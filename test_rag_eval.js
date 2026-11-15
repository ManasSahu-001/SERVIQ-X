import dotenv from 'dotenv';
dotenv.config();

import { runRAGEvaluationSuite } from './src/evaluation/ragEvaluator.js';

async function main() {
  console.log('🚀 Running SERVIQ-X RAG Evaluation Suite...\n');

  try {
    const report = await runRAGEvaluationSuite();

    console.log('\n========================================================================');
    console.log('                        RAG EVALUATION RESULTS');
    console.log('========================================================================\n');

    console.log(`Execution Time:     ${report.durationSeconds}s`);
    console.log(`Total Scenarios:    ${report.totalScenarios}`);
    console.log(`Passed:             ${report.passedCount} / ${report.totalScenarios} (${report.passRatePercent}%)`);
    console.log(`Average Score:      ${report.aggregates.averageScore}`);
    console.log(`Avg Faithfulness:   ${report.aggregates.averageFaithfulness}`);
    console.log(`Avg Hallucination:  ${report.aggregates.averageHallucinationRate}`);
    console.log(`Escalation Accuracy:${report.aggregates.averageEscalationAccuracy * 100}%\n`);

    console.log('| Scenario ID | Scenario Name | Decision | Faithfulness | Esc. Acc. | Overall | Verdict |');
    console.log('|---|---|---|---|---|---|---|');
    for (const s of report.scenarios) {
      console.log(
        `| ${s.id} | ${s.name} | ${s.decision} | ${s.metrics.faithfulness} | ${s.metrics.escalationAccuracy} | ${s.metrics.overallScore} | ${s.passed ? '✅ PASS' : '❌ FAIL'} |`
      );
    }

    console.log('\n========================================================================');
    console.log('Detailed Scenario Responses:');
    for (const s of report.scenarios) {
      console.log(`\n[${s.id}] ${s.name}`);
      console.log(`  Query:     ${s.query}`);
      console.log(`  Decision:  ${s.decision}`);
      console.log(`  Escalated: ${s.requiresHumanApproval} (Expected: ${s.expectedEscalation})`);
      console.log(`  Response:  ${s.responseSnippet}`);
    }

    if (report.passedCount === report.totalScenarios) {
      console.log('\n🎉 ALL 5 RAG EVALUATION SCENARIOS PASSED WITH ZERO HALLUCINATION!\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️ ${report.failedCount} scenario(s) did not meet full passing criteria.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error executing RAG Evaluation Suite:', err);
    process.exit(1);
  }
}

main();
