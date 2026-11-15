import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import dotenv from 'dotenv';
dotenv.config();

/**
 * LangSmith Observability Configuration for SERVIQ-X
 *
 * Reads:
 * - LANGSMITH_TRACING (true/false)
 * - LANGSMITH_API_KEY (LangSmith personal/service access token)
 * - LANGSMITH_PROJECT (Target project name in LangSmith, defaults to SERVIQ-X)
 * - LANGSMITH_ENDPOINT (API endpoint, defaults to https://api.smith.langchain.com)
 */

const isTracingEnabled = process.env.LANGSMITH_TRACING === 'true';
const apiKey = process.env.LANGSMITH_API_KEY;
const project = process.env.LANGSMITH_PROJECT || 'SERVIQ-X';
const endpoint = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';

// Configure environment variables for LangChain / LangGraph automatic tracing
if (isTracingEnabled && apiKey) {
  process.env.LANGCHAIN_TRACING_V2 = 'true';
  process.env.LANGCHAIN_API_KEY = apiKey;
  process.env.LANGCHAIN_PROJECT = project;
  process.env.LANGCHAIN_ENDPOINT = endpoint;

  // Masked logging for security (NEVER log the raw API key)
  const maskedKey = apiKey.length > 10
    ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
    : '***';
  console.log(`[LangSmith] Tracing ENABLED for project "${project}" at endpoint ${endpoint} (Key: ${maskedKey})`);
} else {
  console.log('[LangSmith] Tracing is currently DISABLED or LANGSMITH_API_KEY is not set');
}

// Export singleton LangSmith Client
export const langsmithClient = apiKey
  ? new Client({ apiKey, apiUrl: endpoint })
  : null;

export { traceable, isTracingEnabled, project, endpoint };
