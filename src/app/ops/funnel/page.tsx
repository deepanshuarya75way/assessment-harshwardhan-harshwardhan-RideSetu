'use client';

import React from 'react';
import { Filter, Users, Eye, CheckCircle2 } from 'lucide-react';

export default function AdminFunnelPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Marketplace Conversion Funnel</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          End-to-end conversion tracking from homepage search to deposit authorization and booking confirmation.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900">1. Marketplace Impressions & Search</span>
            <span className="font-black text-amber-700">12,450 Visits (100%)</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-amber-500 rounded-full w-full"></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900">2. Vehicle Listing Views & Gallery Inspect</span>
            <span className="font-black text-blue-700">4,820 Views (38.7%)</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-blue-500 rounded-full w-[38.7%]"></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900">3. Checkout & Deposit Escrow Confirmation</span>
            <span className="font-black text-emerald-700">1,240 Bookings (10.0%)</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-emerald-500 rounded-full w-[10%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
