'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { Activity, TrendingUp, Users, Car, MapPin, DollarSign } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Marketplace BI & Telemetry Analytics</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Enterprise analytics on GMV trends, rental duration metrics, customer lifetime value, and hub performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Gross Marketplace Volume</div>
          <div className="text-2xl font-black text-slate-900">{formatINR(845200)}</div>
          <div className="text-xs text-emerald-700 font-bold">+28.4% vs last month</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Average Rental Duration</div>
          <div className="text-2xl font-black text-amber-600">2.8 Days</div>
          <div className="text-xs text-slate-600 font-medium">Weekend peak: 3.4 days</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Top Destination Hub</div>
          <div className="text-2xl font-black text-emerald-600">Rishikesh</div>
          <div className="text-xs text-slate-600 font-medium">42% of total marketplace bookings</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-sm">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cancellation Rate</div>
          <div className="text-2xl font-black text-blue-600">1.8%</div>
          <div className="text-xs text-slate-600 font-medium">Well below 5.0% threshold</div>
        </div>
      </div>
    </div>
  );
}
