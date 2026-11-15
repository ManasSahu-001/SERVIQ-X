import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/user/UserLayout';
import { userService, CustomerConversation } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  CreditCard,
  RotateCcw,
  Package,
  UserCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

const COMMON_QUESTIONS = [
  {
    icon: CreditCard,
    title: 'Payment failed but money deducted',
    desc: 'UPI or Netbanking debited without order confirmation',
    query: 'Bhai payment fail ho gaya lekin paisa kat gaya hai, ₹1,200. Order bhi nahi dikh raha.',
  },
  {
    icon: RotateCcw,
    title: 'Refund timelines & status',
    desc: 'Automated 5–7 working days reversal or instant agent approval',
    query: 'How long does a refund take if bank gateway failed?',
  },
  {
    icon: Package,
    title: 'Order status & tracking',
    desc: 'Track dispatch time, courier links, and invoice delivery',
    query: 'Ref hai 4812 wala, order pending dikha raha hai abhi tak.',
  },
  {
    icon: UserCheck,
    title: 'Talk to a human support agent',
    desc: 'Direct escalation to Billing Ops (assigned to Priya)',
    query: 'Haan kar do jaldi, aur kisi human se baat karni hai.',
  },
];

export const UserHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiryText, setInquiryText] = useState('');
  const [conversations, setConversations] = useState<CustomerConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ACCENT = '#FFB547';

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await userService.getCustomerConversations(user?.email);
        setConversations(data);
      } catch (err) {
        console.error('Error loading customer conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadConversations();
  }, [user]);

  const handleStartInquiry = async (queryText?: string) => {
    const text = (queryText || inquiryText).trim();
    if (!text) return;

    try {
      const conv = await userService.createNewConversation(
        text.slice(0, 36) + '...',
        text,
        {
          name: user?.fullName || 'Rohan Mehta',
          email: user?.email || 'rohan.mehta@customer.com',
        }
      );
      navigate(`/user/chat/${conv.id}`);
    } catch {
      navigate('/user/chat/new');
    }
  };

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
          gap: '32px',
        }}
      >
        {/* Editorial Hero Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: '#6B6558',
              textTransform: 'uppercase',
            }}
          >
            DESKPILOT SUPPORT · PRO PLAN
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: '44px',
                color: '#1A1712',
                lineHeight: 1.1,
              }}
            >
              How can we help you today, Rohan?
            </h1>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#6B6558' }}>
              Average response: 42s
            </span>
          </div>
          <p style={{ margin: 0, color: '#3F3A2F', fontSize: '15px', lineHeight: 1.5, maxWidth: '640px' }}>
            Instant answers grounded in official company policies, gateway verification, and direct human approvals for refunds.
          </p>

          {/* Quick Ask Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStartInquiry();
            }}
            style={{
              marginTop: '10px',
              display: 'flex',
              gap: '10px',
              background: '#FFFFFF',
              border: '1px solid #D6CDB8',
              borderRadius: '14px',
              padding: '8px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <input
              type="text"
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder="Ask a question (e.g. ₹1,200 deducted but order pending, request refund)..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#1A1712',
                background: 'transparent',
                padding: '8px',
              }}
            />
            <button
              type="submit"
              style={{
                minHeight: '44px',
                padding: '0 22px',
                borderRadius: '10px',
                border: 'none',
                background: ACCENT,
                color: '#14110A',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Ask DeskPilot AI</span>
              <ArrowRight style={{ width: '15px', height: '15px' }} />
            </button>
          </form>
        </div>

        {/* Active Ticket Banner / Ongoing Inquiries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontSize: '28px',
                fontWeight: 400,
                color: '#1A1712',
              }}
            >
              Active Tickets & Inquiries
            </h2>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558' }}>
              {conversations.length} total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B6558', fontSize: '13px' }}>
                Loading your inquiries...
              </div>
            ) : conversations.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  background: '#FFFFFF',
                  border: '1px solid #D6CDB8',
                  borderRadius: '12px',
                  textAlign: 'center',
                  color: '#6B6558',
                  fontSize: '13px',
                }}
              >
                No active tickets right now. Ask a question above to start.
              </div>
            ) : (
              conversations.slice(0, 4).map((c) => {
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
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '11px',
                                color: '#6B6558',
                              }}
                            >
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {isNeedsYou ? (
                        <>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '11px',
                              color: '#B3321F',
                              fontWeight: 600,
                            }}
                          >
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

        {/* Common Reference Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: '#6B6558',
            }}
          >
            POPULAR ASSISTANCE TOPICS
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '12px',
            }}
          >
            {COMMON_QUESTIONS.map((q, i) => {
              const Icon = q.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleStartInquiry(q.query)}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    border: '1px solid #D6CDB8',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#F6F1E6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8A5A00',
                      }}
                    >
                      <Icon style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1712', lineHeight: 1.3 }}>
                      {q.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B6558', lineHeight: 1.4 }}>{q.desc}</div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#8A5A00',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Ask this</span>
                    <ArrowRight style={{ width: '12px', height: '12px' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom AI Performance Metric Bar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E3DCCB',
            borderRadius: '14px',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', letterSpacing: '0.06em' }}>
              AI RESOLVED TODAY ACROSS WORKSPACE
            </span>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: '32px', color: '#8A5A00', lineHeight: 1 }}>
              71%
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#E3DCCB', overflow: 'hidden' }}>
            <div style={{ width: '71%', height: '100%', background: ACCENT }} />
          </div>
        </div>
      </div>
    </UserLayout>
  );
};
