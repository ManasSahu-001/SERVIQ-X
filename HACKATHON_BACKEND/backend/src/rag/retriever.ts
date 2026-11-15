import { defaultEmbeddingProvider } from './embeddings.js';
import { searchVectorChunks, VectorSearchResult } from './vectorSearch.js';
import { store } from '../services/store.js';
import { logger } from '../config/logger.js';

export interface RetrievalResult {
  chunks: VectorSearchResult[];
  formattedContext: string;
  sources: string[];
}

export interface RetrieveOptions {
  companyId: string;
  query: string;
  topK?: number;
  threshold?: number;
}

export const retrieveKnowledge = async (options: RetrieveOptions): Promise<RetrievalResult> => {
  const { companyId, query, topK = 4, threshold = 0.15 } = options;

  try {
    const queryEmbedding = await defaultEmbeddingProvider.generateEmbedding(query);
    const chunks = await searchVectorChunks({
      companyId,
      queryEmbedding,
      topK,
      threshold,
    });

    const sourcesSet = new Set<string>();
    const contextBlocks: string[] = [];

    for (const chunk of chunks) {
      const doc = store.getDocumentById(companyId, chunk.document_id);
      const docName = doc?.filename || `Document-${chunk.document_id.slice(0, 8)}`;
      const sourceLabel = `${docName} (Page ${chunk.page_number})`;
      sourcesSet.add(sourceLabel);

      contextBlocks.push(
        `--- BEGIN EXCERPT [${sourceLabel}] ---\n${chunk.content}\n--- END EXCERPT ---`
      );
    }

    const formattedContext =
      contextBlocks.length > 0
        ? contextBlocks.join('\n\n')
        : 'No specific company documentation excerpts matched the query.';

    return {
      chunks,
      formattedContext,
      sources: Array.from(sourcesSet),
    };
  } catch (err: any) {
    logger.error({ error: err.message, query, companyId }, 'Knowledge retrieval failed');
    return {
      chunks: [],
      formattedContext: 'Documentation retrieval encountered an unexpected error.',
      sources: [],
    };
  }
};
