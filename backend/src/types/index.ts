export type Priority = 'P1' | 'P2' | 'P3';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type ConversationStatus = 'open' | 'pending' | 'escalated' | 'resolved';
export type MessageSenderType = 'customer' | 'ai' | 'agent' | 'system';
export type AssignedTo = 'ai' | 'human';
export type DocumentStatus = 'processing' | 'indexed' | 'failed';
export type TicketCategory =
  | 'Billing'
  | 'Payment'
  | 'Refund'
  | 'Shipping'
  | 'Technical Support'
  | 'Product Inquiry'
  | 'General';

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'admin' | 'agent' | 'viewer';
  created_at: string;
}

export interface Document {
  id: string;
  company_id: string;
  filename: string;
  storage_path: string;
  status: DocumentStatus;
  category: string;
  size_bytes: number;
  tokens_count?: number;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentChunk {
  id: string;
  company_id: string;
  document_id: string;
  content: string;
  page_number: number;
  chunk_index: number;
  similarity?: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  content: string;
  sender_name?: string;
  is_suggested?: boolean;
  created_at: string;
}

export interface SuggestedReply {
  text: string;
  sources: string[];
  confidence: number;
}

export interface Conversation {
  id: string;
  company_id: string;
  customer_name: string;
  customer_email?: string;
  customer_avatar?: string;
  subject?: string;
  status: ConversationStatus;
  assigned_to: AssignedTo;
  assigned_agent_name?: string;
  priority: Priority;
  category: string;
  language: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at?: string;
  messages?: Message[];
  ticket_id?: string;
  suggested_reply?: SuggestedReply;
}

export interface Ticket {
  id: string;
  company_id: string;
  conversation_id?: string;
  title: string;
  category: TicketCategory;
  priority: Priority;
  status: TicketStatus;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  company_id?: string;
}

export interface AnalyticsOverview {
  totalConversations: number;
  aiResolvedRate: number;
  averageResponseTime: string;
  customerSatisfaction: number;
  escalationRate: number;
  openTickets: number;
  aiResolvedCount: number;
  humanEscalationsCount: number;
}
