import http from 'http';
import { createApp } from './app.js';
import { initSocketServer } from './sockets/socket.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const startServer = () => {
  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO real-time server
  const io = initSocketServer(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 SERVIQ-X Backend running on http://localhost:${env.PORT}`);
    logger.info(`⚡ Socket.IO real-time engine ready on port ${env.PORT}`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    io.close(() => {
      logger.info('Socket.IO connections closed');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    // Force exit after 10s if connections refuse to terminate
    setTimeout(() => {
      logger.error('Forced shutdown timeout exceeded');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
