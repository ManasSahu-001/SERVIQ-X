import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useToast } from '../contexts/ToastContext';

interface TicketItem {
  id: string;
  code: string;
  name: string;
  initials: string;
  sla: string;
  slaUrgent?: boolean;
  timeAgo?: string;
  summary: string;
  channel: 'WhatsApp' | 'Email' | 'Web chat';
  status: 'Needs you' | 'AI drafting' | 'AI resolved' | 'Waiting on customer' | 'AI resolving';
  sentiment?: string;
  language?: string;
  category?: string;
  priority?: string;
  plan?: string;
  pastTickets?: string;
  refundAmount?: number;
  refundLimit?: number;
  initialsBg?: string;
  initialsColor?: string;
}

const INITIAL_TICKETS: TicketItem[] = [
  {
    id: 'tck-1',
    code: '#DP-4821',
    name: 'Rohan Mehta',
    initials: 'RM',
    sla: 'SLA 12m',
    slaUrgent: true,
    summary: 'Payment failed but money got deducted',
    channel: 'WhatsApp',
    status: 'Needs you',
    sentiment: 'Frustrated',
    language: 'Hinglish',
    category: 'Billing',
    priority: 'P1',
    plan: 'Pro · monthly',
    pastTickets: '2 (both resolved by AI)',
    refundAmount: 1200,
    refundLimit: 2000,
    initialsBg: '#FFE3B0',
    initialsColor: '#8A5A00',
  },
  {
    id: 'tck-2',
    code: '#DP-4822',
    name: 'Asha K.',
    initials: 'AK',
    sla: 'SLA 1h 40m',
    summary: 'Refund for damaged item',
    channel: 'Email',
    status: 'AI drafting',
    sentiment: 'Neutral',
    language: 'English',
    category: 'Refund',
    priority: 'P2',
    plan: 'Starter · annual',
    pastTickets: '0',
    refundAmount: 450,
    refundLimit: 2000,
    initialsBg: '#E8E0CC',
    initialsColor: '#3F3A2F',
  },
  {
    id: 'tck-3',
    code: '#DP-4823',
    name: 'Vikram S.',
    initials: 'VS',
    sla: '2m ago',
    summary: 'Invoice not received',
    channel: 'Web chat',
    status: 'AI resolved',
    sentiment: 'Positive',
    language: 'English',
    category: 'Billing',
    priority: 'P3',
    plan: 'Enterprise',
    pastTickets: '5 (all resolved)',
    refundAmount: 0,
    refundLimit: 5000,
    initialsBg: '#E8E0CC',
    initialsColor: '#3F3A2F',
  },
  {
    id: 'tck-4',
    code: '#DP-4824',
    name: 'Meera P.',
    initials: 'MP',
    sla: '9m ago',
    summary: 'How do I change my plan?',
    channel: 'WhatsApp',
    status: 'AI resolved',
    sentiment: 'Curious',
    language: 'English',
    category: 'General',
    priority: 'P3',
    plan: 'Free tier',
    pastTickets: '1 (resolved by AI)',
    refundAmount: 0,
    refundLimit: 1000,
    initialsBg: '#E8E0CC',
    initialsColor: '#3F3A2F',
  },
  {
    id: 'tck-5',
    code: '#DP-4825',
    name: 'Kabir J.',
    initials: 'KJ',
    sla: 'SLA 3h',
    summary: 'Change delivery address',
    channel: 'Web chat',
    status: 'Waiting on customer',
    sentiment: 'Neutral',
    language: 'Hindi',
    category: 'Orders',
    priority: 'P2',
    plan: 'Pro · annual',
    pastTickets: '3 (2 resolved by AI)',
    refundAmount: 0,
    refundLimit: 2000,
    initialsBg: '#E8E0CC',
    initialsColor: '#3F3A2F',
  },
  {
    id: 'tck-6',
    code: '#DP-4826',
    name: 'Neha T.',
    initials: 'NT',
    sla: 'SLA 2h',
    summary: 'Login OTP is not coming',
    channel: 'WhatsApp',
    status: 'AI resolving',
    sentiment: 'Anxious',
    language: 'English',
    category: 'Technical',
    priority: 'P1',
    plan: 'Pro · monthly',
    pastTickets: '0',
    refundAmount: 0,
    refundLimit: 2000,
    initialsBg: '#E8E0CC',
    initialsColor: '#3F3A2F',
  },
];

