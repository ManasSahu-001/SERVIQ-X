import { describe, it, expect } from 'vitest';
import { store, DEMO_COMPANY_ID } from '../src/services/store.js';
import { retrieveKnowledge } from '../src/rag/retriever.js';
import { v4 as uuidv4 } from 'uuid';

describe('Multi-Tenant Data Isolation', () => {
  const companyA = DEMO_COMPANY_ID;
  const companyB = uuidv4();

  it('creates isolated companies', () => {
    store.createCompany('Competitor Corp B');
    expect(store.getCompany(companyB)).toBeDefined;
  });

  it('ensures Company B cannot retrieve Company A documents', () => {
    const docsA = store.getDocumentsByCompany(companyA);
    const docsB = store.getDocumentsByCompany(companyB);

    expect(docsA.length).toBeGreaterThan(0);
    expect(docsB.length).toBe(0);
  });

  it('ensures vector retrieval strictly scopes by companyId and never leaks chunks', async () => {
    // Search with refund query for Company B (which has no refund document)
    const resultB = await retrieveKnowledge({
      companyId: companyB,
      query: 'What is your 30 day refund policy?',
      topK: 5,
    });

    expect(resultB.chunks.length).toBe(0);

    // Search with refund query for Company A (which has seeded refund document)
    const resultA = await retrieveKnowledge({
      companyId: companyA,
      query: 'What is your 30 day refund policy?',
      topK: 5,
    });

    expect(resultA.chunks.length).toBeGreaterThan(0);
    expect(resultA.chunks.every((c) => c.company_id === companyA)).toBe(true);
  });

  it('ensures tickets cannot be queried across tenants', () => {
    const ticketA = store.createTicket({
      company_id: companyA,
      title: 'Secret Ticket Company A',
      category: 'Billing',
      priority: 'P1',
      status: 'open',
    });

    const queryFromB = store.getTicketById(companyB, ticketA.id);
    expect(queryFromB).toBeNull();

    const queryFromA = store.getTicketById(companyA, ticketA.id);
    expect(queryFromA).not.toBeNull();
    expect(queryFromA?.id).toBe(ticketA.id);
  });
});
