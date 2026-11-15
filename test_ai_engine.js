import dotenv from 'dotenv';
dotenv.config();

/**
 * SERVIQ-X AI Engine Verification Suite
 * Executes:
 * Part 1: Offline Unit Tests (Mocked models & state)
 * Part 2: Live Integration Tests (Genuine Groq, Gemini 768d, Supabase DB & LangSmith)
 */

async function main() {
  console.log('========================================================================');
  console.log('          SERVIQ-X COMPLETE AI ENGINE VERIFICATION SUITE');
  console.log('========================================================================\n');

  try {
    // 1. Run Unit Tests
    console.log('>>> [PHASE 1] RUNNING OFFLINE UNIT TESTS...\n');
    const { spawn } = await import('child_process');

    const runScript = (scriptName) => {
      return new Promise((resolve, reject) => {
        const proc = spawn('node', [scriptName], { stdio: 'inherit' });
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`${scriptName} failed with exit code ${code}`));
        });
      });
    };

    await runScript('test_unit.js');

    console.log('\n>>> [PHASE 2] RUNNING LIVE INTEGRATION TESTS...\n');
    await runScript('test_integration.js');

    console.log('\n========================================================================');
    console.log('🎉 ALL SERVIQ-X AI ENGINE UNIT & LIVE INTEGRATION TESTS PASSED!');
    console.log('   - Groq Live Models: Verified (openai/gpt-oss-120b & 20b)');
    console.log('   - Gemini 768d Embeddings: Verified (gemini-embedding-001)');
    console.log('   - Supabase Persistence: Verified (Live tickets table)');
    console.log('   - LLM-as-a-Judge: Verified (Grounded approval & Escalation)');
    console.log('   - LangSmith Tracing: Verified (Project SERVIQ-X)');
    console.log('========================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Suite Failed:', err.message);
    process.exit(1);
  }
}

main();
