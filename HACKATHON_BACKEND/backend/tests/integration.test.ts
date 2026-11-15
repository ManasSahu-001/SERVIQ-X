import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DEMO_COMPANY_ID } from '../src/services/store.js';

describe('End-to-End Customer Support API Integration Flow', () => {
  const app = createApp();
  const authHeader = 'Bearer demo-agent-token';

  it('1. GET /api/health returns healthy operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('2. POST /api/chat handles customer message and returns AI reply & conversation', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'How many days do I have to request a refund for a returned product?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conversation).toBeDefined();
    expect(res.body.data.aiReply).toBeDefined();
  });

  it('3. POST /api/chat with payment issue auto-escalates and generates a ticket', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'My payment was deducted but order was not confirmed (P1)!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdTicket).toBeDefined();
  });

  it('4. Full Agent Dashboard Flow: list convs, takeover, send human message, update ticket', async () => {
    // List conversations
    const convsRes = await request(app)
      .get('/api/conversations')
      .set('Authorization', authHeader);

    expect(convsRes.status).toBe(200);
    expect(convsRes.body.data.length).toBeGreaterThan(0);
    const targetConvId = convsRes.body.data[0].id;

    // Takeover conversation
    const takeoverRes = await request(app)
      .post(`/api/conversations/${targetConvId}/takeover`)
      .set('Authorization', authHeader)
      .send({ agentName: 'Senior Agent Priya' });

    expect(takeoverRes.status).toBe(200);
    expect(takeoverRes.body.data.assigned_to).toBe('human');

    // Agent sends message
    const msgRes = await request(app)
      .post(`/api/conversations/${targetConvId}/messages`)
      .set('Authorization', authHeader)
      .send({
        content: 'I have escalated this to payment reconciliation. Your refund is approved.',
        sender: 'agent',
      });

    expect(msgRes.status).toBe(201);
    expect(msgRes.body.data.content).toContain('escalated');

    // List tickets
    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', authHeader);

    expect(ticketsRes.status).toBe(200);
    expect(ticketsRes.body.data.length).toBeGreaterThan(0);
    const targetTicketId = ticketsRes.body.data[0].id;

    // Resolve ticket
    const updateTicketRes = await request(app)
      .patch(`/api/tickets/${targetTicketId}`)
      .set('Authorization', authHeader)
      .send({ status: 'resolved' });

    expect(updateTicketRes.status).toBe(200);
    expect(updateTicketRes.body.data.status).toBe('resolved');

    // Analytics overview
    const analyticsRes = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', authHeader);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.totalConversations).toBeGreaterThan(0);
  });
});
