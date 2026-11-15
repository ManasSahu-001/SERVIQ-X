import { z } from 'zod';
import { invokeGroqWithTracing } from '../services/groqService.js';
import { traceable } from '../config/langsmith.js';

/**
 * Zod Schema for Structured LLM-as-a-Judge Evaluation
 */
export const JudgeOutputSchema = z.object({
  decision: z.enum(['APPROVE_AI_RESPONSE', 'REQUEST_HUMAN_REVIEW', 'REGENERATE_RESPONSE']),
  faithfulness_score: z.number().min(0).max(1),
  relevance_score: z.number().min(0).max(1),
  completeness_score: z.number().min(0).max(1),
  hallucination_detected: z.boolean(),
  safety_passed: z.boolean(),
  requires_human: z.boolean(),
  reason: z.string(),
  missing_information: z.array(z.string()).default([]),
  suggested_action: z.string().default(''),
});

/**
 * Deterministic Backend Escalation Rules
 *
 * Enforces mandatory human takeover independently of LLM judgment for:
 * 1. Financial transactions (refunds, payment cancellations, charge disputes)
 * 2. Explicit human agent requests
 * 3. Zero supporting company knowledge for domain inquiries
 * 4. Profanity or legal threats
 */
export function evaluateDeterministicRules(query, contextChunks, regenerationCount = 0) {
  const normalizedQuery = query.toLowerCase().trim();

  // Rule 1: Explicit Human Request
  if (/(talk|speak|connect|transfer)\s+(to|with)\s+(a\s+)?(human|person|agent|representative|manager)/i.test(normalizedQuery) ||
      /want\s+(a\s+)?human/i.test(normalizedQuery) ||
      /file\s+a\s+complaint/i.test(normalizedQuery)) {
    return {
      requiresHuman: true,
      reason: 'Customer explicitly requested a human support agent.',
      priority: 'high',
    };
  }

  // Rule 2: Financial Actions (Mandatory Human Approval)
  if (/(process|give|send|issue)\s+(a\s+)?(refund|money back)/i.test(normalizedQuery) ||
      /(cancel|reverse)\s+(my\s+)?(order|payment|transaction|subscription|charge)/i.test(normalizedQuery) ||
      /unauthorized\s+charge/i.test(normalizedQuery) ||
      /payment\s+dispute/i.test(normalizedQuery) ||
      /(payment|money|amount).*(deducted|debited|charged).*(order|confirm)/i.test(normalizedQuery) ||
      /guarantee.*refund/i.test(normalizedQuery) ||
      /refund.*today/i.test(normalizedQuery)) {
    return {
      requiresHuman: true,
      reason: 'Financial operations (refunds, cancellations, payment disputes, unconfirmed transactions) require authorized human agent approval.',
      priority: 'high',
    };
  }

  // Rule 3: Missing Knowledge for Specific Policy Inquiries
  const isPolicyInquiry = /policy|warranty|guarantee|terms|fee|pricing|hours|shipping time|return window/i.test(normalizedQuery);
  if (isPolicyInquiry && (!contextChunks || contextChunks.length === 0)) {
    return {
      requiresHuman: true,
      reason: 'Customer asked for specific company policy details, but no relevant company documentation was found.',
      priority: 'medium',
    };
  }

  // Rule 4: Regeneration Limit Exceeded
  if (regenerationCount >= 2) {
    return {
      requiresHuman: true,
      reason: 'Response failed automated quality checks after maximum regeneration attempts.',
      priority: 'medium',
    };
  }

  return null;
}

/**
 * Executes LLM-as-a-Judge Evaluation using Primary Groq Model.
 * Traced in LangSmith as a quality evaluator run.
 */
