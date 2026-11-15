import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generates a 768-dimensional embedding using Google Gemini text-embedding-004
 * @param {string} text - Content to embed
 * @returns {Promise<number[]>} - 768-dimensional vector
 */
export async function getGeminiEmbedding(text) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found; generating normalized pseudo-vector for local testing.');
    const mock = new Array(768).fill(0);
    for (let i = 0; i < text.length && i < 768; i++) {
      mock[i % 768] += (text.charCodeAt(i) % 100) / 100;
    }
    return mock;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Embedding API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const vector = data.embedding?.values;
  if (!vector || vector.length !== 768) {
    throw new Error(`Expected 768-dimensional vector, received: ${vector?.length || 0}`);
  }

  return vector;
}

/**
 * Generates a support response using Gemini 1.5 Flash
 * @param {string} prompt - Synthesized support prompt with retrieved context
 * @returns {Promise<string>} - Model generated response
 */
export async function generateGeminiResponse(prompt) {
  if (!GEMINI_API_KEY) {
    return 'Thank you for contacting support. Our AI agent is currently operating in offline mode.';
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Generation API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}
