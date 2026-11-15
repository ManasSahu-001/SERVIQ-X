import dotenv from 'dotenv';
dotenv.config();

import { chunkText } from './src/services/ragService.js';
import { generateDeterministic768Vector, EXPECTED_VECTOR_DIMENSION } from './src/services/geminiService.js';
import { simulateGroqResponse } from './src/services/groqService.js';
import { evaluateDeterministicRules, runJudgeEvaluation } from './src/agent/judge.js';
import { runSupportAgent } from './src/agent/supportAgent.js';

async function runUnitTests() {
  console.log('========================================================================');
  console.log('                 SERVIQ-X OFFLINE UNIT TEST SUITE');
  console.log('       (100% Deterministic Mocks - No Live External Network Calls)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Text Chunking & Metadata
  console.log('\n[1/5] Testing Text Chunking & Sentence Boundary Splits...');
  const sampleDoc = `
    DeskPilot Customer Agreement:
    Section 1: Returns. Customers can return undamaged goods within 30 days for a full refund.
    Section 2: Shipping. Standard delivery takes 3 to 5 business days across North America.
    Section 3: Warranty. All hardware products include a 1-year limited warranty against factory defects.
  `.repeat(8);

  const chunks = chunkText(sampleDoc, { page_number: 1 });
  assert(chunks.length >= 2, `Text chunker produced ${chunks.length} overlapping chunks`);
  assert(chunks[0].chunk_index === 0, 'Chunking attaches correct zero-based indexing');
  assert(chunks[0].content.length > 20, 'Chunk content exceeds minimum character threshold');

  // 2. Deterministic 768-dim Unit Vector
  console.log('\n[2/5] Testing Deterministic Vector Normalization...');
  const unitVector = generateDeterministic768Vector('Return policy and 30-day warranty');
  assert(Array.isArray(unitVector), 'Unit vector is an array');
  assert(unitVector.length === EXPECTED_VECTOR_DIMENSION, `Vector length strictly equals ${EXPECTED_VECTOR_DIMENSION}`);
  const magnitude = Math.sqrt(unitVector.reduce((sum, val) => sum + val * val, 0));
  assert(Math.abs(magnitude - 1.0) < 0.01, `Vector is properly L2-normalized (magnitude: ${magnitude.toFixed(4)})`);

  // 3. Deterministic Escalation Rules (Scenarios A through E)
  console.log('\n[3/5] Testing Deterministic Escalation Rules (Scenarios A-E)...');

  // Test A: Normal informational return policy question with context -> No escalation
  const ruleA = evaluateDeterministicRules('What is your return policy?', [{ content: 'Returns allowed within 30 days.' }]);
  assert(ruleA === null, 'Test A: Informational "What is your return policy?" does NOT trigger deterministic escalation');

  // Test B: Unsupported guarantee demand -> Escalation
  const ruleB = evaluateDeterministicRules('Can you guarantee my refund today?', []);
  assert(ruleB !== null && ruleB.requiresHuman === true, 'Test B: "Can you guarantee my refund today?" triggers deterministic escalation');

  // Test C: Payment deducted without confirmation -> Escalation
  const ruleC = evaluateDeterministicRules('My payment was deducted, but my order is not confirmed.', []);
  assert(ruleC !== null && ruleC.requiresHuman === true, 'Test C: "Payment deducted but order unconfirmed" triggers deterministic escalation');

  // Test D: Explicit human request -> Escalation
  const ruleD = evaluateDeterministicRules('I want to speak with a human support agent.', []);
  assert(ruleD !== null && ruleD.requiresHuman === true, 'Test D: "I want to speak with a human" triggers deterministic escalation');

  // Test E: Specific policy question with zero context -> Escalation
  const ruleE = evaluateDeterministicRules('What is your company warranty policy?', []);
  assert(ruleE !== null && ruleE.requiresHuman === true, 'Test E: Missing policy context triggers deterministic escalation');

  // Test F: Private personal information inquiry -> Explicit Refusal
  const ruleF = evaluateDeterministicRules("What is your CEO's personal phone number?", []);
  assert(ruleF !== null && ruleF.decision === 'REFUSE_RESPONSE' && ruleF.requiresHuman === false, 'Test F: Private executive info inquiry triggers explicit REFUSE_RESPONSE');

  // 4. Mocked LLM-as-a-Judge Logic
  console.log('\n[4/5] Testing Mocked LLM-as-a-Judge Decision Pathways...');
  const mockApprovedJudge = await runJudgeEvaluation({
    customerQuery: 'What is your return policy?',
    generatedResponse: 'You can return items within 30 days for a full refund.',
    retrievedChunks: [{ content: 'Items can be returned within 30 days for a full refund.' }],
    intent: 'general_support',
    options: { mock: true },
  });
  assert(mockApprovedJudge.decision === 'APPROVE_AI_RESPONSE', 'Mock Judge approves grounded response');
  assert(mockApprovedJudge.requires_human === false, 'Mock Judge requires_human is false for grounded answer');

  const mockEscalateJudge = await runJudgeEvaluation({
    customerQuery: 'Please process a refund for my order immediately.',
    generatedResponse: 'I will submit this for review.',
    retrievedChunks: [],
    intent: 'billing',
    options: { mock: true },
  });
  assert(mockEscalateJudge.decision === 'REQUEST_HUMAN_REVIEW', 'Mock Judge requests human review for refund demand');
  assert(mockEscalateJudge.requires_human === true, 'Mock Judge requires_human is true for refund demand');

  const mockRefuseJudge = await runJudgeEvaluation({
    customerQuery: "What is your CEO's personal phone number?",
    generatedResponse: 'I cannot share personal contact details.',
    retrievedChunks: [],
    intent: 'general_support',
    options: { mock: true },
  });
  assert(mockRefuseJudge.decision === 'REFUSE_RESPONSE', 'Mock Judge returns explicit REFUSE_RESPONSE for private PII');
  assert(mockRefuseJudge.safety_passed === false, 'Mock Judge marks safety_passed: false (never approved as safe content)');

  // 5. Full LangGraph Support Agent Execution (In-Memory Mock Supabase)
  console.log('\n[5/5] Testing Full LangGraph Support Agent Workflow (Mocked)...');
  const mockTickets = [];
  const mockDb = {
    from: () => {
      const builder = {
        select: () => builder,
        insert: (record) => {
          if (record?.title) mockTickets.push(record);
          return builder;
        },
        update: () => builder,
        delete: () => builder,
        eq: () => builder,
        in: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () => Promise.resolve({ data: { id: `mock-ticket-${Date.now()}` }, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve) => resolve({ data: [], error: null }),
      };
      return builder;
    },
    rpc: (name) => {
      if (name === 'match_document_chunks') {
        return Promise.resolve({
          data: [
            {
              id: 'mock-chunk-1',
              document_id: 'mock-doc-1',
              document_name: 'Policy.pdf',
              page_number: 1,
              content: 'Items can be returned within 30 days for a full refund.',
              similarity: 0.95,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    },
  };

  // Run Routine Path (Should approve)
  const routineRes = await runSupportAgent({
    companyId: 'unit-test-comp',
    conversationId: 'unit-conv-1',
    customerId: 'unit-cust-1',
    customerMessage: 'What is your return policy?',
    supabaseClient: mockDb,
    options: { mock: true },
  });
  assert(routineRes.success === true, 'Mock routine agent execution succeeded');
  assert(typeof routineRes.response === 'string', 'Generated customer response string');

  // Run Escalation Path (Should escalate)
  const escalateRes = await runSupportAgent({
    companyId: 'unit-test-comp',
    conversationId: 'unit-conv-2',
    customerId: 'unit-cust-2',
    customerMessage: 'I want to speak with a human and cancel my order.',
    supabaseClient: mockDb,
    options: { mock: true },
  });
  assert(escalateRes.requiresHumanApproval === true, 'Mock escalation agent flagged requiresHumanApproval = true');
  assert(escalateRes.ticketId !== null, 'Mock escalation agent generated ticket ID');
  assert(escalateRes.suggestedReply !== null, 'Mock escalation agent generated suggested reply');

  console.log('\n========================================================================');
  console.log(`UNIT TESTS COMPLETED: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runUnitTests().catch((err) => {
  console.error('Fatal Unit Test Error:', err);
  process.exit(1);
});
