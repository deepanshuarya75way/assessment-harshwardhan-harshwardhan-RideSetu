'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Compass, Lock, ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'CUSTOMER' | 'VENDOR' | 'ADMIN'>;
  fallbackUrl?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackUrl,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 animate-pulse flex items-center justify-center text-white font-bold text-xl shadow-lg">
          RS
        </div>
        <div className="text-slate-500 text-xs font-bold animate-pulse">
          Verifying security authorization & session tokens...
        </div>
      </div>
    );
  }

  // Unauthenticated user attempting to access protected partner or ops route
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black font-heading text-navy-950">Authentication Required</h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            You must be signed into an authorized account to access this portal section.
          </p>
        </div>
        <div className="flex gap-3 pt-2 w-full">
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold hover:bg-slate-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated user with unauthorized role (e.g. Customer accessing /partner/* or /ops/*)
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-2xl font-black font-heading text-navy-950 mt-2">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Your account ({user.name} • <strong className="uppercase">{user.role}</strong>) does not have authorization to view this area ({pathname}).
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs w-full space-y-1.5">
          <div className="font-bold text-slate-800">Navigational Guidance:</div>
          {user.role === 'CUSTOMER' && (
            <p className="text-slate-600">
              As a travel rider, your dedicated portal is the Customer Marketplace and Rider Dashboard.
            </p>
          )}
          {user.role === 'VENDOR' && (
            <p className="text-slate-600">
              As a verified mobility partner, your portal is the RideSetu Partner Portal (`/partner/dashboard`).
            </p>
          )}
          {user.role === 'ADMIN' && (
            <p className="text-slate-600">
              As a platform administrator, your enterprise portal is the Operations Console (`/ops/dashboard`).
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full">
          <Link
            href={
              user.role === 'ADMIN'
                ? '/ops/dashboard'
                : user.role === 'VENDOR'
                ? '/partner/dashboard'
                : '/dashboard'
            }
            className="flex-1 py-3 px-4 rounded-xl bg-navy-950 text-white text-xs font-extrabold hover:bg-navy-900 transition-colors flex items-center justify-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-brand-orange" />
            <span>Go to My Dedicated Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const CustomerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['CUSTOMER', 'ADMIN']}>{children}</RoleGuard>
);

export const VendorGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['VENDOR', 'ADMIN']}>{children}</RoleGuard>
);

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['ADMIN']}>{children}</RoleGuard>
);

export default RoleGuard;
