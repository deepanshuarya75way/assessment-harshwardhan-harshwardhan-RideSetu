'use client';

import React, { Suspense } from 'react';
import CustomerAuthCard from '@/components/auth/CustomerAuthCard';

export default function CustomerRegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 text-center animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-bold mx-auto mb-4">
              RS
            </div>
            <p className="text-xs text-slate-500 font-bold">Loading registration portal...</p>
          </div>
        }
      >
        <CustomerAuthCard initialMode="OTP" />
      </Suspense>
    </main>
  );
}
