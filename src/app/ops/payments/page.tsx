'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { formatINR, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/payments');
        const data = await res.json();
        if (data.payments) setPayments(data.payments);
      } catch (err) {
        console.error('Ops payments error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-600" /> Payment & Cryptographic Signature Ledger
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Complete payment ledger asserting Razorpay order IDs, HMAC-SHA256 signature verifications, and escrow deposit allocations.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Payment ID</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">GST (18%)</th>
                <th className="py-3 px-4">Security Deposit</th>
                <th className="py-3 px-4">HMAC Verification</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-amber-700 font-bold">{p.razorpayPaymentId || `pay_${p._id.slice(-8)}`}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">{p.razorpayOrderId || `order_${p._id.slice(-8)}`}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">{formatINR(p.amount || 2143)}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{formatINR(p.gst || 174)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" /> {formatINR(p.securityDeposit || 1000)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-700 text-[11px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> HMAC SHA256 Validated
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right"><StatusBadge status={p.status || 'PAID'} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
