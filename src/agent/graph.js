import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { traceable } from '../config/langsmith.js';
import { invokeGroqWithTracing } from '../services/groqService.js';
import { getGeminiEmbedding } from '../services/geminiService.js';

/**
 * LangGraph Agent State Definition
 */
export const SupportAgentAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  companyId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  conversationId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  customerId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  customerQuery: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  intent: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'general_inquiry',
  }),
  retrievedChunks: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  response: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  needsEscalation: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  ticket: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  executionErrors: Annotation({
    reducer: (x, y) => (y ? (x || []).concat(y) : x),
    default: () => [],
  }),
});

/**
 * Node 1: Intent Classification
 * Uses Groq LLM to classify customer intent. Traced by LangSmith.
 */
async function classifyIntentNode(state) {
  const query = state.customerQuery || state.messages[state.messages.length - 1]?.content || '';
  const prompt = `Classify the customer inquiry into exactly ONE of the following categories:
- returns_and_refunds
- billing
- technical_issue
- general_support

Customer query: "${query}"
Category:`;

  try {
    const rawCategory = await invokeGroqWithTracing(prompt);
    const category = rawCategory.trim().toLowerCase().replace(/[^a-z_]/g, '');
    return { intent: category || 'general_support' };
  } catch (err) {
    return {
      intent: 'general_support',
      executionErrors: [`Intent classification warning: ${err.message}`],
    };
  }
}

/**
 * Node 3: Grounded Response Generation
 * Invokes Groq LLM with retrieved context. Traced by LangSmith.
 */
async function generateResponseNode(state) {
  const query = state.customerQuery || state.messages[state.messages.length - 1]?.content || '';
  const chunks = state.retrievedChunks || [];

  const contextText = chunks.length > 0
    ? chunks.map((c, i) => `[Source ${i + 1} - Page ${c.page_number || 1}]:\n${c.content}`).join('\n\n')
    : 'No specific company documentation found.';

  const prompt = `You are SERVIQ-X AI, a helpful and accurate customer support agent.
Answer the customer's question using ONLY the provided company documentation context.
If the context does not contain the answer, politely state that you do not have that information and suggest connecting with a human agent.

--- COMPANY DOCUMENTATION CONTEXT ---
${contextText}
------------------------------------

Customer Query: "${query}"
Detected Intent: ${state.intent}

Support Response:`;

  try {
    const reply = await invokeGroqWithTracing(prompt);
    return { response: reply };
  } catch (err) {
    return {
      response: 'I apologize, but I am currently unable to process your request. A human agent has been alerted.',
      executionErrors: [`Response generation error: ${err.message}`],
    };
  }
}

/**
 * Build and compile the LangGraph workflow with scoped Supabase client.
 * Closure ensures Supabase client is never passed into traceable inputs,
 * completely preventing circular JSON warnings in LangSmith.
 */
export function buildSupportGraph(supabaseClient) {
  // Scoped traceable retrieval tool
  const retrieveKnowledgeTool = traceable(
    async function retrieve_company_knowledge(companyId, query) {
      if (!companyId || !query || !supabaseClient) return [];

      const embedding = await getGeminiEmbedding(query);
      const { data: chunks, error } = await supabaseClient.rpc(
        'match_document_chunks',
        {
          query_embedding: embedding,
          filter_company_id: companyId,
          match_threshold: 0.5,
          match_count: 3,
        }
      );

      if (error) {
        throw new Error(`Vector retrieval RPC error: ${error.message}`);
      }

      return chunks || [];
    },
    {
      name: 'retrieve_company_knowledge',
      run_type: 'retriever',
      metadata: {
        vector_dim: 768,
        embedding_provider: 'gemini-text-embedding-004',
        storage_type: 'pgvector_supabase',
      },
    }
  );

  // Scoped traceable ticket creation tool
  const createTicketTool = traceable(
    async function create_support_ticket(companyId, conversationId, query, response) {
      if (!supabaseClient || !companyId) return null;

      const { data: ticket, error } = await supabaseClient
        .from('tickets')
        .insert({
          company_id: companyId,
          conversation_id: conversationId || null,
          title: `Support Escalation: ${query.substring(0, 50)}...`,
          description: `Customer Query:\n${query}\n\nAI Response Draft:\n${response}`,
          priority: 'high',
          status: 'open',
        })
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Ticket creation error: ${error.message}`);
      }

      return ticket;
    },
    {
      name: 'create_support_ticket',
      run_type: 'tool',
      metadata: {
        action: 'ticket_escalation',
      },
    }
  );

  const retrieveNode = async (state) => {
    const query = state.customerQuery || state.messages[state.messages.length - 1]?.content || '';
    try {
      const chunks = await retrieveKnowledgeTool(state.companyId, query);
      return { retrievedChunks: chunks };
    } catch (err) {
      return {
        retrievedChunks: [],
        executionErrors: [`Retrieval error: ${err.message}`],
      };
    }
  };

  const escalateNode = async (state) => {
    const query = state.customerQuery || state.messages[state.messages.length - 1]?.content || '';
    const requiresEscalation =
      state.retrievedChunks.length === 0 ||
      /refund|cancel|human|agent|urgent|speak with someone|complaint/i.test(query);

    if (!requiresEscalation) {
      return { needsEscalation: false, ticket: null };
    }

    try {
      const ticket = await createTicketTool(
        state.companyId,
        state.conversationId,
        query,
        state.response
      );
      return { needsEscalation: true, ticket };
    } catch (err) {
      return {
        needsEscalation: true,
        ticket: null,
        executionErrors: [`Ticket creation error: ${err.message}`],
      };
    }
  };

  const workflow = new StateGraph(SupportAgentAnnotation)
    .addNode('classify_intent', classifyIntentNode)
    .addNode('retrieve_knowledge', retrieveNode)
    .addNode('generate_response', generateResponseNode)
    .addNode('escalate_if_needed', escalateNode)
    .addEdge(START, 'classify_intent')
    .addEdge('classify_intent', 'retrieve_knowledge')
    .addEdge('retrieve_knowledge', 'generate_response')
    .addEdge('generate_response', 'escalate_if_needed')
    .addEdge('escalate_if_needed', END);

  return workflow.compile();
}
