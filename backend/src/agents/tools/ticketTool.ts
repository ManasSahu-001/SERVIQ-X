import { store } from '../../services/store.js';
import { Ticket, TicketCategory, Priority } from '../../types/index.js';
import { logger } from '../../config/logger.js';
import { logTraceEvent } from '../../config/langsmith.js';

export interface CreateTicketParams {
  companyId: string;
  conversationId: string;
  title: string;
  category: TicketCategory;
  priority: Priority;
  notes?: string;
  assignedTo?: string;
}

export const executeCreateTicket = async (params: CreateTicketParams): Promise<Ticket> => {
  const { companyId, conversationId, title, category, priority, notes, assignedTo } = params;

  logger.info({ companyId, conversationId, priority, category }, 'Executing idempotent ticket creation');

  const ticket = store.createTicket({
    company_id: companyId,
    conversation_id: conversationId,
    title,
    category,
    priority,
    status: 'open',
    assigned_to: assignedTo || 'Human Support Lead',
    notes: notes || `Auto-created by SERVIQ-X Agent on escalation. Reason: ${notes || 'Priority triage'}`,
  });

  await logTraceEvent('ticket:created', {
    conversationId,
    companyId,
    escalated: true,
    data: { ticketId: ticket.id, priority, category },
  });

  return ticket;
};
