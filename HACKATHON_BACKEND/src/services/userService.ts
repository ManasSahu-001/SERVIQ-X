import { Conversation, Message } from '../types';
import { INITIAL_CONVERSATIONS } from './mockData';

const API_BASE = '/api/user';
const STORAGE_KEY = 'deskpilot_customer_conversations';

export interface HumanAssistanceRequest {
  conversationId: string;
  reason: string;
  actionType?: 'refund_approval' | 'verify_answer' | 'human_agent' | 'billing_escalation';
}

export interface CustomerConversation extends Conversation {
  humanReviewPending?: boolean;
  humanReviewReason?: string;
  humanReviewActionType?: string;
}

const ROHAN_CONVERSATION: CustomerConversation = {
  id: 'conv-rohan-4821',
  ticketId: '#DP-4821',
  customerName: 'Rohan Mehta',
  customerEmail: 'rohan.mehta@customer.com',
  customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  subject: 'Payment failed but money got deducted ₹1,200',
  priority: 'P1',
  status: 'Escalated',
  language: 'Hinglish',
  category: 'Billing',
  lastMessage: 'Haan kar do jaldi, aur kisi human se baat karni hai.',
  lastMessageTime: 'Today · 2:14 PM',
  isHumanHandled: true,
  humanReviewPending: true,
  humanReviewReason: 'Customer requested human assistance for UPI gateway delay and ₹1,200 refund',
  humanReviewActionType: 'refund_approval',
  suggestedReply: {
    text: "Rohan, I've checked with our payment partner. Your ₹1,200 will be back in your account by 21 Nov. I'll update you here the moment it lands.",
    sources: ['Payments FAQ v14', 'Gateway delays policy v6', 'Refund timelines v9'],
    confidence: 97,
  },
  messages: [
    {
      id: 'm1',
      sender: 'customer',
      senderName: 'Rohan Mehta',
      text: 'Bhai payment fail ho gaya lekin paisa kat gaya hai, ₹1,200. Order bhi nahi dikh raha.',
      timestamp: '2:14 PM',
    },
    {
      id: 'm2',
      sender: 'ai',
      senderName: 'DESKPILOT AI',
      text: 'Sorry Rohan, ye gateway delay ki wajah se hota hai. Kya aap apna UPI reference number bata sakte hain? Main payment check kar leta hoon.',
      timestamp: '2:14 PM',
    },
    {
      id: 'm3',
      sender: 'customer',
      senderName: 'Rohan Mehta',
      text: 'Ref hai 4812 wala, order pending dikha raha hai abhi tak.',
      timestamp: '2:15 PM',
    },
    {
      id: 'm4',
      sender: 'ai',
      senderName: 'DESKPILOT AI',
      text: 'Mil gaya. Your bank took the payment, but our gateway never confirmed it. It reverses on its own in 5–7 working days. Want me to raise a refund request now?',
      timestamp: '2:15 PM',
    },
    {
      id: 'm5',
      sender: 'customer',
      senderName: 'Rohan Mehta',
      text: 'Haan kar do jaldi, aur kisi human se baat karni hai.',
      timestamp: '2:16 PM',
    },
    {
      id: 'm6',
      sender: 'ai',
      senderName: 'System Notice',
      text: 'Customer asked for a human · routed to Billing · assigned to Priya',
      timestamp: '2:16 PM',
    },
  ],
};

