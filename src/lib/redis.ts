import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Create a publisher and subscriber instance specifically for Pub/Sub
export const publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
