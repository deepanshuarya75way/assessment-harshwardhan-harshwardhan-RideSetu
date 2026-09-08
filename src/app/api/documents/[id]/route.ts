import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getPrivateStorageProvider, LocalSecureStorageProvider } from '@/services/document-storage.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storageKey = decodeURIComponent(params.id);
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const expires = searchParams.get('expires');

    const storageProvider = getPrivateStorageProvider();

    // 1. If signed token provided, validate signature and expiration
    if (token && expires) {
      const tokenCheck = storageProvider.validateSignedToken(storageKey, token, parseInt(expires, 10));
      if (!tokenCheck.valid) {
        return NextResponse.json({ error: tokenCheck.error || 'Invalid or expired signature' }, { status: 403 });
      }
    } else {
      // 2. Otherwise require direct session authorization
      const session = await getAuthUser(req);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized: Valid signed link or session required.' }, { status: 401 });
      }

      if (session.role === 'VENDOR') {
        return NextResponse.json({ error: 'Forbidden: Vendors cannot access customer identity documents.' }, { status: 403 });
      }
    }

    if (storageProvider instanceof LocalSecureStorageProvider) {
      const data = storageProvider.getDocumentData(storageKey);
      if (!data) {
        return NextResponse.json({ error: 'Document not found or has been purged.' }, { status: 404 });
      }

      return new NextResponse(new Uint8Array(data.buffer), {
        status: 200,
        headers: {
          'Content-Type': data.mimeType || 'application/octet-stream',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Content-Disposition': 'inline',
        },
      });
    }

    return NextResponse.json({
      success: true,
      storageKey,
      status: 'SECURE_STORAGE_SERVED',
    });
  } catch (error: any) {
    console.error('[API Secure Document Error]:', error);
    return NextResponse.json({ error: 'Access denied to private document.' }, { status: 403 });
  }
}
