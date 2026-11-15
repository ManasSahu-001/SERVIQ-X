import { store, DEMO_COMPANY_ID } from './store.js';
import { Conversation, Message } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { getSocketServer } from '../sockets/socket.js';
import { SOCKET_EVENTS } from '../sockets/events.js';
import { runSupportAgent } from '../agents/graph.js';

export const conversationService = {
  async getConversations(companyId: string): Promise<Conversation[]> {
    const convs = store.getConversationsByCompany(companyId);
    // Enrich with messages for client consumption
    return convs.map((c) => ({
      ...c,
      messages: store.getMessagesByConversation(c.id),
    }));
  },

  async getConversationById(companyId: string, id: string): Promise<Conversation> {
    const conv = store.getConversationById(companyId, id);
    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }
    return {
      ...conv,
      messages: store.getMessagesByConversation(conv.id),
    };
  },

  async createConversation(data: {
    companyId: string;
    customerName?: string;
    customerEmail?: string;
    subject?: string;
    initialMessage?: string;
  }): Promise<{ conversation: Conversation; initialMessage?: Message }> {
    const { companyId, customerName, customerEmail, subject, initialMessage } = data;

    const conv = store.createConversation({
      company_id: companyId,
      customer_name: customerName || 'Live Chat Customer',
      customer_email: customerEmail || 'customer@example.com',
      subject: subject || initialMessage?.slice(0, 50) || 'New Inquiry',
      assigned_to: 'ai',
      status: 'open',
    });

    let msg: Message | undefined = undefined;
    if (initialMessage) {
      msg = store.createMessage({
        conversation_id: conv.id,
        sender_type: 'customer',
        content: initialMessage,
        sender_name: conv.customer_name,
      });
    }

    const io = getSocketServer();
    if (io) {
      io.to(`company:${companyId}`).emit(SOCKET_EVENTS.CONVERSATION_CREATED, conv);
    }

    return {
      conversation: {
        ...conv,
        messages: msg ? [msg] : [],
      },
      initialMessage: msg,
    };
  },

  /**
   * Concurrency-safe Human Takeover
   * Sets assigned_to = 'human', pauses AI autopilot, broadcasts system message and socket events
   */
  async takeoverConversation(
    companyId: string,
    conversationId: string,
    agentName = 'Human Support Lead'
  ): Promise<Conversation> {
    logger.info({ companyId, conversationId, agentName }, 'Executing human takeover');

    const conv = store.getConversationById(companyId, conversationId);
    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    // Atomic update
    const updated = store.updateConversation(companyId, conversationId, {
      assigned_to: 'human',
      assigned_agent_name: agentName,
      status: 'open',
    });

    // Create system notice message
    const sysMsg = store.createMessage({
      conversation_id: conversationId,
      sender_type: 'system',
      content: `🔔 Agent ${agentName} has taken over this conversation. Automatic AI responses are now paused.`,
      sender_name: 'System Notice',
    });

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.AGENT_TAKEOVER, {
        conversationId,
        agentName,
        message: sysMsg,
      });
      io.to(`company:${companyId}`).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, updated);
    }

    return {
      ...updated!,
      messages: store.getMessagesByConversation(conversationId),
    };
  },

  /**
   * Handback conversation to AI Autopilot
   */
  async handbackToAI(companyId: string, conversationId: string): Promise<Conversation> {
    logger.info({ companyId, conversationId }, 'Executing handback to AI autopilot');

    const conv = store.getConversationById(companyId, conversationId);
    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    const updated = store.updateConversation(companyId, conversationId, {
      assigned_to: 'ai',
      assigned_agent_name: undefined,
    });

    const sysMsg = store.createMessage({
      conversation_id: conversationId,
      sender_type: 'system',
      content: '🤖 Conversation handed back to SERVIQ-X AI autopilot.',
      sender_name: 'SERVIQ-X AI',
    });

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.AGENT_HANDBACK, {
        conversationId,
        message: sysMsg,
      });
      io.to(`company:${companyId}`).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, updated);
    }

    return {
      ...updated!,
      messages: store.getMessagesByConversation(conversationId),
    };
  },

  /**
   * Customer chat endpoint (/api/chat) for customer widget
   */
  async handleCustomerChat(data: {
    message: string;
    conversationId?: string;
    companyId?: string;
  }): Promise<{ conversation: Conversation; aiReply?: string; createdTicket?: string }> {
    const companyId = data.companyId || DEMO_COMPANY_ID;
    let conversationId = data.conversationId;

    if (!conversationId) {
      const created = await this.createConversation({
        companyId,
        customerName: 'Live Chat Customer',
        customerEmail: 'guest.shopper@example.com',
        initialMessage: data.message,
      });
      conversationId = created.conversation.id;
    } else {
      store.createMessage({
        conversation_id: conversationId,
        sender_type: 'customer',
        content: data.message,
        sender_name: 'Customer',
      });
    }

    // Run LangGraph agent workflow
    const agentResult = await runSupportAgent({
      conversationId,
      companyId,
      customerMessage: data.message,
    });

    const freshConv = await this.getConversationById(companyId, conversationId);

    return {
      conversation: freshConv,
      aiReply: agentResult.generatedResponse,
      createdTicket: agentResult.ticketId,
    };
  },
};
