'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyVendorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/partner/dashboard');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center animate-pulse">
        RS
      </div>
      <div className="text-xs font-bold text-slate-500 animate-pulse">
        Redirecting to RideSetu Partner Portal (`/partner/dashboard`)...
      </div>
    </div>
  );
}
