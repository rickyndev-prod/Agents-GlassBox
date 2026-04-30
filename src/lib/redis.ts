import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

// Vercel KV typically uses KV_URL, while standard Redis uses REDIS_URL
const redisUrl = process.env.REDIS_URL || process.env.KV_URL || 'redis://localhost:6379';

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl);

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Create a publisher and subscriber instance specifically for Pub/Sub
export const publisher = new Redis(redisUrl);
export const subscriber = new Redis(redisUrl);
