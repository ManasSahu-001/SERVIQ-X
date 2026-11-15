import { z } from 'zod';
import { invokeGroqWithTracing } from '../services/groqService.js';
import { traceable } from '../config/langsmith.js';

/**
 * Zod Schema for Structured LLM-as-a-Judge Evaluation
 * Explicitly distinguishes REFUSE_RESPONSE from APPROVE_AI_RESPONSE and REQUEST_HUMAN_REVIEW.
 */
export const JudgeOutputSchema = z.object({
  decision: z.enum(['APPROVE_AI_RESPONSE', 'REFUSE_RESPONSE', 'REQUEST_HUMAN_REVIEW', 'REGENERATE_RESPONSE']),
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
 * Deterministic Backend Escalation & Refusal Rules
 *
 * 1. Confidential PII / Executive Privacy -> REFUSE_RESPONSE (Safe refusal without escalation)
 * 2. Explicit human agent requests -> REQUEST_HUMAN_REVIEW
 * 3. Operational financial actions (refunds, cancellations, payment disputes) -> REQUEST_HUMAN_REVIEW
 * 4. Specific policy inquiries where zero company documentation is found -> REQUEST_HUMAN_REVIEW
 * 5. Maximum regeneration limit exceeded -> REQUEST_HUMAN_REVIEW
 */
export function evaluateDeterministicRules(query, contextChunks, regenerationCount = 0) {
  const normalizedQuery = (query || '').toLowerCase().trim();

  // Rule 0: Confidential PII & Executive Privacy (Mandatory Explicit Refusal)
  if (
    /(ceo|executive|founder|boss|employee|manager|staff)\s*('s)?\s*(personal|private|direct|home|cell|mobile)?\s*(phone|number|contact|address|email|whatsapp)/i.test(normalizedQuery) ||
    /(personal|private)\s+(phone|number|cell|mobile|address)\s+of/i.test(normalizedQuery) ||
    /(what\s+is|give|share|tell)\s+(me\s+)?(the\s+)?(ceo|executive|founder)\s*('s)?\s*(personal|private)?\s*(phone|number|contact)/i.test(normalizedQuery)
  ) {
    return {
      decision: 'REFUSE_RESPONSE',
      requiresHuman: false,
      reason: 'Request asks for confidential personal contact information of company executives/employees.',
      suggestedRefusal: "I cannot provide personal contact details or private employee information. For official corporate communications, please reach out through our public support channels.",
    };
  }

  // Rule 1: Explicit Human Request
  if (
    /(talk|speak|connect|transfer)\s+(to|with)\s+(a\s+)?(human|person|agent|representative|manager)/i.test(normalizedQuery) ||
    /want\s+(a\s+)?(human|person|agent|representative)/i.test(normalizedQuery) ||
    /speak\s+with\s+(a\s+)?human/i.test(normalizedQuery) ||
    /file\s+a\s+complaint/i.test(normalizedQuery)
  ) {
    return {
      decision: 'REQUEST_HUMAN_REVIEW',
      requiresHuman: true,
      reason: 'Customer explicitly requested a human support agent.',
      priority: 'high',
    };
  }

  // Rule 2: Transactional Financial Operations, Disputes & Demands
  const isInformationalOnly = /^(what|how|can you tell me|do you have|explain|where)\b/i.test(normalizedQuery) &&
    /policy|rules|process|window|terms/i.test(normalizedQuery) &&
    !/(deducted|debited|unconfirmed|guarantee|today|now|immediately)/i.test(normalizedQuery);

  if (!isInformationalOnly) {
    if (
      /(process|issue|send|give|initiate)\s+(a\s+|my\s+)?(refund|money back)/i.test(normalizedQuery) ||
      /(cancel|reverse)\s+(my\s+)?(order|payment|transaction|subscription|charge)/i.test(normalizedQuery) ||
      /unauthorized\s+charge/i.test(normalizedQuery) ||
      /payment\s+dispute|dispute\s+(a\s+)?charge/i.test(normalizedQuery) ||
      /(payment|money|amount).*(deducted|debited|charged).*(order|confirm)/i.test(normalizedQuery) ||
      /guarantee.*refund/i.test(normalizedQuery) ||
      /refund.*(today|now|immediately)/i.test(normalizedQuery)
    ) {
      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        requiresHuman: true,
        reason: 'Financial operations (refund requests, payment disputes, cancellations, unconfirmed transactions) require authorized human agent approval.',
        priority: 'high',
      };
    }
  }

  // Rule 3: Missing Knowledge for Specific Policy Inquiries
  const isPolicyInquiry = /policy|warranty|guarantee|terms|fee|pricing|shipping time|return window/i.test(normalizedQuery);
  if (isPolicyInquiry && (!contextChunks || contextChunks.length === 0)) {
    return {
      decision: 'REQUEST_HUMAN_REVIEW',
      requiresHuman: true,
      reason: 'Customer asked for specific company policy details, but no relevant company documentation was found in the knowledge base.',
      priority: 'medium',
    };
  }

  // Rule 4: Regeneration Limit Exceeded
  if (regenerationCount >= 2) {
    return {
      decision: 'REQUEST_HUMAN_REVIEW',
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
 *
 * If the judge service fails, fails safely into human escalation with null evaluation scores.
 */
export const runJudgeEvaluation = traceable(
  async function evaluate_response_judge({
    customerQuery,
    generatedResponse,
    retrievedChunks = [],
    intent = 'general_support',
    regenerationCount = 0,
    options = {},
  }) {
    // 1. Evaluate deterministic hard rules first
    const deterministicCheck = evaluateDeterministicRules(customerQuery, retrievedChunks, regenerationCount);
    if (deterministicCheck) {
      console.log(`[Judge] Deterministic rule triggered: ${deterministicCheck.reason}`);
      
      if (deterministicCheck.decision === 'REFUSE_RESPONSE') {
        return {
          decision: 'REFUSE_RESPONSE',
          faithfulness_score: 1.0,
          relevance_score: 1.0,
          completeness_score: 1.0,
          hallucination_detected: false,
          safety_passed: false, // Explicitly marked false: Refusal is never treated as approval of unsafe content
          requires_human: false,
          reason: deterministicCheck.reason,
          missing_information: [],
          suggested_action: 'Deliver safe refusal notice to customer without human escalation.',
          refusal_message: deterministicCheck.suggestedRefusal,
        };
      }

      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        faithfulness_score: 1.0,
        relevance_score: 1.0,
        completeness_score: 1.0,
        hallucination_detected: false,
        safety_passed: true,
        requires_human: true,
        reason: deterministicCheck.reason,
        missing_information: ['Human verification required by policy'],
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
5. SAFETY: Does the response protect confidential information and avoid unauthorized commitments?
6. CONFIDENCE: Is there adequate evidence to send this answer automatically?

--- DECISION RULES ---
- "APPROVE_AI_RESPONSE": Use when the answer is fully grounded in the documentation, relevant, safe, free of hallucination, and makes no unauthorized promises. (Example: Informational return policy explanations supported by docs).
- "REFUSE_RESPONSE": Use when the query requests private/confidential personal information (e.g. CEO phone numbers, employee personal details, passwords), probes restricted safety boundaries, or violates privacy policies. Must be explicitly flagged as REFUSE_RESPONSE and NEVER approved as safe content.
- "REGENERATE_RESPONSE": Use if the response is poorly phrased or incomplete, BUT the retrieved documentation contains sufficient info to fix it. (Current regeneration count: ${regenerationCount}).
- "REQUEST_HUMAN_REVIEW": Use if documentation is missing, hallucination is detected, safety checks fail, or the customer demands an actual financial transaction, refund execution, or payment cancellation.

Output MUST be a single valid JSON object strictly matching this schema:
{
  "decision": "APPROVE_AI_RESPONSE" | "REFUSE_RESPONSE" | "REQUEST_HUMAN_REVIEW" | "REGENERATE_RESPONSE",
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
        mock: options.mock === true,
      });

      // Post-validation safety enforcement:
      if (evaluation.decision !== 'REFUSE_RESPONSE') {
        if (evaluation.hallucination_detected || !evaluation.safety_passed) {
          evaluation.decision = 'REQUEST_HUMAN_REVIEW';
          evaluation.requires_human = true;
        }

        if (evaluation.decision === 'REGENERATE_RESPONSE' && regenerationCount >= 2) {
          evaluation.decision = 'REQUEST_HUMAN_REVIEW';
          evaluation.requires_human = true;
          evaluation.reason = 'Exceeded maximum regeneration limit without passing judge criteria.';
        }
      }

      console.log(`[Judge Verdict] Decision: ${evaluation.decision} | Faithfulness: ${evaluation.faithfulness_score} | Relevance: ${evaluation.relevance_score}`);
      return evaluation;
    } catch (err) {
      // Fail safely: Never fabricate evaluation scores.
      console.warn(`[Judge Live Error] ${err.message}. Enforcing safe human review.`);
      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        faithfulness_score: null,
        relevance_score: null,
        completeness_score: null,
        hallucination_detected: null,
        safety_passed: false,
        requires_human: true,
        reason: `Automated judge service unavailable (${err.message}). Defaulted to human review.`,
        missing_information: ['Automated LLM Judge evaluation failed'],
        suggested_action: 'Forward to human agent for manual review.',
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
