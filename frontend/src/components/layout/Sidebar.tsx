import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Ticket as TicketIcon,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  Bot,
  Wifi,
  WifiOff,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBackend } from '../../contexts/BackendContext';

interface SidebarProps {
  onOpenCustomerChatDemo?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCustomerChatDemo,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { isMockMode, toggleMockMode, isBackendHealthy } = useBackend();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onCloseMobile?.();
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Inbox', path: '/inbox', icon: Inbox },
    { label: 'Tickets', path: '/tickets', icon: TicketIcon },
    { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-[#14141B] border-r border-[#292932] flex flex-col h-screen shrink-0 select-none z-50 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#292932] flex items-center justify-between">
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFB33F] to-[#E59312] flex items-center justify-center shadow-[0_0_15px_rgba(255,179,63,0.35)]">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-lg">DeskPilot</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#FFB33F]/20 text-[#FFB33F] border border-[#FFB33F]/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Autonomous Support</p>
            </div>
          </NavLink>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backend Integration Mode Pill */}
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={toggleMockMode}
            title="Click to toggle between Live Backend and Hackathon Mock/Demo Mode"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#191920] border border-[#292932] hover:border-gray-600 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              {isMockMode ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              ) : isBackendHealthy ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <div className="truncate">
                <div className="text-[11px] font-medium text-gray-200">
                  {isMockMode ? 'Demo / Mock Data' : isBackendHealthy ? 'Live Backend API' : 'Backend Offline'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {isMockMode ? 'Click for Live Mode' : 'Click for Mock Mode'}
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-semibold text-[#FFB33F] bg-[#FFB33F]/10 px-1.5 py-0.5 rounded border border-[#FFB33F]/20">
              {isMockMode ? 'Demo' : 'Live'}
            </span>
          </button>
        </div>

        {/* Quick Customer Chat Launcher */}
        {onOpenCustomerChatDemo && (
          <div className="px-4 py-2">
            <button
              onClick={() => {
                onOpenCustomerChatDemo();
                onCloseMobile?.();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#FFB33F]/15 to-[#F5A623]/10 text-[#FFB33F] border border-[#FFB33F]/30 hover:bg-[#FFB33F]/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Customer Chat Demo</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#FFB33F]/15 text-[#FFB33F] border border-[#FFB33F]/20 font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* View Landing Page link */}
        <div className="px-4 py-2 border-t border-[#292932]">
          <NavLink
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between text-xs text-gray-400 hover:text-[#FFB33F] py-1 transition-colors"
          >
            <span>Landing Page Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-[#292932] bg-[#0E0E14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user?.fullName || 'User'}
                className="w-9 h-9 rounded-full object-cover border border-[#292932]"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.fullName || 'Rahul Sharma'}
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  {user?.companyName || 'Acme SaaS Corp'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
