/**
 * RideSetu Environment Validation & Startup Safety Guard
 * Validates required environment variables without leaking secrets or credentials.
 */

export interface EnvValidationResult {
  isValid: boolean;
  environment: 'sandbox' | 'development' | 'production';
  paymentMode: 'MOCK' | 'RAZORPAY_TEST' | 'RAZORPAY_LIVE';
  missingVariables: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 1. Critical Database URI
  if (!process.env.MONGODB_URI) {
    missing.push('MONGODB_URI');
  }

  // 2. Authentication & Cryptography Secrets
  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  } else if (process.env.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET should be at least 32 characters long for production security.');
  }

  if (!process.env.ENCRYPTION_KEY) {
    missing.push('ENCRYPTION_KEY');
  }

  // 3. Payment Mode & Safety Checks
  const paymentProvider = process.env.PAYMENT_PROVIDER || 'MOCK';
  let paymentMode: 'MOCK' | 'RAZORPAY_TEST' | 'RAZORPAY_LIVE' = 'MOCK';

  if (paymentProvider === 'RAZORPAY') {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    if (keyId.startsWith('rzp_test_')) {
      paymentMode = 'RAZORPAY_TEST';
    } else if (keyId.startsWith('rzp_live_')) {
      paymentMode = 'RAZORPAY_LIVE';
      if (process.env.NODE_ENV !== 'production') {
        warnings.push('CRITICAL: Live Razorpay credentials detected in non-production environment!');
      }
    } else {
      warnings.push('RAZORPAY_KEY_ID does not match standard test/live prefix.');
    }
  }

  const environment = (process.env.NODE_ENV as any) || 'development';

  return {
    isValid: missing.length === 0,
    environment: environment === 'production' ? 'production' : 'sandbox',
    paymentMode,
    missingVariables: missing,
    warnings,
  };
}
