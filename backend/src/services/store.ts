import { v4 as uuidv4 } from 'uuid';
import {
  Company,
  CompanyMember,
  Document,
  DocumentChunk,
  Conversation,
  Message,
  Ticket,
  AnalyticsOverview,
} from '../types/index.js';

// Pre-seeded demo tenant ID and demo user ID
export const DEMO_COMPANY_ID = '11111111-1111-1111-1111-111111111111';
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

class DataStore {
  private companies: Map<string, Company> = new Map();
  private companyMembers: Map<string, CompanyMember> = new Map();
  private documents: Map<string, Document> = new Map();
  private documentChunks: Map<string, DocumentChunk & { embedding?: number[] }> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private tickets: Map<string, Ticket> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Seed Demo Company
    const demoCompany: Company = {
      id: DEMO_COMPANY_ID,
      name: 'SERVIQ-X Enterprise Demo Corp',
      created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    };
    this.companies.set(demoCompany.id, demoCompany);

    // 2. Seed Demo Member
    const demoMember: CompanyMember = {
      id: uuidv4(),
      company_id: DEMO_COMPANY_ID,
      user_id: DEMO_USER_ID,
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    this.companyMembers.set(demoMember.id, demoMember);

    // 3. Seed Knowledge Base Documents
    const docRefund: Document = {
      id: 'doc-refund-001',
      company_id: DEMO_COMPANY_ID,
      filename: 'Refund_and_Cancellation_Policy_2026.pdf',
      storage_path: 'kb/Refund_and_Cancellation_Policy_2026.pdf',
      status: 'indexed',
      category: 'Refund Policy',
      size_bytes: 48200,
      tokens_count: 1250,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    };
    const docShipping: Document = {
      id: 'doc-shipping-002',
      company_id: DEMO_COMPANY_ID,
      filename: 'Shipping_and_Fulfillment_Guidelines.pdf',
      storage_path: 'kb/Shipping_and_Fulfillment_Guidelines.pdf',
      status: 'indexed',
      category: 'Shipping Policy',
      size_bytes: 32400,
      tokens_count: 890,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    };
    const docPayment: Document = {
      id: 'doc-payment-003',
      company_id: DEMO_COMPANY_ID,
      filename: 'Payment_Gateways_and_Disputes_SOP.pdf',
      storage_path: 'kb/Payment_Gateways_and_Disputes_SOP.pdf',
      status: 'indexed',
      category: 'Payment Policy',
      size_bytes: 65100,
      tokens_count: 1720,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    };

    this.documents.set(docRefund.id, docRefund);
    this.documents.set(docShipping.id, docShipping);
    this.documents.set(docPayment.id, docPayment);

    const refundChunk: DocumentChunk & { embedding: number[] } = {
      id: uuidv4(),
      company_id: DEMO_COMPANY_ID,
      document_id: docRefund.id,
      content:
        'Refund Policy: Customers can request a 100% refund within 30 days of product receipt if the item is unused and in original packaging. Refunds are processed back to the original payment method within 5 to 7 business days once approved by support.',
      page_number: 1,
      chunk_index: 0,
      created_at: new Date().toISOString(),
      embedding: this.generateSyntheticEmbedding(
        'Refund Policy: Customers can request a 100% refund within 30 days of product receipt if the item is unused and in original packaging. Refunds are processed back to the original payment method within 5 to 7 business days once approved by support.'
      ),
    };

    const shippingChunk: DocumentChunk & { embedding: number[] } = {
      id: uuidv4(),
      company_id: DEMO_COMPANY_ID,
      document_id: docShipping.id,
      content:
        'Shipping Guidelines: Standard courier delivery takes 3 to 5 business days nationwide. Express air shipping takes 24 to 48 hours. Tracking details are automatically dispatched via SMS and email within 12 hours of package dispatch.',
      page_number: 1,
      chunk_index: 0,
      created_at: new Date().toISOString(),
      embedding: this.generateSyntheticEmbedding(
        'Shipping Guidelines: Standard courier delivery takes 3 to 5 business days nationwide. Express air shipping takes 24 to 48 hours. Tracking details are automatically dispatched via SMS and email within 12 hours of package dispatch.'
      ),
    };

    const paymentChunk: DocumentChunk & { embedding: number[] } = {
      id: uuidv4(),
      company_id: DEMO_COMPANY_ID,
      document_id: docPayment.id,
      content:
        'Payment Disputes & Reconciliation: If a customer amount is deducted from their bank account or credit card but the order status displays Pending or Failed, the transaction is reconciled within 24 hours. Support agents must collect the Order ID or Bank Reference Number and file an urgent P1 ticket for manual settlement.',
      page_number: 2,
      chunk_index: 1,
      created_at: new Date().toISOString(),
      embedding: this.generateSyntheticEmbedding(
        'Payment Disputes & Reconciliation: If a customer amount is deducted from their bank account or credit card but the order status displays Pending or Failed, the transaction is reconciled within 24 hours. Support agents must collect the Order ID or Bank Reference Number and file an urgent P1 ticket for manual settlement.'
      ),
    };

    this.documentChunks.set(refundChunk.id, refundChunk);
    this.documentChunks.set(shippingChunk.id, shippingChunk);
    this.documentChunks.set(paymentChunk.id, paymentChunk);

    // 5. Seed Pre-existing Conversations
    const conv1: Conversation = {
      id: 'conv-demo-001',
      company_id: DEMO_COMPANY_ID,
      customer_name: 'Priya Sharma',
      customer_email: 'priya.sharma@example.com',
      customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      subject: 'Refund status for returned leather jacket',
      status: 'open',
      assigned_to: 'ai',
      priority: 'P2',
      category: 'Refund',
      language: 'English',
      last_message: 'Our refund policy covers requests within 30 days. Your return has been verified.',
      last_message_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
    };
    this.conversations.set(conv1.id, conv1);

    const msg1: Message = {
      id: uuidv4(),
      conversation_id: conv1.id,
      sender_type: 'customer',
      content: 'Hello, I returned my order 3 days ago. When will I get my refund?',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    };
    const msg2: Message = {
      id: uuidv4(),
      conversation_id: conv1.id,
      sender_type: 'ai',
      content:
        'According to our Refund Policy, refunds are processed back to your original payment method within 5 to 7 business days once approved by our verification team.',
      sender_name: 'SERVIQ-X AI',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    };
    this.messages.set(msg1.id, msg1);
    this.messages.set(msg2.id, msg2);

    // 6. Seed Demo Ticket
    const ticket1: Ticket = {
      id: 'TCK-8821',
      company_id: DEMO_COMPANY_ID,
      conversation_id: conv1.id,
      title: 'Refund verification for order #RET-5510',
      category: 'Refund',
      priority: 'P2',
      status: 'open',
      assigned_to: 'Rahul Sharma',
      notes: 'Customer returned jacket, awaiting courier warehouse scan.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tickets.set(ticket1.id, ticket1);
  }

  // --- Company Methods ---
  createCompany(name: string): Company {
    const company: Company = {
      id: uuidv4(),
      name,
      created_at: new Date().toISOString(),
    };
    this.companies.set(company.id, company);
    return company;
  }

  getCompany(id: string): Company | null {
    return this.companies.get(id) || null;
  }

  addMember(companyId: string, userId: string, role: 'admin' | 'agent' | 'viewer' = 'admin'): CompanyMember {
    const member: CompanyMember = {
      id: uuidv4(),
      company_id: companyId,
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
    };
    this.companyMembers.set(member.id, member);
    return member;
  }

  getMemberByUserId(userId: string): CompanyMember | null {
    for (const member of this.companyMembers.values()) {
      if (member.user_id === userId) return member;
    }
    return null;
  }

  isUserMemberOf(companyId: string, userId: string): boolean {
    for (const member of this.companyMembers.values()) {
      if (member.company_id === companyId && member.user_id === userId) return true;
    }
    return false;
  }

  // --- Document Methods ---
  createDocument(doc: Omit<Document, 'id' | 'created_at'>): Document {
    const newDoc: Document = {
      ...doc,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.documents.set(newDoc.id, newDoc);
    return newDoc;
  }

  getDocumentsByCompany(companyId: string): Document[] {
    return Array.from(this.documents.values()).filter((d) => d.company_id === companyId);
  }

  getDocumentById(companyId: string, docId: string): Document | null {
    const doc = this.documents.get(docId);
    if (doc && doc.company_id === companyId) return doc;
    return null;
  }

  deleteDocument(companyId: string, docId: string): boolean {
    const doc = this.getDocumentById(companyId, docId);
    if (!doc) return false;

    // Delete chunks
    for (const [id, chunk] of this.documentChunks.entries()) {
      if (chunk.document_id === docId) {
        this.documentChunks.delete(id);
      }
    }
    this.documents.delete(docId);
    return true;
  }

  // --- Chunks & Vector Search Methods ---
  saveChunks(chunks: Array<Omit<DocumentChunk & { embedding?: number[] }, 'id' | 'created_at'>>): DocumentChunk[] {
    const saved: DocumentChunk[] = [];
    for (const c of chunks) {
      const chunk: DocumentChunk & { embedding?: number[] } = {
        ...c,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      };
      this.documentChunks.set(chunk.id, chunk);
      saved.push(chunk);
    }
    return saved;
  }

  searchChunks(
    companyId: string,
    queryEmbedding: number[],
    threshold = 0.3,
    topK = 5
  ): Array<DocumentChunk & { similarity: number }> {
    const results: Array<DocumentChunk & { similarity: number }> = [];

    for (const chunk of this.documentChunks.values()) {
      if (chunk.company_id !== companyId) continue;
      if (!chunk.embedding || chunk.embedding.length === 0) continue;

      const sim = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      if (sim >= threshold) {
        results.push({
          ...chunk,
          similarity: sim,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  // --- Conversations & Messages ---
  createConversation(data: Partial<Conversation> & { company_id: string }): Conversation {
    const conv: Conversation = {
      id: data.id || uuidv4(),
      company_id: data.company_id,
      customer_name: data.customer_name || 'Guest Customer',
      customer_email: data.customer_email || 'guest@example.com',
      customer_avatar:
        data.customer_avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      subject: data.subject || 'Support Conversation',
      status: data.status || 'open',
      assigned_to: data.assigned_to || 'ai',
      assigned_agent_name: data.assigned_agent_name,
      priority: data.priority || 'P3',
      category: data.category || 'General',
      language: data.language || 'English',
      last_message: data.last_message || '',
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ticket_id: data.ticket_id,
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  getConversationsByCompany(companyId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter((c) => c.company_id === companyId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getConversationById(companyId: string, convId: string): Conversation | null {
    const conv = this.conversations.get(convId);
    if (conv && conv.company_id === companyId) return conv;
    return null;
  }

  updateConversation(
    companyId: string,
    convId: string,
    updates: Partial<Conversation>
  ): Conversation | null {
    const conv = this.getConversationById(companyId, convId);
    if (!conv) return null;

    const updated: Conversation = {
      ...conv,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.conversations.set(convId, updated);
    return updated;
  }

  createMessage(data: Omit<Message, 'id' | 'created_at'>): Message {
    const msg: Message = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.messages.set(msg.id, msg);

    // Update conversation last message
    const conv = this.conversations.get(msg.conversation_id);
    if (conv) {
      conv.last_message = msg.content;
      conv.last_message_at = msg.created_at;
      conv.updated_at = msg.created_at;
    }

    return msg;
  }

  getMessagesByConversation(convId: string): Message[] {
    return Array.from(this.messages.values())
      .filter((m) => m.conversation_id === convId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // --- Tickets ---
  createTicket(data: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Ticket {
    // Idempotency: if an open ticket for the same conversation already exists, return it
    if (data.conversation_id) {
      const existing = Array.from(this.tickets.values()).find(
        (t) =>
          t.conversation_id === data.conversation_id &&
          t.company_id === data.company_id &&
          t.status !== 'resolved'
      );
      if (existing) {
        return existing;
      }
    }

    const ticket: Ticket = {
      ...data,
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tickets.set(ticket.id, ticket);

    // Link ticket to conversation
    if (ticket.conversation_id) {
      const conv = this.conversations.get(ticket.conversation_id);
      if (conv) {
        conv.ticket_id = ticket.id;
        conv.priority = ticket.priority;
        conv.status = 'escalated';
      }
    }

    return ticket;
  }

  getTicketsByCompany(companyId: string): Ticket[] {
    return Array.from(this.tickets.values())
      .filter((t) => t.company_id === companyId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getTicketById(companyId: string, ticketId: string): Ticket | null {
    const ticket = this.tickets.get(ticketId);
    if (ticket && ticket.company_id === companyId) return ticket;
    return null;
  }

  updateTicket(
    companyId: string,
    ticketId: string,
    updates: Partial<Ticket>
  ): Ticket | null {
    const ticket = this.getTicketById(companyId, ticketId);
    if (!ticket) return null;

    const updated: Ticket = {
      ...ticket,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.tickets.set(ticketId, updated);
    return updated;
  }

  getAnalytics(companyId: string): AnalyticsOverview {
    const convs = this.getConversationsByCompany(companyId);
    const tickets = this.getTicketsByCompany(companyId);

    const totalConversations = convs.length || 1;
    const aiResolved = convs.filter((c) => c.status === 'resolved' && c.assigned_to === 'ai').length;
    const escalations = convs.filter((c) => c.status === 'escalated' || c.assigned_to === 'human').length;
    const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;

    const aiResolvedRate = Math.round((aiResolved / totalConversations) * 100) || 78;
    const escalationRate = Math.round((escalations / totalConversations) * 100) || 22;

    return {
      totalConversations: convs.length,
      aiResolvedRate,
      averageResponseTime: '38s',
      customerSatisfaction: 4.8,
      escalationRate,
      openTickets: openTicketsCount,
      aiResolvedCount: aiResolved,
      humanEscalationsCount: escalations,
    };
  }

  // --- Utility: Vector Similarity ---
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Deterministic synthetic embedding generator
   * Maps text to a reproducible 1536-dimensional normalized vector
   * utilizing position-invariant word hashing and character 3-grams
   */
  public generateSyntheticEmbedding(text: string, dimensions = 1536): number[] {
    const vector = new Array(dimensions).fill(0);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    for (const word of words) {
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 31 + word.charCodeAt(j)) >>> 0;
      }
      const index = hash % dimensions;
      vector[index] += 1.0;

      // Also add character 3-grams for subword / morphological overlap
      if (word.length >= 3) {
        for (let k = 0; k <= word.length - 3; k++) {
          let triHash = 0;
          for (let m = 0; m < 3; m++) {
            triHash = (triHash * 37 + word.charCodeAt(k + m)) >>> 0;
          }
          const triIndex = (triHash + 13) % dimensions;
          vector[triIndex] += 0.5;
        }
      }
    }

    // Normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] /= norm;
      }
    }
    return vector;
  }
}

export const store = new DataStore();
