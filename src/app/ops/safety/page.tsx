'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Radio, PhoneCall } from 'lucide-react';

export default function AdminSafetyPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-6 h-6 text-rose-600 animate-pulse" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Safety & Emergency Command Center</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Real-time SOS telemetry, Himalayan dispatch monitoring, and accident response logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active SOS Signals</div>
          <div className="text-3xl font-black text-emerald-600">0 Active</div>
          <div className="text-xs text-slate-600 font-medium">All trip telemetry nominal</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Himalayan Emergency Desk</div>
          <div className="text-lg font-black text-slate-900">+91 1800-419-SETU</div>
          <div className="text-xs text-slate-600 font-medium">Direct dispatch line to Uttarkashi & Chamoli response teams</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Handover Safety Checks</div>
          <div className="text-3xl font-black text-amber-600">100% Verified</div>
          <div className="text-xs text-slate-600 font-medium">Dual photo verification required before pickup</div>
        </div>
      </div>
    </div>
  );
}
