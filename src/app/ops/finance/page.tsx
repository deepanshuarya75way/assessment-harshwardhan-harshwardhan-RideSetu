'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { CreditCard, Lock, ShieldCheck, DollarSign, Wallet } from 'lucide-react';

export default function AdminFinancePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Financial Ledger & Escrow Isolation</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Enterprise financial accounting tracking GMV, platform take-rate, GST tax liabilities, and security deposit escrow.
        </p>
      </div>

      {/* Security Deposit Escrow Policy Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 shadow-sm">
        <Lock className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
        <div>
          <strong className="font-extrabold text-slate-900 text-sm block">Mandatory Escrow Isolation Rule:</strong>
          <p className="mt-0.5 leading-relaxed text-slate-700 font-medium">
            Rider security deposits (₹500 - ₹5,000) are held in isolated bank escrow and are <strong>100% EXCLUDED</strong> from platform gross revenue, platform take-rate, and vendor income. Deposits are strictly returned or settled for verified damage repair.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Gross Rental Revenue</span>
          <div className="text-2xl font-black text-slate-900">{formatINR(845200)}</div>
          <div className="text-xs text-slate-600 font-medium">Base customer payments</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Platform Take-Rate (15%)</span>
          <div className="text-2xl font-black text-emerald-600">{formatINR(126780)}</div>
          <div className="text-xs text-slate-600 font-medium">RideSetu gross fee</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">GST Tax Collected (18%)</span>
          <div className="text-2xl font-black text-amber-600">{formatINR(22820)}</div>
          <div className="text-xs text-slate-600 font-medium">Remitted to tax authority</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Security Deposit Escrow</span>
          <div className="text-2xl font-black text-blue-600">{formatINR(142000)}</div>
          <div className="text-xs text-slate-600 font-bold">100% Isolated in Escrow</div>
        </div>
      </div>
    </div>
  );
}
