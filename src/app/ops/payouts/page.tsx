'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR, formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Play, Lock } from 'lucide-react';

export default function OpsPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ops/payouts?status=${statusFilter}`);
      const data = await res.json();
      if (data.payouts) setPayouts(data.payouts);
    } catch (err) {
      console.error('Admin payouts load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [statusFilter]);

  const handleAction = async (payoutId: string, action: 'APPROVE' | 'HOLD' | 'EXECUTE' | 'RETRY') => {
    try {
      setProcessingId(payoutId);
      const res = await fetch('/api/ops/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Action ${action} executed successfully (TEST MODE).`);
        loadPayouts();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing action');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black font-heading text-slate-900">RideSetu Ops — Vendor Payout Management</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Administrative financial oversight: review pending payouts, place compliance holds, approve settlements, and execute transfers (TEST MODE).
          </p>
        </div>

        <button onClick={loadPayouts} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
        {['ALL', 'ELIGIBLE', 'PENDING', 'PROCESSING', 'PAID', 'ON_HOLD', 'FAILED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl font-black transition-colors shrink-0 ${
              statusFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Payout ID</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Booking Ref</th>
                  <th className="p-3.5 text-right">Gross Amount</th>
                  <th className="p-3.5 text-right">Commission</th>
                  <th className="p-3.5 text-right font-black text-slate-900">Net Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Ops Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No vendor payout records found in this queue status.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 font-mono text-[11px]">{p.payoutId.substring(0, 12)}...</td>
                      <td className="p-3.5 font-bold text-slate-900">{p.vendorName}</td>
                      <td className="p-3.5 text-slate-700">{p.bookingNumber}</td>
                      <td className="p-3.5 text-right text-slate-800">{formatINR(p.grossAmount)}</td>
                      <td className="p-3.5 text-right text-rose-600">-{formatINR(p.platformCommission)}</td>
                      <td className="p-3.5 text-right font-black text-emerald-700 text-sm">{formatINR(p.netAmount)}</td>
                      <td className="p-3.5 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {p.status === 'ELIGIBLE' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleAction(p.id, 'EXECUTE')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            Execute Transfer (TEST)
                          </button>
                        )}
                        {p.status !== 'PAID' && p.status !== 'ON_HOLD' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleAction(p.id, 'HOLD')}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-[11px]"
                          >
                            Hold
                          </button>
                        )}
                        {p.status === 'ON_HOLD' && (
                          <button
                            disabled={processingId === p.id}
                            onClick={() => handleAction(p.id, 'APPROVE')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            Release Hold
                          </button>
                        )}
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
