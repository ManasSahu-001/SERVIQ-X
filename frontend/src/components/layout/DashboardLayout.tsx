import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { CustomerChatWidget } from '../chat/CustomerChatWidget';
import { Menu, Bot, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isDemoChatOpen, setIsDemoChatOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0B0F] text-[#F5F5F5]">
      {/* Mobile Top Header (only visible on mobile/tablet screens < lg) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#14141B] border-b border-[#292932] px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFB33F] flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-white text-sm">DeskPilot</span>
          </NavLink>
        </div>

        <button
          onClick={() => setIsDemoChatOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FFB33F]/10 text-[#FFB33F] border border-[#FFB33F]/30 hover:bg-[#FFB33F]/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Chat</span>
        </button>
      </div>

      {/* Left Sidebar (Desktop persistent + Mobile slide-over drawer) */}
      <Sidebar
        onOpenCustomerChatDemo={() => setIsDemoChatOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#0B0B0F] lg:pt-0 pt-14">
        {children}
      </main>

      {/* Floating Customer Chat Widget */}
      <CustomerChatWidget
        isOpenExternally={isDemoChatOpen}
        onCloseExternal={() => setIsDemoChatOpen(false)}
      />
    </div>
  );
};
