import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window tracking store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for expired entries (runs every 60 seconds)
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup > 60000) {
    lastCleanup = now;
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export const RATE_LIMIT_PRESETS = {
  AUTH: { limit: 10, windowMs: 60 * 1000, keyPrefix: 'auth' }, // 10 req/min/ip
  OTP: { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'otp' }, // 5 req/15min
  PAYMENT: { limit: 20, windowMs: 60 * 1000, keyPrefix: 'pay' }, // 20 req/min
  BOOKING: { limit: 20, windowMs: 60 * 1000, keyPrefix: 'book' }, // 20 req/min
  KYC: { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'kyc' }, // 10 req/15min
  DOCUMENT_UPLOAD: { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'doc' }, // 10 req/15min
  REFUND: { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'refund' }, // 10 req/15min
  REVIEW: { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'review' }, // 10 req/15min
  DISPUTE: { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'dispute' }, // 10 req/15min
  DEFAULT: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'default' },
};

/**
 * Extracts client IP safely from headers
 */
export function getClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Checks in-memory rate limiting with automated expired entry cleanup
 */
export function checkRateLimit(
  req: Request | NextRequest,
  options: RateLimitOptions = RATE_LIMIT_PRESETS.DEFAULT,
  identifier?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpired();

  const ip = getClientIp(req);
  const key = `${options.keyPrefix || 'rl'}:${identifier || ip}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetTime: now + options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Standard 429 Rate Limit Response
 */
export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Rate limit exceeded. Please try again later.',
        retryAfterSeconds,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}
