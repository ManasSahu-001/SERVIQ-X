import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { store, DEMO_COMPANY_ID, DEMO_USER_ID } from '../services/store.js';
import { SOCKET_EVENTS } from './events.js';
import { runSupportAgent } from '../agents/graph.js';

let ioInstance: Server | null = null;

export const getSocketServer = (): Server | null => {
  return ioInstance;
};

export const initSocketServer = (server: HttpServer): Server => {
  ioInstance = new Server(server, {
    cors: {
      origin: [env.FRONTEND_URL, env.SOCKET_CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Socket Authentication Middleware
  ioInstance.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers['authorization'] as string)?.split(' ')[1] ||
        socket.handshake.query?.token;

      // Guest / Customer Widget access
      if (!token) {
        (socket as any).isCustomerGuest = true;
        (socket as any).companyId =
          (socket.handshake.headers['x-company-id'] as string) || DEMO_COMPANY_ID;
        return next();
      }

      // Authenticated Agent / Admin
      (socket as any).isCustomerGuest = false;
      (socket as any).userId = DEMO_USER_ID;
      (socket as any).companyId = DEMO_COMPANY_ID;

      next();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Socket authentication failed');
      next(new Error('Socket authentication error'));
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    const socketData = socket as any;
    const companyId = socketData.companyId || DEMO_COMPANY_ID;

    logger.info({ socketId: socket.id, isGuest: socketData.isCustomerGuest }, 'Socket connected');

    // Automatically join company broadcast room
    socket.join(`company:${companyId}`);

    // Join specific conversation room
    socket.on('join:conversation', (conversationId: string) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        logger.debug({ socketId: socket.id, conversationId }, 'Joined conversation room');
      }
    });

    // Customer message event
    socket.on(
      SOCKET_EVENTS.CUSTOMER_MESSAGE,
      async (payload: { conversationId: string; content: string; customerName?: string }) => {
        try {
          const { conversationId, content, customerName } = payload;
          if (!conversationId || !content) return;

          // 1. Persist customer message
          const customerMsg = store.createMessage({
            conversation_id: conversationId,
            sender_type: 'customer',
            content,
            sender_name: customerName || 'Customer',
          });

          // 2. Broadcast to conversation room and company agents
          ioInstance?.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.CUSTOMER_MESSAGE, customerMsg);
          ioInstance?.to(`company:${companyId}`).emit(SOCKET_EVENTS.CUSTOMER_MESSAGE, customerMsg);

          // 3. Check conversation ownership
          const conv = store.getConversationById(companyId, conversationId);
          if (conv && conv.assigned_to === 'ai') {
            ioInstance?.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.AI_STATUS, {
              status: 'thinking',
              conversationId,
            });

            // Trigger LangGraph agent autonomously
            runSupportAgent({
              conversationId,
              companyId,
              customerMessage: content,
            }).catch((err) => {
              logger.error({ error: err.message, conversationId }, 'Background LangGraph agent execution error');
            });
          }
        } catch (err: any) {
          logger.error({ error: err.message }, 'Error processing customer:message socket event');
        }
      }
    );

    // Agent message event
    socket.on(
      SOCKET_EVENTS.AGENT_MESSAGE,
      async (payload: { conversationId: string; content: string; agentName?: string }) => {
        try {
          const { conversationId, content, agentName } = payload;
          if (!conversationId || !content) return;

          const agentMsg = store.createMessage({
            conversation_id: conversationId,
            sender_type: 'agent',
            content,
            sender_name: agentName || 'Support Specialist',
          });

          ioInstance?.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.AGENT_MESSAGE, agentMsg);
        } catch (err: any) {
          logger.error({ error: err.message }, 'Error handling agent:message socket event');
        }
      }
    );

    // Typing indicators
    socket.on(SOCKET_EVENTS.CUSTOMER_TYPING, (payload: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.CUSTOMER_TYPING, payload);
    });

    socket.on(SOCKET_EVENTS.AGENT_TYPING, (payload: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.AGENT_TYPING, payload);
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  return ioInstance;
};
