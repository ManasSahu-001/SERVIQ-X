import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Ticket, TicketStatus, Priority } from '../types';
import { ticketService } from '../services/ticketService';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Tickets: React.FC = () => {
  const { success } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TicketStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | Priority>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ticketService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    const handleUpdate = () => loadTickets();
    window.addEventListener('deskpilot_tickets_updated', handleUpdate);
    return () => window.removeEventListener('deskpilot_tickets_updated', handleUpdate);
  }, [loadTickets]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'Open').length;
    const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved').length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  // Filtered & Sorted tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'All' ? true : t.category === categoryFilter;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          t.id.toLowerCase().includes(q) ||
          t.customer.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q);

        return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchQuery, sortOrder]);

  const handleRowClick = (t: Ticket) => {
    setSelectedTicket(t);
    setIsModalOpen(true);
  };

  const handleInlineStatusChange = async (e: React.MouseEvent, id: string, newStatus: TicketStatus) => {
    e.stopPropagation();
    await ticketService.updateTicketStatus(id, newStatus);
    success(`Ticket ${id} marked as ${newStatus}`);
    loadTickets();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
  };

  const handleQuickCreateTicket = async () => {
    const newTck = await ticketService.createTicket({
      customer: 'Siddharth Rao',
      customerEmail: 'siddharth@startup.co',
      subject: 'Custom Webhook Retries configuration inquiry',
      category: 'Technical',
      priority: 'P2',
      notes: 'Customer inquiring about exponential backoff retry configuration.',
    });
    success(`New ticket ${newTck.id} generated!`);
    loadTickets();
  };

  const categories = ['All', 'Billing', 'Technical', 'Orders', 'General'];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-[#FFB33F]" />
              Ticket Management
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Automated issue triage, priority escalation, and agent resolution table.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleQuickCreateTicket}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Ticket
          </Button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
            <span className="text-xs text-gray-400">Total Tickets</span>
            <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
          </div>
          <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
            <span className="text-xs text-blue-400">Open Tickets</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{metrics.open}</div>
          </div>
          <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
            <span className="text-xs text-[#FFB33F]">In Progress</span>
            <div className="text-2xl font-bold text-[#FFB33F] mt-1">{metrics.inProgress}</div>
          </div>
          <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
            <span className="text-xs text-emerald-400">Resolved Tickets</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.resolved}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket ID, customer, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#191920] border border-[#292932] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F]"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFB33F]"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="sm:col-span-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFB33F]"
              >
                <option value="All">All Priorities</option>
                <option value="P1">P1 (Urgent - Red)</option>
                <option value="P2">P2 (Medium - Amber)</option>
                <option value="P3">P3 (Normal - Green)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFB33F]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Toggle */}
            <div className="sm:col-span-1">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                title="Sort by date"
                className="w-full h-full flex items-center justify-center p-2 rounded-xl bg-[#191920] border border-[#292932] hover:bg-[#21212B] text-gray-300 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-[#14141B] border border-[#292932] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#191920] border-b border-[#292932] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Subject</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292932]/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      Loading tickets...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#FFB33F]" />
                      <div className="font-semibold text-white mb-1">No tickets match the selected filters</div>
                      <p className="text-gray-500 mb-4">Try clearing your search query or reset status/priority filters.</p>
                      <Button variant="outline" size="sm" onClick={handleResetFilters} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
                        Reset Filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleRowClick(t)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#FFB33F]">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{t.customer}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
                          {t.customerEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-200">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="px-2 py-0.5 rounded bg-[#191920] border border-[#292932]">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">
                        {t.assignedTo}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                        {t.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status !== 'Resolved' ? (
                            <button
                              onClick={(e) => handleInlineStatusChange(e, t.id, 'Resolved')}
                              title="Quick resolve"
                              className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdated={loadTickets}
        />
      </div>
    </DashboardLayout>
  );
};
