import { createClient } from 'redis';
import { env } from '../config/index.js';

export const redisClient = createClient({ url: env.REDIS_URL });

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

export const ensureRedisConnected = async (): Promise<void> => {
  if (!redisClient.isOpen) await redisClient.connect();
};

export const setCache = async <T>(
  key: string,
  value: T,
  expirationInSeconds: number,
): Promise<void> => {
  await ensureRedisConnected();
  await redisClient.set(key, JSON.stringify(value), { EX: expirationInSeconds });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  await ensureRedisConnected();
  const value = await redisClient.get(key);
  return value ? (JSON.parse(value) as T) : null;
};

export const getCacheTtl = async (key: string): Promise<number> => {
  await ensureRedisConnected();
  return redisClient.ttl(key);
};

export const deleteCache = async (key: string): Promise<void> => {
  await ensureRedisConnected();
  await redisClient.del(key);
};
