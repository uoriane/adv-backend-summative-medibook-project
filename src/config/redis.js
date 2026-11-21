const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

async function connectRedis() {
  if (redis.status === 'wait') await redis.connect();
  return redis;
}

module.exports = { redis, connectRedis };
