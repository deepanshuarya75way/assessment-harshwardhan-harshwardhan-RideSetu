'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR, formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { Wallet, ArrowRight, RefreshCw, Lock, ShieldCheck, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/payouts?status=${statusFilter}`);
      const data = await res.json();
      if (data.payouts) setPayouts(data.payouts);
    } catch (err) {
      console.error('Payouts load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black font-heading text-slate-900">Payout Settlement History</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Track bank settlement transfers, eligibility statuses, and payout disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/earnings"
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs shadow-sm"
          >
            ← Back to Earnings
          </Link>
          <Link
            href="/partner/settings/payouts"
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm"
          >
            Bank Account Settings
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
        {['ALL', 'ELIGIBLE', 'PENDING', 'PROCESSING', 'PAID', 'ON_HOLD', 'FAILED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl font-black transition-colors shrink-0 ${
              statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 font-heading">Payout Records ({payouts.length})</h3>
            <button onClick={loadPayouts} className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Payout ID</th>
                  <th className="p-3.5">Booking Ref</th>
                  <th className="p-3.5 text-right">Gross Amount</th>
                  <th className="p-3.5 text-right">Commission</th>
                  <th className="p-3.5 text-right font-black text-slate-900">Net Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No payout settlement records found for this status.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 font-mono text-[11px]">{p.payoutId.substring(0, 12)}...</td>
                      <td className="p-3.5 font-bold text-slate-700">{p.bookingNumber}</td>
                      <td className="p-3.5 text-right text-slate-800">{formatINR(p.grossAmount)}</td>
                      <td className="p-3.5 text-right text-rose-600">-{formatINR(p.platformCommission)}</td>
                      <td className="p-3.5 text-right font-black text-emerald-700 text-sm">{formatINR(p.netAmount)}</td>
                      <td className="p-3.5 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{formatDateTime(p.createdAt)}</td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/partner/payouts/${p.payoutId}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-[11px] inline-flex items-center gap-1"
                        >
                          Details <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
