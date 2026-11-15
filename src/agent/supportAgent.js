import { compiledSupportGraph } from './graph.js';
import { isTracingEnabled, project } from '../config/langsmith.js';

/**
 * Entry point to execute the SERVIQ-X LangGraph Support Agent.
 * Configured with LangSmith tracing, tagging, and multi-tenant metadata.
 */
export async function runSupportAgent({
  companyId,
  conversationId,
  customerId,
  customerMessage,
  supabaseClient,
}) {
  if (!customerMessage) {
    throw new Error('customerMessage is required');
  }

  // Set up LangGraph state inputs
  const initialState = {
    customerQuery: customerMessage,
    companyId: companyId || '',
    conversationId: conversationId || '',
    customerId: customerId || '',
    messages: [
      {
        role: 'user',
        content: customerMessage,
      },
    ],
  };

  // LangSmith Run Configuration:
  // Injects tags, tenant metadata, and execution run name for comprehensive observability
  const runConfig = {
    configurable: {
      supabaseClient,
    },
    runName: `SERVIQ-X Agent - ${conversationId || 'session'}`,
    tags: [
      'serviq-x',
      'customer-support',
      'langgraph-agent',
      'groq-llm',
      companyId ? `company:${companyId}` : 'no-tenant',
    ],
    metadata: {
      company_id: companyId,
      conversation_id: conversationId,
      customer_id: customerId,
      channel: 'web_chat',
      langsmith_project: project,
      tracing_active: isTracingEnabled,
    },
  };

  console.log(`[SERVIQ-X Agent] Running LangGraph agent for company: ${companyId || 'N/A'}`);

  // Execute the compiled LangGraph workflow (automatically creates root run in LangSmith)
  const finalState = await compiledSupportGraph.invoke(initialState, runConfig);

  // If conversationId is provided, record the message in Supabase
  if (conversationId && supabaseClient) {
    try {
      await supabaseClient.from('messages').insert({
        conversation_id: conversationId,
        company_id: companyId,
        sender_type: 'ai',
        content: finalState.response,
        metadata: {
          intent: finalState.intent,
          sources_count: finalState.retrievedChunks?.length || 0,
          escalated: finalState.needsEscalation,
          ticket_id: finalState.ticket?.id || null,
          langsmith_traced: isTracingEnabled,
        },
      });
    } catch (saveErr) {
      console.warn('[SERVIQ-X Agent] Non-critical warning saving message to database:', saveErr.message);
    }
  }

  return {
    response: finalState.response,
    intent: finalState.intent,
    sources: finalState.retrievedChunks || [],
    escalated: finalState.needsEscalation,
    ticket: finalState.ticket,
    errors: finalState.executionErrors || [],
  };
}
