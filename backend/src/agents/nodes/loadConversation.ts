import { AgentState } from '../state.js';
import { store } from '../../services/store.js';
import { logger } from '../../config/logger.js';

export const loadConversationNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId } = state;
  logger.info({ conversationId, companyId }, 'Node: loadConversation');

  let conv = store.getConversationById(companyId, conversationId);
  if (!conv) {
    // Create new conversation record if it doesn't exist yet
    conv = store.createConversation({
      id: conversationId,
      company_id: companyId,
      customer_name: 'Customer',
      assigned_to: 'ai',
      status: 'open',
    });
  }

  const messages = store.getMessagesByConversation(conversationId);

  return {
    conversationOwner: conv.assigned_to,
    conversationStatus: conv.status,
    priority: conv.priority,
    category: conv.category as any,
    conversationHistory: messages,
    ticketId: conv.ticket_id,
  };
};
