import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@/services/google-auth.service';
import { signJwt, AUTH_COOKIE_NAME } from '@/lib/auth';
import { OAUTH_STATE_COOKIE_NAME } from '../route';

export const dynamic = 'force-dynamic';

const APPROVED_REDIRECT_DESTINATIONS = [
  '/dashboard',
  '/dashboard/bookings',
  '/dashboard/profile',
  '/partner/dashboard',
  '/partner/fleet',
  '/partner/profile',
  '/ops/dashboard',
];

export async function GET(request: NextRequest) {
  let portalRole: 'CUSTOMER' | 'VENDOR' = 'CUSTOMER';

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    // Extract target role from state if available for accurate failure redirects
    if (state && state.startsWith('VENDOR:')) {
      portalRole = 'VENDOR';
    }

    const fallbackLoginUrl = portalRole === 'VENDOR' ? '/login/partner' : '/login/customer';

    if (oauthError) {
      console.warn('[API Google Callback] OAuth access denied by user or provider:', oauthError);
      return NextResponse.redirect(new URL(`${fallbackLoginUrl}?error=google_access_denied`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL(`${fallbackLoginUrl}?error=missing_oauth_params`, request.url));
    }

    const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value || '';

    // Validate CSRF state parameter
    const stateValidation = GoogleAuthService.validateState(state, storedState);
    if (!stateValidation.valid) {
      console.error('[API Google Callback Error] Invalid or expired OAuth state parameter.');
      return NextResponse.redirect(new URL(`${fallbackLoginUrl}?error=invalid_oauth_state`, request.url));
    }

    const targetRole = stateValidation.role || 'CUSTOMER';
    portalRole = targetRole;

    // 1. Fetch & Verify Google Identity Claims
    const googleIdentity = await GoogleAuthService.fetchGoogleIdentity(code);

    // 2. Link Existing Account or Create New User
    const { user, vendorId } = await GoogleAuthService.linkOrCreateUser(
      googleIdentity,
      targetRole
    );

    // 3. Issue RideSetu Session Token (HTTP-Only Cookie)
    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      vendorId,
    };

    const token = signJwt(sessionPayload);

    // Determine safe authenticated portal redirect destination
    let redirectPath = '/dashboard';
    if (user.role === 'VENDOR') {
      redirectPath = '/partner/dashboard';
    }

    // Open Redirect Guard: Only permit whitelisted internal routes
    if (!APPROVED_REDIRECT_DESTINATIONS.includes(redirectPath)) {
      redirectPath = user.role === 'VENDOR' ? '/partner/dashboard' : '/dashboard';
    }

    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    // Set secure HTTP-only ridesetu_token cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear one-time OAuth state cookie
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('[API Google Callback Failure]:', error);
    const safeMsg = encodeURIComponent(error.message || 'Google authentication failed');
    const failureUrl = portalRole === 'VENDOR' ? '/login/partner' : '/login/customer';
    return NextResponse.redirect(new URL(`${failureUrl}?error=${safeMsg}`, request.url));
  }
}
