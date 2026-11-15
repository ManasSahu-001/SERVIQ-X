import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentState } from './state.js';
import { loadConversationNode } from './nodes/loadConversation.js';
import { classifyIntentNode } from './nodes/classifyIntent.js';
import { retrieveKnowledgeNode } from './nodes/retrieveKnowledge.js';
import { generateResponseNode } from './nodes/generateResponse.js';
import { evaluateResponseNode } from './nodes/evaluateResponse.js';
import { generateSuggestedReplyNode } from './nodes/generateSuggestedReply.js';
import { createTicketNode } from './nodes/createTicket.js';
import { generateSummaryNode } from './nodes/generateSummary.js';
import { humanApprovalNode } from './nodes/humanApproval.js';
import { sendResponseNode } from './nodes/sendResponse.js';
import { updateConversationNode } from './nodes/updateConversation.js';
import { logger } from '../config/logger.js';
import { logTraceEvent } from '../config/langsmith.js';

const checkpointer = new MemorySaver();

const canResolveBranch = (state: AgentState): 'resolved_path' | 'escalation_path' => {
  const canResolve = state.evaluationSignals.canResolve && !state.escalationRequired;
  return canResolve ? 'resolved_path' : 'escalation_path';
};

const builder = new StateGraph(AgentStateAnnotation)
  .addNode('loadConversation', loadConversationNode)
  .addNode('classifyIntent', classifyIntentNode)
  .addNode('retrieveKnowledge', retrieveKnowledgeNode)
  .addNode('generateResponse', generateResponseNode)
  .addNode('evaluateResponse', evaluateResponseNode)
  .addNode('generateSuggestedReply', generateSuggestedReplyNode)
  .addNode('createTicket', createTicketNode)
  .addNode('generateSummary', generateSummaryNode)
  .addNode('humanApproval', humanApprovalNode)
  .addNode('sendResponse', sendResponseNode)
  .addNode('updateConversation', updateConversationNode)

  // Linear pipeline up to evaluation
  .addEdge(START, 'loadConversation')
  .addEdge('loadConversation', 'classifyIntent')
  .addEdge('classifyIntent', 'retrieveKnowledge')
  .addEdge('retrieveKnowledge', 'generateResponse')
  .addEdge('generateResponse', 'evaluateResponse')

  // Conditional branching based on AI resolution ability vs escalation
  .addConditionalEdges('evaluateResponse', canResolveBranch, {
    resolved_path: 'generateSuggestedReply',
    escalation_path: 'createTicket',
  })

  // Escalation branch flow
  .addEdge('createTicket', 'generateSummary')
  .addEdge('generateSummary', 'generateSuggestedReply')

  // Converged flow through human approval gatekeeper
  .addEdge('generateSuggestedReply', 'humanApproval')
  .addEdge('humanApproval', 'sendResponse')
  .addEdge('sendResponse', 'updateConversation')
  .addEdge('updateConversation', END);

export const supportAgentGraph = builder.compile({
  checkpointer,
});

export const runSupportAgent = async (params: {
  conversationId: string;
  companyId: string;
  customerMessage: string;
}): Promise<AgentState> => {
  const startTime = Date.now();
  const { conversationId, companyId, customerMessage } = params;

  logger.info({ conversationId, companyId }, 'Starting LangGraph Support Agent execution');

  const config = {
    configurable: {
      thread_id: conversationId,
    },
  };

  const finalState = await supportAgentGraph.invoke(
    {
      conversationId,
      companyId,
      customerMessage,
    },
    config
  );

  const durationMs = Date.now() - startTime;
  await logTraceEvent('agent:execution', {
    conversationId,
    companyId,
    latencyMs: durationMs,
    escalated: finalState.escalationRequired,
    data: {
      intent: finalState.intent,
      priority: finalState.priority,
      ticketId: finalState.ticketId,
      canResolve: finalState.evaluationSignals.canResolve,
      isSent: finalState.isSent,
    },
  });

  return finalState as AgentState;
};
