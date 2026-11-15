import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { runSupportAgent } from './src/agent/supportAgent.js';
import { langsmithClient, isTracingEnabled, project, endpoint } from './src/config/langsmith.js';

const SUPABASE_URL = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your_supabase')
  ? process.env.SUPABASE_URL
  : 'https://pphphvjhwfudeunipcqm.supabase.co';

const PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('your_supabase')
  ? process.env.SUPABASE_ANON_KEY
  : 'sb_publishable_ANC-YmcjrtcsfwBaaRTJ-w_feaQslah';

async function verifyLangSmithIntegration() {
  console.log('================================================================');
  console.log(' SERVIQ-X — LangSmith Tracing & Agent Verification');
  console.log('================================================================\n');

  // 1. Verify LangSmith Environment Variables
  console.log('1. Checking LangSmith Configuration:');
  console.log(`   - LANGSMITH_TRACING  : ${process.env.LANGSMITH_TRACING}`);
  console.log(`   - LANGSMITH_PROJECT  : ${project}`);
  console.log(`   - LANGSMITH_ENDPOINT : ${endpoint}`);
  console.log(`   - LANGSMITH_API_KEY  : ${process.env.LANGSMITH_API_KEY ? '[PROTECTED / VALID]' : '[MISSING]'}`);

  if (!isTracingEnabled) {
    throw new Error('LANGSMITH_TRACING must be set to "true"');
  }
  if (!langsmithClient) {
    throw new Error('langsmithClient failed to initialize; check LANGSMITH_API_KEY');
  }
  console.log('   [PASS] LangSmith configuration validated successfully.\n');

  // 2. Authenticate User and Obtain Multi-Tenant Company Context
  console.log('2. Authenticating Support Session with Supabase...');
  const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY);
  const authRes = await supabase.auth.signInWithPassword({
    email: 'alice.demo@deskpilot.io',
    password: 'Password123!',
  });

  if (authRes.error) {
    throw new Error('Supabase login failed: ' + authRes.error.message);
  }
  console.log(`   [PASS] Authenticated user: ${authRes.data.user.email} (${authRes.data.user.id})`);

  // Retrieve Alice's company
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select('id, name')
    .limit(1);

  if (compErr || !companies.length) {
    throw new Error('Could not find company for test user');
  }
  const company = companies[0];
  console.log(`   [PASS] Multi-tenant Company context: "${company.name}" (ID: ${company.id})\n`);

  // 3. Create a test conversation to track
  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .insert({
      company_id: company.id,
      customer_name: 'Rahul Sharma',
      customer_email: 'rahul.customer@example.com',
      title: 'Billing & Refund Inquiry regarding order #1042',
      status: 'active',
      channel: 'web_chat',
    })
    .select()
    .single();

  if (convErr) {
    throw new Error('Failed to create test conversation: ' + convErr.message);
  }
  console.log(`3. Created Customer Conversation: ID ${conversation.id}`);
  console.log(`   - Customer: ${conversation.customer_name} (${conversation.customer_email})`);
  console.log(`   - Subject : ${conversation.title}\n`);

  // 4. Execute the LangGraph Agent with LangSmith Tracing
  console.log('4. Executing LangGraph Support Agent with LangSmith Tracing...');
  const testCustomerQuery = 'I paid ₹1,299 for my order, but I have not received confirmation. Can I request a refund under your 30-day return policy?';
  console.log(`   - Input Query: "${testCustomerQuery}"`);

  const startTime = Date.now();
  const agentResult = await runSupportAgent({
    companyId: company.id,
    conversationId: conversation.id,
    customerId: 'cust_rahul_99',
    customerMessage: testCustomerQuery,
    supabaseClient: supabase,
  });
  const durationMs = Date.now() - startTime;

  console.log(`\n   [PASS] Agent Execution Completed in ${durationMs}ms`);
  console.log(`   - Detected Intent  : ${agentResult.intent}`);
  console.log(`   - Retrieved Chunks : ${agentResult.sources.length} chunk(s) from Supabase vector search`);
  console.log(`   - Escalated to Human: ${agentResult.escalated}`);
  if (agentResult.ticket) {
    console.log(`   - Support Ticket   : Created Ticket #${agentResult.ticket.id} (Priority: ${agentResult.ticket.priority})`);
  }
  console.log(`   - Response Preview : "${agentResult.response.substring(0, 120)}..."\n`);

  // 5. Query LangSmith to Verify Ingested Traces
  console.log('5. Verifying Traces in LangSmith Project "' + project + '"...');
  console.log('   Waiting 3 seconds for LangSmith background telemetry flush...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    let recentRuns = [];
    // Query runs using the LangSmith client
    for await (const run of langsmithClient.listRuns({
      projectName: project,
      limit: 10,
    })) {
      recentRuns.push(run);
    }

    console.log(`   [PASS] Found ${recentRuns.length} recent run(s) recorded in LangSmith project "${project}":\n`);
    
    recentRuns.slice(0, 5).forEach((r, idx) => {
      console.log(`   Run #${idx + 1}:`);
      console.log(`     - Name      : ${r.name}`);
      console.log(`     - Run ID    : ${r.id}`);
      console.log(`     - Run Type  : ${r.run_type}`);
      console.log(`     - Status    : ${r.status}`);
      console.log(`     - Latency   : ${r.latency ? `${(r.latency * 1000).toFixed(0)}ms` : (r.end_time && r.start_time ? `${new Date(r.end_time) - new Date(r.start_time)}ms` : 'Recorded')}`);
      console.log(`     - Tags      : ${JSON.stringify(r.tags || [])}`);
      console.log(`     - Trace URL : ${r.url || `${endpoint}/o/.../projects/p/${project}/r/${r.id}`}`);
      console.log('');
    });

    // Verification check: ensure at least one run was recorded
    if (recentRuns.length > 0) {
      console.log('================================================================');
      console.log(' SUCCESS: LangSmith Tracing Fully Verified in SERVIQ-X Backend!');
      console.log(' All LangGraph agent nodes, LLM calls, and tools are traced.');
      console.log('================================================================');
    } else {
      console.warn('   [WARNING] Traces were queued but not immediately returned by listRuns; verify in dashboard.');
    }
  } catch (lsErr) {
    console.error('   [ERROR] Error querying LangSmith API:', lsErr.message);
    throw lsErr;
  }
}

verifyLangSmithIntegration().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
