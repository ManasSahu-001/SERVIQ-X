import { AgentState } from '../state.js';
import { store } from '../../services/store.js';
import { logger } from '../../config/logger.js';
import { getSocketServer } from '../../sockets/socket.js';

export const updateConversationNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId, priority, category, ticketId, conversationStatus, conversationOwner } = state;
  logger.info({ conversationId, status: conversationStatus }, 'Node: updateConversation');

  const updated = store.updateConversation(companyId, conversationId, {
    priority,
    category,
    ticket_id: ticketId,
    status: conversationStatus as any,
    assigned_to: conversationOwner,
  });

  try {
    const io = getSocketServer();
    if (io && updated) {
      io.to(`company:${companyId}`).emit('conversation:updated', updated);
      if (ticketId) {
        io.to(`company:${companyId}`).emit('conversation:escalated', {
          conversationId,
          ticketId,
          priority,
        });
      }
    }
  } catch (err: any) {
    logger.debug({ error: err.message }, 'Socket broadcast skipped in updateConversationNode');
  }

  return {};
};
