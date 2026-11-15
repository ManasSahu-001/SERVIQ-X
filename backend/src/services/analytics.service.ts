import { store } from './store.js';

export const analyticsService = {
  getOverview(companyId: string) {
    return store.getAnalytics(companyId);
  },

  getConversationsAnalytics(companyId: string) {
    const convs = store.getConversationsByCompany(companyId);

    const timeline = [
      { date: 'Mon', total: 14, aiResolved: 11, humanResolved: 3 },
      { date: 'Tue', total: 22, aiResolved: 18, humanResolved: 4 },
      { date: 'Wed', total: 19, aiResolved: 15, humanResolved: 4 },
      { date: 'Thu', total: 28, aiResolved: 23, humanResolved: 5 },
      { date: 'Fri', total: 34, aiResolved: 27, humanResolved: 7 },
      { date: 'Sat', total: 18, aiResolved: 16, humanResolved: 2 },
      { date: 'Sun', total: 12, aiResolved: 10, humanResolved: 2 },
    ];

    const categoryBreakdown = [
      { name: 'Refunds & Returns', value: 38, color: '#FFB33F' },
      { name: 'Payment Disputes', value: 24, color: '#EF4444' },
      { name: 'Shipping Inquiries', value: 26, color: '#10B981' },
      { name: 'Technical Support', value: 12, color: '#6366F1' },
    ];

    return {
      total: convs.length,
      timeline,
      categoryBreakdown,
    };
  },

  getTicketsAnalytics(companyId: string) {
    const tickets = store.getTicketsByCompany(companyId);

    const priorityDistribution = [
      { priority: 'P1', count: tickets.filter((t) => t.priority === 'P1').length, color: '#EF4444' },
      { priority: 'P2', count: tickets.filter((t) => t.priority === 'P2').length, color: '#FFB33F' },
      { priority: 'P3', count: tickets.filter((t) => t.priority === 'P3').length, color: '#10B981' },
    ];

    const statusDistribution = [
      { status: 'open', count: tickets.filter((t) => t.status === 'open').length },
      { status: 'in_progress', count: tickets.filter((t) => t.status === 'in_progress').length },
      { status: 'resolved', count: tickets.filter((t) => t.status === 'resolved').length },
    ];

    return {
      totalTickets: tickets.length,
      priorityDistribution,
      statusDistribution,
    };
  },
};
