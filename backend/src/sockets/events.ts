export const SOCKET_EVENTS = {
  // Customer
  CUSTOMER_MESSAGE: 'customer:message',
  CUSTOMER_TYPING: 'customer:typing',
  CONVERSATION_CREATED: 'conversation:created',

  // Agent
  AGENT_MESSAGE: 'agent:message',
  AGENT_TYPING: 'agent:typing',
  AGENT_TAKEOVER: 'agent:takeover',
  AGENT_HANDBACK: 'agent:handback',

  // System
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_ESCALATED: 'conversation:escalated',
  TICKET_CREATED: 'ticket:created',
  TICKET_UPDATED: 'ticket:updated',
  AI_SUGGESTION: 'ai:suggestion',
  AI_STATUS: 'ai:status',
} as const;
