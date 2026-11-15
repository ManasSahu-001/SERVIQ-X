import React from 'react';
import { MessageSquare, Bot, AlertOctagon, UserCheck, ArrowUpRight } from 'lucide-react';
import { AnalyticsMetrics } from '../../types';

interface MetricsCardsProps {
  metrics: AnalyticsMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Conversations',
      value: metrics.totalConversations.toLocaleString(),
      subtext: '+14% vs last week',
      icon: MessageSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'AI Resolved',
      value: `${metrics.aiResolvedRate}%`,
      subtext: `${metrics.aiResolvedCount} handled without human`,
      icon: Bot,
      color: 'text-[#FFB33F]',
      bgColor: 'bg-[#FFB33F]/10',
      borderColor: 'border-[#FFB33F]/25',
    },
    {
      title: 'Open Tickets',
      value: metrics.openTickets.toString(),
      subtext: '4 marked urgent (P1)',
      icon: AlertOctagon,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    },
    {
      title: 'Human Escalations',
      value: `${metrics.escalationRate}%`,
      subtext: `${metrics.humanEscalationsCount} transferred to agents`,
      icon: UserCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 p-5 bg-[#0B0B0F] border-b border-[#292932]">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-[#191920] border border-[#292932] rounded-xl p-4 flex flex-col justify-between hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">{card.title}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bgColor} ${card.borderColor} border flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
              <span className="text-[11px] text-gray-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 text-[#FFB33F]" />
              </span>
            </div>

            <div className="mt-1 text-xs text-gray-400">{card.subtext}</div>
          </div>
        );
      })}
    </div>
  );
};
