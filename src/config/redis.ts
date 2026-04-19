import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis({
    host: env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 3,
})

// Generic cache helper
export const withCache = async <T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
): Promise<T> => {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached)
    
    const data = await fetcher()
    await redis.setex(key, ttlSeconds, JSON.stringify(data))
    return data
}