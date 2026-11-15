import { apiClient, isMockModeEnabled } from './api';
import { Conversation, Message } from '../types';
import { INITIAL_CONVERSATIONS } from './mockData';

const STORAGE_KEY = 'deskpilot_conversations';

// Initialize local cache from localStorage or mock data
const loadLocalConversations = (): Conversation[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
  return INITIAL_CONVERSATIONS;
};

const saveLocalConversations = (conversations: Conversation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  window.dispatchEvent(new CustomEvent('deskpilot_conversations_updated'));
};

export const conversationService = {
  async getConversations(): Promise<Conversation[]> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<any>('/api/conversations');
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && Array.isArray(response.data.conversations)) {
          return response.data.conversations;
        }
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, using local conversations:', err);
      }
    }
    return loadLocalConversations();
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<any>(`/api/conversations/${id}`);
        if (response.data && response.data.conversation) {
          return {
            ...response.data.conversation,
            messages: response.data.messages || response.data.conversation.messages || [],
          };
        }
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, using local conversation:', err);
      }
    }
    const convs = loadLocalConversations();
    return convs.find((c) => c.id === id) || null;
  },

  async sendMessage(
    conversationId: string,
    text: string,
    sender: 'agent' | 'customer' | 'ai' = 'agent',
    senderName?: string
  ): Promise<Message> {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: senderName || (sender === 'agent' ? 'Rahul Sharma' : sender === 'ai' ? 'DeskPilot AI' : 'Customer'),
    };

    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.post<any>(`/api/conversations/${conversationId}/messages`, {
          content: text,
          text,
          sender,
          senderName: newMessage.senderName,
        });
        return response.data?.message || response.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to local storage update:', err);
      }
    }

    // Local fallback
    const convs = loadLocalConversations();
    const updated = convs.map((conv) => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: text,
          lastMessageTime: 'Just now',
          messages: [...conv.messages, newMessage],
        };
      }
      return conv;
    });
    saveLocalConversations(updated);

    return newMessage;
  },

  async takeoverConversation(conversationId: string, agentName: string = 'Rahul Sharma'): Promise<Conversation> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.post<Conversation>(`/api/conversations/${conversationId}/takeover`, {
          agentName,
        });
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to local takeover:', err);
      }
    }

    const convs = loadLocalConversations();
    let updatedConv: Conversation | null = null;
    const updated = convs.map((conv) => {
      if (conv.id === conversationId) {
        const systemMsg: Message = {
          id: `sys-${Date.now()}`,
          sender: 'agent',
          text: `🔔 [System] Agent ${agentName} has taken over this conversation. Automatic AI responses paused.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: 'System Notice',
        };
        updatedConv = {
          ...conv,
          isHumanHandled: true,
          assignedAgent: agentName,
          status: 'Open',
          messages: [...conv.messages, systemMsg],
        };
        return updatedConv;
      }
      return conv;
    });
    saveLocalConversations(updated);
    return updatedConv || convs[0];
  },

  async handbackToAI(conversationId: string): Promise<Conversation> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.post<Conversation>(`/api/conversations/${conversationId}/handback`);
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to local handback:', err);
      }
    }

    const convs = loadLocalConversations();
    let updatedConv: Conversation | null = null;
    const updated = convs.map((conv) => {
      if (conv.id === conversationId) {
        const systemMsg: Message = {
          id: `sys-${Date.now()}`,
          sender: 'ai',
          text: `🤖 [System] Conversation handed back to DeskPilot AI autopilot.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: 'DeskPilot AI',
        };
        updatedConv = {
          ...conv,
          isHumanHandled: false,
          assignedAgent: 'DeskPilot AI',
          messages: [...conv.messages, systemMsg],
        };
        return updatedConv;
      }
      return conv;
    });
    saveLocalConversations(updated);
    return updatedConv || convs[0];
  },

  async sendSuggestedReply(conversationId: string): Promise<Message | null> {
    const convs = loadLocalConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv || !conv.suggestedReply) return null;

    const replyText = conv.suggestedReply.text;
    const msg = await this.sendMessage(conversationId, replyText, 'ai', 'DeskPilot AI');

    // Remove or reset suggestion after sending
    const updated = convs.map((c) => (c.id === conversationId ? { ...c, suggestedReply: undefined } : c));
    saveLocalConversations(updated);
    return msg;
  },

  // Used by the Customer Chat Widget to create or continue conversation
  async customerChatQuery(
    messageText: string,
    existingConvId?: string
  ): Promise<{ conversation: Conversation; aiReply?: string; createdTicket?: string }> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.post<any>('/api/chat', {
          message: messageText,
          conversation_id: existingConvId,
          conversationId: existingConvId,
        });
        const data = response.data;
        const aiReply = data?.response || data?.aiReply;
        const createdTicket = data?.ticketId || data?.createdTicket;
        if (aiReply) {
          const convs = loadLocalConversations();
          let targetConv = existingConvId ? convs.find((c) => c.id === existingConvId) : null;
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const customerMsg: Message = {
            id: `cmsg-${Date.now()}-1`,
            sender: 'customer',
            text: messageText,
            timestamp,
            senderName: 'Customer',
          };
          const aiMsg: Message = {
            id: `cmsg-${Date.now()}-2`,
            sender: 'ai',
            text: aiReply,
            timestamp,
            senderName: 'DeskPilot AI',
          };

          if (!targetConv) {
            targetConv = {
              id: existingConvId || `conv-${Date.now()}`,
              customerName: 'Customer (Live Chat)',
              customerEmail: 'guest.shopper@example.com',
              customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              subject: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
              priority: data?.escalated ? 'P1' : 'P2',
              status: data?.escalated ? 'Escalated' : 'Open',
              language: 'English',
              category: 'General',
              lastMessage: aiReply,
              lastMessageTime: 'Just now',
              unreadCount: 1,
              assignedAgent: 'DeskPilot AI',
              isHumanHandled: false,
              ticketId: createdTicket,
              messages: [customerMsg, aiMsg],
              suggestedReply: data?.suggestedReply ? {
                text: typeof data.suggestedReply === 'string' ? data.suggestedReply : data.suggestedReply.text,
                sources: data.retrievedSources || data.sources || [],
                confidence: 96,
              } : undefined,
            };
            convs.unshift(targetConv);
          } else {
            targetConv.messages.push(customerMsg, aiMsg);
            targetConv.lastMessage = aiReply;
            targetConv.lastMessageTime = 'Just now';
            if (createdTicket) {
              targetConv.ticketId = createdTicket;
              targetConv.status = 'Escalated';
            }
          }
          saveLocalConversations(convs);
          return { conversation: targetConv, aiReply, createdTicket };
        }
      } catch (err) {
        console.warn('Backend /api/chat error, using interactive mock agent logic:', err);
      }
    }

    const convs = loadLocalConversations();
    let targetConv = existingConvId ? convs.find((c) => c.id === existingConvId) : null;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let createdTicketId: string | undefined = undefined;
    let aiReplyText = '';

    // Smart simulated responses for customer demo flow
    const lower = messageText.toLowerCase();
    if (lower.includes('payment') || lower.includes('deducted') || lower.includes('refund') || lower.includes('charge')) {
      aiReplyText = "I'm sorry to hear that your payment had an issue! Could you please share your Order ID or transaction reference so I can look it up in our payment records?";
    } else if (lower.includes('ord-') || lower.includes('order') || lower.includes('hdfc') || lower.includes('inv-')) {
      createdTicketId = `TCK-${Math.floor(8824 + Math.random() * 50)}`;
      aiReplyText = `Thank you! I have located the record and created high-priority Ticket ${createdTicketId}. Our support lead has been alerted and will reconcile your payment shortly.`;
    } else if (lower.includes('human') || lower.includes('agent') || lower.includes('support person') || lower.includes('speak')) {
      createdTicketId = `TCK-${Math.floor(8824 + Math.random() * 50)}`;
      aiReplyText = `Understood! I am escalating your query to our live support team right now. Ticket ${createdTicketId} has been created for human handover.`;
    } else {
      aiReplyText = "Thanks for contacting DeskPilot support! I can help you with orders, billing, refunds, or technical integrations. What can I assist you with today?";
    }

    if (!targetConv) {
      // Create new customer conversation
      const newConvId = `conv-${Date.now()}`;
      const customerMsg: Message = {
        id: `cmsg-${Date.now()}-1`,
        sender: 'customer',
        text: messageText,
        timestamp,
        senderName: 'Customer',
      };
      const aiMsg: Message = {
        id: `cmsg-${Date.now()}-2`,
        sender: 'ai',
        text: aiReplyText,
        timestamp,
        senderName: 'DeskPilot AI',
      };

      const newConv: Conversation = {
        id: newConvId,
        customerName: 'Customer (Live Chat)',
        customerEmail: 'guest.shopper@example.com',
        customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        subject: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
        priority: lower.includes('payment') || lower.includes('deducted') ? 'P1' : 'P2',
        status: createdTicketId ? 'Escalated' : 'Open',
        language: 'English',
        category: lower.includes('payment') ? 'Billing' : 'Orders',
        lastMessage: aiReplyText,
        lastMessageTime: 'Just now',
        unreadCount: 1,
        assignedAgent: 'DeskPilot AI',
        isHumanHandled: false,
        ticketId: createdTicketId,
        messages: [customerMsg, aiMsg],
        suggestedReply: {
          text: 'Hello, I have reviewed your account and confirmed the transaction. I will process the order instantly.',
          sources: ['Payment Gateway Reconciliation FAQ (doc-3)'],
          confidence: 95,
        },
      };

      convs.unshift(newConv);
      saveLocalConversations(convs);
      return { conversation: newConv, aiReply: aiReplyText, createdTicket: createdTicketId };
    } else {
      // Update existing conversation
      const customerMsg: Message = {
        id: `cmsg-${Date.now()}-1`,
        sender: 'customer',
        text: messageText,
        timestamp,
        senderName: targetConv.customerName,
      };

      const aiMsg: Message = {
        id: `cmsg-${Date.now()}-2`,
        sender: 'ai',
        text: aiReplyText,
        timestamp,
        senderName: 'DeskPilot AI',
      };

      const updated = convs.map((c) => {
        if (c.id === targetConv!.id) {
          return {
            ...c,
            lastMessage: aiReplyText,
            lastMessageTime: 'Just now',
            ticketId: createdTicketId || c.ticketId,
            status: createdTicketId ? ('Escalated' as const) : c.status,
            messages: [...c.messages, customerMsg, aiMsg],
          };
        }
        return c;
      });
      saveLocalConversations(updated);
      return {
        conversation: updated.find((c) => c.id === targetConv!.id)!,
        aiReply: aiReplyText,
        createdTicket: createdTicketId,
      };
    }
  },
};
