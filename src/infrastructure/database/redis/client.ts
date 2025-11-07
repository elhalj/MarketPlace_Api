import Redis from 'ioredis';
import { databaseConfig } from '../../config/database';

export class RedisClient {
  private static instance: RedisClient;
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly publisher: Redis;

  private constructor() {
    this.client = new Redis(databaseConfig.redis);
    this.subscriber = new Redis(databaseConfig.redis);
    this.publisher = new Redis(databaseConfig.redis);

    this.setupEventHandlers();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.subscriber.on('connect', () => {
      console.log('Redis subscriber connected');
    });

    this.publisher.on('connect', () => {
      console.log('Redis publisher connected');
    });
  }

  public static async connect(): Promise<void> {
    try {
      const instance = RedisClient.getInstance();
      // Test the connection
      await instance.client.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
}

export const connectToRedis = RedisClient.connect;

  // Cache operations
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  // List operations
  async rpush(key: string, value: string): Promise<void> {
    await this.client.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  // Pub/Sub operations
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch: string, message: string) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // Transaction support
  async multi(): Promise<Redis.ChainableCommander> {
    return this.client.multi();
  }

  // Key expiration
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // Connection management
  async ping(): Promise<string> {
    return this.client.ping();
  }

  async quit(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit()
    ]);
  }

  // Lock mechanism for distributed operations
  async acquireLock(
    lockKey: string,
    lockValue: string,
    ttl: number
  ): Promise<boolean> {
    const acquired = await this.client.set(
      lockKey,
      lockValue,
      'EX',
      ttl,
      'NX'
    );
    return acquired === 'OK';
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }
}

export const redisClient = RedisClient.getInstance();
});

redisClient.on('error', (error) => {
  console.error('Redis connection error:', error);
});
