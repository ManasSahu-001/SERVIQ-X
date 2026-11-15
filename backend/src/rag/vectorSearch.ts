import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { store } from '../services/store.js';
import { logger } from '../config/logger.js';
import { DocumentChunk } from '../types/index.js';

export interface VectorSearchParams {
  companyId: string;
  queryEmbedding: number[];
  threshold?: number;
  topK?: number;
}

export interface VectorSearchResult extends DocumentChunk {
  similarity: number;
}

export const searchVectorChunks = async (
  params: VectorSearchParams
): Promise<VectorSearchResult[]> => {
  const { companyId, queryEmbedding, threshold = 0.15, topK = 4 } = params;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: topK,
        filter_company_id: companyId,
      });

      if (error) {
        logger.error({ error: error.message }, 'Supabase pgvector RPC search returned error; falling back to store');
      } else if (data) {
        return data.map((item: any) => ({
          id: item.id,
          company_id: item.company_id,
          document_id: item.document_id,
          content: item.content,
          page_number: item.page_number,
          chunk_index: item.chunk_index || 0,
          similarity: item.similarity,
          created_at: item.created_at || new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed during Supabase vector search; fallback to memory store');
    }
  }

  // Fallback to store vector search
  const results = store.searchChunks(companyId, queryEmbedding, threshold, topK);
  return results.map((r) => ({
    id: r.id,
    company_id: r.company_id,
    document_id: r.document_id,
    content: r.content,
    page_number: r.page_number,
    chunk_index: r.chunk_index,
    similarity: r.similarity,
    created_at: r.created_at,
  }));
};
