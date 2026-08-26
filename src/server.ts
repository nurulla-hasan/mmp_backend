import { createServer } from 'node:http';
import { app } from './app.js';
import { env } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { ensureRedisConnected, redisClient } from './lib/redis.js';

const server = createServer(app);
let shuttingDown = false;
async function main() {
  try {
    await prisma.$connect();
    await ensureRedisConnected();
    server.listen(env.PORT, env.HOST, () =>
      console.log(`Server started on ${env.HOST}:${env.PORT}`),
    );
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(1), env.SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();
  server.close(() => {
    clearTimeout(forceExit);
    void prisma.$disconnect();
    if (redisClient.isOpen) void redisClient.quit();
  });
  console.log(`Received ${signal}`);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
void main();
