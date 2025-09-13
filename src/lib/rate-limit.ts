import { prisma } from './prisma'

export type RateLimitConfig = {
  windowMs: number
  max: number
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }>
{
  const now = new Date()
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
  await prisma.rateLimit.update({ where: { key }, data: { count: nextCount } })
  return { allowed, remaining: Math.max(0, config.max - nextCount), resetAt: existing.windowExpiresAt }
}


