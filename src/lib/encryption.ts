import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Retrieves the 32-byte encryption key for financial data.
 * FAIL FAST: Never falls back to JWT_SECRET or arbitrary predictable strings.
 */
export function getEncryptionKey(overrideKey?: Buffer | string): Buffer {
  if (overrideKey) {
    if (Buffer.isBuffer(overrideKey) && overrideKey.length === 32) {
      return overrideKey;
    }
    if (typeof overrideKey === 'string') {
      if (overrideKey.length === 64 && /^[0-9a-fA-F]+$/.test(overrideKey)) {
        return Buffer.from(overrideKey, 'hex');
      }
      if (Buffer.from(overrideKey, 'utf8').length === 32) {
        return Buffer.from(overrideKey, 'utf8');
      }
    }
    throw new Error('Invalid override encryption key: Must be exactly 32 bytes (or 64 hex characters).');
  }

  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error(
      'SECURITY CRITICAL: ENCRYPTION_KEY environment variable is missing. Financial encryption cannot proceed.'
    );
  }

  // Support 64-char hex string (32 bytes) or raw 32-byte string
  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  const keyBuffer = Buffer.from(rawKey, 'utf8');
  if (keyBuffer.length === 32) {
    return keyBuffer;
  }

  // If length is not 32 bytes, fail fast to prevent compromised security
  throw new Error(
    `SECURITY CRITICAL: ENCRYPTION_KEY must be exactly 32 bytes (found ${keyBuffer.length} bytes / ${rawKey.length} chars). Use a 64-character hex string.`
  );
}

/**
 * Encrypts sensitive financial data using authenticated AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptFinancialData(plaintext: string, customKey?: Buffer | string): string {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext for financial encryption.');
  }

  const key = getEncryptionKey(customKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts sensitive financial data using authenticated AES-256-GCM.
 * Validates integrity via the GCM authentication tag.
 */
export function decryptFinancialData(payload: string, customKey?: Buffer | string): string {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid ciphertext payload.');
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload format. Expected iv:authTag:ciphertext.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey(customKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid IV or Authentication Tag length in encrypted payload.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Masks a bank account number showing only the last 4 digits.
 * Example: "123456789012" -> "•••• •••• 9012"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '';
  const cleaned = accountNumber.replace(/\s+/g, '');
  if (cleaned.length < 4) return '••••';
  const lastFour = cleaned.slice(-4);
  return `•••• •••• ${lastFour}`;
}

/**
 * Masks a UPI ID for safe display.
 * Example: "rahul.sharma@okhdfcbank" -> "r••••a@okhdfcbank"
 */
export function maskUpiId(upiId: string): string {
  if (!upiId || !upiId.includes('@')) return '';
  const [handle, domain] = upiId.split('@');
  if (handle.length <= 2) {
    return `${handle[0] || ''}*@${domain}`;
  }
  const maskedHandle = `${handle[0]}${'•'.repeat(Math.min(4, handle.length - 2))}${handle[handle.length - 1]}`;
  return `${maskedHandle}@${domain}`;
}

/**
 * Indian Financial System Code (IFSC) Validator
 * Format: 4 uppercase alphabets, 0, 6 alphanumeric characters.
 */
export function validateIfscCode(ifsc: string): boolean {
  if (!ifsc || typeof ifsc !== 'string') return false;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase());
}

/**
 * UPI ID Validator
 * Standard Virtual Payment Address (VPA) format.
 */
export function validateUpiId(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  return /^[\w.\-]+@[\w.\-]+$/.test(upiId.trim().toLowerCase());
}

/**
 * Bank Account Number Validator (Indian standard: 9 to 18 digits)
 */
export function validateAccountNumber(accountNumber: string): boolean {
  if (!accountNumber || typeof accountNumber !== 'string') return false;
  const cleaned = accountNumber.replace(/\s+/g, '');
  return /^\d{9,18}$/.test(cleaned);
}

/**
 * Server-side geographic coordinates validator.
 * Ensures coordinates are finite numbers within [-90, 90] and [-180, 180].
 */
export function validateCoordinates(
  lat: unknown,
  lng: unknown
): { isValid: boolean; lat?: number; lng?: number; error?: string } {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return { isValid: false, error: 'Latitude and longitude coordinates are required.' };
  }

  const numLat = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const numLng = typeof lng === 'number' ? lng : parseFloat(String(lng));

  if (!Number.isFinite(numLat) || isNaN(numLat)) {
    return { isValid: false, error: 'Latitude must be a valid finite number.' };
  }
  if (!Number.isFinite(numLng) || isNaN(numLng)) {
    return { isValid: false, error: 'Longitude must be a valid finite number.' };
  }

  if (numLat < -90 || numLat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and +90 degrees.' };
  }
  if (numLng < -180 || numLng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and +180 degrees.' };
  }

  return { isValid: true, lat: numLat, lng: numLng };
}

/**
 * Masks a Driving Licence Number for safe UI presentation.
 * Example: "UK0720230009876" -> "UK07 •••• •••• 9876"
 */
export function maskDrivingLicence(dlNumber: string): string {
  if (!dlNumber || typeof dlNumber !== 'string') return '';
  const cleaned = dlNumber.trim().toUpperCase().replace(/\s+/g, '');
  if (cleaned.length < 8) return '•••• ••••';
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-4);
  return `${prefix} •••• •••• ${suffix}`;
}

/**
 * Masks an Email Address for safe presentation.
 * Example: "customer@ridesetu.demo" -> "c•••••••r@ridesetu.demo"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) return `${local[0] || '*'}*@${domain}`;
  const maskedLocal = `${local[0]}${'•'.repeat(Math.min(6, local.length - 2))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks a Phone Number for safe presentation.
 * Example: "+91 9876543210" -> "+91 ••••• •3210"
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.length <= 4) return '••••';
  const last4 = cleaned.slice(-4);
  return `•••• ••• ${last4}`;
}

