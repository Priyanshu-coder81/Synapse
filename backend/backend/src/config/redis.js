import { Redis } from 'ioredis';
import 'dotenv/config';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn("⚠️ REDIS_URL not found in environment. Real-time scaling may not work correctly.");
}

// Publisher client
export const redisPub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

// Subscriber client (must be a separate connection)
export const redisSub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

redisPub.on('connect', () => console.log('✓ Redis Publisher Connected'));
redisSub.on('connect', () => console.log('✓ Redis Subscriber Connected'));

redisPub.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSub.on('error', (err) => console.error('Redis Subscriber Error:', err));
