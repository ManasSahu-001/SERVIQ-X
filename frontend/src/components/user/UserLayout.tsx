import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bot,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ACCENT = '#FFB547';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F6F1E6',
        color: '#1A1712',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Editorial Top Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: '#FFFFFF',
          borderBottom: '1px solid #E3DCCB',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '0 20px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <NavLink
              to="/user"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                color: '#1A1712',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#FFE3B0',
                  color: '#8A5A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <Bot style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: 'italic',
                    fontSize: '26px',
                    lineHeight: 1,
                    fontWeight: 400,
                    color: '#1A1712',
                  }}
                >
                  DeskPilot
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#8A5A00',
                    background: '#FFF8EB',
                    border: `1px solid ${ACCENT}`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 500,
                  }}
                >
                  Customer Desk
                </span>
              </div>
            </NavLink>

            {/* Navigation Pills */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NavLink
                to="/user"
                end
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isActive ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: isActive ? '#FFF8EB' : 'transparent',
                  color: isActive ? '#8A5A00' : '#3F3A2F',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                })}
              >
                Help & Inquiries
              </NavLink>
              <NavLink
                to="/user/history"
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isActive ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: isActive ? '#FFF8EB' : 'transparent',
                  color: isActive ? '#8A5A00' : '#3F3A2F',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                })}
              >
                My Inquiries
              </NavLink>
              <NavLink
                to="/user/profile"
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isActive ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: isActive ? '#FFF8EB' : 'transparent',
                  color: isActive ? '#8A5A00' : '#3F3A2F',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                })}
              >
                Profile & Plan
              </NavLink>
            </nav>
          </div>

          {/* User profile & actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAdmin && (
              <NavLink
                to="/inbox"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #C9C0AB',
                  background: 'transparent',
                  color: '#1A1712',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                <span>Agent Inbox</span>
              </NavLink>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingLeft: '12px',
                borderLeft: '1px solid #E3DCCB',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#FFE3B0',
                  color: '#8A5A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                RM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1712' }}>
                  {user?.fullName || 'Rohan Mehta'}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: '#6B6558',
                  }}
                >
                  Pro · monthly
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B6558',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                }}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>

      {/* Editorial Footer */}
      <footer
        style={{
          borderTop: '1px solid #E3DCCB',
          background: '#FFFFFF',
          padding: '16px 20px',
          fontSize: '12px',
          color: '#6B6558',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#1E7A3A',
                display: 'inline-block',
              }}
            />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
              Autonomous DeskPilot AI Online · Grounded in official company policy
            </span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
            Refunds & human takeovers managed by Billing Ops
          </div>
        </div>
      </footer>
    </div>
  );
};
