import { retrieveKnowledge, RetrievalResult } from '../../rag/retriever.js';
import { logger } from '../../config/logger.js';
import { logTraceEvent } from '../../config/langsmith.js';

export const executeKnowledgeSearch = async (
  companyId: string,
  query: string,
  topK = 4
): Promise<RetrievalResult> => {
  const startTime = Date.now();
  logger.info({ companyId, query, topK }, 'Executing Knowledge Search tool');

  const result = await retrieveKnowledge({
    companyId,
    query,
    topK,
  });

  const latencyMs = Date.now() - startTime;
  await logTraceEvent('knowledge:retrieval', {
    companyId,
    latencyMs,
    data: {
      query,
      chunkCount: result.chunks.length,
      sources: result.sources,
    },
  });

  return result;
};