interface ChatMessage {
  id: string;
  sender: 'customer' | 'ai' | 'agent' | 'system';
  senderLabel?: string;
  text: string;
  time?: string;
  sources?: string[];
}

export const Inbox: React.FC = () => {
  const { success, info } = useToast();
  const [filter, setFilter] = useState<'All' | 'Needs you' | 'SLA at risk'>('All');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('tck-1');
  const [isTakenOver, setIsTakenOver] = useState(true);
  const [refundApproved, setRefundApproved] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'customer',
      text: 'Bhai payment fail ho gaya lekin paisa kat gaya hai, ₹1,200. Order bhi nahi dikh raha.',
    },
    {
      id: 'm2',
      sender: 'ai',
      senderLabel: 'DESKPILOT AI',
      text: 'Sorry Rohan, ye gateway delay ki wajah se hota hai. Kya aap apna UPI reference number bata sakte hain? Main payment check kar leta hoon.',
      sources: ['Payments FAQ v14'],
    },
    {
      id: 'm3',
      sender: 'customer',
      text: 'Ref hai 4812 wala, order pending dikha raha hai abhi tak.',
    },
    {
      id: 'm4',
      sender: 'ai',
      senderLabel: 'DESKPILOT AI',
      text: 'Mil gaya. Your bank took the payment, but our gateway never confirmed it. It reverses on its own in 5–7 working days. Want me to raise a refund request now?',
      sources: ['Gateway delays policy v6', 'Refund timelines v9'],
    },
    {
      id: 'm5',
      sender: 'customer',
      text: 'Haan kar do jaldi, aur kisi human se baat karni hai.',
    },
    {
      id: 'm6',
      sender: 'system',
      text: 'Customer asked for a human · routed to Billing · assigned to Priya',
    },
  ]);

  const activeTicket = INITIAL_TICKETS.find((t) => t.id === selectedTicketId) || INITIAL_TICKETS[0];

  const filteredTickets = INITIAL_TICKETS.filter((t) => {
    if (filter === 'Needs you') return t.status === 'Needs you';
    if (filter === 'SLA at risk') return t.slaUrgent || t.sla.includes('12m') || t.sla.includes('1h');
    return true;
  });

  const handleSendReply = (text?: string) => {
    const toSend = (text !== undefined ? text : replyText).trim();
    if (!toSend) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      senderLabel: 'Priya (Support Agent)',
      text: toSend,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (text === undefined) {
      setReplyText('');
    }
    success('Reply sent to customer as Priya');
  };

  const handleTakeOver = () => {
    setIsTakenOver(true);
    info('You took over this conversation. AI replies paused.');
  };

  const handleHandBack = () => {
    setIsTakenOver(false);
    info('Handed back to DeskPilot AI. Autonomous answering resumed.');
  };

  const handleApproveRefund = () => {
    if (refundApproved) return;
    setRefundApproved(true);

    const refundMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      text: 'Refund of ₹1,200 approved by Priya via Cashfree Gateway · Ref #RF-99021',
    };
    const confirmationMsg: ChatMessage = {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      senderLabel: 'Priya (Support Agent)',
      text: 'Rohan, your refund of ₹1,200 has been initiated. It will reflect in your UPI account within 2-3 business days. Reference ID: RF-99021.',
    };

    setMessages((prev) => [...prev, refundMsg, confirmationMsg]);
    success('Refund of ₹1,200 approved successfully within limit');
  };

  const copilotSuggestionText =
    "Rohan, I've checked with our payment partner. Your ₹1,200 will be back in your account by 21 Nov. I'll update you here the moment it lands.";

  const ACCENT = '#FFB547';

  return (
    <DashboardLayout>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flex: 1,
          alignItems: 'stretch',
          height: '100%',
          minHeight: '100%',
          overflow: 'hidden',
          background: '#F6F1E6',
        }}
      >
        {/* Ticket list */}
        <section
          style={{
            flex: '1 1 320px',
            maxWidth: '360px',
            minWidth: 0,
            borderRight: '1px solid #E3DCCB',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
          }}
          aria-label="Tickets"
        >
          <div style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: '30px',
                  color: '#1A1712',
                }}
              >
                Tickets
              </h2>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#6B6558' }}>
                24 open
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFilter('All')}
                style={{
                  padding: '7px 12px',
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
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('Needs you')}
                style={{
                  padding: '7px 12px',
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
                Needs you · 6
              </button>
              <button
                type="button"
                onClick={() => setFilter('SLA at risk')}
                style={{
                  padding: '7px 12px',
                  minHeight: '36px',
                  borderRadius: '999px',
                  border: filter === 'SLA at risk' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: filter === 'SLA at risk' ? '#FFF8EB' : 'transparent',
                  color: filter === 'SLA at risk' ? '#8A5A00' : '#3F3A2F',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                SLA at risk · 3
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 10px 10px', gap: '2px', flex: 1 }}>
            {filteredTickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: isSelected ? '#EFE8D6' : 'transparent',
                    outline: isSelected ? '1px solid #C9C0AB' : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      flex: 'none',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: isSelected ? '#FFE3B0' : t.initialsBg || '#E8E0CC',
                      color: isSelected ? '#8A5A00' : t.initialsColor || '#3F3A2F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    {t.initials}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#1A1712', fontSize: '13px' }}>{t.name}</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px',
                          color: t.slaUrgent ? '#B3321F' : '#6B6558',
                        }}
                      >
                        {t.sla}
                      </span>
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
                      {t.summary}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: '#6B6558',
                      }}
                    >
                      <span>{t.channel}</span>
                      {t.status === 'Needs you' && (
                        <span
                          style={{
                            color: '#14110A',
                            background: ACCENT,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            fontWeight: 500,
                          }}
                        >
                          Needs you
                        </span>
                      )}
                      {t.status === 'AI drafting' && (
                        <span
                          style={{
                            border: '1px solid #C9C0AB',
                            padding: '1px 7px',
                            borderRadius: '999px',
                          }}
                        >
                          AI drafting
                        </span>
                      )}
                      {t.status === 'AI resolved' && (
                        <span
                          style={{
                            color: '#1E7A3A',
                            border: '1px solid #A9D9B4',
                            padding: '1px 7px',
                            borderRadius: '999px',
                          }}
                        >
                          AI resolved
                        </span>
                      )}
                      {t.status === 'Waiting on customer' && (
                        <span
                          style={{
                            border: '1px solid #C9C0AB',
                            padding: '1px 7px',
                            borderRadius: '999px',
                          }}
                        >
                          Waiting on customer
                        </span>
                      )}
                      {t.status === 'AI resolving' && (
                        <span
                          style={{
                            border: '1px solid #C9C0AB',
                            padding: '1px 7px',
                            borderRadius: '999px',
                          }}
                        >
                          AI resolving
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '16px 20px',
              borderTop: '1px solid #E3DCCB',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  color: '#6B6558',
                  letterSpacing: '0.06em',
                }}
              >
                AI RESOLVED TODAY
              </span>
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontSize: '30px',
                  color: '#8A5A00',
                  lineHeight: 1,
                }}
              >
                71%
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: '#E3DCCB', overflow: 'hidden' }}>
              <div style={{ width: '71%', height: '100%', background: ACCENT }} />
            </div>
          </div>
        </section>

        {/* Conversation */}
        <main
          style={{
            flex: '999 1 480px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#F6F1E6',
            height: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 24px',
              borderBottom: '1px solid #E3DCCB',
              background: '#F6F1E6',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1A1712' }}>
                  {activeTicket.name}
                </h1>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#6B6558',
                  }}
                >
                  {activeTicket.code} · {activeTicket.channel}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                }}
              >
                <span
                  style={{
                    color: '#B3321F',
                    border: '1px solid #F0B8AE',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#FFF5F4',
                  }}
                >
                  {activeTicket.sentiment || 'Frustrated'}
                </span>
                <span
                  style={{
                    color: '#3F3A2F',
                    border: '1px solid #C9C0AB',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {activeTicket.language || 'Hinglish'}
                </span>
                <span
                  style={{
                    color: '#3F3A2F',
                    border: '1px solid #C9C0AB',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {activeTicket.category || 'Billing'}
                </span>
                <span
                  style={{
                    color: '#3F3A2F',
                    border: '1px solid #C9C0AB',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {activeTicket.priority || 'P1'}
                </span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={handleHandBack}
                style={{
                  minHeight: '44px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid #C9C0AB',
                  background: isTakenOver ? 'transparent' : '#EFE8D6',
                  color: '#1A1712',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Hand back to AI
              </button>
              <button
                type="button"
                onClick={handleTakeOver}
                style={{
                  minHeight: '44px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isTakenOver ? ACCENT : '#D6CDB8',
                  color: '#14110A',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {isTakenOver ? 'Under Takeover' : 'Take over'}
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                alignSelf: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#6B6558',
              }}
            >
              Today · 2:14 PM
            </div>

            {messages.map((m) => {
              if (m.sender === 'system') {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      border: '1px dashed #B5AB94',
                      borderRadius: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#3F3A2F',
                      background: '#F9F5EC',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8A5A00"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                    </svg>
                    {m.text}
                  </div>
                );
              }

              if (m.sender === 'customer') {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '62%',
                      background: '#EFE8D6',
                      borderRadius: '14px 14px 4px 14px',
                      padding: '12px 14px',
                      lineHeight: 1.5,
                      color: '#1A1712',
                      fontSize: '14px',
                    }}
                  >
                    {m.text}
                  </div>
                );
              }

              if (m.sender === 'agent') {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: '#8A5A00',
                        fontWeight: 600,
                      }}
                    >
                      {m.senderLabel || 'PRIYA (SUPPORT AGENT)'}
                    </div>
                    <div
                      style={{
                        background: '#FFFFFF',
                        color: '#1A1712',
                        borderRadius: '14px 14px 14px 4px',
                        padding: '12px 14px',
                        lineHeight: 1.5,
                        fontSize: '14px',
                        border: '1px solid #E3DCCB',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              }

              // AI message
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#8A5A00',
                      fontWeight: 600,
                    }}
                  >
                    {m.senderLabel || 'DESKPILOT AI'}
                  </div>
                  <div
                    style={{
                      background: '#FFFFFF',
                      color: '#1A1712',
                      borderRadius: '14px 14px 14px 4px',
                      padding: '12px 14px',
                      lineHeight: 1.5,
                      fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {m.text}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {m.sources.map((src) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setSelectedSource(src)}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            color: '#3F3A2F',
                            border: '1px solid #C9C0AB',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: '16px 24px 20px',
              borderTop: '1px solid #E3DCCB',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#F6F1E6',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}
            >
              <textarea
                aria-label="Reply to Rohan"
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Reply as Priya. Type / for saved replies"
                style={{
                  flex: '1 1 240px',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  resize: 'none',
                  background: '#FFFFFF',
                  color: '#1A1712',
                  border: '1px solid #D6CDB8',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  minHeight: '44px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: ACCENT,
                  color: '#14110A',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </form>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#6B6558',
              }}
            >
              Replies are sent as Priya. The AI stays paused on this ticket until you hand back.
            </div>
          </div>
        </main>

        {/* Copilot */}
        <aside
          style={{
            flex: '1 1 300px',
            maxWidth: '360px',
            minWidth: 0,
            borderLeft: '1px solid #E3DCCB',
            background: '#FFFFFF',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            height: '100%',
            overflowY: 'auto',
          }}
          aria-label="Copilot"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.06em',
                color: '#6B6558',
              }}
            >
              COPILOT SUGGESTION
            </div>
            <div
              style={{
                background: '#FBF8F0',
                border: '1px solid #FFB547',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <p style={{ margin: 0, lineHeight: 1.5, color: '#1A1712', fontSize: '13px' }}>
                {copilotSuggestionText}
              </p>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  color: '#6B6558',
                }}
              >
                Grounded in 3 articles
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleSendReply(copilotSuggestionText)}
                  style={{
                    minHeight: '44px',
                    padding: '0 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: ACCENT,
                    color: '#14110A',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setReplyText(copilotSuggestionText)}
                  style={{
                    minHeight: '44px',
                    padding: '0 16px',
                    borderRadius: '10px',
                    border: '1px solid #C9C0AB',
                    background: 'transparent',
                    color: '#1A1712',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.06em',
                color: '#6B6558',
              }}
            >
              ACTION · WITH LIMITS
            </div>
            <div
              style={{
                background: '#FBF8F0',
                border: '1px solid #D6CDB8',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, color: '#1A1712', fontSize: '14px' }}>
                  Refund ₹1,200
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: refundApproved ? '#8A5A00' : '#1E7A3A',
                    fontWeight: 600,
                  }}
                >
                  {refundApproved ? 'Approved & Logged' : 'Within limit'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B6558' }}>
                  <span>Agent refund limit</span>
                  <span>₹2,000</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: '#E3DCCB',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: refundApproved ? '100%' : '60%',
                      height: '100%',
                      background: refundApproved ? '#8A5A00' : '#1E7A3A',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6B6558', lineHeight: 1.45 }}>
                Order not created · payment captured by bank only · no duplicate refund found.
              </div>
              <button
                type="button"
                onClick={handleApproveRefund}
                disabled={refundApproved}
                style={{
                  minHeight: '44px',
                  borderRadius: '10px',
                  border: `1px solid ${ACCENT}`,
                  background: refundApproved ? '#EFE8D6' : 'transparent',
                  color: '#8A5A00',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: refundApproved ? 'not-allowed' : 'pointer',
                  opacity: refundApproved ? 0.7 : 1,
                }}
              >
                {refundApproved ? '✓ Refund Approved' : 'Approve refund'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.06em',
                color: '#6B6558',
              }}
            >
              CUSTOMER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B6558' }}>Plan</span>
                <span style={{ color: '#1A1712', fontWeight: 500 }}>{activeTicket.plan || 'Pro · monthly'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B6558' }}>Past tickets</span>
                <span style={{ color: '#1A1712', fontWeight: 500 }}>{activeTicket.pastTickets || '2 (both resolved by AI)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B6558' }}>Language</span>
                <span style={{ color: '#1A1712', fontWeight: 500 }}>{activeTicket.language || 'Hinglish'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.06em',
                color: '#6B6558',
              }}
            >
              SOURCES USED
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => setSelectedSource('Payments FAQ · v14')}
                style={{
                  color: '#1A1712',
                  padding: '8px 10px',
                  border: '1px solid #D6CDB8',
                  borderRadius: '8px',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                }}
              >
                Payments FAQ · v14
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('Gateway delays policy · v6')}
                style={{
                  color: '#1A1712',
                  padding: '8px 10px',
                  border: '1px solid #D6CDB8',
                  borderRadius: '8px',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                }}
              >
                Gateway delays policy · v6
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('Refund timelines · v9')}
                style={{
                  color: '#1A1712',
                  padding: '8px 10px',
                  border: '1px solid #D6CDB8',
                  borderRadius: '8px',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                }}
              >
                Refund timelines · v9
              </button>
            </div>
          </div>
        </aside>

        {/* Modal for Knowledge Grounding preview */}
        {selectedSource && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
            onClick={() => setSelectedSource(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '520px',
                width: '100%',
                border: '1px solid #E3DCCB',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: 'italic',
                    fontSize: '24px',
                    color: '#1A1712',
                  }}
                >
                  {selectedSource}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedSource(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#6B6558',
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#3F3A2F' }}>
                <p>
                  <strong>Policy Excerpt:</strong> When a customer reports a payment deduction without an order confirmation,
                  check the payment gateway webhook latency. Standard gateway reversal SLA is 5–7 working days for UPI and netbanking.
                </p>
                <p>
                  Support agents are authorized to initiate proactive reconciliations or approve refunds up to ₹2,000 without requiring secondary manager sign-off.
                </p>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSource(null)}
                  style={{
                    padding: '8px 16px',
                    background: ACCENT,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    color: '#14110A',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
