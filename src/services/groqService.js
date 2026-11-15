import { ChatGroq } from '@langchain/groq';
import { traceable } from '../config/langsmith.js';
import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Creates an instance of ChatGroq configured with current model and parameters.
 * Automatically traced by LangSmith when LANGSMITH_TRACING=true.
 */
export function getGroqChatModel(options = {}) {
  const modelName = options.model || GROQ_MODEL;
  const temperature = options.temperature ?? 0.2;

  return new ChatGroq({
    apiKey: GROQ_API_KEY || 'dummy_key',
    model: modelName,
    temperature,
    maxRetries: 1,
    ...options,
  });
}

/**
 * Executes a Groq model call with LangSmith tracing and error tracking.
 * @param {Array|string} messages - Input messages or prompt
 * @param {Object} options - Invocation options (runName, tags, metadata)
 * @returns {Promise<string>} - Model generated output
 */
export const invokeGroqWithTracing = traceable(
  async function groqChatCompletion(prompt, options = {}) {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('your_groq_api_key')) {
      console.warn('[Groq] GROQ_API_KEY is missing or unconfigured.');
      return simulateGroqResponse(prompt);
    }

    try {
      const model = getGroqChatModel(options);
      const response = await model.invoke(prompt);
      return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    } catch (err) {
      // Never expose the API key in the error message or logs
      const sanitizedError = err.message.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_GROQ_KEY]');
      console.warn(`[Groq] API call failed (${sanitizedError}). Using resilient fallback.`);
      
      // If Groq key is invalid/expired during demo or test, record the error and provide fallback
      return simulateGroqResponse(prompt, sanitizedError);
    }
  },
  {
    name: 'Groq Chat Completion',
    run_type: 'llm',
    metadata: {
      provider: 'groq',
      model: GROQ_MODEL,
    },
  }
);

/**
 * Fallback synthesizer for development/testing when Groq API key is invalid or rate limited.
 */
function simulateGroqResponse(prompt, errorNotice = null) {
  const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

  if (/classify/i.test(promptText)) {
    if (/refund|return|money back/i.test(promptText)) return 'returns_and_refunds';
    if (/payment|charge|invoice|bill/i.test(promptText)) return 'billing';
    if (/error|crash|bug|api|down/i.test(promptText)) return 'technical_issue';
    return 'general_support';
  }

  return `[SERVIQ-X AI Response via Groq (${GROQ_MODEL})]\nThank you for reaching out to customer support. Based on your inquiry and our company policy, we are processing your request. ${errorNotice ? `(Notice: ${errorNotice})` : ''}`;
}
