import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { analyticsService, AnalyticsResponse } from '../services/analyticsService';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Bot,
  Users,
  Info,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await analyticsService.getAnalyticsData();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = data?.metrics;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#FFB33F]" />
              Support Analytics & Performance
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Autonomous resolution metrics, agent workload distribution, and ticket velocity.
            </p>
          </div>

          {/* Demo data badge */}
          {data?.isDemoData && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191920] border border-[#FFB33F]/30 text-xs text-gray-300">
              <Info className="w-3.5 h-3.5 text-[#FFB33F]" />
              <span>Simulated Demo Analytics Data</span>
            </div>
          )}
        </div>

        {/* 5 Top Key Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
              <span className="text-xs text-gray-400 block mb-1">Total Conversations</span>
              <div className="text-2xl font-bold text-white">{metrics.totalConversations}</div>
              <span className="text-[10px] text-emerald-400 mt-1 block">+12% this week</span>
            </div>

            <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
              <span className="text-xs text-[#FFB33F] block mb-1">AI Resolution Rate</span>
              <div className="text-2xl font-bold text-[#FFB33F]">{metrics.aiResolvedRate}%</div>
              <span className="text-[10px] text-gray-400 mt-1 block">Goal: 75%+</span>
            </div>

            <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
              <span className="text-xs text-blue-400 block mb-1">Avg Response Time</span>
              <div className="text-2xl font-bold text-blue-400">{metrics.averageResponseTime}</div>
              <span className="text-[10px] text-gray-400 mt-1 block">Real-time instant reply</span>
            </div>

            <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4">
              <span className="text-xs text-emerald-400 block mb-1">Customer CSAT</span>
              <div className="text-2xl font-bold text-emerald-400">{metrics.customerSatisfaction} / 5.0</div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">98% positive sentiment</span>
            </div>

            <div className="bg-[#14141B] border border-[#292932] rounded-xl p-4 col-span-2 md:col-span-1">
              <span className="text-xs text-rose-400 block mb-1">Escalation Rate</span>
              <div className="text-2xl font-bold text-rose-400">{metrics.escalationRate}%</div>
              <span className="text-[10px] text-gray-400 mt-1 block">Transferred to human</span>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Conversations Over Time (Area Chart) */}
          <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Conversations Volume Over Time</h3>
                <p className="text-xs text-gray-400">Total inquiries handled daily</p>
              </div>
              <span className="text-[11px] text-gray-400 bg-[#191920] px-2.5 py-1 rounded-lg border border-[#292932]">
                Past 7 Days
              </span>
            </div>

            <div className="h-64 w-full">
              {data?.timeline && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFB33F" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FFB33F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292932" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#191920',
                        borderColor: '#292932',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#FFF',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#FFB33F"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#totalColor)"
                      name="Total Conversations"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: AI-Resolved vs Human-Resolved Conversations */}
          <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">AI-Resolved vs Human-Resolved</h3>
                <p className="text-xs text-gray-400">Daily breakdown of autonomous resolution</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-[#FFB33F]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FFB33F]" />
                  AI Handled
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  Human Handled
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {data?.timeline && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292932" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#191920',
                        borderColor: '#292932',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#FFF',
                      }}
                    />
                    <Bar dataKey="aiResolved" fill="#FFB33F" radius={[4, 4, 0, 0]} name="AI Resolved" />
                    <Bar dataKey="humanResolved" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Human Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Tickets by Category (Donut Chart) */}
          <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-5 shadow-md">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white">Tickets by Category</h3>
              <p className="text-xs text-gray-400">Distribution across business domains</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {data?.categories && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {data.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#191920',
                        borderColor: '#292932',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#FFF',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-gray-300">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 4: Ticket Priority Distribution */}
          <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-5 shadow-md">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white">Ticket Priority Distribution</h3>
              <p className="text-xs text-gray-400">Total tickets classified by urgency tier</p>
            </div>

            <div className="h-64 w-full">
              {data?.priorities && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.priorities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292932" vertical={false} />
                    <XAxis dataKey="priority" stroke="#71717A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#191920',
                        borderColor: '#292932',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#FFF',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.priorities.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
