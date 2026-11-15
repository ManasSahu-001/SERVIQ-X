import { store } from './store.js';
import { Ticket, TicketCategory, Priority, TicketStatus } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { getSocketServer } from '../sockets/socket.js';
import { SOCKET_EVENTS } from '../sockets/events.js';

export const ticketService = {
  async getTickets(companyId: string): Promise<Ticket[]> {
    return store.getTicketsByCompany(companyId);
  },

  async getTicketById(companyId: string, id: string): Promise<Ticket> {
    const ticket = store.getTicketById(companyId, id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found in this company workspace');
    }
    return ticket;
  },

  async createTicket(params: {
    companyId: string;
    conversationId?: string;
    title: string;
    category?: TicketCategory;
    priority?: Priority;
    assignedTo?: string;
    notes?: string;
  }): Promise<Ticket> {
    const ticket = store.createTicket({
      company_id: params.companyId,
      conversation_id: params.conversationId,
      title: params.title,
      category: params.category || 'General',
      priority: params.priority || 'P3',
      status: 'open',
      assigned_to: params.assignedTo || 'Unassigned',
      notes: params.notes,
    });

    const io = getSocketServer();
    if (io) {
      io.to(`company:${params.companyId}`).emit(SOCKET_EVENTS.TICKET_CREATED, ticket);
    }

    return ticket;
  },

  async updateTicket(
    companyId: string,
    id: string,
    updates: {
      status?: TicketStatus;
      priority?: Priority;
      assigned_to?: string;
      notes?: string;
      category?: TicketCategory;
    }
  ): Promise<Ticket> {
    const updated = store.updateTicket(companyId, id, updates);
    if (!updated) {
      throw new NotFoundError('Ticket not found');
    }

    const io = getSocketServer();
    if (io) {
      io.to(`company:${companyId}`).emit(SOCKET_EVENTS.TICKET_UPDATED, updated);
    }

    return updated;
  },
};
