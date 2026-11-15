import { AgentState } from '../state.js';
import { logger } from '../../config/logger.js';
import { store } from '../../services/store.js';

export const humanApprovalNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId, escalationRequired, conversationOwner } = state;
  logger.info({ conversationId, escalationRequired, conversationOwner }, 'Node: humanApproval');

  if (escalationRequired || conversationOwner === 'human') {
    // Lock conversation to human ownership
    store.updateConversation(companyId, conversationId, {
      assigned_to: 'human',
      status: 'escalated',
    });

    return {
      autoSendApproved: false,
      conversationOwner: 'human',
      conversationStatus: 'escalated',
    };
  }

  return {
    autoSendApproved: true,
  };
};
