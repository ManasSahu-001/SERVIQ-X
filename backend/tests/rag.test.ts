import { describe, it, expect } from 'vitest';
import { cleanText } from '../src/rag/pdfParser.js';
import { chunkDocument } from '../src/rag/chunker.js';
import { defaultEmbeddingProvider } from '../src/rag/embeddings.js';
import { retrieveKnowledge } from '../src/rag/retriever.js';
import { DEMO_COMPANY_ID } from '../src/services/store.js';

describe('RAG Pipeline & Embeddings', () => {
  it('cleans control characters and normalizes text properly', () => {
    const raw = 'Hello \x00world!\r\n\r\n\r\nThis   is a    test.\x08';
    const cleaned = cleanText(raw);
    expect(cleaned).toBe('Hello world!\n\nThis is a test.');
  });

  it('chunks documents with character bounds and metadata', () => {
    const pages = [
      {
        pageNumber: 1,
        text: 'Paragraph one explaining cancellation. Paragraph two explaining 30-day money back guarantee.',
      },
    ];

    const chunks = chunkDocument(pages, { chunkSize: 50, chunkOverlap: 10 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].content.length).toBeGreaterThan(0);
  });

  it('generates normalized 1536-dimensional embeddings', async () => {
    const vector = await defaultEmbeddingProvider.generateEmbedding('Return policy test');
    expect(vector.length).toBe(1536);

    // Test norm ≈ 1
    let norm = 0;
    for (const v of vector) norm += v * v;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 2);
  });

  it('retrieves relevant knowledge chunks with similarity score and citations', async () => {
    const result = await retrieveKnowledge({
      companyId: DEMO_COMPANY_ID,
      query: 'When will I get my refund for returned items?',
      topK: 3,
    });

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.formattedContext).toContain('Refund');
    expect(result.chunks[0].similarity).toBeGreaterThan(0.2);
  });
});
