'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function PartnerCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const res = await fetch('/api/vendor/bookings');
        const data = await res.json();
        if (data.bookings) setBookings(data.bookings);
      } catch (err) {
        console.error('Calendar bookings error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-600" /> Fleet Schedule Calendar
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Visual rental booking timelines and maintenance availability slots.
          </p>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No scheduled rentals"
          description="Rider bookings and maintenance blocks will display on your schedule calendar."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-700">#{b.bookingCode}</span>
                  <span className="font-extrabold text-slate-900 text-sm font-heading">{b.vehicleId?.brand} {b.vehicleId?.model}</span>
                </div>
                <p className="text-slate-600 font-medium">Schedule: {formatDateTime(b.pickupDateTime)} → {formatDateTime(b.returnDateTime)}</p>
              </div>
              <StatusBadge status={b.status} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
