import { runSupportAgent } from '../agents/graph.js';
import { executeGroqChat } from '../config/groq.js';
import { retrieveKnowledge } from '../rag/retriever.js';
import { store } from './store.js';
import { NotFoundError } from '../utils/errors.js';

export const agentService = {
  async respond(companyId: string, conversationId: string, message: string) {
    const finalState = await runSupportAgent({
      companyId,
      conversationId,
      customerMessage: message,
    });

    return {
      response: finalState.generatedResponse,
      intent: finalState.intent,
      priority: finalState.priority,
      category: finalState.category,
      escalated: finalState.escalationRequired,
      escalationReason: finalState.escalationReason,
      ticketId: finalState.ticketId,
      sources: finalState.sources,
      confidence: finalState.evaluationSignals.confidence,
    };
  },

  async suggestReply(companyId: string, conversationId: string) {
    const conv = store.getConversationById(companyId, conversationId);
    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = store.getMessagesByConversation(conversationId);
    const lastCustomerMsg = [...messages].reverse().find((m) => m.sender_type === 'customer')?.content || conv.last_message || 'Inquiry';

    const retrieval = await retrieveKnowledge({
      companyId,
      query: lastCustomerMsg,
      topK: 3,
    });

    const prompt = `You are the SERVIQ-X Agent Copilot.
Provide a high-quality, professional suggested reply for the human support agent to review.
Customer query: "${lastCustomerMsg}"
Knowledge context:
${retrieval.formattedContext}`;

    const text = await executeGroqChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxTokens: 400,
    });

    const suggestion = {
      text,
      sources: retrieval.sources.length > 0 ? retrieval.sources : ['Internal Support Documentation'],
      confidence: retrieval.chunks.length > 0 ? 94 : 70,
    };

    store.updateConversation(companyId, conversationId, {
      suggested_reply: suggestion,
    });

    return suggestion;
  },

  async summarizeConversation(companyId: string, conversationId: string) {
    const conv = store.getConversationById(companyId, conversationId);
    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = store.getMessagesByConversation(conversationId);
    const historyText = messages.map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`).join('\n');

    const summary = await executeGroqChat({
      messages: [
        {
          role: 'system',
          content: 'Summarize the customer support interaction in 2 crisp sentences including issue and current status.',
        },
        {
          role: 'user',
          content: historyText || `Customer subject: ${conv.subject}`,
        },
      ],
      temperature: 0.1,
    });

    return {
      summary: summary.trim(),
      conversationId,
    };
  },
};
