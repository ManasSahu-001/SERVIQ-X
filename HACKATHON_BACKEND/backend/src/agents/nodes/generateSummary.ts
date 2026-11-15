import { AgentState } from '../state.js';
import { executeGroqChat } from '../../config/groq.js';
import { logger } from '../../config/logger.js';
import { store } from '../../services/store.js';

export const generateSummaryNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { conversationId, companyId, conversationHistory, customerMessage, intent } = state;
  logger.info({ conversationId }, 'Node: generateSummary');

  const historyText = conversationHistory
    .map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`)
    .join('\n');

  try {
    const summary = await executeGroqChat({
      messages: [
        {
          role: 'system',
          content:
            'You are an AI support supervisor. Provide a brief 1-2 sentence executive summary of the conversation issue and current resolution status.',
        },
        {
          role: 'user',
          content: `History:\n${historyText}\n\nLatest message: "${customerMessage}"\nIntent: ${intent}`,
        },
      ],
      temperature: 0.1,
      maxTokens: 100,
    });

    store.updateConversation(companyId, conversationId, {
      subject: summary.trim().slice(0, 100),
    });

    return {
      summary: summary.trim(),
    };
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Failed to generate summary');
    return {
      summary: `Customer inquiry regarding ${intent}.`,
    };
  }
};
