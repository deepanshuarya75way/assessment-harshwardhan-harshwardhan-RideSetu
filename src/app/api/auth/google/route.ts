import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/services/google-auth.service';

export const dynamic = 'force-dynamic';

export const OAUTH_STATE_COOKIE_NAME = 'ridesetu_oauth_state';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roleParam = searchParams.get('role');
    const role: 'CUSTOMER' | 'VENDOR' = roleParam === 'VENDOR' ? 'VENDOR' : 'CUSTOMER';

    const state = GoogleAuthService.generateState(role);
    const authUrl = GoogleAuthService.getAuthorizationUrl(role, state);

    const response = NextResponse.redirect(authUrl);

    // Store state in HTTP-only cookie for CSRF validation on callback
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error('[API Google OAuth Init Error]:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication.' },
      { status: 500 }
    );
  }
}
