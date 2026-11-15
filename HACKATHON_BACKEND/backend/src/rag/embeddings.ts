import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { store } from '../services/store.js';

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions: number;

  constructor(dimensions = env.EMBEDDING_DIMENSIONS) {
    this.dimensions = dimensions;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return store.generateSyntheticEmbedding(text, this.dimensions);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((t) => store.generateSyntheticEmbedding(t, this.dimensions));
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(
    apiKey = env.EMBEDDING_API_KEY || '',
    model = env.EMBEDDING_MODEL,
    dimensions = env.EMBEDDING_DIMENSIONS
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = dimensions;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      logger.warn('OpenAI embedding API key missing; falling back to deterministic local embeddings');
      return store.generateSyntheticEmbedding(text, this.dimensions);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI embedding request failed with status ${response.status}`);
      }

      const json = (await response.json()) as any;
      return json.data[0].embedding;
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed to fetch OpenAI embedding; falling back to local provider');
      return store.generateSyntheticEmbedding(text, this.dimensions);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      return texts.map((t) => store.generateSyntheticEmbedding(t, this.dimensions));
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI batch embedding request failed with status ${response.status}`);
      }

      const json = (await response.json()) as any;
      return json.data.map((item: any) => item.embedding);
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed batch embedding; fallback to local');
      return texts.map((t) => store.generateSyntheticEmbedding(t, this.dimensions));
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

export const createEmbeddingProvider = (): EmbeddingProvider => {
  if (env.EMBEDDING_PROVIDER === 'openai' && env.EMBEDDING_API_KEY) {
    return new OpenAIEmbeddingProvider();
  }
  return new MockEmbeddingProvider();
};

export const defaultEmbeddingProvider = createEmbeddingProvider();
