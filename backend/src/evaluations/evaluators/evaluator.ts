import { EvaluationCase } from '../datasets/evaluationCases.js';
import { AgentState } from '../../agents/state.js';

export interface EvaluationResult {
  caseId: string;
  name: string;
  intentScore: number; // 0 or 1
  retrievalScore: number; // 0 or 1
  faithfulnessScore: number; // 0 to 1
  correctnessScore: number; // 0 to 1
  escalationScore: number; // 0 or 1
  toolExecutionScore: number; // 0 or 1
  passedAll: boolean;
  notes: string[];
}

export const evaluateCase = (testCase: EvaluationCase, agentResult: AgentState): EvaluationResult => {
  const notes: string[] = [];

  // 1. Intent & Priority Score
  const categoryMatch =
    agentResult.category.toLowerCase() === testCase.expectedCategory.toLowerCase() ||
    (testCase.expectedCategory === 'General' && Boolean(agentResult.category));
  const priorityMatch = agentResult.priority === testCase.expectedPriority;
  const intentScore = categoryMatch && priorityMatch ? 1 : categoryMatch || priorityMatch ? 0.5 : 0;
  if (intentScore < 1) {
    notes.push(`Category/Priority mismatch: got ${agentResult.category}/${agentResult.priority}, expected ${testCase.expectedCategory}/${testCase.expectedPriority}`);
  }

  // 2. Retrieval Quality Score
  let retrievalScore = 1;
  if (testCase.groundTruthContextMustContain) {
    const matchedChunk = agentResult.retrievedChunks.some((c) =>
      c.content.toLowerCase().includes(testCase.groundTruthContextMustContain!.toLowerCase())
    );
    retrievalScore = matchedChunk ? 1 : 0;
    if (retrievalScore === 0) {
      notes.push(`Retrieval missed expected ground truth context containing "${testCase.groundTruthContextMustContain}"`);
    }
  }

  // 3. Faithfulness Score
  // Does the response contain hallucinations of policies if context was missing?
  let faithfulnessScore = agentResult.evaluationSignals.isFaithful ? 1 : 0.5;
  const lowerResp = agentResult.generatedResponse.toLowerCase();
  if (testCase.id === 'case-07-unknown-policy') {
    // If agent hallucinated bitcoin payout instead of declining or escalating
    if (lowerResp.includes('guarantee') && lowerResp.includes('bitcoin')) {
      faithfulnessScore = 0;
      notes.push('Anti-hallucination failure: agent falsely guaranteed unsupported policy');
    }
  }

  // 4. Answer Correctness Score
  let matchedKeywords = 0;
  for (const kw of testCase.expectedKeywords) {
    if (lowerResp.includes(kw.toLowerCase())) {
      matchedKeywords++;
    }
  }
  const correctnessScore =
    testCase.expectedKeywords.length > 0
      ? matchedKeywords / testCase.expectedKeywords.length
      : 1;

  // 5. Escalation Accuracy Score
  const escalationScore = agentResult.escalationRequired === testCase.expectedEscalate ? 1 : 0;
  if (escalationScore === 0) {
    notes.push(`Escalation error: got ${agentResult.escalationRequired}, expected ${testCase.expectedEscalate}`);
  }

  // 6. Tool Execution Score
  let toolExecutionScore = 1;
  if (testCase.expectedEscalate) {
    toolExecutionScore = agentResult.ticketId ? 1 : 0;
    if (toolExecutionScore === 0) {
      notes.push('Ticket creation tool failed to generate ticket ID upon escalation');
    }
  }

  const passedAll =
    intentScore >= 0.5 &&
    retrievalScore >= 0.5 &&
    faithfulnessScore >= 0.8 &&
    correctnessScore >= 0.5 &&
    escalationScore === 1 &&
    toolExecutionScore === 1;

  return {
    caseId: testCase.id,
    name: testCase.name,
    intentScore,
    retrievalScore,
    faithfulnessScore,
    correctnessScore,
    escalationScore,
    toolExecutionScore,
    passedAll,
    notes,
  };
};
