import { z } from 'zod';
import { AgentState } from '../state.js';
import { executeGroqChat } from '../../config/groq.js';
import { logger } from '../../config/logger.js';
import { Priority, TicketCategory } from '../../types/index.js';

const intentOutputSchema = z.object({
  intent: z.string(),
  category: z.enum([
    'Billing',
    'Payment',
    'Refund',
    'Shipping',
    'Technical Support',
    'Product Inquiry',
    'General',
  ]),
  priority: z.enum(['P1', 'P2', 'P3']),
  escalationRequired: z.boolean(),
  escalationReason: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const classifyIntentNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { customerMessage, conversationHistory } = state;
  logger.info({ messagePreview: customerMessage.slice(0, 50) }, 'Node: classifyIntent');

  const historyContext = conversationHistory
    .slice(-4)
    .map((m) => `${m.sender_type.toUpperCase()}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are the Intent Classification engine for SERVIQ-X customer support.
Analyze the customer's message and recent conversation history to determine:
1. Intent: Concise identifier (e.g., payment_failure, refund_request, shipping_inquiry, human_takeover_request, angry_complaint, general).
2. Category: One of ["Billing", "Payment", "Refund", "Shipping", "Technical Support", "Product Inquiry", "General"].
3. Priority:
   - "P1": Critical issues like unauthorized deduction, order not placed after payment, severe system breakdown, or furious customer.
   - "P2": High priority like refund processing issues or explicit request for a human agent.
   - "P3": Normal routine queries like policy questions, product details, or FAQs.
4. EscalationRequired: boolean. True if the user explicitly demands a human agent, if money was deducted without an order, or if customer is highly angry.
5. EscalationReason: Brief justification if escalationRequired is true.
6. Confidence: Float from 0.0 to 1.0.

Respond strictly in valid JSON format matching this schema:
{
  "intent": "string",
  "category": "Billing" | "Payment" | "Refund" | "Shipping" | "Technical Support" | "Product Inquiry" | "General",
  "priority": "P1" | "P2" | "P3",
  "escalationRequired": boolean,
  "escalationReason": "string",
  "confidence": number
}`;

  try {
    const rawJson = await executeGroqChat({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Recent Conversation Context:\n${historyContext}\n\nCurrent Customer Message: "${customerMessage}"`,
        },
      ],
      temperature: 0.1,
      responseFormatJson: true,
    });

    const parsed = intentOutputSchema.parse(JSON.parse(rawJson));

    return {
      intent: parsed.intent,
      category: parsed.category as TicketCategory,
      priority: parsed.priority as Priority,
      escalationRequired: parsed.escalationRequired,
      escalationReason: parsed.escalationReason,
    };
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Intent classification fallback triggered');
    const lower = customerMessage.toLowerCase();
    const isP1 = lower.includes('deducted') || lower.includes('payment') || lower.includes('cheat');
    const isHuman = lower.includes('human') || lower.includes('agent');

    return {
      intent: isP1 ? 'payment_issue' : isHuman ? 'human_request' : 'general',
      category: isP1 ? 'Payment' : 'General',
      priority: isP1 ? 'P1' : isHuman ? 'P2' : 'P3',
      escalationRequired: isP1 || isHuman,
      escalationReason: isP1 ? 'Payment deduction flagged' : isHuman ? 'Customer requested human' : undefined,
    };
  }
};
