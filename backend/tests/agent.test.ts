import { describe, it, expect } from 'vitest';
import { runSupportAgent } from '../src/agents/graph.js';
import { DEMO_COMPANY_ID, store } from '../src/services/store.js';
import { v4 as uuidv4 } from 'uuid';

describe('LangGraph AI Agent Execution', () => {
  it('correctly classifies standard inquiries and resolves without escalation', async () => {
    const convId = `test-${uuidv4().slice(0, 8)}`;
    const finalState = await runSupportAgent({
      conversationId: convId,
      companyId: DEMO_COMPANY_ID,
      customerMessage: 'What is your refund timeframe policy?',
    });

    expect(finalState.generatedResponse.length).toBeGreaterThan(10);
    expect(finalState.suggestedReply).not.toBeNull();
    expect(finalState.evaluationSignals.canResolve).toBe(true);
    expect(finalState.isSent).toBe(true);
  });

  it('triggers P1 escalation and ticket creation when payment deduction is reported', async () => {
    const convId = `test-${uuidv4().slice(0, 8)}`;
    const finalState = await runSupportAgent({
      conversationId: convId,
      companyId: DEMO_COMPANY_ID,
      customerMessage: 'My money was deducted but order was not confirmed!',
    });

    expect(finalState.priority).toBe('P1');
    expect(finalState.escalationRequired).toBe(true);
    expect(finalState.ticketId).toBeDefined();

    // Verify ticket exists in store
    const ticket = store.getTicketById(DEMO_COMPANY_ID, finalState.ticketId!);
    expect(ticket).not.toBeNull();
    expect(ticket?.priority).toBe('P1');
  });

  it('triggers escalation when customer explicitly requests a human agent', async () => {
    const convId = `test-${uuidv4().slice(0, 8)}`;
    const finalState = await runSupportAgent({
      conversationId: convId,
      companyId: DEMO_COMPANY_ID,
      customerMessage: 'I need to speak to a human support person immediately.',
    });

    expect(finalState.escalationRequired).toBe(true);
    expect(finalState.ticketId).toBeDefined();
  });
});