class UserService {
  private getLocalConversations(): CustomerConversation[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.some((c: CustomerConversation) => c.id === 'conv-rohan-4821')) {
            parsed.unshift(ROHAN_CONVERSATION);
            this.saveLocalConversations(parsed);
          }
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    // Seed with Rohan's conversation first, followed by others
    const initial: CustomerConversation[] = [
      ROHAN_CONVERSATION,
      ...INITIAL_CONVERSATIONS.map((c) => ({
        ...c,
        humanReviewPending: c.status === 'Escalated' || c.isHumanHandled,
      })),
    ];
    this.saveLocalConversations(initial);
    return initial;
  }

  private saveLocalConversations(convs: CustomerConversation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  }

  /**
   * Fetch customer conversations (from API with fallback to local storage)
   */
  async getCustomerConversations(email?: string): Promise<CustomerConversation[]> {
    try {
      const token = localStorage.getItem('deskpilot_auth_token') || 'demo-customer-token';
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          return body.data;
        }
      }
    } catch {
      // Backend not running or offline; fall back to local store
    }

    const local = this.getLocalConversations();
    if (email) {
      const filtered = local.filter(
        (c) => c.customerEmail.toLowerCase() === email.toLowerCase()
      );
      return filtered.length > 0 ? filtered : local;
    }
    return local;
  }

  /**
   * Fetch a single customer conversation by ID
   */
  async getCustomerConversationById(id: string): Promise<CustomerConversation | null> {
    try {
      const token = localStorage.getItem('deskpilot_auth_token') || 'demo-customer-token';
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          return body.data;
        }
      }
    } catch {
      // fallback
    }

    const local = this.getLocalConversations();
    return local.find((c) => c.id === id) || null;
  }

  /**
   * Submit human assistance / approval request.
   * NOTE: This marks the conversation as pending human review and DOES NOT auto-approve.
   */
  async requestHumanAssistance(req: HumanAssistanceRequest): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('deskpilot_auth_token') || 'demo-customer-token';
      const res = await fetch(`${API_BASE}/request-human`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (res.ok) {
        const body = await res.json();
        // Update local state too
        this.updateLocalReviewStatus(req.conversationId, req.reason, req.actionType);
        return { success: true, message: body.message || 'Human assistance requested successfully.' };
      }
    } catch {
      // fallback to local handling
    }

    this.updateLocalReviewStatus(req.conversationId, req.reason, req.actionType);
    return {
      success: true,
      message: 'Human review request submitted. Our support team has been notified.',
    };
  }

  private updateLocalReviewStatus(id: string, reason: string, actionType?: string) {
    const list = this.getLocalConversations();
    const updated = list.map((c) => {
      if (c.id === id) {
        const auditMessage: Message = {
          id: `msg-audit-${Date.now()}`,
          sender: 'ai',
          senderName: 'System Notice',
          text: `Human assistance requested: "${reason}". A support agent has been notified and will review your request shortly. Refunds require human agent approval.`,
          timestamp: 'Just now',
        };
        return {
          ...c,
          status: 'Escalated' as const,
          humanReviewPending: true,
          humanReviewReason: reason,
          humanReviewActionType: actionType || 'human_agent',
          messages: [...c.messages, auditMessage],
        };
      }
      return c;
    });
    this.saveLocalConversations(updated);
  }

  /**
   * Send a customer query to the chat endpoint
   */
  async sendCustomerMessage(
    conversationId: string,
    message: string,
    customerInfo?: { name: string; email: string }
  ): Promise<{ response: string; sources?: string[]; conversation: CustomerConversation }> {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message,
          customerName: customerInfo?.name || 'Customer',
          customerEmail: customerInfo?.email || 'customer@example.com',
        }),
      });

      if (res.ok) {
        const body = await res.json();
        const data = body.data;
        const conv = await this.getCustomerConversationById(conversationId);
        return {
          response: data.response || data.message || '',
          sources: data.sources || [],
          conversation: conv || ({} as CustomerConversation),
        };
      }
    } catch {
      // fallback below
    }

    // Local deterministic fallback
    const list = this.getLocalConversations();
    let conv = list.find((c) => c.id === conversationId);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      senderName: customerInfo?.name || 'Customer',
      text: message,
      timestamp: 'Just now',
    };

    let replyText = "Thank you for reaching out! I'm DeskPilot AI. I've noted your question and checked our knowledge documents.";
    let sources = ['General Support Guidelines'];

    const lower = message.toLowerCase();
    if (lower.includes('refund') || lower.includes('money') || lower.includes('deducted') || lower.includes('payment')) {
      replyText = 'Under our payment policy, deductions without confirmation reverse within 5–7 business days. If you need a manual refund right now, you can click "Request Human Review" above and an agent will approve it.';
      sources = ['Payments FAQ v14', 'Gateway Delays Policy v6', 'Refund Timelines v9'];
    } else if (lower.includes('order') || lower.includes('shipping') || lower.includes('delivery')) {
      replyText = 'Orders typically dispatch within 24-48 hours. You can track your shipment using the tracking link emailed with your receipt.';
      sources = ['Shipping & Fulfilment Policy'];
    }

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      sender: 'ai',
      senderName: 'DeskPilot AI',
      text: replyText,
      timestamp: 'Just now',
    };

    if (conv) {
      conv.messages.push(userMsg, aiMsg);
      conv.lastMessage = replyText;
      conv.lastMessageTime = 'Just now';
      this.saveLocalConversations(list);
    } else {
      conv = {
        id: conversationId,
        customerName: customerInfo?.name || 'Customer',
        customerEmail: customerInfo?.email || 'customer@example.com',
        customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        subject: message.slice(0, 40) + '...',
        priority: 'P2',
        status: 'Open',
        language: 'English',
        category: 'General',
        lastMessage: replyText,
        lastMessageTime: 'Just now',
        isHumanHandled: false,
        messages: [userMsg, aiMsg],
      };
      list.unshift(conv);
      this.saveLocalConversations(list);
    }

    return {
      response: replyText,
      sources,
      conversation: conv,
    };
  }

  /**
   * Create a new conversation
   */
  async createNewConversation(
    subject: string,
    initialMessage: string,
    customerInfo: { name: string; email: string }
  ): Promise<CustomerConversation> {
    const id = `conv-cust-${Date.now()}`;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      senderName: customerInfo.name,
      text: initialMessage,
      timestamp: 'Just now',
    };

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      sender: 'ai',
      senderName: 'DeskPilot AI',
      text: `Hello ${customerInfo.name}! I am DeskPilot AI. I am looking into your inquiry regarding "${subject}". How else can I assist you?`,
      timestamp: 'Just now',
    };

    const newConv: CustomerConversation = {
      id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      subject,
      priority: 'P2',
      status: 'Open',
      language: 'English',
      category: 'General',
      lastMessage: aiMsg.text,
      lastMessageTime: 'Just now',
      isHumanHandled: false,
      messages: [userMsg, aiMsg],
    };

    const list = this.getLocalConversations();
    list.unshift(newConv);
    this.saveLocalConversations(list);
    return newConv;
  }
}

export const userService = new UserService();
