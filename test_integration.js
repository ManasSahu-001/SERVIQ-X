import dotenv from 'dotenv';
dotenv.config();

import { invokeGroqWithTracing, invokeGroqFastWithTracing } from './src/services/groqService.js';
import { getGeminiEmbedding, EXPECTED_VECTOR_DIMENSION } from './src/services/geminiService.js';
import { runJudgeEvaluation } from './src/agent/judge.js';
import { getAdminClient } from './src/supabaseClient.js';
import { Client } from 'langsmith';
import { runSupportAgent } from './src/agent/supportAgent.js';

async function runLiveIntegrationTests() {
  console.log('========================================================================');
  console.log('              SERVIQ-X LIVE INTEGRATION TEST SUITE');
  console.log('    (Genuine Groq, Gemini 768d, Supabase DB & LangSmith Tracing)');
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
  // 1. Live Groq API Models
  // ---------------------------------------------------------------------------
  console.log('\n[1/6] Testing Live Groq Inference (Fast & Primary Models)...');
  try {
    const fastStart = Date.now();
    const fastRes = await invokeGroqFastWithTracing(
      'Respond with exactly: GROQ_FAST_OPERATIONAL',
      { temperature: 0.0 }
    );
    const fastLatency = Date.now() - fastStart;
    assert(fastRes.includes('GROQ_FAST_OPERATIONAL'), `Groq Fast Model responded live (${fastLatency}ms)`);

    const primaryStart = Date.now();
    const primaryRes = await invokeGroqWithTracing(
      'Respond with exactly: GROQ_PRIMARY_OPERATIONAL',
      { temperature: 0.0 }
    );
    const primaryLatency = Date.now() - primaryStart;
    assert(primaryRes.includes('GROQ_PRIMARY_OPERATIONAL'), `Groq Primary Model responded live (${primaryLatency}ms)`);
  } catch (err) {
    assert(false, `Live Groq API failure: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 2. Live Gemini Embedding API (768-Dimensions)
  // ---------------------------------------------------------------------------
  console.log('\n[2/6] Testing Live Gemini Embeddings (gemini-embedding-001)...');
  try {
    const embStart = Date.now();
    const vector = await getGeminiEmbedding('Customer return and exchange warranty policy');
    const embLatency = Date.now() - embStart;

    assert(Array.isArray(vector), `Gemini embedding returned vector array (${embLatency}ms)`);
    assert(vector.length === EXPECTED_VECTOR_DIMENSION, `Embedding dimension strictly matches ${EXPECTED_VECTOR_DIMENSION}`);
    assert(vector.length === 768, 'Embedding dimension is exactly 768-dim (pgvector schema compliant)');
    assert(typeof vector[0] === 'number' && !isNaN(vector[0]), 'Vector contains valid floating point numbers');
  } catch (err) {
    assert(false, `Live Gemini Embedding failure: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 3. Live LLM-as-a-Judge Evaluation (Real Groq Primary Model)
  // ---------------------------------------------------------------------------
  console.log('\n[3/6] Testing Live LLM-as-a-Judge Reasoning & Grounding...');
  try {
    // Scenario A: Grounded routine question -> APPROVE_AI_RESPONSE
    const approvedVerdict = await runJudgeEvaluation({
      customerQuery: 'What is your return policy?',
      generatedResponse: 'Customers can return items within 30 days of purchase for a full refund if accompanied by the original receipt.',
      retrievedChunks: [
        {
          document_id: 'doc-policy-01',
          content: 'Return Policy: Customers can return items within 30 days of purchase for a full refund if accompanied by the original receipt.',
          page_number: 1,
        },
      ],
      intent: 'general_support',
    });

    assert(approvedVerdict.decision === 'APPROVE_AI_RESPONSE', `Live Judge approved grounded answer: ${approvedVerdict.decision}`);
    assert(approvedVerdict.requires_human === false, 'Live Judge requires_human is false for grounded answer');
    assert(approvedVerdict.faithfulness_score >= 0.8, `Grounded faithfulness score: ${approvedVerdict.faithfulness_score}`);
    assert(approvedVerdict.hallucination_detected === false, 'Zero hallucinations detected in grounded answer');

    // Scenario B: Demand for refund -> REQUEST_HUMAN_REVIEW
    const escalateVerdict = await runJudgeEvaluation({
      customerQuery: 'Please process a refund of ₹4,500 to my credit card immediately.',
      generatedResponse: 'I will submit this request for you.',
      retrievedChunks: [],
      intent: 'billing',
    });

    assert(escalateVerdict.decision === 'REQUEST_HUMAN_REVIEW', `Live Judge escalated financial refund demand: ${escalateVerdict.decision}`);
    assert(escalateVerdict.requires_human === true, 'Live Judge requires_human is true for refund demand');
  } catch (err) {
    assert(false, `Live Judge evaluation failure: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 4. Real Supabase Ticket Persistence (Database Verification)
  // ---------------------------------------------------------------------------
  console.log('\n[4/6] Testing Real Supabase Ticket Persistence...');
  let testTicketId = null;
  const supabase = getAdminClient();

  try {
    // Fetch a real active company ID from database
    const { data: companies, error: compErr } = await supabase.from('companies').select('id, name').limit(1);
    if (compErr || !companies || companies.length === 0) {
      throw new Error(`Failed to find active company for test: ${compErr?.message}`);
    }
    const realCompanyId = companies[0].id;
    console.log(`  ℹ Using real tenant company: "${companies[0].name}" (${realCompanyId})`);

    // Insert an isolated test ticket
    const testTitle = `[INTEGRATION_TEST_${Date.now()}] AI Support Escalation Verification`;
    const { data: insertedTicket, error: insertErr } = await supabase
      .from('tickets')
      .insert({
        company_id: realCompanyId,
        title: testTitle,
        description: 'Test ticket generated during live integration verification suite.',
        priority: 'high',
        status: 'open',
        metadata: {
          is_automated_test: true,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertErr) {
      throw new Error(`Supabase insert failed: ${insertErr.message}`);
    }

    testTicketId = insertedTicket.id;
    assert(typeof testTicketId === 'string' && testTicketId.length > 20, `Ticket genuinely persisted with UUID: ${testTicketId}`);
    assert(insertedTicket.priority === 'high', `Ticket priority persisted as "${insertedTicket.priority}"`);
    assert(insertedTicket.status === 'open', `Ticket status persisted as "${insertedTicket.status}"`);

    // Select back from database to prove persistence independently
    const { data: fetchedTicket, error: fetchErr } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', testTicketId)
      .single();

    assert(!fetchErr && fetchedTicket && fetchedTicket.id === testTicketId, 'Ticket confirmed via independent database read query');

    // Clean up test ticket to leave database clean
    const { error: deleteErr } = await supabase
      .from('tickets')
      .delete()
      .eq('id', testTicketId);

    assert(!deleteErr, 'Test ticket cleaned up successfully from Supabase tickets table');
  } catch (err) {
    assert(false, `Real Supabase persistence failure: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 5. Real LangSmith Trace Ingestion Verification
  // ---------------------------------------------------------------------------
  console.log('\n[5/6] Testing Real LangSmith Trace Ingestion...');
  try {
    const langsmithClient = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_ENDPOINT,
    });

    const targetProject = process.env.LANGSMITH_PROJECT || 'SERVIQ-X';
    let projectFound = false;

    for await (const p of langsmithClient.listProjects()) {
      if (p.name === targetProject) {
        projectFound = true;
        break;
      }
    }

    assert(projectFound, `Verified LangSmith project "${targetProject}" exists and is accessible`);
    console.log(`  ℹ LangSmith endpoint: ${process.env.LANGSMITH_ENDPOINT}`);
  } catch (err) {
    assert(false, `LangSmith verification error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 6. Complete Live End-to-End Support Agent Execution
  // ---------------------------------------------------------------------------
  console.log('\n[6/6] Testing Live End-to-End Support Agent Workflow...');
  try {
    const { data: companies } = await supabase.from('companies').select('id').limit(1);
    const companyId = companies?.[0]?.id || '4b05721f-2708-43fa-972e-0928404723a0';

    // A: Routine informational question (Live execution)
    const liveRoutine = await runSupportAgent({
      companyId,
      customerId: 'live-test-customer',
      customerMessage: 'What is your return policy?',
      supabaseClient: supabase,
    });

    assert(liveRoutine.success === true, 'Live routine agent execution succeeded');
    assert(typeof liveRoutine.response === 'string' && liveRoutine.response.length > 20, 'Live agent generated customer response');
    assert(liveRoutine.requiresHumanApproval === false, 'Live routine question did NOT escalate to human');

    // B: Sensitive transaction demand (Live execution)
    const liveEscalate = await runSupportAgent({
      companyId,
      customerId: 'live-test-customer',
      customerMessage: 'My payment was deducted, but my order is not confirmed. Please issue a refund immediately.',
      supabaseClient: supabase,
    });

    assert(liveEscalate.success === true, 'Live escalation agent execution succeeded');
    assert(liveEscalate.requiresHumanApproval === true, 'Live sensitive transaction flagged requiresHumanApproval = true');
    assert(typeof liveEscalate.suggestedReply === 'string' || typeof liveEscalate.suggestedReply === 'object', 'Drafted suggested reply for human agent');

    // Clean up any test ticket created during live agent execution
    if (liveEscalate.ticketId) {
      await supabase.from('tickets').delete().eq('id', liveEscalate.ticketId);
      console.log(`  ℹ Cleaned up live test ticket #${liveEscalate.ticketId}`);
    }
  } catch (err) {
    assert(false, `Live E2E Agent execution failure: ${err.message}`);
  }

  console.log('\n========================================================================');
  console.log(`LIVE INTEGRATION TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    // Brief pause to allow LangSmith background trace batches to flush before exit
    setTimeout(() => {
      console.log('✅ Live Integration Test Suite Exited Cleanly.');
      process.exit(0);
    }, 1500);
  }
}

runLiveIntegrationTests().catch((err) => {
  console.error('Fatal Live Integration Test Error:', err);
  process.exit(1);
});
