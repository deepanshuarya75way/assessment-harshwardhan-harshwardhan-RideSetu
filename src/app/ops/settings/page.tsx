'use client';

import React from 'react';
import { Settings } from 'lucide-react';

export default function OpsSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" /> Platform Operations Settings
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Configure security rate-limiting thresholds, platform commission rates, and audit policies.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 text-xs shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base font-heading">Marketplace Financial Rules</h3>
        <div className="space-y-3 text-slate-700 font-medium">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span>Platform Commission Rate</span>
            <span className="font-bold text-emerald-700 text-sm">15.0%</span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span>Customer Platform Fee</span>
            <span className="font-bold text-emerald-700 text-sm">₹49 / booking</span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span>GST Tax Rate</span>
            <span className="font-bold text-emerald-700 text-sm">18.0%</span>
          </div>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span>Refundable Security Deposit Escrow Isolation</span>
            <span className="font-bold text-emerald-700 text-sm">100% PROTECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
