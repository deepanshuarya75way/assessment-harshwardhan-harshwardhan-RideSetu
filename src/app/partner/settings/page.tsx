'use client';

import React from 'react';
import { Settings, ShieldCheck } from 'lucide-react';

export default function PartnerSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Partner Portal Settings</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Configure operational alerts, auto-approval parameters, and delivery options.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 text-xs shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base font-heading">Notification & Delivery Parameters</h3>
        <div className="space-y-3 text-slate-700 font-medium">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span>Instant SMS & WhatsApp Booking Alerts</span>
            <span className="font-bold text-emerald-700">ENABLED</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span>Hotel & Doorstep Delivery Service</span>
            <span className="font-bold text-emerald-700">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
