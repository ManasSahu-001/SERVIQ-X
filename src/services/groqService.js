import { ChatGroq } from '@langchain/groq';
import { traceable } from '../config/langsmith.js';
import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const PRIMARY_GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
export const FAST_GROQ_MODEL = process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';

/**
 * Creates an instance of ChatGroq configured with specified model and options.
 * Traced automatically by LangSmith when LANGSMITH_TRACING=true.
 */
export function getGroqChatModel(options = {}) {
  const modelType = options.modelType || 'primary';
  const modelName = options.model || (modelType === 'fast' ? FAST_GROQ_MODEL : PRIMARY_GROQ_MODEL);
  const temperature = options.temperature ?? (modelType === 'fast' ? 0.1 : 0.2);
  const maxRetries = options.maxRetries ?? 2;

  return new ChatGroq({
    apiKey: GROQ_API_KEY || 'dummy_groq_key',
    model: modelName,
    temperature,
    maxRetries,
    ...options,
  });
}

/**
 * Robustly parses and extracts JSON from LLM output.
 * Handles markdown code blocks, escaped characters, and leading/trailing reasoning text.
 */
export function extractAndParseJSON(text) {
  if (typeof text !== 'string') {
    throw new Error('Expected string input for JSON parsing');
  }

  // 1. Try direct parse
  try {
    return JSON.parse(text.trim());
  } catch (_) {
    // Continue to regex extraction
  }

  // 2. Try markdown code block extraction
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {
      // Continue
    }
  }

  // 3. Try finding first '{' and last '}'
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonSubstring = text.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonSubstring);
    } catch (innerErr) {
      throw new Error(`Malformed JSON in model output: ${innerErr.message}`);
    }
  }

  throw new Error('No valid JSON object structure found in model response');
}

/**
 * Categorizes an error for safe observability without exposing headers or secrets.
 */
function categorizeError(err) {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.statusCode || null;

  if (msg.includes('timed out') || msg.includes('timeout') || err?.name === 'AbortError') {
    return { category: 'TIMEOUT_ERROR', status: status || 408 };
  }
  if (status === 401 || msg.includes('invalid_api_key') || msg.includes('unauthorized')) {
    return { category: 'AUTHENTICATION_ERROR', status: status || 401 };
  }
  if (status === 429 || msg.includes('rate_limit') || msg.includes('too many requests')) {
    return { category: 'RATE_LIMIT_ERROR', status: status || 429 };
  }
  if (msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('connection error') || msg.includes('fetch failed')) {
    return { category: 'NETWORK_CONNECTION_ERROR', status: status || 503 };
  }
  if (msg.includes('json') || msg.includes('schema') || msg.includes('zod')) {
    return { category: 'OUTPUT_VALIDATION_ERROR', status: 422 };
  }
  return { category: 'INTERNAL_MODEL_ERROR', status: status || 500 };
}

/**
 * Executes a Groq model call with LangSmith tracing, structured output validation,
 * retries with exponential backoff, and 60-second timeout enforcement.
 *
 * Silent mock fallback is removed in production. Live failures report exact diagnostic details.
 */
