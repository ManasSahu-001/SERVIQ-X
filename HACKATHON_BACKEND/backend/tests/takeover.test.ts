import { describe, it, expect } from 'vitest';
import { conversationService } from '../src/services/conversation.service.js';
import { messageService } from '../src/services/message.service.js';
import { runSupportAgent } from '../src/agents/graph.js';
import { DEMO_COMPANY_ID, store } from '../src/services/store.js';
import { v4 as uuidv4 } from 'uuid';

describe('Human Takeover & Race-Condition Guardrails', () => {
  it('switches assigned_to to human and inserts a system audit notice', async () => {
    const conv = store.createConversation({
      company_id: DEMO_COMPANY_ID,
      customer_name: 'Test Customer',
      assigned_to: 'ai',
      status: 'open',
    });

    const updated = await conversationService.takeoverConversation(
      DEMO_COMPANY_ID,
      conv.id,
      'Agent Vikram'
    );

    expect(updated.assigned_to).toBe('human');
    expect(updated.assigned_agent_name).toBe('Agent Vikram');

    const messages = store.getMessagesByConversation(conv.id);
    const systemNotice = messages.find((m) => m.sender_type === 'system');
    expect(systemNotice).toBeDefined();
    expect(systemNotice?.content).toContain('Agent Vikram has taken over');
  });

  it('prevents AI from automatically sending responses once conversation is human-owned', async () => {
    const conv = store.createConversation({
      company_id: DEMO_COMPANY_ID,
      customer_name: 'Test Customer',
      assigned_to: 'human', // already human owned
      status: 'open',
    });

    // Run LangGraph agent for this conversation
    const result = await runSupportAgent({
      conversationId: conv.id,
      companyId: DEMO_COMPANY_ID,
      customerMessage: 'Hello, are you there?',
    });

    // isSent must be false because sendResponse verifies ownership!
    expect(result.isSent).toBe(false);

    // Verify no new AI message was posted to the conversation
    const messages = store.getMessagesByConversation(conv.id);
    const aiMessages = messages.filter((m) => m.sender_type === 'ai');
    expect(aiMessages.length).toBe(0);
  });

  it('allows agent to send custom messages and restores AI upon handback', async () => {
    const conv = store.createConversation({
      company_id: DEMO_COMPANY_ID,
      customer_name: 'Test Customer',
      assigned_to: 'human',
      status: 'open',
    });

    // Human sends message
    const msg = await messageService.addMessage({
      companyId: DEMO_COMPANY_ID,
      conversationId: conv.id,
      sender: 'agent',
      content: 'I have checked your account and refunded the charge manually.',
      senderName: 'Agent Vikram',
    });
    expect(msg.content).toContain('refunded');

    // Handback to AI
    const handedBack = await conversationService.handbackToAI(DEMO_COMPANY_ID, conv.id);
    expect(handedBack.assigned_to).toBe('ai');
  });
});
