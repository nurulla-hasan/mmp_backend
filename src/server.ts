import { createServer } from 'node:http';
import { app } from './app.js';
import { env } from './config/index.js';
import { prisma } from './lib/prisma.js';

const server = createServer(app);
let shuttingDown = false;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    server.listen(env.PORT, env.HOST, () => {
      console.log(`Server started on ${env.HOST}:${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);

  const forceExit = setTimeout(() => process.exit(1), env.SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(() => {
    clearTimeout(forceExit);
    void prisma.$disconnect();
    console.log('Server closed and database disconnected');
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

void main();