export const invokeGroqWithTracing = traceable(
  async function groqChatCompletion(prompt, options = {}) {
    const modelType = options.modelType || 'primary';
    const targetModel = options.model || (modelType === 'fast' ? FAST_GROQ_MODEL : PRIMARY_GROQ_MODEL);
    const timeoutMs = options.timeoutMs || 60000; // 60-second timeout per specification
    const schema = options.schema || null;

    // Explicit unit test mock mode only
    if (options.mock === true) {
      return simulateGroqResponse(prompt, null, schema, modelType);
    }

    if (!GROQ_API_KEY || GROQ_API_KEY.includes('your_groq_api_key')) {
      throw new Error('GROQ_API_KEY is not configured with a valid key. Production execution halted.');
    }

    const model = getGroqChatModel({
      modelType,
      model: targetModel,
      temperature: options.temperature,
    });

    const maxAttempts = options.maxAttempts || 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const callStart = Date.now();
      console.log(`[Groq Live Call] Attempt ${attempt}/${maxAttempts} Started | Model: ${targetModel} | Timeout: ${timeoutMs}ms`);

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Groq request timed out after ${timeoutMs}ms`)), timeoutMs)
        );

        const invokePromise = model.invoke(prompt);
        const response = await Promise.race([invokePromise, timeoutPromise]);

        const latency = Date.now() - callStart;
        console.log(`[Groq Live Call] Attempt ${attempt} Succeeded in ${latency}ms | Model: ${targetModel} | Status: 200 OK`);

        const rawContent = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        // Track token usage if available in response_metadata
        if (response.response_metadata?.tokenUsage) {
          const usage = response.response_metadata.tokenUsage;
          console.log(`[Groq Usage] Model: ${targetModel} | Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens} | Total: ${usage.totalTokens}`);
        }

        // If schema is provided, parse and validate with Zod
        if (schema) {
          const parsed = extractAndParseJSON(rawContent);
          const validated = schema.parse(parsed);
          return validated;
        }

        return rawContent;
      } catch (err) {
        const latency = Date.now() - callStart;
        lastError = err;
        const errInfo = categorizeError(err);
        const sanitizedErr = err.message.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]');

        console.error(`[Groq Live Call] Attempt ${attempt}/${maxAttempts} Failed after ${latency}ms | Category: ${errInfo.category} | HTTP: ${errInfo.status} | Notice: ${sanitizedErr}`);

        if (attempt < maxAttempts) {
          const backoffMs = 1500 * attempt;
          console.log(`[Groq Live Call] Retrying in ${backoffMs}ms...`);
          await new Promise((res) => setTimeout(res, backoffMs));
        }
      }
    }

    // Fail honestly in production: Never silently mask with simulated success
    const errInfo = categorizeError(lastError);
    const sanitizedFinalErr = lastError.message.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]');
    throw new Error(`Groq API invocation failed permanently after ${maxAttempts} attempts [${errInfo.category}]: ${sanitizedFinalErr}`);
  },
  {
    name: 'Groq Chat Completion',
    run_type: 'llm',
    metadata: {
      provider: 'groq',
      primary_model: PRIMARY_GROQ_MODEL,
      fast_model: FAST_GROQ_MODEL,
    },
  }
);

export const invokeGroqFastWithTracing = (prompt, options = {}) =>
  invokeGroqWithTracing(prompt, { ...options, modelType: 'fast' });

/**
 * Deterministic fallback generator strictly reserved for isolated unit tests.
 * Only invoked when options.mock === true is explicitly requested.
 */
export function simulateGroqResponse(prompt, errorNotice = null, schema = null, modelType = 'primary') {
  const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

  // If Judge evaluation requested
  if (schema && /LLM-as-a-Judge|judge|evaluate/i.test(promptText)) {
    // Only actual financial demands trigger human review in unit test mock
    const isActualRefundDemand = /(process|issue|send|give)\s+(a\s+)?refund|cancel\s+(my\s+)?order/i.test(promptText);
    const hasContext = !/No specific company documentation found|No relevant|NONE \(No company documentation/i.test(promptText);

    if (isActualRefundDemand) {
      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        faithfulness_score: 0.95,
        relevance_score: 0.95,
        completeness_score: 0.85,
        hallucination_detected: false,
        safety_passed: true,
        requires_human: true,
        reason: 'Refund and payment cancellation requests require authorized human agent verification.',
        missing_information: ['Human authorization', 'Transaction verification'],
        suggested_action: 'Escalate to support team with High priority.',
      };
    }

    if (!hasContext) {
      return {
        decision: 'REQUEST_HUMAN_REVIEW',
        faithfulness_score: 0.3,
        relevance_score: 0.8,
        completeness_score: 0.4,
        hallucination_detected: false,
        safety_passed: true,
        requires_human: true,
        reason: 'No company documentation exists for this specific question.',
        missing_information: ['Company documentation for topic'],
        suggested_action: 'Forward to human support agent.',
      };
    }

    return {
      decision: 'APPROVE_AI_RESPONSE',
      faithfulness_score: 0.95,
      relevance_score: 0.95,
      completeness_score: 0.9,
      hallucination_detected: false,
      safety_passed: true,
      requires_human: false,
      reason: 'Response is fully grounded in retrieved knowledge base and answers the customer question.',
      missing_information: [],
      suggested_action: 'Deliver AI response to customer.',
    };
  }

  // If Intent classification
  if (/classify/i.test(promptText)) {
    if (/refund|return|money back|item back/i.test(promptText)) return 'returns_and_refunds';
    if (/payment|charge|invoice|bill|deduct/i.test(promptText)) return 'billing';
    if (/error|crash|bug|api|down|broken|login/i.test(promptText)) return 'technical_issue';
    return 'general_support';
  }

  // If Query rewriting
  if (/rewrite/i.test(promptText)) {
    return 'customer inquiry policy details';
  }

  // If Summary generation
  if (/summary/i.test(promptText)) {
    return 'Customer requested support assistance. Knowledge retrieved and analyzed.';
  }

  return 'Thank you for reaching out. Based on our policy, items can be returned within 30 days for a full refund.';
}
