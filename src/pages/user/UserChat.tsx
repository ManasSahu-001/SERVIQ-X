import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/user/UserLayout';
import { userService, CustomerConversation } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { HumanAssistanceModal } from '../../components/user/HumanAssistanceModal';
import { useToast } from '../../contexts/ToastContext';
import {
  ArrowLeft,
  FileText,
  UserCheck,
  Send,
  Zap,
} from 'lucide-react';

export const UserChat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [conversation, setConversation] = useState<CustomerConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ACCENT = '#FFB547';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadConv = async () => {
      setIsLoading(true);
      try {
        const idToLoad = conversationId && conversationId !== 'new' ? conversationId : 'conv-rohan-4821';
        const found = await userService.getCustomerConversationById(idToLoad);
        if (found) {
          setConversation(found);
        } else {
          const fresh = await userService.createNewConversation(
            'Payment failed but money got deducted ₹1,200',
            'Bhai payment fail ho gaya lekin paisa kat gaya hai, ₹1,200. Order bhi nahi dikh raha.',
            {
              name: user?.fullName || 'Rohan Mehta',
              email: user?.email || 'rohan.mehta@customer.com',
            }
          );
          setConversation(fresh);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConv();
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !conversation || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      await userService.sendCustomerMessage(
        conversation.id,
        text,
        {
          name: user?.fullName || 'Rohan Mehta',
          email: user?.email || 'rohan.mehta@customer.com',
        }
      );

      const updated = await userService.getCustomerConversationById(conversation.id);
      if (updated) {
        setConversation(updated);
      }
    } catch {
      error('Failed to send message. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleHumanAssistanceSubmitted = async () => {
    if (!conversation) return;
    const updated = await userService.getCustomerConversationById(conversation.id);
    if (updated) {
      setConversation(updated);
    }
  };

  const isReviewPending = conversation?.humanReviewPending || conversation?.status === 'Escalated';

  return (
    <UserLayout>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flex: 1,
          alignItems: 'stretch',
          background: '#F6F1E6',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Main Conversation Thread matching reference */}
        <main
          style={{
            flex: '999 1 540px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#F6F1E6',
            height: '100%',
            borderRight: '1px solid #E3DCCB',
          }}
        >
          {/* Conversation Header */}
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
            <button
              type="button"
              onClick={() => navigate('/user')}
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #C9C0AB',
                background: '#FFFFFF',
                color: '#1A1712',
              }}
              title="Back to Tickets"
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1A1712' }}>
                  {conversation?.subject || 'Payment failed but money got deducted ₹1,200'}
                </h1>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558' }}>
                  {conversation?.ticketId || '#DP-4821'} · WhatsApp
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                <span style={{ color: '#B3321F', border: '1px solid #F0B8AE', padding: '2px 8px', borderRadius: '999px', background: '#FFF5F4' }}>
                  Frustrated
                </span>
                <span style={{ color: '#3F3A2F', border: '1px solid #C9C0AB', padding: '2px 8px', borderRadius: '999px' }}>
                  Hinglish
                </span>
                <span style={{ color: '#3F3A2F', border: '1px solid #C9C0AB', padding: '2px 8px', borderRadius: '999px' }}>
                  Billing
                </span>
                <span style={{ color: '#3F3A2F', border: '1px solid #C9C0AB', padding: '2px 8px', borderRadius: '999px' }}>
                  P1
                </span>
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  minHeight: '40px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: isReviewPending ? '1px solid #B5AB94' : `1px solid ${ACCENT}`,
                  background: isReviewPending ? '#EFE8D6' : ACCENT,
                  color: '#14110A',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UserCheck style={{ width: '15px', height: '15px' }} />
                <span>{isReviewPending ? 'Review Pending (Priya Assigned)' : 'Request Human Approval'}</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
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
            <div style={{ alignSelf: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558' }}>
              Today · 2:14 PM
            </div>

            {conversation?.messages.map((m) => {
              const isCustomer = m.sender === 'customer';
              const isSystemNotice = m.senderName === 'System Notice' || (m.sender as string) === 'system';
              const isAgent = m.sender === 'agent';

              if (isSystemNotice) {
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                    </svg>
                    <span>{m.text}</span>
                  </div>
                );
              }

              if (isCustomer) {
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '64%',
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

              if (isAgent) {
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
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8A5A00', fontWeight: 600 }}>
                      PRIYA · SUPPORT LEAD (HUMAN TAKEOVER)
                    </div>
                    <div
                      style={{
                        background: '#FFFFFF',
                        color: '#1A1712',
                        borderRadius: '14px 14px 14px 4px',
                        padding: '12px 14px',
                        lineHeight: 1.5,
                        fontSize: '14px',
                        border: '1px solid #D6CDB8',
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
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8A5A00', fontWeight: 600 }}>
                    DESKPILOT AI
                  </div>
                  <div
                    style={{
                      background: '#FFFFFF',
                      color: '#1A1712',
                      borderRadius: '14px 14px 14px 4px',
                      padding: '12px 14px',
                      lineHeight: 1.5,
                      fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    {m.text}
                  </div>
                  {/* Grounding Source Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(m.text.includes('gateway delay')
                      ? ['Payments FAQ v14']
                      : m.text.includes('reverses on its own')
                      ? ['Gateway delays policy v6', 'Refund timelines v9']
                      : ['Payments FAQ v14']
                    ).map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setSelectedSource(src)}
                        style={{
                          all: 'unset',
                          boxSizing: 'border-box',
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
                </div>
              );
            })}

            {isSending && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FFFFFF', borderRadius: '12px', fontSize: '12px', color: '#6B6558' }}>
                <span style={{ width: '12px', height: '12px', border: '2px solid #8A5A00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>DeskPilot AI is retrieving gateway records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
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
              onSubmit={handleSendMessage}
              style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}
            >
              <textarea
                aria-label="Reply to DeskPilot"
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message or follow-up... (Press Enter to send)"
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
                disabled={!inputText.trim() || isSending}
                style={{
                  minHeight: '44px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: ACCENT,
                  color: '#14110A',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: !inputText.trim() || isSending ? 'not-allowed' : 'pointer',
                  opacity: !inputText.trim() || isSending ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </form>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558' }}>
              Messages are monitored by DeskPilot AI. Human assistance is currently assigned to Priya in Billing.
            </div>
          </div>
        </main>

        {/* Right Reference Context Aside */}
        <aside
          style={{
            flex: '1 1 280px',
            maxWidth: '340px',
            minWidth: 0,
            background: '#FFFFFF',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            height: '100%',
            overflowY: 'auto',
          }}
          aria-label="Inquiry Details"
        >
          {/* Action limits / status card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.06em', color: '#6B6558' }}>
              TICKET STATUS & REFUND
            </div>
            <div style={{ background: '#FBF8F0', border: '1px solid #D6CDB8', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, color: '#1A1712', fontSize: '14px' }}>Refund ₹1,200</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: isReviewPending ? '#8A5A00' : '#1E7A3A', fontWeight: 600 }}>
                  {isReviewPending ? 'Pending Priya Approval' : 'Eligible'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B6558' }}>
                  <span>Agent refund limit</span>
                  <span>₹2,000</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: '#E3DCCB', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: '#1E7A3A' }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6B6558', lineHeight: 1.45 }}>
                Order not created · payment captured by bank only · no duplicate refund found.
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  minHeight: '40px',
                  borderRadius: '10px',
                  border: `1px solid ${ACCENT}`,
                  background: 'transparent',
                  color: '#8A5A00',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {isReviewPending ? 'View Review Status' : 'Request Human Approval'}
              </button>
            </div>
          </div>

          {/* Customer Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.06em', color: '#6B6558' }}>
              YOUR ACCOUNT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B6558' }}>Plan</span>
                <span style={{ color: '#1A1712', fontWeight: 500 }}>Pro · monthly</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B6558' }}>Past tickets</span>
                <span style={{ color: '#1A1712', fontWeight: 500 }}>2 (both resolved by AI)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6B6558' }}>Language</span>
                <span style={{ color: '#1A1712', fontWeight: 500 }}>Hinglish</span>
              </div>
            </div>
          </div>

          {/* Sources Grounded */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.06em', color: '#6B6558' }}>
              SOURCES USED
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => setSelectedSource('Payments FAQ · v14')}
                style={{ all: 'unset', boxSizing: 'border-box', color: '#1A1712', padding: '8px 10px', border: '1px solid #D6CDB8', borderRadius: '8px', cursor: 'pointer', display: 'block', width: '100%' }}
              >
                Payments FAQ · v14
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('Gateway delays policy · v6')}
                style={{ all: 'unset', boxSizing: 'border-box', color: '#1A1712', padding: '8px 10px', border: '1px solid #D6CDB8', borderRadius: '8px', cursor: 'pointer', display: 'block', width: '100%' }}
              >
                Gateway delays policy · v6
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('Refund timelines · v9')}
                style={{ all: 'unset', boxSizing: 'border-box', color: '#1A1712', padding: '8px 10px', border: '1px solid #D6CDB8', borderRadius: '8px', cursor: 'pointer', display: 'block', width: '100%' }}
              >
                Refund timelines · v9
              </button>
            </div>
          </div>
        </aside>

        {/* Modal for Requesting Human Review */}
        {conversation && (
          <HumanAssistanceModal
            conversationId={conversation.id}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRequestSubmitted={handleHumanAssistanceSubmitted}
          />
        )}

        {/* Source Article Preview Modal */}
        {selectedSource && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
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
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: '24px', color: '#1A1712' }}>
                  {selectedSource}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedSource(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B6558' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#3F3A2F' }}>
                <p>
                  <strong>Gateway Reversal Timeline:</strong> When funds are deducted via UPI or banking gateway without an order creation,
                  the receiving switch will automatically release the hold within 5–7 working days.
                </p>
                <p>
                  If you need immediate manual reconciliation, request human approval. Our support lead (Priya) will verify the transaction reference and authorize the refund directly.
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
    </UserLayout>
  );
};
