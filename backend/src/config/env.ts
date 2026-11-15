import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Supabase
  SUPABASE_URL: z.string().url().default('https://mock-supabase.example.co'),
  SUPABASE_PUBLISHABLE_KEY: z.string().default('mock-publishable-key'),
  SUPABASE_SECRET_KEY: z.string().default('mock-secret-key'),

  // Groq LLM
  GROQ_API_KEY: z.string().default('mock_groq_api_key'),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),

  // LangSmith Observability
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_TRACING: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  LANGSMITH_PROJECT: z.string().default('SERVIQ-X'),

  // Embeddings
  EMBEDDING_PROVIDER: z.enum(['mock', 'openai', 'local']).default('mock'),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(1536),

  // CORS & Frontend
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Demo / Dev auth bypass for testing without active Supabase live keys
  DEMO_AUTH_ENABLED: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  throw new Error('Environment variable validation failed');
}

export const env = parsed.data;
