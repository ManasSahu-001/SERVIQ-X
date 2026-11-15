import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/user/UserLayout';
import { userService, CustomerConversation } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronRight,
  Plus,
} from 'lucide-react';

export const UserHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<CustomerConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Needs you' | 'AI resolved'>('All');
  const [isLoading, setIsLoading] = useState(true);

  const ACCENT = '#FFB547';

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await userService.getCustomerConversations(user?.email);
        setConversations(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.subject.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      (c.ticketId && c.ticketId.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filter === 'Needs you') {
      return c.humanReviewPending || c.status === 'Escalated';
    }
    if (filter === 'AI resolved') {
      return !c.humanReviewPending && c.status !== 'Escalated';
    }
    return true;
  });

  return (
    <UserLayout>
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '36px 20px 48px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              CUSTOMER INBOX & HISTORY
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
              Inquiries & Tickets
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/user/chat/new')}
            style={{
              minHeight: '40px',
              padding: '0 18px',
              borderRadius: '999px',
              border: `1px solid ${ACCENT}`,
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
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>New Inquiry</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setFilter('All')}
              style={{
                padding: '7px 14px',
                minHeight: '36px',
                borderRadius: '999px',
                border: filter === 'All' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                background: filter === 'All' ? '#FFF8EB' : 'transparent',
                color: filter === 'All' ? '#8A5A00' : '#3F3A2F',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              All Inquiries
            </button>
            <button
              type="button"
              onClick={() => setFilter('Needs you')}
              style={{
                padding: '7px 14px',
                minHeight: '36px',
                borderRadius: '999px',
                border: filter === 'Needs you' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                background: filter === 'Needs you' ? '#FFF8EB' : 'transparent',
                color: filter === 'Needs you' ? '#8A5A00' : '#3F3A2F',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Needs you · Review Pending
            </button>
            <button
              type="button"
              onClick={() => setFilter('AI resolved')}
              style={{
                padding: '7px 14px',
                minHeight: '36px',
                borderRadius: '999px',
                border: filter === 'AI resolved' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                background: filter === 'AI resolved' ? '#FFF8EB' : 'transparent',
                color: filter === 'AI resolved' ? '#8A5A00' : '#3F3A2F',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              AI Resolved
            </button>
          </div>

          <div style={{ marginLeft: 'auto', flex: '1 1 200px', maxWidth: '300px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, ref #, or status..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#FFFFFF',
                border: '1px solid #D6CDB8',
                borderRadius: '999px',
                padding: '8px 14px',
                fontSize: '12px',
                color: '#1A1712',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6B6558', fontSize: '13px' }}>
              Loading your inquiries...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px', background: '#FFFFFF', border: '1px solid #D6CDB8', borderRadius: '12px', textAlign: 'center', color: '#6B6558', fontSize: '13px' }}>
              No inquiries match your current filters.
            </div>
          ) : (
            filtered.map((c) => {
              const isNeedsYou = c.humanReviewPending || c.status === 'Escalated';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/user/chat/${c.id}`)}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: isNeedsYou ? '#EFE8D6' : '#FFFFFF',
                    outline: isNeedsYou ? '1px solid #C9C0AB' : '1px solid #E3DCCB',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#FFE3B0',
                        color: '#8A5A00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '13px',
                        flexShrink: 0,
                      }}
                    >
                      RM
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 600, color: '#1A1712', fontSize: '14px' }}>
                          {c.subject}
                        </span>
                        {c.ticketId && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558' }}>
                            {c.ticketId}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          color: '#3F3A2F',
                          fontSize: '13px',
                          lineHeight: 1.35,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.lastMessage}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {isNeedsYou ? (
                      <>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#B3321F', fontWeight: 600 }}>
                          SLA 12m
                        </span>
                        <span
                          style={{
                            color: '#14110A',
                            background: ACCENT,
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontWeight: 500,
                            fontSize: '11px',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          Needs you
                        </span>
                      </>
                    ) : (
                      <span
                        style={{
                          color: '#1E7A3A',
                          border: '1px solid #A9D9B4',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        AI resolved
                      </span>
                    )}
                    <ChevronRight style={{ width: '16px', height: '16px', color: '#6B6558' }} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </UserLayout>
  );
};
