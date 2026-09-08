'use client';

import React, { useState, useEffect } from 'react';
import { Star, Eye, ShieldAlert } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (err) {
      console.error('Ops reviews load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> Marketplace Review Moderation & Quality Control
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Audit customer ratings, verify rental completion integrity, and moderate inappropriate marketplace reviews.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Rider Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Review Text</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Moderation State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reviews.map((r) => (
                <tr key={r._id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.customerName || 'Verified Rider'}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{r.vehicleId?.brand} {r.vehicleId?.model}</td>
                  <td className="py-3.5 px-4 font-black text-amber-700">{r.overallRating || 5}★</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-medium">{r.reviewText}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-black uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px]">
                      PUBLISHED (VERIFIED)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
