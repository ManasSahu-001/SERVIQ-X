import { EVALUATION_CASES } from './datasets/evaluationCases.js';
import { evaluateCase, EvaluationResult } from './evaluators/evaluator.js';
import { runSupportAgent } from '../agents/graph.js';
import { DEMO_COMPANY_ID } from '../services/store.js';
import { v4 as uuidv4 } from 'uuid';

export const runFullEvaluations = async (): Promise<EvaluationResult[]> => {
  console.log('================================================================');
  console.log('🧪 SERVIQ-X AI AGENT & RAG EVALUATION SUITE');
  console.log('================================================================\n');

  const results: EvaluationResult[] = [];

  for (const testCase of EVALUATION_CASES) {
    const testConvId = `eval-${uuidv4().slice(0, 8)}`;
    console.log(`▶ Running Case [${testCase.id}]: "${testCase.name}"`);
    console.log(`  Query: "${testCase.query}"`);

    const agentState = await runSupportAgent({
      conversationId: testConvId,
      companyId: DEMO_COMPANY_ID,
      customerMessage: testCase.query,
    });

    const evalResult = evaluateCase(testCase, agentState);
    results.push(evalResult);

    console.log(`  Intent: ${(evalResult.intentScore * 100).toFixed(0)}% | Retrieval: ${(evalResult.retrievalScore * 100).toFixed(0)}% | Faithfulness: ${(evalResult.faithfulnessScore * 100).toFixed(0)}% | Escalation: ${(evalResult.escalationScore * 100).toFixed(0)}% | Tool: ${(evalResult.toolExecutionScore * 100).toFixed(0)}%`);
    console.log(`  Status: ${evalResult.passedAll ? '✅ PASSED' : '⚠️ WARNING / REVIEW'}`);
    if (evalResult.notes.length > 0) {
      console.log(`  Notes: ${evalResult.notes.join('; ')}`);
    }
    console.log('----------------------------------------------------------------');
  }

  // Summary Metrics
  const total = results.length;
  const avgIntent = (results.reduce((acc, r) => acc + r.intentScore, 0) / total) * 100;
  const avgRetrieval = (results.reduce((acc, r) => acc + r.retrievalScore, 0) / total) * 100;
  const avgFaithfulness = (results.reduce((acc, r) => acc + r.faithfulnessScore, 0) / total) * 100;
  const avgCorrectness = (results.reduce((acc, r) => acc + r.correctnessScore, 0) / total) * 100;
  const avgEscalation = (results.reduce((acc, r) => acc + r.escalationScore, 0) / total) * 100;
  const avgTool = (results.reduce((acc, r) => acc + r.toolExecutionScore, 0) / total) * 100;
  const passedCount = results.filter((r) => r.passedAll).length;

  console.log('\n================================================================');
  console.log('📊 EVALUATION SUMMARY SCORECARD');
  console.log('================================================================');
  console.log(`Cases Evaluated:             ${total}`);
  console.log(`Passed All Criteria:         ${passedCount}/${total} (${((passedCount / total) * 100).toFixed(1)}%)`);
  console.log(`1. Answer Correctness:       ${avgCorrectness.toFixed(1)}%`);
  console.log(`2. Faithfulness (Grounded):  ${avgFaithfulness.toFixed(1)}%`);
  console.log(`3. Retrieval Quality:        ${avgRetrieval.toFixed(1)}%`);
  console.log(`4. Intent Classification:    ${avgIntent.toFixed(1)}%`);
  console.log(`5. Escalation Accuracy:      ${avgEscalation.toFixed(1)}%`);
  console.log(`6. Tool Execution (Tickets): ${avgTool.toFixed(1)}%`);
  console.log('================================================================\n');

  return results;
};

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes('runEvaluations')) {
  runFullEvaluations()
    .then((results) => {
      const allSuccess = results.filter((r) => r.passedAll).length >= results.length * 0.75;
      process.exit(allSuccess ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal evaluation runner error:', err);
      process.exit(1);
    });
}
