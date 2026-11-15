import { AgentState } from '../state.js';
import { executeKnowledgeSearch } from '../tools/knowledgeTool.js';
import { logger } from '../../config/logger.js';

export const retrieveKnowledgeNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { companyId, customerMessage } = state;
  logger.info({ companyId, query: customerMessage.slice(0, 50) }, 'Node: retrieveKnowledge');

  const result = await executeKnowledgeSearch(companyId, customerMessage, 4);

  return {
    retrievedChunks: result.chunks,
    sources: result.sources,
  };
};
