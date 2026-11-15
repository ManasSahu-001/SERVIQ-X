import React, { useState } from 'react';
import { userService, HumanAssistanceRequest } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { CreditCard, HelpCircle, UserCheck, X } from 'lucide-react';

interface HumanAssistanceModalProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (req: HumanAssistanceRequest) => void;
}

export const HumanAssistanceModal: React.FC<HumanAssistanceModalProps> = ({
  conversationId,
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const { success, error } = useToast();
  const [actionType, setActionType] = useState<HumanAssistanceRequest['actionType']>('refund_approval');
  const [reason, setReason] = useState('Payment failed but ₹1,200 deducted via UPI. Need human agent refund verification.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const ACCENT = '#FFB547';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      error('Please describe what you need assistance with.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: HumanAssistanceRequest = {
        conversationId,
        actionType,
        reason: reason.trim(),
      };

      const res = await userService.requestHumanAssistance(payload);
      if (res.success) {
        success('Request submitted. Routed to Billing Ops and assigned to Priya.');
        onRequestSubmitted(payload);
        onClose();
      } else {
        error(res.message || 'Failed to submit request.');
      }
    } catch {
      error('An error occurred submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(20, 17, 10, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          border: '1px solid #D6CDB8',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          color: '#1A1712',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#6B6558', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ESCALATION · BILLING OPS
            </div>
            <h2
              style={{
                margin: '4px 0 0',
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: '28px',
                color: '#1A1712',
              }}
            >
              Request Human Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: '#6B6558',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Warning Policy Box */}
        <div
          style={{
            background: '#FBF8F0',
            border: '1px solid #FFB547',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#8A5A00' }}>
            Action · With Human Verification
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#3F3A2F', lineHeight: 1.5 }}>
            Autonomous AI answering will be paused on this ticket. Your request will be routed directly to Priya in Billing.
            <strong> Refunds are subject to policy limits (up to ₹2,000) and require manual agent approval.</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Options */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3F3A2F', marginBottom: '8px' }}>
              Select Request Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActionType('refund_approval')}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: actionType === 'refund_approval' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: actionType === 'refund_approval' ? '#FFF8EB' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1A1712' }}>
                  <CreditCard style={{ width: '14px', height: '14px', color: '#8A5A00' }} />
                  <span>Refund ₹1,200</span>
                </div>
                <span style={{ fontSize: '10px', color: '#6B6558' }}>Within ₹2,000 limit</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('verify_answer')}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: actionType === 'verify_answer' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: actionType === 'verify_answer' ? '#FFF8EB' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1A1712' }}>
                  <HelpCircle style={{ width: '14px', height: '14px', color: '#8A5A00' }} />
                  <span>Verify AI Reply</span>
                </div>
                <span style={{ fontSize: '10px', color: '#6B6558' }}>Policy cross-check</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('human_agent')}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: actionType === 'human_agent' ? `1px solid ${ACCENT}` : '1px solid #D6CDB8',
                  background: actionType === 'human_agent' ? '#FFF8EB' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1A1712' }}>
                  <UserCheck style={{ width: '14px', height: '14px', color: '#8A5A00' }} />
                  <span>Live Agent</span>
                </div>
                <span style={{ fontSize: '10px', color: '#6B6558' }}>Speak with Priya</span>
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3F3A2F', marginBottom: '6px' }}>
              Details for Support Agent
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. UPI ref 4812, bank debited ₹1,200 but order not confirmed."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#FFFFFF',
                border: '1px solid #D6CDB8',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#1A1712',
                resize: 'none',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0 16px',
                minHeight: '40px',
                borderRadius: '8px',
                border: '1px solid #D6CDB8',
                background: 'transparent',
                color: '#3F3A2F',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0 20px',
                minHeight: '40px',
                borderRadius: '8px',
                border: 'none',
                background: ACCENT,
                color: '#14110A',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Routing to Priya...' : 'Submit to Human Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
