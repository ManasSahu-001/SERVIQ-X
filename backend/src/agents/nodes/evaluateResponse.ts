import { z } from 'zod';
import { AgentState } from '../state.js';
import { executeGroqChat } from '../../config/groq.js';
import { logger } from '../../config/logger.js';

const evaluationSchema = z.object({
  isFaithful: z.boolean(),
  confidence: z.number().min(0).max(1),
  answerCorrectness: z.number().min(0).max(1),
  canResolve: z.boolean(),
  escalate: z.boolean(),
  escalateReason: z.string().optional(),
});

export const evaluateResponseNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { customerMessage, generatedResponse, retrievedChunks, escalationRequired, escalationReason } = state;
  logger.info('Node: evaluateResponse');

  // If intent classification already decided escalation is mandatory (e.g. human requested or payment deducted)
  if (escalationRequired) {
    return {
      evaluationSignals: {
        isFaithful: true,
        confidence: 0.95,
        answerCorrectness: 0.9,
        canResolve: false,
      },
      escalationRequired: true,
      escalationReason: escalationReason || 'Mandatory escalation triggered by intent classification',
    };
  }

  const contextSnippet = retrievedChunks.map((c) => c.content).join('\n').slice(0, 1500);

  const evalPrompt = `You are the SERVIQ-X Quality & Guardrail Evaluator.
Evaluate the AI's proposed response against the Customer's query and the Verified Knowledge Context.

Criteria:
1. isFaithful: Does the response adhere strictly to the context without making up false facts or unsupported guarantees?
2. confidence: Value from 0.0 to 1.0 representing how confident you are that this response safely and accurately addresses the customer.
3. answerCorrectness: Value from 0.0 to 1.0 measuring correctness.
4. canResolve: True if AI can resolve this safely without human intervention.
5. escalate: True if the context was empty/unsupported, if customer is demanding human takeover, or if confidence < 0.7.
6. escalateReason: Explanation if escalate is true.

Respond in JSON matching this schema:
{
  "isFaithful": boolean,
  "confidence": number,
  "answerCorrectness": number,
  "canResolve": boolean,
  "escalate": boolean,
  "escalateReason": string
}`;

  try {
    const rawJson = await executeGroqChat({
      messages: [
        { role: 'system', content: evalPrompt },
        {
          role: 'user',
          content: `Context:\n${contextSnippet || 'No context'}\n\nCustomer Message: "${customerMessage}"\n\nAI Response: "${generatedResponse}"`,
        },
      ],
      temperature: 0.1,
      responseFormatJson: true,
    });

    const parsed = evaluationSchema.parse(JSON.parse(rawJson));

    const needsEscalation = parsed.escalate || !parsed.canResolve || parsed.confidence < 0.65;

    return {
      evaluationSignals: {
        isFaithful: parsed.isFaithful,
        confidence: parsed.confidence,
        answerCorrectness: parsed.answerCorrectness,
        canResolve: !needsEscalation,
      },
      escalationRequired: needsEscalation,
      escalationReason: needsEscalation ? parsed.escalateReason || 'Low confidence or unsupported policy' : undefined,
    };
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Evaluation node fallback used');
    const hasContext = retrievedChunks.length > 0;
    return {
      evaluationSignals: {
        isFaithful: true,
        confidence: hasContext ? 0.88 : 0.45,
        answerCorrectness: hasContext ? 0.85 : 0.5,
        canResolve: hasContext,
      },
      escalationRequired: !hasContext,
      escalationReason: !hasContext ? 'No matching documentation found for customer query' : undefined,
    };
  }
};
