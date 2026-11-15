import React, { useState, useEffect } from 'react';
import {
  Tag,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Ticket, TicketStatus, Priority, Conversation } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../contexts/ToastContext';

interface TicketInfoPanelProps {
  conversation: Conversation;
  onTicketUpdated?: () => void;
}

export const TicketInfoPanel: React.FC<TicketInfoPanelProps> = ({
  conversation,
  onTicketUpdated,
}) => {
  const { success } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTicket = async () => {
      if (!conversation.ticketId) {
        setTicket(null);
        return;
      }
      setIsLoading(true);
      const res = await ticketService.getTicketById(conversation.ticketId);
      if (isMounted) {
        setTicket(res);
        setIsLoading(false);
      }
    };
    fetchTicket();
    return () => {
      isMounted = false;
    };
  }, [conversation.ticketId]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setIsUpdating(true);
    await ticketService.updateTicketStatus(ticket.id, status);
    setTicket((prev) => (prev ? { ...prev, status } : null));
    setIsUpdating(false);
    success(`Ticket status marked as ${status}`);
    onTicketUpdated?.();
  };

  const handlePriorityChange = async (priority: Priority) => {
    if (!ticket) return;
    setIsUpdating(true);
    await ticketService.updateTicketPriority(ticket.id, priority);
    setTicket((prev) => (prev ? { ...prev, priority } : null));
    setIsUpdating(false);
    success(`Ticket priority updated to ${priority}`);
    onTicketUpdated?.();
  };

  const handleAssignAgent = async (agent: string) => {
    if (!ticket) return;
    setIsUpdating(true);
    await ticketService.assignTicket(ticket.id, agent);
    setTicket((prev) => (prev ? { ...prev, assignedTo: agent } : null));
    setIsUpdating(false);
    success(`Ticket assigned to ${agent}`);
    onTicketUpdated?.();
  };

  if (!conversation.ticketId && !ticket) {
    return (
      <div className="w-72 bg-[#14141B] border-l border-[#292932] p-5 flex flex-col justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Ticket Details
          </h3>
          <div className="p-4 rounded-xl bg-[#191920] border border-[#292932] text-center">
            <FolderOpen className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-gray-400 mb-3">No active ticket linked to this chat.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const newTck = await ticketService.createTicket({
                  customer: conversation.customerName,
                  customerEmail: conversation.customerEmail,
                  subject: conversation.subject,
                  category: conversation.category,
                  priority: conversation.priority,
                  conversationId: conversation.id,
                });
                setTicket(newTck);
                conversation.ticketId = newTck.id;
                success(`Ticket ${newTck.id} created!`);
                onTicketUpdated?.();
              }}
            >
              Create Ticket Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 bg-[#14141B] border-l border-[#292932] flex flex-col h-full shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-[#292932]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Ticket Overview
          </span>
          <span className="text-xs font-mono font-bold text-[#FFB33F] bg-[#FFB33F]/10 px-2 py-0.5 rounded border border-[#FFB33F]/20">
            {ticket?.id || conversation.ticketId}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1 text-xs">
        {/* Status Section */}
        <div>
          <label className="text-gray-400 block mb-1.5 font-medium">Status</label>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={ticket?.status || 'Open'} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['Open', 'In Progress', 'Resolved'] as TicketStatus[]).map((st) => (
              <button
                key={st}
                disabled={isUpdating}
                onClick={() => handleStatusChange(st)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  ticket?.status === st
                    ? 'bg-[#FFB33F] text-black border-[#FFB33F] font-semibold'
                    : 'bg-[#191920] text-gray-300 border-[#292932] hover:bg-white/5'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Section */}
        <div>
          <label className="text-gray-400 block mb-1.5 font-medium">Priority</label>
          <div className="flex items-center gap-2 mb-2">
            <PriorityBadge priority={ticket?.priority || conversation.priority} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['P1', 'P2', 'P3'] as Priority[]).map((p) => (
              <button
                key={p}
                disabled={isUpdating}
                onClick={() => handlePriorityChange(p)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  ticket?.priority === p
                    ? 'bg-white/10 text-white border-white/30 font-bold'
                    : 'bg-[#191920] text-gray-400 border-[#292932] hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Assignment */}
        <div className="space-y-3 pt-2 border-t border-[#292932]">
          <div>
            <span className="text-gray-400 block mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              Category
            </span>
            <div className="px-2.5 py-1.5 bg-[#191920] border border-[#292932] rounded-lg text-white font-medium">
              {ticket?.category || conversation.category}
            </div>
          </div>

          <div>
            <span className="text-gray-400 block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Assigned Agent
            </span>
            <select
              value={ticket?.assignedTo || 'DeskPilot AI'}
              onChange={(e) => handleAssignAgent(e.target.value)}
              className="w-full bg-[#191920] border border-[#292932] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#FFB33F]"
            >
              <option value="DeskPilot AI">DeskPilot AI (Autopilot)</option>
              <option value="Rahul Sharma">Rahul Sharma (You)</option>
              <option value="Ananya Roy">Ananya Roy (Billing Lead)</option>
              <option value="Vikram Joshi">Vikram Joshi (Senior Support)</option>
            </select>
          </div>

          <div>
            <span className="text-gray-400 block mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Created
            </span>
            <div className="text-gray-300 text-[11px]">
              {ticket?.createdAt || 'Just now'}
            </div>
          </div>
        </div>

        {/* Quick Resolution Action */}
        <div className="pt-3 border-t border-[#292932]">
          <Button
            variant={ticket?.status === 'Resolved' ? 'secondary' : 'primary'}
            size="sm"
            className="w-full"
            isLoading={isUpdating}
            onClick={() => handleStatusChange(ticket?.status === 'Resolved' ? 'Open' : 'Resolved')}
            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
          >
            {ticket?.status === 'Resolved' ? 'Re-open Ticket' : 'Mark as Resolved'}
          </Button>
        </div>
      </div>
    </aside>
  );
};
