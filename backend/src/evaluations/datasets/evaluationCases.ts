import { Priority, TicketCategory } from '../../types/index.js';

export interface EvaluationCase {
  id: string;
  name: string;
  query: string;
  expectedCategory: TicketCategory;
  expectedPriority: Priority;
  expectedEscalate: boolean;
  expectedKeywords: string[];
  groundTruthContextMustContain?: string;
  description: string;
}

export const EVALUATION_CASES: EvaluationCase[] = [
  {
    id: 'case-01-refund',
    name: 'Refund Policy Query',
    query: 'What is your refund policy? How many days do I have to return an item?',
    expectedCategory: 'Refund',
    expectedPriority: 'P2',
    expectedEscalate: false,
    expectedKeywords: ['30 days', 'refund'],
    groundTruthContextMustContain: 'Refund Policy',
    description: 'Customer asks standard question about refund timeframe.',
  },
  {
    id: 'case-02-shipping',
    name: 'Shipping Guidelines Query',
    query: 'How long does standard delivery usually take to arrive at my door?',
    expectedCategory: 'Shipping',
    expectedPriority: 'P3',
    expectedEscalate: false,
    expectedKeywords: ['3 to 5 business days', 'shipping'],
    groundTruthContextMustContain: 'Shipping Guidelines',
    description: 'Routine delivery timeline inquiry.',
  },
  {
    id: 'case-03-payment-failure',
    name: 'Payment Deducted / Order Failed',
    query: 'My payment of $120 was deducted from my bank but the order status says Failed! Help!',
    expectedCategory: 'Payment',
    expectedPriority: 'P1',
    expectedEscalate: true,
    expectedKeywords: ['Order ID', 'reconcil'],
    groundTruthContextMustContain: 'Payment Disputes',
    description: 'Urgent monetary transaction discrepancy requiring P1 escalation.',
  },
  {
    id: 'case-04-order-not-confirmed',
    name: 'Order Not Confirmed After Checkout',
    query: 'My money was deducted from HDFC card but I never received an order confirmation or email.',
    expectedCategory: 'Payment',
    expectedPriority: 'P1',
    expectedEscalate: true,
    expectedKeywords: ['reference', 'order'],
    groundTruthContextMustContain: 'Payment Disputes',
    description: 'Payment captured without order generation.',
  },
  {
    id: 'case-05-human-request',
    name: 'Explicit Human Agent Request',
    query: 'I want to speak with a human support agent immediately. Stop sending bot answers.',
    expectedCategory: 'General',
    expectedPriority: 'P2',
    expectedEscalate: true,
    expectedKeywords: ['human', 'support'],
    description: 'Explicit human takeover request.',
  },
  {
    id: 'case-06-angry-customer',
    name: 'Angry Customer Sentiment',
    query: 'This is the worst service ever! You cheated me and took my money! I am filing a police fraud complaint!',
    expectedCategory: 'Payment',
    expectedPriority: 'P1',
    expectedEscalate: true,
    expectedKeywords: ['apologize', 'assist'],
    description: 'Distressed angry customer triggering immediate priority triage.',
  },
  {
    id: 'case-07-unknown-policy',
    name: 'Unknown Policy (Anti-Hallucination)',
    query: 'Can you guarantee me a crypto bitcoin payout if my package is delayed by 10 minutes?',
    expectedCategory: 'General',
    expectedPriority: 'P3',
    expectedEscalate: true,
    expectedKeywords: ['not', 'documentation'],
    description: 'Nonsensical / unsupported query where agent must not hallucinate policy.',
  },
  {
    id: 'case-08-out-of-scope',
    name: 'Out-of-Scope Query',
    query: 'Can you write me a Python script to scrape alien satellites on Mars?',
    expectedCategory: 'General',
    expectedPriority: 'P3',
    expectedEscalate: true,
    expectedKeywords: ['assist', 'support'],
    description: 'Irrelevant query out of customer support scope.',
  },
];
