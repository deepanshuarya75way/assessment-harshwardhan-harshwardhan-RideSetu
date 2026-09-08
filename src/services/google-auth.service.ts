import crypto from 'crypto';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { User, IUser, UserRole } from '@/models/User';
import { Vendor } from '@/models/Vendor';
import { AuditLog } from '@/models/AuditLog';

export interface GoogleIdentityClaims {
  sub: string; // Google Subject ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export class GoogleAuthService {
  /**
   * Generates a cryptographically secure OAuth state parameter
   */
  public static generateState(role: 'CUSTOMER' | 'VENDOR'): string {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${role}:${timestamp}:${randomHex}`;
  }

  /**
   * Constructs Google OAuth 2.0 authorization URL
   */
  public static getAuthorizationUrl(role: 'CUSTOMER' | 'VENDOR', state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id.apps.googleusercontent.com';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Validates state parameter to prevent CSRF attacks
   */
  public static validateState(state: string, cookieState: string): { valid: boolean; role?: 'CUSTOMER' | 'VENDOR' } {
    if (!state || !cookieState || state !== cookieState) {
      return { valid: false };
    }

    const parts = state.split(':');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const role = parts[0] as 'CUSTOMER' | 'VENDOR';
    const timestamp = Number(parts[1]);
    const maxAgeMs = 15 * 60 * 1000; // 15 minutes max state age

    if (Date.now() - timestamp > maxAgeMs) {
      return { valid: false };
    }

    return { valid: true, role };
  }

  /**
   * Exchanges Google Authorization Code for Google ID Token & Identity claims
   */
  public static async fetchGoogleIdentity(code: string): Promise<GoogleIdentityClaims> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    // Development Fallback: If Google credentials are not configured in dev environment, return dev mock identity
    if (!clientId || !clientSecret || clientId.startsWith('mock-')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Dev Google OAuth] Using development fallback identity for code:', code);
        const codeClean = code.trim().toLowerCase();
        const isPartner = codeClean.includes('partner') || codeClean.includes('vendor');
        return {
          sub: `google_sub_${Date.now()}`,
          email: codeClean.includes('@') ? codeClean : `google_${isPartner ? 'partner' : 'customer'}_${Date.now()}@example.com`,
          email_verified: true,
          name: isPartner ? 'Google Test Vendor' : 'Google Test Rider',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        };
      }

      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing in production.');
    }

    // Live Google OAuth 2.0 Token Exchange
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange authorization code with Google.');
    }

    // Decode & Verify Google ID Token Payload
    const parts = tokenData.id_token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid Google ID token format.');
    }

    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    if (payload.aud !== clientId) {
      throw new Error('Google ID token audience mismatch.');
    }

    if (payload.exp * 1000 < Date.now()) {
      throw new Error('Google ID token has expired.');
    }

    if (!payload.email_verified) {
      throw new Error('Your Google email address is not verified by Google.');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name || payload.given_name || 'Google User',
      picture: payload.picture || '',
    };
  }

  /**
   * Safely links an existing user account or creates a new user via Google OAuth
   */
  public static async linkOrCreateUser(
    identity: GoogleIdentityClaims,
    targetRole: 'CUSTOMER' | 'VENDOR'
  ): Promise<{
    user: IUser;
    vendorId?: string;
    isNew: boolean;
    isLinked: boolean;
  }> {
    await connectToDatabase();

    const normalizedEmail = identity.email.trim().toLowerCase();

    // 1. Look up existing user by googleId OR normalized email
    let user = await User.findOne({
      $or: [{ googleId: identity.sub }, { email: normalizedEmail }],
    });

    if (user) {
      // Admin Security Guard: Block public Google login to unlinked Admin accounts
      if (user.role === 'ADMIN' && user.googleId !== identity.sub) {
        throw new Error('Admin accounts cannot be automatically linked via Google Sign-In. Please sign in with admin credentials.');
      }

      let isLinked = false;
      if (!user.googleId) {
        user.googleId = identity.sub;
        user.googleEmail = normalizedEmail;
        if (identity.picture && !user.avatar) {
          user.avatar = identity.picture;
        }
        user.emailVerified = true;
        const providers = user.authProviders || [];
        if (!providers.includes('GOOGLE')) {
          providers.push('GOOGLE');
        }
        user.authProviders = providers;
        await user.save();
        isLinked = true;

        await AuditLog.create({
          action: 'GOOGLE_ACCOUNT_LINKED',
          userId: user._id.toString(),
          userRole: user.role,
          resourceType: 'USER',
          resourceId: user._id.toString(),
          details: { email: normalizedEmail, googleSub: identity.sub },
        }).catch(() => {});
      }

      let vendorId: string | undefined = undefined;
      if (user.role === 'VENDOR') {
        const vendor = await Vendor.findOne({ userId: user._id });
        if (vendor) {
          vendorId = vendor._id.toString();
        }
      }

      return { user, vendorId, isNew: false, isLinked };
    }

    // 2. Create New User via Google OAuth
    if (targetRole === ('ADMIN' as any)) {
      throw new Error('Public registration for Admin accounts is strictly prohibited.');
    }

    const newUser = await User.create({
      name: (identity.name || 'Google User').trim(),
      email: normalizedEmail,
      phone: '',
      passwordHash: '',
      role: targetRole,
      emailVerified: true,
      phoneVerified: false,
      googleId: identity.sub,
      googleEmail: normalizedEmail,
      googleProfileImage: identity.picture || '',
      avatar: identity.picture || '',
      authProviders: ['GOOGLE'],
      kycStatus: 'PENDING',
      drivingLicenseStatus: 'PENDING',
    });

    let vendorId: string | undefined = undefined;
    if (targetRole === 'VENDOR') {
      const newVendor = await Vendor.create({
        userId: newUser._id,
        businessName: `${identity.name || 'Vendor'}'s Rental Agency`,
        ownerName: (identity.name || 'Vendor').trim(),
        email: normalizedEmail,
        phone: '+919999900000',
        address: 'Local Office',
        city: 'Rishikesh',
        destinationId: new mongoose.Types.ObjectId(),
        rentalLicenseNumber: `UK-RNT-GGL-${Math.floor(1000 + Math.random() * 9000)}`,
        verificationStatus: 'UNDER_REVIEW', // Vendor remains UNDER_REVIEW until admin approves
        commissionRate: 15,
      });
      vendorId = newVendor._id.toString();
    }

    await AuditLog.create({
      action: 'GOOGLE_AUTH_SUCCESS',
      userId: newUser._id.toString(),
      userRole: newUser.role,
      resourceType: 'USER',
      resourceId: newUser._id.toString(),
      details: { email: normalizedEmail, role: targetRole, googleSub: identity.sub },
    }).catch(() => {});

    return { user: newUser, vendorId, isNew: true, isLinked: false };
  }
}
