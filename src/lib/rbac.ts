export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (!role) {
    if (pathname.startsWith('/partner') || pathname.startsWith('/ops')) {
      return false;
    }
    return true;
  }

  if (pathname.startsWith('/ops')) {
    return role === 'ADMIN';
  }

  if (pathname.startsWith('/partner')) {
    return role === 'VENDOR' || role === 'ADMIN';
  }

  return true;
}
