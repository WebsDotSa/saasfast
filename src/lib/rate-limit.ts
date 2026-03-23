import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Rate Limiting System - SaaS Core Platform
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم للحد من الطلبات المتكررة وحماية API من abuse
//
// الاستخدام:
// import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
//
// const { success, remaining, reset } = await checkRateLimit(
//   identifier,
//   rateLimiters.auth
// );
//
// if (!success) {
//   return NextResponse.json(
//     { error: 'Too many requests' },
//     { status: 429, headers: { 'Retry-After': reset.toString() } }
//   );
// }
// ═══════════════════════════════════════════════════════════════════════════════

// Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate Limiters configuration
export const rateLimiters = {
  // 5 محاولات تسجيل دخول كل دقيقة
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'ratelimit:auth',
  }),

  // 100 طلب API كل دقيقة
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api',
  }),

  // 10 دفعات كل ساعة
  payments: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'ratelimit:payments',
  }),

  // 3 محاولات إنشاء tenant كل ساعة
  tenantCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'ratelimit:tenant-create',
  }),

  // 20 طلب للـ webhooks كل دقيقة
  webhooks: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:webhooks',
  }),

  // 10 محاولات استعادة كلمة مرور كل ساعة
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'ratelimit:password-reset',
  }),
};

// Rate limit result type
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp in milliseconds
}

/**
 * Check rate limit for a specific identifier
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // في حالة الخطأ، نسمح بالطلب (fail-open)
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.success ? {} : { 'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString() }),
  };
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message: string = 'Too many requests'
): NextResponse | null {
  if (result.success) {
    return null;
  }

  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: message,
      retryAfter,
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  );
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(request: Request): string {
  // Try to get user ID from headers (set by middleware)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Middleware-style rate limiting
 * يُستخدم في middleware.ts
 */
export async function rateLimitMiddleware(
  request: Request,
  limiter: Ratelimit = rateLimiters.api
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request);
  const result = await checkRateLimit(identifier, limiter);

  return createRateLimitResponse(result);
}

/**
 * API Route rate limiting helper
 * يُستخدم داخل API routes
 */
export async function withRateLimit<T>(
  request: Request,
  limiter: Ratelimit,
  handler: () => Promise<T>,
  errorMessage: string = 'Too many requests'
): Promise<NextResponse | Promise<T>> {
  const identifier = getIdentifier(request);
  const result = await checkRateLimit(identifier, limiter);

  const rateLimitResponse = createRateLimitResponse(result, errorMessage);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return handler();
}
