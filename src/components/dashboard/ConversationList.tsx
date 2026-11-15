import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Conversation, ConversationStatus } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | ConversationStatus>('All');

  const filters: ('All' | ConversationStatus)[] = ['All', 'Open', 'Pending', 'Escalated', 'Resolved'];

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesFilter = activeFilter === 'All' ? true : c.status === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerEmail.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        (c.ticketId && c.ticketId.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [conversations, activeFilter, searchQuery]);

  return (
    <div className="w-80 md:w-96 bg-[#14141B] border-r border-[#292932] flex flex-col h-full shrink-0">
      {/* Top Search bar */}
      <div className="p-4 border-b border-[#292932] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Conversations</span>
            <span className="px-2 py-0.5 text-xs bg-[#292932] text-gray-300 rounded-full font-normal">
              {filteredConversations.length}
            </span>
          </h2>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, issue, ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#191920] border border-[#292932] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#FFB33F] text-black font-semibold'
                    : 'bg-[#191920] text-gray-400 hover:text-white border border-[#292932]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#292932]/50">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-gray-400">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No conversations match your filter.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full text-left p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                  isSelected
                    ? 'bg-[#191920] border-l-4 border-l-[#FFB33F]'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Avatar with status indicator */}
                <div className="relative shrink-0">
                  <img
                    src={conv.customerAvatar}
                    alt={conv.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-[#292932]"
                  />
                  {conv.isHumanHandled ? (
                    <span
                      title="Human Agent Active"
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#14141B]"
                    />
                  ) : (
                    <span
                      title="AI Autopilot Active"
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FFB33F] border-2 border-[#14141B]"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-white truncate">
                      {conv.customerName}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">{conv.lastMessageTime}</span>
                  </div>

                  <div className="text-xs text-gray-300 font-medium truncate mb-1">
                    {conv.subject}
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={conv.priority} size="sm" />
                      <StatusBadge status={conv.status} size="sm" />
                    </div>

                    {conv.ticketId && (
                      <span className="text-[10px] text-gray-400 font-mono bg-[#21212B] px-1.5 py-0.5 rounded">
                        {conv.ticketId}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
