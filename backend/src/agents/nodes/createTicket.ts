import { AgentState } from '../state.js';
import { executeCreateTicket } from '../tools/ticketTool.js';
import { logger } from '../../config/logger.js';
import { store } from '../../services/store.js';

export const createTicketNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId, customerMessage, category, priority, escalationReason } = state;
  logger.info({ conversationId, category, priority }, 'Node: createTicket');

  const title = `Escalation: ${category} - ${customerMessage.slice(0, 40)}...`;

  const ticket = await executeCreateTicket({
    companyId,
    conversationId,
    title,
    category,
    priority,
    notes: escalationReason || 'Autonomous AI escalation triggered',
    assignedTo: 'Support Agent Pool',
  });

  store.updateConversation(companyId, conversationId, {
    ticket_id: ticket.id,
    priority: ticket.priority,
    status: 'escalated',
  });

  return {
    ticketId: ticket.id,
    conversationStatus: 'escalated',
  };
};
