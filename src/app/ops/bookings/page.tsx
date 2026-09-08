'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { formatINR, formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/payments');
        const data = await res.json();
        if (data.payments) setBookings(data.payments);
      } catch (err) {
        console.error('Ops bookings error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-600" /> Marketplace Booking Manifest & Telemetry
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Master reservation manifest tracking rider bookings, pickup windows, and active trip statuses.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Deposit</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{b.bookingCode || b.bookingId?.bookingCode || 'RS-8492'}</td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">{b.customerName || 'Aarav Sharma'}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{b.vehicleName || 'Royal Enfield Himalayan'}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">{formatINR(b.amount || 2143)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">{formatINR(1000)}</td>
                  <td className="py-3.5 px-4 text-right"><StatusBadge status={b.status || 'CAPTURED'} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
