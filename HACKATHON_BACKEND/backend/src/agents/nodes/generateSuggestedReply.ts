import { AgentState } from '../state.js';
import { logger } from '../../config/logger.js';
import { store } from '../../services/store.js';

export const generateSuggestedReplyNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId, generatedResponse, sources, evaluationSignals } = state;
  logger.info({ conversationId }, 'Node: generateSuggestedReply');

  const suggestedReply = {
    text: generatedResponse,
    sources: sources.length > 0 ? sources : ['Knowledge Base — General FAQ'],
    confidence: Math.round(evaluationSignals.confidence * 100),
  };

  // Persist suggestion to conversation record in store so the Agent Console receives it immediately
  store.updateConversation(companyId, conversationId, {
    suggested_reply: suggestedReply,
  });

  return {
    suggestedReply,
  };
};
