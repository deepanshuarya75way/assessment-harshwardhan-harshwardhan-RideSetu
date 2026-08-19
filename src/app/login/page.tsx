'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Store, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPortalSelectionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Auto-redirect authenticated users directly to their designated portal
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'VENDOR') {
        router.replace('/partner/dashboard');
      } else if (user.role === 'ADMIN') {
        router.replace('/ops/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || (user && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-bold text-lg animate-pulse mx-auto">
            RS
          </div>
          <p className="text-xs text-slate-400 font-bold animate-pulse">Redirecting to your authenticated portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6B00]/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-[#FF6B00]/30 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black font-heading tracking-tight">
              Ride<span className="text-[#FF6B00]">Setu</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
            Select Your Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-medium">
            Choose your account type to access the dedicated RideSetu product experience.
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. RideSetu Customer */}
          <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-6 flex flex-col justify-between hover:border-[#FF6B00]/50 transition-all hover:shadow-xl hover:shadow-[#FF6B00]/10 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black font-heading text-white group-hover:text-[#FF6B00] transition-colors">
                  RideSetu Customer
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  Find a ride, manage your bookings, explore Uttarakhand, and earn referral rewards.
                </p>
              </div>
            </div>
            <Link
              href="/login/customer"
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-amber-600 hover:to-[#FF6B00] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/20 transition-all group-hover:gap-3"
            >
              <span>Continue as Customer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 2. RideSetu Partner */}
          <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/10 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black font-heading text-white group-hover:text-amber-400 transition-colors">
                  RideSetu Partner
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  Manage your fleet inventory, digital handovers, earnings ledger, and vehicle availability.
                </p>
              </div>
            </div>
            <Link
              href="/login/partner"
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all group-hover:gap-3"
            >
              <span>Partner Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3. RideSetu Operations */}
          <div className="bg-slate-900/80 rounded-3xl border border-white/10 p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/10 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black font-heading text-white group-hover:text-emerald-400 transition-colors">
                  RideSetu Operations
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  Enterprise command center for KYC approvals, vendor governance, risk, and analytics.
                </p>
              </div>
            </div>
            <Link
              href="/login/admin"
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all group-hover:gap-3"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