export const runJudgeEvaluation = traceable(
  async function evaluate_response_judge({
    customerQuery,
    generatedResponse,
    retrievedChunks = [],
    intent = 'general_support',
    regenerationCount = 0,
  }) {
    // 1. First evaluate deterministic hard rules
    const deterministicCheck = evaluateDeterministicRules(customerQuery, retrievedChunks, regenerationCount);
    if (deterministicCheck) {
      console.log(`[Judge] Deterministic rule triggered: ${deterministicCheck.reason}`);
      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        faithfulness_score: 0.9,
        relevance_score: 0.9,
        completeness_score: 0.8,
        hallucination_detected: false,
        safety_passed: true,
        requires_human: true,
        reason: deterministicCheck.reason,
        missing_information: ['Human verification required'],
        suggested_action: 'Escalate to support ticket for human review.',
      };
    }

    // 2. Build detailed LLM Judge evaluation prompt
    const contextText = retrievedChunks.length > 0
      ? retrievedChunks.map((c, i) => `[Source ${i + 1} - Page ${c.page_number || 1}]:\n${c.content}`).join('\n\n')
      : 'NONE (No company documentation was retrieved for this query).';

    const judgePrompt = `You are a strict, impartial AI Quality and Safety Judge for SERVIQ-X customer support.
Your task is to evaluate whether a generated customer support response is safe, faithful, relevant, and appropriate for automatic delivery to the customer.

--- INPUT INFORMATION ---
Customer Query: "${customerQuery}"
Detected Intent: ${intent}

--- RETRIEVED COMPANY DOCUMENTATION ---
${contextText}

--- PROPOSED AI RESPONSE ---
"${generatedResponse}"
---------------------------

--- EVALUATION CRITERIA ---
1. FAITHFULNESS: Is every fact in the response strictly supported by the retrieved documentation?
2. RELEVANCE: Does the response directly address the customer's exact question?
3. COMPLETENESS: Does the response provide sufficient clarity without omitting vital steps?
4. HALLUCINATION: Does the response invent unverified policies, prices, refund guarantees, or delivery timelines?
5. SAFETY: Does the response make unauthorized commitments (e.g. promising a refund or cancellation) without human approval?
6. CONFIDENCE: Is there adequate evidence to send this answer automatically?

--- DECISION RULES ---
- "APPROVE_AI_RESPONSE": Use ONLY if faithfulness >= 0.8, relevance >= 0.8, hallucination is false, safety is true, and the response does not make unauthorized business commitments.
- "REGENERATE_RESPONSE": Use if the response is poorly structured, partially irrelevant, or incomplete, BUT the retrieved documentation contains sufficient info to fix it. (Regeneration count: ${regenerationCount}).
- "REQUEST_HUMAN_REVIEW": Use if documentation is missing, hallucination is detected, safety checks fail, the query requires human authorization, or regeneration count >= 2.

Output MUST be a single valid JSON object strictly matching this schema:
{
  "decision": "APPROVE_AI_RESPONSE" | "REQUEST_HUMAN_REVIEW" | "REGENERATE_RESPONSE",
  "faithfulness_score": <number between 0.0 and 1.0>,
  "relevance_score": <number between 0.0 and 1.0>,
  "completeness_score": <number between 0.0 and 1.0>,
  "hallucination_detected": <boolean>,
  "safety_passed": <boolean>,
  "requires_human": <boolean>,
  "reason": "<detailed rationale for this verdict>",
  "missing_information": ["<item 1>", "<item 2>"],
  "suggested_action": "<recommended action>"
}

JSON Output:`;

    // 3. Execute via Groq with schema validation
    try {
      const evaluation = await invokeGroqWithTracing(judgePrompt, {
        modelType: 'primary',
        schema: JudgeOutputSchema,
        temperature: 0.1,
      });

      // Post-validation safety enforcement:
      // If hallucination detected or safety failed, force REQUEST_HUMAN_REVIEW
      if (evaluation.hallucination_detected || !evaluation.safety_passed) {
        evaluation.decision = 'REQUEST_HUMAN_REVIEW';
        evaluation.requires_human = true;
      }

      // If regeneration limit reached, force REQUEST_HUMAN_REVIEW
      if (evaluation.decision === 'REGENERATE_RESPONSE' && regenerationCount >= 2) {
        evaluation.decision = 'REQUEST_HUMAN_REVIEW';
        evaluation.requires_human = true;
        evaluation.reason = 'Exceeded maximum regeneration limit without passing judge criteria.';
      }

      console.log(`[Judge Verdict] Decision: ${evaluation.decision} | Faithfulness: ${evaluation.faithfulness_score} | Relevance: ${evaluation.relevance_score}`);
      return evaluation;
    } catch (err) {
      console.warn(`[Judge Fallback] Evaluation error: ${err.message}. Defaulting to safe human review.`);
      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        faithfulness_score: 0.5,
        relevance_score: 0.5,
        completeness_score: 0.5,
        hallucination_detected: false,
        safety_passed: true,
        requires_human: true,
        reason: `Automated judge encountered processing error: ${err.message}`,
        missing_information: ['Human verification needed due to evaluation error'],
        suggested_action: 'Escalate to human agent.',
      };
    }
  },
  {
    name: 'LLM-as-a-Judge Evaluation',
    run_type: 'chain',
    metadata: {
      evaluator: 'groq-judge',
    },
  }
);
