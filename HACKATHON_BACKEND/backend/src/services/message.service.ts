import { store } from './store.js';
import { Message, MessageSenderType } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { getSocketServer } from '../sockets/socket.js';
import { SOCKET_EVENTS } from '../sockets/events.js';
import { runSupportAgent } from '../agents/graph.js';
import { logger } from '../config/logger.js';

export const messageService = {
  async addMessage(params: {
    companyId: string;
    conversationId: string;
    sender: MessageSenderType;
    content: string;
    senderName?: string;
  }): Promise<Message> {
    const { companyId, conversationId, sender, content, senderName } = params;

    const conv = store.getConversationById(companyId, conversationId);
    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    const message = store.createMessage({
      conversation_id: conversationId,
      sender_type: sender,
      content,
      sender_name: senderName || (sender === 'agent' ? 'Support Agent' : sender === 'ai' ? 'SERVIQ-X AI' : 'Customer'),
    });

    const io = getSocketServer();
    if (io) {
      const eventName = sender === 'agent' ? SOCKET_EVENTS.AGENT_MESSAGE : SOCKET_EVENTS.CUSTOMER_MESSAGE;
      io.to(`conversation:${conversationId}`).emit(eventName, message);
      io.to(`company:${companyId}`).emit(eventName, message);
    }

    // If customer message and conversation is currently owned by AI, trigger agent
    if (sender === 'customer' && conv.assigned_to === 'ai') {
      runSupportAgent({
        conversationId,
        companyId,
        customerMessage: content,
      }).catch((err) => {
        logger.error({ error: err.message, conversationId }, 'Background LangGraph invocation failed');
      });
    }

    return message;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return store.getMessagesByConversation(conversationId);
  },
};
