import { Annotation } from '@langchain/langgraph';

/**
 * SERVIQ-X LangGraph Agent State Definition
 * Strongly typed state structure tracking customer interaction across all 12 nodes.
 */
export const SupportAgentState = Annotation.Root({
  // Tenant & Session Identifiers
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

  // Customer Input & Context
  customerMessage: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  conversationHistory: Annotation({
    reducer: (x, y) => (y ? (Array.isArray(y) ? y : x.concat(y)) : x),
    default: () => [],
  }),

  // Step 2 & 3: Intent & Query Understanding
  intent: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'general_inquiry',
  }),
  rewrittenQuery: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),

  // Step 4: Knowledge Retrieval
  retrievedChunks: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  retrievedSources: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  // Step 5: Response Generation & Regens
  generatedResponse: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  regenerationCount: Annotation({
    reducer: (x, y) => (typeof y === 'number' ? y : x),
    default: () => 0,
  }),

  // Step 6: LLM-as-a-Judge Evaluation
  judgeResult: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  // Step 7: Escalation & Human Review
  requiresHumanApproval: Annotation({
    reducer: (x, y) => (typeof y === 'boolean' ? y : x),
    default: () => false,
  }),
  escalationReason: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  ticketId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  // Step 8 & 9: Suggested Reply & Summary
  suggestedReply: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  conversationSummary: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  // Final Delivery
  finalResponse: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),

  // Diagnostic & Error tracking
  executionErrors: Annotation({
    reducer: (x, y) => (y ? (x || []).concat(y) : x),
    default: () => [],
  }),
});
