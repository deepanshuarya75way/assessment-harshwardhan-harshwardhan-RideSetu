import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, ArrowRight, Car } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-light text-brand-orange flex items-center justify-center mx-auto shadow-md shadow-brand-orange/20">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">404 • Destination Not Found</span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Off the Mountain Trail</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            The rental page or destination route you are looking for has been moved or does not exist.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95"
          >
            Return Home
          </Link>
          <Link
            href="/vehicles"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white text-xs font-extrabold shadow-md shadow-brand-orange/25 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Explore Verified Fleet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
