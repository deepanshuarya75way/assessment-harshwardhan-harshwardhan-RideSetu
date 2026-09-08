import { NextResponse } from 'next/server';

export interface ApiSuccessPayload<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Strips MongoDB connection strings, file system paths, and internal credentials from error messages.
 */
export function sanitizeErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'An unexpected error occurred. Please try again.';

  let sanitized = rawMessage
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[DATABASE_URI_REDACTED]')
    .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[JWT_REDACTED]')
    .replace(/rzp_(test|live)_[a-zA-Z0-9]+/gi, '[PAYMENT_KEY_REDACTED]')
    .replace(/[A-Fa-f0-9]{64}/g, '[SECRET_KEY_REDACTED]')
    .replace(/[a-zA-Z]:\\[^\n\r]+(\.ts|\.js|\.json)/gi, '[PATH_REDACTED]');

  return sanitized;
}

/**
 * Standardized Success Response Factory
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiSuccessPayload<T>> {
  const payload: ApiSuccessPayload<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };

  return NextResponse.json(payload, {
    status,
    headers: headers ? new Headers(headers) : undefined,
  });
}

/**
 * Standardized Error Response Factory
 */
export function errorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status: number = 500,
  details?: unknown,
  headers?: Record<string, string>
): NextResponse<ApiErrorPayload> {
  const sanitizedMsg = sanitizeErrorMessage(message);

  const payload: ApiErrorPayload = {
    success: false,
    error: {
      code,
      message: sanitizedMsg,
      ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: headers ? new Headers(headers) : undefined,
  });
}
