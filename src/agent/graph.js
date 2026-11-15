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
 * Node 2: Document Knowledge Retrieval
 * Semantic retrieval tool invoking Supabase match_document_chunks RPC.
 * Explicitly traced in LangSmith as a retrieval tool run.
 */
const retrieveKnowledgeTool = traceable(
  async function retrieveCompanyKnowledge(companyId, query, supabaseClient) {
    if (!companyId || !query || !supabaseClient) {
      return [];
    }

    // Step A: Generate 768-dim query embedding using Gemini
    const embedding = await getGeminiEmbedding(query);

    // Step B: Query Supabase multi-tenant vector RPC
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

async function retrieveKnowledgeNode(state, config) {
  const query = state.customerQuery || state.messages[state.messages.length - 1]?.content || '';
  const supabase = config?.configurable?.supabaseClient;

  try {
    const chunks = await retrieveKnowledgeTool(state.companyId, query, supabase);
    return { retrievedChunks: chunks };
  } catch (err) {
    return {
      retrievedChunks: [],
      executionErrors: [`Retrieval error: ${err.message}`],
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
 * Node 4: Ticket Escalation Tool
 * Creates support ticket in Supabase when issue requires human takeover.
 * Traced in LangSmith as a tool execution run.
 */
const createTicketTool = traceable(
  async function createSupportTicket(companyId, conversationId, query, response, supabaseClient) {
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

async function escalateIfNeededNode(state, config) {
  const query = state.customerQuery || state.messages[state.messages.length - 1]?.content || '';
  const supabase = config?.configurable?.supabaseClient;

  // Determine escalation criteria: lack of retrieved context or urgent intent keywords
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
      state.response,
      supabase
    );
    return { needsEscalation: true, ticket };
  } catch (err) {
    return {
      needsEscalation: true,
      ticket: null,
      executionErrors: [`Ticket creation error: ${err.message}`],
    };
  }
}

/**
 * Build and compile the LangGraph workflow
 */
export function createSupportAgentGraph() {
  const workflow = new StateGraph(SupportAgentAnnotation)
    .addNode('classify_intent', classifyIntentNode)
    .addNode('retrieve_knowledge', retrieveKnowledgeNode)
    .addNode('generate_response', generateResponseNode)
    .addNode('escalate_if_needed', escalateIfNeededNode)
    .addEdge(START, 'classify_intent')
    .addEdge('classify_intent', 'retrieve_knowledge')
    .addEdge('retrieve_knowledge', 'generate_response')
    .addEdge('generate_response', 'escalate_if_needed')
    .addEdge('escalate_if_needed', END);

  return workflow.compile();
}

// Singleton compiled agent graph
export const compiledSupportGraph = createSupportAgentGraph();
