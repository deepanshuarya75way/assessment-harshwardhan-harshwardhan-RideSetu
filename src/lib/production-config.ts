/**
 * RideSetu Production Configuration Validator & Diagnostic Layer
 * Validates environment integrity without leaking secret values.
 */

export interface EnvValidationResult {
  valid: boolean;
  environment: string;
  missingVars: string[];
  warnings: string[];
  services: {
    database: boolean;
    jwt: boolean;
    googleMaps: boolean;
    googleOAuth: boolean;
    razorpay: boolean;
    encryption: boolean;
  };
}

export function validateProductionConfig(): EnvValidationResult {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'GOOGLE_MAPS_SERVER_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingVars: string[] = [];
  const warnings: string[] = [];

  requiredVars.forEach((v) => {
    if (!process.env[v]) {
      missingVars.push(v);
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (isProduction && (appUrl.includes('localhost') || appUrl.includes('127.0.0.1'))) {
    warnings.push('NEXT_PUBLIC_APP_URL is configured with localhost in production mode.');
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
  if (isProduction && (redirectUri.includes('localhost') || redirectUri.includes('127.0.0.1'))) {
    warnings.push('GOOGLE_REDIRECT_URI is configured with localhost in production mode.');
  }

  const services = {
    database: Boolean(process.env.MONGODB_URI),
    jwt: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16),
    googleMaps: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_SERVER_API_KEY),
    googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    encryption: Boolean(process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32),
  };

  return {
    valid: missingVars.length === 0,
    environment: env,
    missingVars,
    warnings,
    services,
  };
}
