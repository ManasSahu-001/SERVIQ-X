import React from 'react';
import { UserLayout } from '../../components/user/UserLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowRight } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ACCENT = '#FFB547';

  return (
    <UserLayout>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '36px 20px 48px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ACCOUNT OVERVIEW
          </div>
          <h1
            style={{
              margin: '4px 0 0',
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '38px',
              color: '#1A1712',
            }}
          >
            Customer Profile
          </h1>
        </div>

        {/* Customer Profile Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D6CDB8',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FFE3B0',
                color: '#8A5A00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '20px',
              }}
            >
              RM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#1A1712' }}>
                  {user?.fullName || 'Rohan Mehta'}
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
                  }}
                >
                  Pro · monthly
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#6B6558' }}>{user?.email || 'rohan.mehta@customer.com'}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558' }}>
                Account Ref #DP-4821 · WhatsApp Channel Linked
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '0 16px',
              minHeight: '40px',
              borderRadius: '8px',
              border: '1px solid #C9C0AB',
              background: 'transparent',
              color: '#B3321F',
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* 3 Detail Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E3DCCB',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', letterSpacing: '0.06em' }}>
              CUSTOMER TIER
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A1712' }}>Pro · Monthly</div>
            <div style={{ fontSize: '12px', color: '#6B6558' }}>Direct SLA routing to Billing Ops & Priya.</div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E3DCCB',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', letterSpacing: '0.06em' }}>
              REFUND LIMIT ELIGIBILITY
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1E7A3A' }}>Up to ₹2,000 / tx</div>
            <div style={{ fontSize: '12px', color: '#6B6558' }}>Single-touch verification via Cashfree gateway.</div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E3DCCB',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', letterSpacing: '0.06em' }}>
              PAST TICKETS
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A1712' }}>2 (Both resolved by AI)</div>
            <div style={{ fontSize: '12px', color: '#6B6558' }}>Avg response latency: 42s.</div>
          </div>
        </div>

        {/* Action card */}
        <div
          style={{
            background: '#FBF8F0',
            border: '1px solid #D6CDB8',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontWeight: 600, color: '#1A1712', fontSize: '15px' }}>Need help with a payment or order?</div>
          <p style={{ margin: 0, fontSize: '13px', color: '#3F3A2F', lineHeight: 1.5 }}>
            You can check your payment gateway hold status, verify deductions, or submit a request directly to Priya in Billing.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/user/chat/conv-rohan-4821')}
              style={{
                minHeight: '40px',
                padding: '0 18px',
                borderRadius: '8px',
                border: 'none',
                background: ACCENT,
                color: '#14110A',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>View Open Ticket #DP-4821</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/inbox')}
                style={{
                  minHeight: '40px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #C9C0AB',
                  background: 'transparent',
                  color: '#1A1712',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Go to Agent Inbox →
              </button>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};
