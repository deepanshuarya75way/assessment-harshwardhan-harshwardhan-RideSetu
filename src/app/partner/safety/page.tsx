'use client';

import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function PartnerSafetyPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-2 shadow-md border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5" /> Partner Safety & SOS Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
          Roadside Assistance & Incident Management
        </h1>
        <p className="text-xs text-slate-300 max-w-xl font-normal leading-relaxed">
          Monitor real-time SOS alerts, active mechanical dispatches, and roadside assistance cases for your fleet.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Active SOS Incidents</div>
          <div className="text-3xl font-black text-emerald-600">0</div>
          <div className="text-[11px] text-slate-500 font-medium">All fleet riders active & safe</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Mechanical Dispatches</div>
          <div className="text-3xl font-black text-amber-600">0</div>
          <div className="text-[11px] text-slate-500 font-medium">24/7 Himalayan dispatch active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-500">Partner SOS Hotline</div>
          <div className="text-lg font-black text-slate-900 font-mono">+91 1800-419-SETU</div>
          <div className="text-[11px] text-slate-500 font-medium">24/7 Priority Emergency Control</div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-xs text-slate-700 shadow-sm">
        <h3 className="text-base font-black text-slate-900 font-heading">Emergency Protocol for Partners</h3>
        <ul className="space-y-2 list-disc list-inside text-slate-600 font-medium">
          <li>In case of a breakdown in mountain areas, riders can press the SOS button to alert our local roadside unit.</li>
          <li>Mutual photographic check-ins verify pre-existing vehicle condition to protect both rider and host.</li>
          <li>Support agents remain on call 24/7 for accident assistance or emergency towing.</li>
        </ul>
      </div>
    </div>
  );
}
