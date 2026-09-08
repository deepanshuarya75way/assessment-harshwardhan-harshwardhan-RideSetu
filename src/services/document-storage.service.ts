import crypto from 'crypto';
import path from 'path';

export interface IDocumentStorageProvider {
  uploadPrivateDocument(
    fileBuffer: Buffer,
    originalFileName: string,
    claimedMimeType: string,
    userId: string
  ): Promise<{ storageKey: string; sanitizedFileName: string }>;
  getSignedDocumentUrl(
    storageKey: string,
    userId: string,
    userRole: string,
    expiresInSeconds?: number
  ): Promise<{ signedUrl: string; expiresAt: Date }>;
  validateSignedToken(
    storageKey: string,
    token: string,
    expiresAtTimestamp: number
  ): { valid: boolean; error?: string };
  deleteDocument(storageKey: string): Promise<void>;
}

// In-memory / Local Secure Storage for Development
const LOCAL_STORAGE_MAP = new Map<string, { buffer: Buffer; mimeType: string; userId: string; uploadedAt: Date }>();
const SIGNING_SECRET = process.env.JWT_SECRET || 'ridesetu_doc_signing_secret_2026';

export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateDocumentFile(buffer: Buffer, originalFileName: string, claimedMimeType: string): {
  isValid: boolean;
  detectedMimeType?: string;
  error?: string;
} {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'Document file is empty.' };
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    return { isValid: false, error: `Document exceeds maximum allowed size of 5 MB (File size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).` };
  }

  // Validate File Extension
  const ext = path.extname(originalFileName).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (!allowedExtensions.includes(ext)) {
    return { isValid: false, error: `Invalid file extension "${ext}". Allowed: JPEG, PNG, PDF.` };
  }

  // Magic Bytes (File Signature) Validation
  // JPEG: FF D8 FF
  // PNG:  89 50 4E 47 (0x89 'P' 'N' 'G')
  // PDF:  25 50 44 46 ('%' 'P' 'D' 'F')
  const hexHeader = buffer.slice(0, 4).toString('hex').toUpperCase();

  let detectedMime = '';
  if (hexHeader.startsWith('FFD8FF')) {
    detectedMime = 'image/jpeg';
  } else if (hexHeader.startsWith('89504E47')) {
    detectedMime = 'image/png';
  } else if (hexHeader.startsWith('25504446')) {
    detectedMime = 'application/pdf';
  } else {
    return {
      isValid: false,
      error: 'Invalid file signature. File contents do not match authentic JPEG, PNG, or PDF formats.',
    };
  }

  return { isValid: true, detectedMimeType: detectedMime };
}

export class LocalSecureStorageProvider implements IDocumentStorageProvider {
  public async uploadPrivateDocument(
    fileBuffer: Buffer,
    originalFileName: string,
    claimedMimeType: string,
    userId: string
  ): Promise<{ storageKey: string; sanitizedFileName: string }> {
    const validation = validateDocumentFile(fileBuffer, originalFileName, claimedMimeType);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Document validation failed.');
    }

    const sanitizedBase = path.basename(originalFileName, path.extname(originalFileName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const ext = path.extname(originalFileName).toLowerCase();
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = `${sanitizedBase}_${uniqueId}${ext}`;
    const storageKey = `kyc_docs/${userId}/${uniqueId}_${sanitizedBase}${ext}`;

    LOCAL_STORAGE_MAP.set(storageKey, {
      buffer: fileBuffer,
      mimeType: validation.detectedMimeType || claimedMimeType,
      userId,
      uploadedAt: new Date(),
    });

    return { storageKey, sanitizedFileName };
  }

  public async getSignedDocumentUrl(
    storageKey: string,
    userId: string,
    userRole: string,
    expiresInSeconds = 600 // 10 minutes default
  ): Promise<{ signedUrl: string; expiresAt: Date }> {
    // RBAC check: only OWNER or ADMIN can obtain signed preview URL
    const doc = LOCAL_STORAGE_MAP.get(storageKey);
    if (doc && userRole !== 'ADMIN' && doc.userId !== userId) {
      throw new Error('Forbidden: You do not have permission to access this identity document.');
    }

    const expiresAtTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const expiresAt = new Date(expiresAtTimestamp * 1000);

    const payload = `${storageKey}:${expiresAtTimestamp}`;
    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    hmac.update(payload);
    const token = hmac.digest('hex');

    const signedUrl = `/api/documents/${encodeURIComponent(storageKey)}?token=${token}&expires=${expiresAtTimestamp}`;
    return { signedUrl, expiresAt };
  }

  public validateSignedToken(
    storageKey: string,
    token: string,
    expiresAtTimestamp: number
  ): { valid: boolean; error?: string } {
    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAtTimestamp) {
      return { valid: false, error: 'Signed document URL has expired. Please request a new preview link.' };
    }

    const payload = `${storageKey}:${expiresAtTimestamp}`;
    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    hmac.update(payload);
    const expectedToken = hmac.digest('hex');

    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedToken);
    if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return { valid: false, error: 'Invalid or tampered document signature token.' };
    }

    return { valid: true };
  }

  public async deleteDocument(storageKey: string): Promise<void> {
    LOCAL_STORAGE_MAP.delete(storageKey);
  }

  public getDocumentData(storageKey: string): { buffer: Buffer; mimeType: string; userId: string } | null {
    return LOCAL_STORAGE_MAP.get(storageKey) || null;
  }
}

let storageProviderInstance: IDocumentStorageProvider | null = null;

export function getPrivateStorageProvider(): IDocumentStorageProvider {
  if (!storageProviderInstance) {
    storageProviderInstance = new LocalSecureStorageProvider();
  }
  return storageProviderInstance;
}

export class DocumentStorageService {
  public static async saveDocument(params: {
    userId: string;
    category?: string;
    fileBuffer: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<{ publicUrl: string; storageKey: string }> {
    const provider = getPrivateStorageProvider();
    const result = await provider.uploadPrivateDocument(
      params.fileBuffer,
      params.originalName,
      params.mimeType,
      params.userId
    );
    const signedUrlRes = await provider.getSignedDocumentUrl(
      result.storageKey,
      params.userId,
      'CUSTOMER'
    );
    return {
      publicUrl: signedUrlRes.signedUrl,
      storageKey: result.storageKey,
    };
  }
}
