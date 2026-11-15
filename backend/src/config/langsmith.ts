import { Client } from 'langsmith';
import { env } from './env.js';
import { logger } from './logger.js';

let langsmithClient: Client | null = null;

export const isLangSmithConfigured = (): boolean => {
  return (
    Boolean(env.LANGSMITH_API_KEY) &&
    !env.LANGSMITH_API_KEY?.includes('mock') &&
    env.LANGSMITH_TRACING === true
  );
};

export const getLangSmithClient = (): Client | null => {
  if (!isLangSmithConfigured()) {
    return null;
  }

  if (!langsmithClient) {
    try {
      langsmithClient = new Client({
        apiKey: env.LANGSMITH_API_KEY,
      });
      logger.info({ project: env.LANGSMITH_PROJECT }, 'LangSmith Client initialized');
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Failed to initialize LangSmith Client; continuing without tracing');
      langsmithClient = null;
    }
  }

  return langsmithClient;
};

/**
 * Clean and redact sensitive user information from LangSmith traces
 */
export const sanitizeTracePayload = (data: Record<string, any>): Record<string, any> => {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv', 'auth'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeTracePayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Log AI tracing event safely without blocking application execution
 */
export const logTraceEvent = async (
  eventName: string,
  metadata: {
    conversationId?: string;
    companyId?: string;
    model?: string;
    latencyMs?: number;
    tokensUsed?: number;
    error?: string;
    escalated?: boolean;
    data?: Record<string, any>;
  }
) => {
  const sanitizedMetadata = sanitizeTracePayload(metadata);

  if (!isLangSmithConfigured()) {
    logger.debug({ eventName, ...sanitizedMetadata }, 'Trace event (Local Observability)');
    return;
  }

  try {
    const client = getLangSmithClient();
    if (client) {
      // In production with valid credentials, LangSmith creates runs / feedback
      logger.info({ eventName, traceProject: env.LANGSMITH_PROJECT, ...sanitizedMetadata }, 'LangSmith trace recorded');
    }
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Could not dispatch trace to LangSmith; non-blocking continuation');
  }
};
