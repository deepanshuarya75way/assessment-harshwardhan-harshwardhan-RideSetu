/**
 * RideSetu Production Observability & Event Logging Layer
 * Provides structured telemetry logging with automated secret redaction and correlation IDs.
 */

import crypto from 'crypto';

export type ObservabilityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'OTP_SENT'
  | 'OTP_FAILED'
  | 'BOOKING_CREATED'
  | 'BOOKING_FAILED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_WEBHOOK'
  | 'REFUND_CREATED'
  | 'VENDOR_APPROVED'
  | 'HANDOVER_COMPLETED'
  | 'RETURN_COMPLETED'
  | 'DISPUTE_CREATED'
  | 'LOCATION_UPDATE'
  | 'SOS_TRIGGERED'
  | 'NOTIFICATION_SENT'
  | 'NOTIFICATION_FAILED';

export interface ObservabilityLogEntry {
  requestId: string;
  event: ObservabilityEventType;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'INFO' | 'WARN';
  userId?: string;
  role?: string;
  bookingId?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

/**
 * Sanitizes metadata objects by redacting sensitive security fields.
 */
export function sanitizeObservabilityMetadata(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'otp',
    'otpCode',
    'jwt',
    'token',
    'secret',
    'apiKey',
    'mongoUri',
    'razorpaySecret',
    'bankAccountNumber',
    'panNumber',
    'aadhaarNumber',
    'documentUrl',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObservabilityMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Generates or extracts a request correlation ID.
 */
export function getOrCreateRequestId(headers?: Headers | Record<string, string>): string {
  if (headers) {
    const existing = headers instanceof Headers ? headers.get('x-request-id') : headers['x-request-id'];
    if (existing && existing.length <= 64) {
      return existing;
    }
  }
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Logs structured observability events safely to stdout/server logging stream.
 */
export function logObservabilityEvent(entry: Omit<ObservabilityLogEntry, 'timestamp'>): ObservabilityLogEntry {
  const fullEntry: ObservabilityLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    metadata: entry.metadata ? sanitizeObservabilityMetadata(entry.metadata) : undefined,
  };

  // Safe structured output without sensitive data exposure
  if (process.env.NODE_ENV !== 'test') {
    console.log(JSON.stringify({ observability: fullEntry }));
  }

  return fullEntry;
}

/**
 * Non-blocking asynchronous observability logger for client-side events.
 * Schedules telemetry processing via requestIdleCallback/setTimeout(..., 0) to avoid INP latency.
 */
export function logObservabilityEventAsync(entry: Omit<ObservabilityLogEntry, 'timestamp'>): void {
  const schedule = typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (window as any).requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 0);

  schedule(() => {
    logObservabilityEvent(entry);
  });
}
