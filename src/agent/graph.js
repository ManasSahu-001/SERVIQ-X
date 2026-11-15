import { StateGraph, START, END } from '@langchain/langgraph';
import { SupportAgentState } from './state.js';
import {
  loadConversationNode,
  classifyIntentNode,
  rewriteQueryNode,
  retrieveKnowledgeNode,
  generateResponseNode,
  evaluateResponseNode,
  generateSuggestedReplyNode,
  createSupportTicketNode,
  generateSummaryNode,
  humanReviewNode,
  sendResponseNode,
  updateConversationNode,
} from './nodes.js';

/**
 * Conditional router after loading conversation.
 * If human takeover is active, pauses automatic AI response and produces internal suggestions.
 */
function checkTakeoverRouter(state) {
  if (state.requiresHumanApproval === true) {
    console.log('[Router] Active human takeover detected. Bypassing automatic AI sending.');
    return 'generate_suggested_reply';
  }
  return 'classify_intent';
}

/**
 * Conditional router after LLM-as-a-Judge evaluation.
 * Directs flow to:
 * 1. Immediate delivery (APPROVE_AI_RESPONSE)
 * 2. Regeneration loop (REGENERATE_RESPONSE, up to 2 attempts)
 * 3. Human escalation (REQUEST_HUMAN_REVIEW)
 */
function routeAfterJudge(state) {
  const decision = state.judgeResult?.decision;
  const count = state.regenerationCount || 0;

  if (decision === 'APPROVE_AI_RESPONSE' || decision === 'REFUSE_RESPONSE') {
    return 'send_response';
  }

  if (decision === 'REGENERATE_RESPONSE' && count < 2) {
    console.log(`[Router] Quality check failed. Triggering regeneration attempt #${count + 1}`);
    return 'generate_response';
  }

  console.log(`[Router] Escalating to human support team. Decision: ${decision}`);
  return 'generate_suggested_reply';
}

/**
 * Builds the complete 12-node SERVIQ-X LangGraph Customer Support Graph.
 *
 * Scopes the Supabase client inside the workflow execution context,
 * ensuring no circular references or credential leaks into LangSmith.
 */
export function buildSupportGraph(supabaseClient, options = {}) {
  const workflow = new StateGraph(SupportAgentState)
    // 1. Session initialization
    .addNode('load_conversation', (state) => loadConversationNode(state, { configurable: { supabaseClient, options } }))
    
    // 2. Query understanding
    .addNode('classify_intent', (state) => classifyIntentNode(state, { configurable: { options } }))
    .addNode('rewrite_query', (state) => rewriteQueryNode(state, { configurable: { options } }))

    // 3. Knowledge retrieval & generation
    .addNode('retrieve_knowledge', (state) => retrieveKnowledgeNode(state, { configurable: { supabaseClient, options } }))
    .addNode('generate_response', (state) => generateResponseNode(state, { configurable: { options } }))

    // 4. LLM-as-a-Judge evaluation
    .addNode('evaluate_response', (state) => evaluateResponseNode(state, { configurable: { options } }))

    // 5. Approved pathway
    .addNode('send_response', sendResponseNode)

    // 6. Escalation & human review pathway
    .addNode('generate_suggested_reply', generateSuggestedReplyNode)
    .addNode('create_support_ticket', (state) => createSupportTicketNode(state, { configurable: { supabaseClient, options } }))
    .addNode('generate_summary', (state) => generateSummaryNode(state, { configurable: { options } }))
    .addNode('human_review', humanReviewNode)

    // 7. Persistence & completion
    .addNode('update_conversation', (state) => updateConversationNode(state, { configurable: { supabaseClient, options } }))

    // Edge definitions
    .addEdge(START, 'load_conversation')
    
    // Check for human takeover
    .addConditionalEdges('load_conversation', checkTakeoverRouter, {
      classify_intent: 'classify_intent',
      generate_suggested_reply: 'generate_suggested_reply',
    })

    // Sequential understanding and retrieval
    .addEdge('classify_intent', 'rewrite_query')
    .addEdge('rewrite_query', 'retrieve_knowledge')
    .addEdge('retrieve_knowledge', 'generate_response')
    .addEdge('generate_response', 'evaluate_response')

    // Judge decision branching
    .addConditionalEdges('evaluate_response', routeAfterJudge, {
      send_response: 'send_response',
      generate_response: 'generate_response',
      generate_suggested_reply: 'generate_suggested_reply',
    })

    // Approved route
    .addEdge('send_response', 'update_conversation')

    // Escalated route
    .addEdge('generate_suggested_reply', 'create_support_ticket')
    .addEdge('create_support_ticket', 'generate_summary')
    .addEdge('generate_summary', 'human_review')
    .addEdge('human_review', 'update_conversation')

    // Finish
    .addEdge('update_conversation', END);

  return workflow.compile();
}
