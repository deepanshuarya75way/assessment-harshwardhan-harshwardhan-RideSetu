import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getPrivateStorageProvider } from '@/services/document-storage.service';

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Vendors must NEVER access raw customer identity documents
    if (session.role === 'VENDOR') {
      return NextResponse.json({ error: 'Forbidden: Vendors cannot access customer identity documents.' }, { status: 403 });
    }

    const body = await request.json();
    const { storageKey, expiresInSeconds = 600 } = body;

    if (!storageKey || typeof storageKey !== 'string') {
      return NextResponse.json({ error: 'Valid storageKey is required.' }, { status: 400 });
    }

    const storageProvider = getPrivateStorageProvider();
    const { signedUrl, expiresAt } = await storageProvider.getSignedDocumentUrl(
      storageKey,
      session.userId,
      session.role,
      expiresInSeconds
    );

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error('[API Document Preview Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate preview URL' }, { status: 403 });
  }
}
