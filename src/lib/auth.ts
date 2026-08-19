import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'ridesetu_super_secret_jwt_key_development_only_2026';
export const AUTH_COOKIE_NAME = 'ridesetu_token';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  vendorId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJwt(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): UserSession | null {
  try {
    // Check Authorization Header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return verifyJwt(token);
    }

    // Check Cookie Header
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(^| )${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match && match[2]) {
        return verifyJwt(match[2]);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function assertRole(
  session: UserSession | null,
  allowedRoles: Array<'CUSTOMER' | 'VENDOR' | 'ADMIN'>
): { authorized: boolean; error?: string; status?: number } {
  if (!session) {
    return { authorized: false, error: 'Authentication required. Please log in.', status: 401 };
  }
  if (!allowedRoles.includes(session.role)) {
    return { authorized: false, error: 'Forbidden: insufficient privileges.', status: 403 };
  }
  return { authorized: true };
}

export const getAuthUser = getSessionFromRequest;
