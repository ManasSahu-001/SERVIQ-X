export type Priority = 'P1' | 'P2' | 'P3';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export type ConversationStatus = 'Open' | 'Pending' | 'Resolved' | 'Escalated';

export type MessageSender = 'customer' | 'ai' | 'agent';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  senderName?: string;
  avatar?: string;
  isSuggested?: boolean;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  subject: string;
  priority: Priority;
  status: ConversationStatus;
  language: 'English' | 'Hindi' | 'Hinglish';
  category: 'Billing' | 'Technical' | 'Orders' | 'General';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  assignedAgent?: string;
  isHumanHandled: boolean;
  ticketId?: string;
  messages: Message[];
  suggestedReply?: {
    text: string;
    sources: string[];
    confidence: number; // e.g. 94
  };
}

export interface Ticket {
  id: string;
  conversationId: string;
  customer: string;
  customerEmail: string;
  subject: string;
  category: 'Billing' | 'Technical' | 'Orders' | 'General';
  priority: Priority;
  assignedTo: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  uploadedAt: string;
  category: 'Refund Policy' | 'Shipping Policy' | 'Payment Policy' | 'Product Information' | 'Frequently Asked Questions' | 'General';
  status: 'Indexed' | 'Processing' | 'Failed';
  type: 'pdf' | 'txt';
  tokensCount?: number;
}

export interface AnalyticsMetrics {
  totalConversations: number;
  aiResolvedRate: number; // percentage
  averageResponseTime: string; // e.g. "42s"
  customerSatisfaction: number; // e.g. 4.8
  escalationRate: number; // percentage
  openTickets: number;
  aiResolvedCount: number;
  humanEscalationsCount: number;
}

export interface ChartDataPoint {
  date: string;
  total: number;
  aiResolved: number;
  humanResolved: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface PriorityDataPoint {
  priority: Priority;
  count: number;
  color: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  avatar: string;
}

export interface AgentSettings {
  general: {
    companyName: string;
    website: string;
    businessDescription: string;
  };
  aiAgent: {
    agentName: string;
    language: 'English' | 'Hindi' | 'Hinglish';
    tone: 'Friendly' | 'Professional' | 'Formal';
    autoResponse: boolean;
  };
  humanSupport: {
    enableHandover: boolean;
    supportHours: string;
    escalationTriggers: string[];
  };
  appearance: {
    brandColor: string;
    logoUrl?: string;
  };
}
