import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttpModule from 'pino-http';
const pinoHttp = (pinoHttpModule as any).default || pinoHttpModule;
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter, chatRateLimiter } from './middleware/rateLimiter.middleware.js';
import { isSupabaseConfigured } from './config/supabase.js';
import { isGroqConfigured } from './config/groq.js';
import { isLangSmithConfigured } from './config/langsmith.js';
import { sendSuccess } from './utils/response.js';

// Route imports
import companyRoutes from './routes/company.routes.js';
import documentRoutes from './routes/document.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import agentRoutes from './routes/agent.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import userRoutes from './routes/user.routes.js';
import { conversationController } from './controllers/conversation.controller.js';

export const createApp = () => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: [
        env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id'],
    })
  );

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Structured request logging with Pino
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  // Rate Limiting
  app.use('/api', apiRateLimiter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    return sendSuccess(
      res,
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.NODE_ENV,
        services: {
          supabase: isSupabaseConfigured() ? 'connected' : 'in-memory-fallback',
          groq: isGroqConfigured() ? 'live-api' : 'deterministic-local-emulator',
          langsmith: isLangSmithConfigured() ? 'active-tracing' : 'local-observability',
        },
      },
      'SERVIQ-X Backend API is operational'
    );
  });

  // Customer Chat Widget Direct Endpoint
  app.post('/api/chat', chatRateLimiter, conversationController.chat);

  // Mount API modules
  app.use('/api/companies', companyRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/knowledge-base', documentRoutes); // Frontend compatibility alias
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/user', userRoutes);

  // 404 & Central Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
