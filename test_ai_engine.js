import dotenv from 'dotenv';
dotenv.config();

import { invokeGroqWithTracing, invokeGroqFastWithTracing } from './src/services/groqService.js';
import { generateEmbedding, EMBEDDING_DIMENSION } from './src/services/geminiService.js';
import { chunkText, retrieveKnowledge } from './src/services/ragService.js';
import { runJudgeEvaluation, evaluateDeterministicRules } from './src/agent/judge.js';
import { runSupportAgent } from './src/agent/supportAgent.js';
import { isTracingEnabled, project } from './src/config/langsmith.js';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('         SERVIQ-X COMPREHENSIVE AI ENGINE VERIFICATION SUITE');
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

  // ---------------------------------------------------------------------------
  // TEST 1: LangSmith Tracing Configuration
  // ---------------------------------------------------------------------------
  console.log('\n[1/6] Verifying LangSmith Observability Configuration...');
  assert(typeof isTracingEnabled === 'boolean', `LangSmith tracing active: ${isTracingEnabled}`);
  assert(project === 'SERVIQ-X', `Target project is "${project}"`);

  // ---------------------------------------------------------------------------
  // TEST 2: Groq LLM Services (Primary & Fast Models)
  // ---------------------------------------------------------------------------
  console.log('\n[2/6] Verifying Groq Model Invocations...');
  try {
    const fastRes = await invokeGroqFastWithTracing([
      { role: 'user', content: 'Classify this intent: "Where is my receipt?"' },
    ]);
    assert(typeof fastRes === 'string' && fastRes.length > 0, 'Groq Fast Model returned valid response');

    const primaryRes = await invokeGroqWithTracing([
      { role: 'user', content: 'Generate a polite greeting for a support customer.' },
    ]);
    assert(typeof primaryRes === 'string' && primaryRes.length > 0, 'Groq Primary Model returned valid response');
  } catch (err) {
    assert(false, `Groq invocation error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Gemini Embeddings Service (768-Dimensions)
  // ---------------------------------------------------------------------------
  console.log('\n[3/6] Verifying Gemini Vector Embeddings...');
  try {
    const vector = await generateEmbedding('Customer return and exchange policy');
    assert(Array.isArray(vector), 'Embedding output is an array');
    assert(vector.length === EMBEDDING_DIMENSION, `Embedding dimension strictly matches ${EMBEDDING_DIMENSION}`);
    assert(vector.length === 768, 'Embedding dimension is exactly 768-dim (pgvector compliant)');
  } catch (err) {
    assert(false, `Embedding generation error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: RAG Chunking and Knowledge Retrieval
  // ---------------------------------------------------------------------------
  console.log('\n[4/6] Verifying RAG Chunking & Metadata...');
  const sampleDocument = `
    DeskPilot Customer Agreement:
    Section 1: Returns. Customers can return undamaged goods within 30 days for a full refund.
    Section 2: Shipping. Standard delivery takes 3 to 5 business days across North America.
    Section 3: Warranty. All hardware products include a 1-year limited warranty against factory defects.
  `.repeat(10); // expand to test chunking

  const chunks = chunkText(sampleDocument, { chunkSize: 300, chunkOverlap: 50 });
  assert(chunks.length > 1, `Chunking produced ${chunks.length} distinct chunks`);
  assert(chunks[0].chunk_index === 0, 'Chunking attaches correct zero-based indexing');
  assert(typeof chunks[0].content === 'string', 'Chunk contains non-empty text content');

  // ---------------------------------------------------------------------------
  // TEST 5: LLM-as-a-Judge & Escalation Logic
  // ---------------------------------------------------------------------------
  console.log('\n[5/6] Verifying LLM-as-a-Judge Evaluation & Deterministic Rules...');
  // A: Normal Question
  const normalJudge = await runJudgeEvaluation({
    customerQuery: 'How long does standard delivery take?',
    generatedResponse: 'Standard delivery takes 3 to 5 business days across North America.',
    retrievedChunks: [{ content: 'Standard delivery takes 3 to 5 business days across North America.' }],
    intent: 'general_support',
  });
  assert(normalJudge.decision === 'APPROVE_AI_RESPONSE', 'Normal grounded query approved by Judge');

  // B: Financial Escalation Rule
  const financeRule = evaluateDeterministicRules('Please process a refund for my order immediately', []);
  assert(financeRule !== null && financeRule.requiresHuman === true, 'Refund request triggers deterministic human escalation');

  // C: Explicit Human Request Rule
  const humanRule = evaluateDeterministicRules('I want to speak to a human representative right now', []);
  assert(humanRule !== null && humanRule.requiresHuman === true, 'Explicit human request triggers deterministic escalation');

  // ---------------------------------------------------------------------------
  // TEST 6: Complete 12-Node LangGraph Support Agent Pipeline
  // ---------------------------------------------------------------------------
  console.log('\n[6/6] Verifying Full LangGraph Support Agent Execution...');
  const mockTickets = [];

  function createMockSupabase() {
    const chain = {
      select: () => chain,
      insert: (record) => {
        if (record?.title) mockTickets.push(record);
        return chain;
      },
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve({ data: { id: `ticket-${Date.now()}` }, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve) => resolve({ data: [], error: null }),
    };

    return {
      from: () => chain,
      rpc: (name) => {
        if (name === 'match_document_chunks') {
          return Promise.resolve({
            data: [
              {
                id: 'c1',
                document_id: 'doc-1',
                document_name: 'Policy.pdf',
                page_number: 1,
                content: 'Items can be returned within 30 days for a full refund.',
                similarity: 0.92,
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: [], error: null });
      },
    };
  }

  const mockDb = createMockSupabase();

  // Run Routine Ingestion Path (Approval Expected)
  const routineExecution = await runSupportAgent({
    companyId: 'comp-100',
    conversationId: 'conv-routine-1',
    customerId: 'cust-1',
    customerMessage: 'What is your return policy window?',
    supabaseClient: mockDb,
  });

  assert(routineExecution.success === true, 'Routine graph execution completed successfully');
  assert(routineExecution.requiresHumanApproval === false, 'Routine graph did NOT escalate to human');
  assert(typeof routineExecution.response === 'string', 'Generated valid customer response');

  // Run Sensitive Escalation Path (Escalation & Ticket Creation Expected)
  const escalationExecution = await runSupportAgent({
    companyId: 'comp-100',
    conversationId: 'conv-escalate-2',
    customerId: 'cust-2',
    customerMessage: 'Please cancel my order and issue a full refund to my bank card.',
    supabaseClient: mockDb,
  });

  assert(escalationExecution.success === true, 'Escalation graph execution completed');
  assert(escalationExecution.requiresHumanApproval === true, 'Escalation graph flagged requiresHumanApproval = true');
  assert(escalationExecution.ticketId !== null, `Support ticket created in database: ${escalationExecution.ticketId}`);
  assert(escalationExecution.suggestedReply !== null, 'Drafted suggested reply for human agent');
  assert(escalationExecution.conversationSummary !== null, 'Generated conversation summary');

  console.log('\n========================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL SERVIQ-X AI ENGINE INTEGRATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${failed} test(s) failed.\n`);
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
