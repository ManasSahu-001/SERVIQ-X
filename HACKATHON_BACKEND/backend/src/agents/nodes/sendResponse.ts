import { AgentState } from '../state.js';
import { store } from '../../services/store.js';
import { logger } from '../../config/logger.js';
import { getSocketServer } from '../../sockets/socket.js';

export const sendResponseNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId, generatedResponse, autoSendApproved } = state;
  logger.info({ conversationId }, 'Node: sendResponse');

  // CRITICAL: Re-check the latest database state immediately before sending to prevent race conditions with human takeover
  const freshConv = store.getConversationById(companyId, conversationId);

  if (!freshConv || freshConv.assigned_to === 'human' || !autoSendApproved) {
    logger.warn(
      {
        conversationId,
        freshOwner: freshConv?.assigned_to,
        autoSendApproved,
      },
      'Race condition averted: Human agent has taken over or approval was denied. Suppressing automatic AI response.'
    );
    return {
      isSent: false,
      conversationOwner: freshConv?.assigned_to || 'human',
    };
  }

  // Safe to persist and send AI message
  const aiMessage = store.createMessage({
    conversation_id: conversationId,
    sender_type: 'ai',
    content: generatedResponse,
    sender_name: 'SERVIQ-X AI',
  });

  // Emit real-time Socket.IO event if socket server is initialized
  try {
    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('ai:status', {
        status: 'responded',
        conversationId,
      });
      io.to(`conversation:${conversationId}`).emit('customer:message', aiMessage);
    }
  } catch (err: any) {
    logger.debug({ error: err.message }, 'Socket broadcast skipped in sendResponseNode');
  }

  return {
    isSent: true,
  };
};
