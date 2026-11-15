import React, { useState } from 'react';
import { Ticket, TicketStatus, Priority } from '../../types';
import { Modal } from '../common/Modal';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../contexts/ToastContext';
import { Tag, User, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { success } = useToast();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!ticket) return null;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsUpdating(true);
    await ticketService.updateTicketStatus(ticket.id, newStatus);
    setIsUpdating(false);
    success(`Ticket status updated to ${newStatus}`);
    onUpdated();
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    setIsUpdating(true);
    await ticketService.updateTicketPriority(ticket.id, newPriority);
    setIsUpdating(false);
    success(`Ticket priority changed to ${newPriority}`);
    onUpdated();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket ${ticket.id}`}
      description="View full issue breakdown and manage agent resolution"
      maxWidth="xl"
    >
      <div className="space-y-6 text-xs">
        {/* Header information */}
        <div className="p-4 bg-[#14141B] border border-[#292932] rounded-xl flex items-start justify-between gap-4">
          <div>
            <span className="text-[11px] text-gray-400 block mb-1">Customer</span>
            <div className="text-sm font-bold text-white">{ticket.customer}</div>
            <div className="text-gray-400">{ticket.customerEmail}</div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        {/* Issue Subject */}
        <div>
          <label className="text-gray-400 font-semibold block mb-1">Subject</label>
          <div className="p-3 bg-[#14141B] border border-[#292932] rounded-xl text-sm font-medium text-white">
            {ticket.subject}
          </div>
        </div>

        {/* Notes / Context */}
        {ticket.notes && (
          <div>
            <label className="text-gray-400 font-semibold block mb-1">Internal Notes</label>
            <div className="p-3 bg-[#191920] border border-[#292932] rounded-xl text-gray-300 leading-relaxed">
              {ticket.notes}
            </div>
          </div>
        )}

        {/* Status controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 font-semibold block mb-1.5">Change Status</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Open', 'In Progress', 'Resolved'] as TicketStatus[]).map((st) => (
                <button
                  key={st}
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(st)}
                  className={`px-2.5 py-2 rounded-lg font-medium text-xs border transition-colors cursor-pointer ${
                    ticket.status === st
                      ? 'bg-[#FFB33F] text-black border-[#FFB33F] font-bold'
                      : 'bg-[#14141B] text-gray-300 border-[#292932] hover:bg-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 font-semibold block mb-1.5">Change Priority</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['P1', 'P2', 'P3'] as Priority[]).map((p) => (
                <button
                  key={p}
                  disabled={isUpdating}
                  onClick={() => handlePriorityChange(p)}
                  className={`px-2.5 py-2 rounded-lg font-medium text-xs border transition-colors cursor-pointer ${
                    ticket.priority === p
                      ? 'bg-white/15 text-white border-white/30 font-bold'
                      : 'bg-[#14141B] text-gray-400 border-[#292932] hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meta details */}
        <div className="p-3.5 bg-[#14141B] border border-[#292932] rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
          <div>
            <span className="text-gray-400 block">Category</span>
            <span className="font-semibold text-white">{ticket.category}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Assigned Agent</span>
            <span className="font-semibold text-white">{ticket.assignedTo}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Created On</span>
            <span className="font-semibold text-white">{ticket.createdAt}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#292932]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/dashboard');
            }}
            leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#FFB33F]" />}
          >
            Open in Workspace
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
