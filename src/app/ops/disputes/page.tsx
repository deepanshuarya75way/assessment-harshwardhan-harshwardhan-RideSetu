'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deductedAmount, setDeductedAmount] = useState(500);
  const [adminNotes, setAdminNotes] = useState('Reviewed damage evidence photos. Deduction approved.');

  const fetchDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ops/disputes');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load disputes');
      }

      setDisputes(data.disputes || []);
    } catch (err: any) {
      setError(err.message || 'Error loading disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (disputeId: string, action: 'APPROVE_DAMAGE' | 'REJECT_DAMAGE') => {
    try {
      const res = await fetch(`/api/ops/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          deductedAmount: Number(deductedAmount),
          adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dispute resolution failed');
      }

      setResolvingId(null);
      fetchDisputes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">RideSetu Operations</div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Damage Disputes Console</h1>
          </div>

          <button
            type="button"
            onClick={() => fetchDisputes()}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading damage disputes...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 max-w-md mx-auto">
            <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900">Zero Unresolved Disputes</h3>
            <p className="text-xs text-slate-500 font-semibold">All vehicle return inspections are clear or resolved.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute._id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      STATUS: {dispute.status}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">Claimed Amount: ₹{dispute.claimedAmount}</h3>
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-500">
                    Customer: {dispute.customerId?.name || 'Rider'} ({dispute.customerId?.phone})
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="font-extrabold text-slate-800">Damage Description</div>
                  <p className="text-slate-600 font-medium">{dispute.description}</p>
                </div>

                {resolvingId === dispute._id ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-amber-900">Approved Deposit Deduction (₹)</label>
                      <input
                        type="number"
                        value={deductedAmount}
                        onChange={(e) => setDeductedAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-amber-900">Admin Resolution Notes</label>
                      <input
                        type="text"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolve(dispute._id, 'APPROVE_DAMAGE')}
                        className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl"
                      >
                        Approve Claim & Deduct ₹{deductedAmount}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(dispute._id, 'REJECT_DAMAGE')}
                        className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                      >
                        Reject Claim & Full Refund
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolvingId(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setResolvingId(dispute._id)}
                    className="px-4 py-2.5 bg-navy-950 hover:bg-black text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Resolve Damage Claim
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
