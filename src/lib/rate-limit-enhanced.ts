import { prisma } from './prisma'

export type RateLimitConfig = {
  windowMs: number
  max: number
  skipSuccessfulRequests?: boolean
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }>
{
  const now = new Date()
  
  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } })

    if (!existing || existing.windowExpiresAt <= now) {
      const resetAt = new Date(now.getTime() + config.windowMs)
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, windowExpiresAt: resetAt },
        create: { key, count: 1, windowExpiresAt: resetAt }
      })
      return { allowed: true, remaining: Math.max(0, config.max - 1), resetAt }
    }

    const nextCount = existing.count + 1
    const allowed = nextCount <= config.max
    
    if (allowed) {
      await prisma.rateLimit.update({ 
        where: { key }, 
        data: { count: nextCount } 
      })
    }
    
    return { 
      allowed, 
      remaining: Math.max(0, config.max - nextCount), 
      resetAt: existing.windowExpiresAt 
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Allow request if rate limiting fails
    return { allowed: true, remaining: config.max, resetAt: new Date(now.getTime() + config.windowMs) }
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Login attempts - more lenient
  LOGIN: { windowMs: 15 * 60 * 1000, max: 20 }, // 20 attempts per 15 minutes
  
  // API requests - generous
  API: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
  
  // File uploads
  UPLOAD: { windowMs: 60 * 60 * 1000, max: 50 }, // 50 uploads per hour
  
  // General requests
  GENERAL: { windowMs: 15 * 60 * 1000, max: 500 } // 500 requests per 15 minutes
}
