import { Annotation } from '@langchain/langgraph';
import { VectorSearchResult } from '../rag/vectorSearch.js';
import { Message, Priority, TicketCategory } from '../types/index.js';

export interface EvaluationSignals {
  isFaithful: boolean;
  confidence: number;
  answerCorrectness: number;
  canResolve: boolean;
}

export const AgentStateAnnotation = Annotation.Root({
  conversationId: Annotation<string>(),
  companyId: Annotation<string>(),
  customerMessage: Annotation<string>(),
  conversationHistory: Annotation<Message[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  intent: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => 'general',
  }),
  category: Annotation<TicketCategory>({
    reducer: (_prev, next) => next,
    default: () => 'General',
  }),
  priority: Annotation<Priority>({
    reducer: (_prev, next) => next,
    default: () => 'P3',
  }),
  retrievedChunks: Annotation<VectorSearchResult[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  sources: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  generatedResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  suggestedReply: Annotation<{ text: string; sources: string[]; confidence: number } | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  evaluationSignals: Annotation<EvaluationSignals>({
    reducer: (_prev, next) => next,
    default: () => ({
      isFaithful: true,
      confidence: 0.9,
      answerCorrectness: 0.9,
      canResolve: true,
    }),
  }),
  escalationRequired: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  escalationReason: Annotation<string | undefined>(),
  ticketId: Annotation<string | undefined>(),
  conversationOwner: Annotation<'ai' | 'human'>({
    reducer: (_prev, next) => next,
    default: () => 'ai',
  }),
  conversationStatus: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => 'open',
  }),
  summary: Annotation<string | undefined>(),
  autoSendApproved: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => true,
  }),
  isSent: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
