import { apiClient, isMockModeEnabled } from './api';
import { Ticket, TicketStatus, Priority } from '../types';
import { INITIAL_TICKETS } from './mockData';

const STORAGE_KEY = 'deskpilot_tickets';

const loadLocalTickets = (): Ticket[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
  return INITIAL_TICKETS;
};

const saveLocalTickets = (tickets: Ticket[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new CustomEvent('deskpilot_tickets_updated'));
};

export const ticketService = {
  async getTickets(): Promise<Ticket[]> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<any>('/api/tickets');
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.tickets && Array.isArray(response.data.tickets)) {
          return response.data.tickets;
        }
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, using local tickets:', err);
      }
    }
    return loadLocalTickets();
  },

  async getTicketById(id: string): Promise<Ticket | null> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<Ticket>(`/api/tickets/${id}`);
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, using local ticket:', err);
      }
    }
    const tickets = loadLocalTickets();
    return tickets.find((t) => t.id === id) || null;
  },

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.patch<Ticket>(`/api/tickets/${id}`, updates);
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to local ticket update:', err);
      }
    }

    const tickets = loadLocalTickets();
    let updatedTicket: Ticket | null = null;
    const updated = tickets.map((t) => {
      if (t.id === id) {
        updatedTicket = {
          ...t,
          ...updates,
          updatedAt: new Date().toLocaleString(),
        };
        return updatedTicket;
      }
      return t;
    });
    saveLocalTickets(updated);
    return updatedTicket || tickets[0];
  },

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return this.updateTicket(id, { status });
  },

  async updateTicketPriority(id: string, priority: Priority): Promise<Ticket> {
    return this.updateTicket(id, { priority });
  },

  async assignTicket(id: string, assignedTo: string): Promise<Ticket> {
    return this.updateTicket(id, { assignedTo });
  },

  async createTicket(data: {
    customer: string;
    customerEmail: string;
    subject: string;
    category: 'Billing' | 'Technical' | 'Orders' | 'General';
    priority: Priority;
    assignedTo?: string;
    notes?: string;
    conversationId?: string;
  }): Promise<Ticket> {
    const newTicket: Ticket = {
      id: `TCK-${Math.floor(8825 + Math.random() * 50)}`,
      conversationId: data.conversationId || `conv-${Date.now()}`,
      customer: data.customer,
      customerEmail: data.customerEmail,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      assignedTo: data.assignedTo || 'DeskPilot AI',
      status: 'Open',
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      notes: data.notes,
    };

    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.post<Ticket>('/api/tickets', newTicket);
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to local ticket creation:', err);
      }
    }

    const tickets = loadLocalTickets();
    tickets.unshift(newTicket);
    saveLocalTickets(tickets);
    return newTicket;
  },
};
