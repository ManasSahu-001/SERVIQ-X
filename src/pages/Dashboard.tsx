import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MetricsCards } from '../components/dashboard/MetricsCards';
import { ConversationList } from '../components/dashboard/ConversationList';
import { ConversationWorkspace } from '../components/dashboard/ConversationWorkspace';
import { TicketInfoPanel } from '../components/dashboard/TicketInfoPanel';
import { Conversation, AnalyticsMetrics } from '../types';
import { conversationService } from '../services/conversationService';
import { analyticsService } from '../services/analyticsService';
import { INITIAL_ANALYTICS } from '../services/mockData';
import { Inbox } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(INITIAL_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(true);
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [convs, analyticsData] = await Promise.all([
        conversationService.getConversations(),
        analyticsService.getAnalyticsData(),
      ]);

      setConversations(convs);
      if (analyticsData.metrics) {
        setMetrics(analyticsData.metrics);
      }

      // If no conversation currently selected, pick first one
      setSelectedConversation((prev) => {
        if (prev) {
          const match = convs.find((c) => c.id === prev.id);
          return match || convs[0] || null;
        }
        return convs[0] || null;
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for live updates
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('deskpilot_conversations_updated', handleUpdate);
    window.addEventListener('deskpilot_tickets_updated', handleUpdate);
    return () => {
      window.removeEventListener('deskpilot_conversations_updated', handleUpdate);
      window.removeEventListener('deskpilot_tickets_updated', handleUpdate);
    };
  }, [loadData]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsMobileViewingChat(true);
  };

  const handleConversationUpdated = (updated: Conversation) => {
    setSelectedConversation(updated);
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Metric Cards */}
        <MetricsCards metrics={metrics} />

        {/* 3-Column Conversation & Ticket Workspace */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Conversation List Column */}
          <div
            className={`${
              isMobileViewingChat ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 lg:w-96 shrink-0 h-full`}
          >
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id || null}
              onSelect={handleSelectConversation}
              isLoading={isLoading}
            />
          </div>

          {/* Main Conversation Workspace */}
          <div
            className={`${
              !isMobileViewingChat ? 'hidden md:flex' : 'flex'
            } flex-1 min-w-0 h-full`}
          >
            {selectedConversation ? (
              <ConversationWorkspace
                conversation={selectedConversation}
                onConversationUpdated={handleConversationUpdated}
                onToggleTicketPanel={() => setIsTicketPanelOpen(!isTicketPanelOpen)}
                isTicketPanelOpen={isTicketPanelOpen}
                onBackToList={() => setIsMobileViewingChat(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <Inbox className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No conversation selected</p>
              </div>
            )}
          </div>

          {/* Right Ticket Information Panel */}
          {selectedConversation && isTicketPanelOpen && (
            <div className="hidden xl:flex shrink-0 h-full animate-slide-in">
              <TicketInfoPanel
                conversation={selectedConversation}
                onTicketUpdated={loadData}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
