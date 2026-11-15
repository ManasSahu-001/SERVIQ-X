import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
// If GEMINI_EMBEDDING_MODEL is text-embedding-004 (which returns 404 on v1beta for this key), use gemini-embedding-001
const RAW_MODEL = process.env.GEMINI_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
export const GEMINI_EMBEDDING_MODEL = RAW_MODEL === 'text-embedding-004' ? 'gemini-embedding-001' : RAW_MODEL;
export const EXPECTED_VECTOR_DIMENSION = 768;
export const EMBEDDING_DIMENSION = EXPECTED_VECTOR_DIMENSION;

/**
 * Generates a genuine 768-dimensional embedding from Google Gemini API.
 * Uses gemini-embedding-001 with outputDimensionality: 768 to strictly match pgvector(768).
 *
 * In production mode, failures throw genuine errors. Silent fake vector substitution is removed.
 *
 * @param {string} text - Content to embed
 * @param {object} options - Optional configuration (e.g. { allowMock: false })
 * @returns {Promise<number[]>} - 768-dimensional vector
 */
export async function getGeminiEmbedding(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text must be a non-empty string');
  }

  // Explicit unit test mock bypass if requested
  if (options.mock === true) {
    return generateDeterministic768Vector(text);
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_') || GEMINI_API_KEY.length < 15) {
    throw new Error('GEMINI_API_KEY is not configured with a valid key. Production execution halted.');
  }

  const modelName = options.model || GEMINI_EMBEDDING_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${GEMINI_API_KEY}`;
  
  const startTime = Date.now();
  console.log(`[Gemini Embedding] Request started | Model: ${modelName} | Target Dim: ${EXPECTED_VECTOR_DIMENSION}`);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${modelName}`,
        content: { parts: [{ text }] },
        outputDimensionality: EXPECTED_VECTOR_DIMENSION,
      }),
    });
  } catch (netErr) {
    const latency = Date.now() - startTime;
    console.error(`[Gemini Embedding] Network Error after ${latency}ms: ${netErr.message}`);
    throw new Error(`Gemini Embedding network connection failed: ${netErr.message}`);
  }

  const latency = Date.now() - startTime;

  if (response.ok) {
    const data = await response.json();
    const values = data.embedding?.values;
    if (values && values.length === EXPECTED_VECTOR_DIMENSION) {
      console.log(`[Gemini Embedding] Success in ${latency}ms | Status: 200 OK | Dimensions: ${values.length}`);
      return values;
    }
    throw new Error(`Gemini API returned unexpected embedding dimension: ${values?.length} (expected ${EXPECTED_VECTOR_DIMENSION})`);
  }

  const errorText = await response.text();
  const sanitizedError = errorText.replace(/key=[a-zA-Z0-9_\-\.]+/g, 'key=[REDACTED]');
  console.error(`[Gemini Embedding] HTTP ${response.status} Error after ${latency}ms: ${sanitizedError}`);

  // If text-embedding-004 was requested and failed, attempt immediate auto-fallback to gemini-embedding-001
  if (modelName !== 'gemini-embedding-001') {
    console.log(`[Gemini Embedding] Retrying with compatible model 'gemini-embedding-001'...`);
    return getGeminiEmbedding(text, { ...options, model: 'gemini-embedding-001' });
  }

  throw new Error(`Gemini Embedding API failed with HTTP ${response.status}: ${sanitizedError}`);
}

export const generateEmbedding = getGeminiEmbedding;

/**
 * Deterministic unit vector generator strictly reserved for isolated unit tests.
 * NEVER used as silent production fallback.
 */
export function generateDeterministic768Vector(text) {
  const vector = new Array(EXPECTED_VECTOR_DIMENSION).fill(0);
  const normalizedText = text.toLowerCase().trim();

  // Create distribution using character code hashes
  for (let i = 0; i < normalizedText.length; i++) {
    const code = normalizedText.charCodeAt(i);
    const pos = (code * (i + 1) * 31) % EXPECTED_VECTOR_DIMENSION;
    vector[pos] += (code % 50) / 100;
  }

  // Semantic topic weights for return, payment, technical, and shipping
  if (/return|refund|30[- ]day|money back/i.test(normalizedText)) {
    vector[0] += 0.85;
    vector[1] += 0.45;
  }
  if (/payment|charge|invoice|bill|deduct/i.test(normalizedText)) {
    vector[2] += 0.80;
    vector[3] += 0.50;
  }
  if (/shipping|delivery|tracking|carrier|package/i.test(normalizedText)) {
    vector[4] += 0.75;
    vector[5] += 0.55;
  }
  if (/error|crash|bug|api|login|broken/i.test(normalizedText)) {
    vector[6] += 0.90;
    vector[7] += 0.40;
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < EXPECTED_VECTOR_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < EXPECTED_VECTOR_DIMENSION; i++) {
    vector[i] = parseFloat((vector[i] / norm).toFixed(6));
  }

  return vector;
}
