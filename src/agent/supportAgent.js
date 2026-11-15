import { buildSupportGraph } from './graph.js';
import { isTracingEnabled, project } from '../config/langsmith.js';

/**
 * Executes the complete SERVIQ-X LangGraph AI Customer Support Engine.
 *
 * Full pipeline:
 * Customer Message -> Load Conversation -> Intent Classification -> Query Understanding ->
 * Company-Specific RAG -> Groq Response Generation -> LLM-as-a-Judge ->
 * Approved AI Answer OR Human Escalation Ticket -> Supabase Persistence -> LangSmith Tracing
 */
export async function runSupportAgent({
  companyId,
  conversationId,
  customerId,
  customerMessage,
  conversationHistory = [],
  supabaseClient,
  options = {},
}) {
  if (!customerMessage) {
    throw new Error('customerMessage is required');
  }

  // 1. Initial State definition
  const initialState = {
    customerMessage,
    companyId: companyId || '',
    conversationId: conversationId || '',
    customerId: customerId || '',
    conversationHistory: conversationHistory || [],
    regenerationCount: 0,
  };

  // 2. LangSmith Observability Run Configuration
  const runConfig = {
    runName: `Support Agent [${conversationId ? conversationId.substring(0, 8) : 'session'}]`,
    tags: [
      'serviq-x',
      'customer-support',
      'langgraph-agent',
      'groq-llm',
      'llm-as-a-judge',
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

  console.log(`[SERVIQ-X Engine] Executing AI Agent for company ${companyId || 'N/A'}`);

  // 3. Compile Graph with Scoped Supabase & Options Context
  const graph = buildSupportGraph(supabaseClient, options);

  // 4. Execute Workflow
  const finalState = await graph.invoke(initialState, runConfig);

  console.log(`[SERVIQ-X Engine] Completed with Judge Verdict: ${finalState.judgeResult?.decision || 'N/A'}`);

  return {
    success: (finalState.executionErrors || []).length === 0,
    response: finalState.finalResponse,
    intent: finalState.intent,
    decision: finalState.judgeResult?.decision,
    judge: finalState.judgeResult,
    judgeResult: finalState.judgeResult,
    sources: finalState.retrievedSources || [],
    retrievedSources: finalState.retrievedSources || [],
    escalated: finalState.requiresHumanApproval,
    requiresHumanApproval: finalState.requiresHumanApproval,
    ticketId: finalState.ticketId,
    suggestedReply: finalState.suggestedReply,
    summary: finalState.conversationSummary,
    conversationSummary: finalState.conversationSummary,
    errors: finalState.executionErrors || [],
  };
}
