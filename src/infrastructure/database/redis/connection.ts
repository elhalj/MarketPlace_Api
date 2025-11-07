import Redis from 'ioredis';
import { databaseConfig } from '../../config/database';

let client: Redis | null = null;

export async function connectToRedis(): Promise<void> {
  try {
    client = new Redis(databaseConfig.redis);

    // Test connection
    await client.ping();
    console.log('Successfully connected to Redis');
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
}

export async function disconnectFromRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    console.log('Disconnected from Redis');
  }
}

export function getRedisClient(): Redis {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectToRedis() first.');
  }
  return client;
}

// Handle Redis errors
process.on('SIGINT', async () => {
  await disconnectFromRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromRedis();
  process.exit(0);
});