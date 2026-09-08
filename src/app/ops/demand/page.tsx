'use client';

import React from 'react';
import { Activity, Flame, MapPin } from 'lucide-react';

export default function AdminDemandPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Demand Intelligence & Dynamic Pricing</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Regional surge modeling across Rishikesh, Mussoorie, Dehradun, Haridwar, Nainital, and Haldwani.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1">📍 Rishikesh</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">High Surge (1.2x)</span>
          </div>
          <div className="text-2xl font-black text-amber-600">92% Fleet Utilization</div>
          <div className="text-xs text-slate-600 font-medium">Peak demand for RE Himalayan & Activa</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1">📍 Mussoorie</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">Moderate Surge (1.1x)</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">84% Fleet Utilization</div>
          <div className="text-xs text-slate-600 font-medium">High demand for Self-Drive SUVs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1">📍 Nainital</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold">Standard</span>
          </div>
          <div className="text-2xl font-black text-blue-600">76% Fleet Utilization</div>
          <div className="text-xs text-slate-600 font-medium">Balanced scooter & motorcycle demand</div>
        </div>
      </div>
    </div>
  );
}
