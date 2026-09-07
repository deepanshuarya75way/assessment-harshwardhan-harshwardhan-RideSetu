'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR, formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { Wallet, ArrowLeft, CheckCircle2, AlertCircle, Clock, Building2, ShieldCheck, FileText } from 'lucide-react';

export default function PartnerPayoutDetailPage({ params }: { params: { payoutId: string } }) {
  const [payout, setPayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vendor/payouts/${params.payoutId}`);
        const data = await res.json();
        if (data.payout) {
          setPayout(data.payout);
        } else {
          setError(data.error || 'Failed to load payout details');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading payout');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [params.payoutId]);

  if (loading) return <DashboardSkeleton />;

  if (error || !payout) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-slate-900">Payout Record Not Found</h2>
        <p className="text-xs text-slate-600 font-medium">{error || 'The requested payout record does not exist or access is restricted.'}</p>
        <Link href="/partner/payouts" className="inline-block px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">
          ← Back to Payouts History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-16">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/partner/payouts" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black font-heading text-slate-900">Payout Breakdown Details</h1>
            <span className="text-xs text-slate-500 font-medium">Ref ID: {payout.payoutId}</span>
          </div>
        </div>

        <StatusBadge status={payout.status} />
      </div>

      {/* Primary Financial Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Payout Amount</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{formatINR(payout.netAmount)}</div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-300 space-y-1 font-medium">
            <div>Beneficiary: <strong className="text-white">{payout.vendorName}</strong></div>
            <div>Bank Ref: <strong className="text-white">{payout.bankAccountRef}</strong></div>
            <div>Status: <strong className="text-emerald-400">{payout.status}</strong></div>
          </div>
        </div>

        {/* Calculation Table */}
        <div className="space-y-3 text-xs">
          <h4 className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">Server-Authoritative Financial Calculation</h4>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-300 font-medium">Gross Rental Amount (Base + Delivery)</span>
            <span className="font-black text-white">{formatINR(payout.grossAmount)}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-300 font-medium">RideSetu Platform Commission ({payout.commissionPercentage}%)</span>
            <span className="font-black text-rose-400">-{formatINR(payout.platformCommission)}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-300 font-medium">GST Tax Collected on Platform Fee (18%)</span>
            <span className="font-black text-amber-300">{formatINR(payout.taxes)}</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-black text-sm">
            <span>Net Vendor Settlement Amount</span>
            <span>{formatINR(payout.netAmount)}</span>
          </div>
        </div>
      </div>

      {/* Booking Line Item Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-black font-heading text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" /> Associated Booking Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Booking Number</span>
            <span className="text-sm font-black text-slate-900">{payout.bookingNumber}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Vehicle Rented</span>
            <span className="text-sm font-black text-slate-900">{payout.vehicleName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Payout Created</span>
            <span className="text-xs font-bold text-slate-800">{formatDateTime(payout.createdAt)}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Settlement Date</span>
            <span className="text-xs font-bold text-slate-800">{payout.paidAt ? formatDateTime(payout.paidAt) : 'Pending Settlement'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
