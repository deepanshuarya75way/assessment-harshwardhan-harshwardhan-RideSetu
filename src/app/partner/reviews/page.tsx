'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        const res = await fetch('/api/reviews?aggregate=true');
        const data = await res.json();
        if (data.reviews) setReviews(data.reviews);
      } catch (err) {
        console.error('Reviews load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <h1 className="text-2xl font-black font-heading text-slate-900">Customer Reviews & Host Feedback</h1>
        </div>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Verified rider ratings and public host responses. Hosts can reply to reviews but cannot modify ratings or verification state.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No customer reviews recorded yet"
          description="Ratings submitted by verified riders after completing trip rentals will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-extrabold text-slate-900 text-sm">{r.customerName || 'Verified Rider'}</span>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: r.overallRating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">{r.reviewText}</p>
              {r.vendorReply?.text && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 font-medium">
                  <strong className="text-amber-800 block text-[11px] uppercase tracking-wider mb-1">Your Public Response:</strong>
                  <p>{r.vendorReply.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
