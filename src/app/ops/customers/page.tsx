'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/kyc');
        const data = await res.json();
        if (data.queue) setCustomers(data.queue);
      } catch (err) {
        console.error('Ops customers load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Customer Account & Identity Registry
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Authorized administrative management for rider accounts, KYC statuses, and licence verifications.
          </p>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">DL Number</th>
                <th className="py-3 px-4 text-right rounded-r-xl">KYC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-heading">{c.name || c.customerName}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">{c.phone || '+91 98765 43210'}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{c.email || 'rider@example.com'}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{c.dlNumber || 'UK0720240012345'}</td>
                  <td className="py-3.5 px-4 text-right"><StatusBadge status={c.kycStatus || 'VERIFIED'} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
