'use client';

import React from 'react';
import { Star, Tag, Gift, Percent } from 'lucide-react';

export default function AdminPromotionsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Promotions & Dynamic Coupon Engine</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Manage seasonal discount coupons, first-ride promo codes, and Uttarakhand travel partner referrals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black text-amber-700">RIDEHIMALAYA</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">Active</span>
          </div>
          <div className="text-xl font-black text-slate-900">15% OFF Base Fare</div>
          <div className="text-xs text-slate-600 font-medium">Min. rental 2 days • Max discount ₹500</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black text-amber-700">WELCOME200</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">Active</span>
          </div>
          <div className="text-xl font-black text-slate-900">Flat ₹200 OFF</div>
          <div className="text-xs text-slate-600 font-medium">Valid for new riders on scooter bookings</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black text-amber-700">CHARDAAM2026</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold">Upcoming</span>
          </div>
          <div className="text-xl font-black text-slate-900">10% OFF Expedition</div>
          <div className="text-xs text-slate-600 font-medium">Valid for Himalayan 450 long-haul rentals</div>
        </div>
      </div>
    </div>
  );
}
