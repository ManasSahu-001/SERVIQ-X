import React from 'react';
import { Priority, TicketStatus, ConversationStatus } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-bold';

  let colorClasses = '';
  let dotColor = '';

  switch (priority) {
    case 'P1':
      colorClasses = 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
      dotColor = 'bg-rose-500';
      break;
    case 'P2':
      colorClasses = 'bg-amber-500/10 text-[#FFB33F] border border-amber-500/25';
      dotColor = 'bg-[#FFB33F]';
      break;
    case 'P3':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      dotColor = 'bg-emerald-400';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${sizeClasses} ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {priority}
    </span>
  );
};

interface StatusBadgeProps {
  status: TicketStatus | ConversationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  let colorClasses = 'bg-gray-800 text-gray-300 border border-gray-700';

  switch (status) {
    case 'Open':
      colorClasses = 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      break;
    case 'In Progress':
    case 'Pending':
      colorClasses = 'bg-amber-500/10 text-[#FFB33F] border border-amber-500/25';
      break;
    case 'Resolved':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      break;
    case 'Escalated':
      colorClasses = 'bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold animate-pulse';
      break;
    case 'Indexed':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      break;
    case 'Processing':
      colorClasses = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      break;
    case 'Failed':
      colorClasses = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-md ${sizeClasses} ${colorClasses}`}>
      {status}
    </span>
  );
};
