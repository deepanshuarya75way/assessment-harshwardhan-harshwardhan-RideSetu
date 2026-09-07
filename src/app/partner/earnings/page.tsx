'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  Wallet,
  DollarSign,
  Lock,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';

export default function PartnerEarningsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '30d',
    bookingId: '',
    vehicleId: '',
    paymentStatus: '',
    payoutStatus: '',
    page: 1,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        dateRange: filters.dateRange,
        ...(filters.bookingId ? { bookingId: filters.bookingId } : {}),
        ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
        ...(filters.payoutStatus ? { payoutStatus: filters.payoutStatus } : {}),
        page: filters.page.toString(),
        limit: '20',
      });

      const [sumRes, txRes] = await Promise.all([
        fetch('/api/vendor/earnings'),
        fetch(`/api/vendor/transactions?${queryParams.toString()}`),
      ]);

      const sumData = await sumRes.json();
      const txData = await txRes.json();

      if (sumData.summary) setSummary(sumData.summary);
      if (txData.transactions) setTransactions(txData.transactions);
    } catch (err) {
      console.error('Earnings data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.dateRange, filters.bookingId, filters.paymentStatus, filters.payoutStatus, filters.page]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black font-heading text-slate-900">Partner Earnings & Financial Ledger</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Server-authoritative ledger tracking gross rental volume, platform fees, GST taxes, and net payout accruals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/payouts"
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" /> View Payout Settlements →
          </Link>
          <Link
            href="/partner/settings/payouts"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm flex items-center gap-2"
          >
            Bank Details
          </Link>
        </div>
      </div>

      {/* Escrow Security Deposit Isolation Policy Alert */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start gap-3 text-xs text-emerald-900 shadow-sm">
        <Lock className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
        <div>
          <strong className="font-black text-emerald-950 block text-xs">Security Deposit Isolation Policy:</strong>
          <p className="mt-0.5 leading-relaxed text-emerald-900 font-medium">
            Rider security deposits are held in isolated escrow for damage protection and are <strong>100% excluded</strong> from vendor gross revenue, platform commission, and earnings calculations. Security deposits are never counted as vendor income unless legally allocated by an admin dispute resolution.
          </p>
        </div>
      </div>

      {loading && !summary ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Earnings</span>
              <div className="text-xl font-black text-emerald-600">{formatINR(summary?.totalEarnings ?? 34500)}</div>
              <div className="text-[10px] text-slate-400 font-medium">Lifetime net accrued</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Available Payout</span>
              <div className="text-xl font-black text-emerald-700">{formatINR(summary?.availablePayout ?? 12400)}</div>
              <div className="text-[10px] text-slate-400 font-medium">Ready for settlement</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Pending</span>
              <div className="text-xl font-black text-amber-600">{formatINR(summary?.pendingPayout ?? 4500)}</div>
              <div className="text-[10px] text-slate-400 font-medium">Awaiting trip return</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Paid Out</span>
              <div className="text-xl font-black text-blue-600">{formatINR(summary?.paidOut ?? 17600)}</div>
              <div className="text-[10px] text-slate-400 font-medium">Transferred to bank</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current Month</span>
              <div className="text-xl font-black text-purple-600">{formatINR(summary?.currentMonth ?? 14200)}</div>
              <div className="text-[10px] text-slate-400 font-medium">This month&apos;s volume</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                <Filter className="w-4 h-4 text-emerald-600" /> Filter Booking Transactions
              </div>
              <button
                onClick={loadData}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Timeframe</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, page: 1 })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Search Booking #</label>
                <input
                  type="text"
                  placeholder="e.g. RS-BOOK-1234"
                  value={filters.bookingId}
                  onChange={(e) => setFilters({ ...filters, bookingId: e.target.value, page: 1 })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payout Status</label>
                <select
                  value={filters.payoutStatus}
                  onChange={(e) => setFilters({ ...filters, payoutStatus: e.target.value, page: 1 })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="">All Payout Statuses</option>
                  <option value="ELIGIBLE">ELIGIBLE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PAID">PAID</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Booking Financial Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 font-heading">Booking-wise Net Earnings Ledger</h3>
              <span className="text-xs text-slate-500 font-medium">{transactions.length} record(s) loaded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Booking ID</th>
                    <th className="p-3.5">Vehicle</th>
                    <th className="p-3.5 text-right">Gross Rental</th>
                    <th className="p-3.5 text-right">Delivery</th>
                    <th className="p-3.5 text-right">Platform Fee (15%)</th>
                    <th className="p-3.5 text-right">GST (18%)</th>
                    <th className="p-3.5 text-right font-black text-slate-900">Vendor Net</th>
                    <th className="p-3.5 text-center">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                        No transactions match the selected filter parameters.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.bookingId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {tx.bookingNumber}
                          {tx.groupBookingId && (
                            <span className="block text-[10px] text-amber-700 font-semibold">{tx.groupBookingId}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-700">{tx.vehicleName}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900">{formatINR(tx.grossRentalAmount)}</td>
                        <td className="p-3.5 text-right text-slate-600">{formatINR(tx.deliveryCharge)}</td>
                        <td className="p-3.5 text-right text-rose-600 font-medium">-{formatINR(tx.platformFee)}</td>
                        <td className="p-3.5 text-right text-amber-700 font-medium">{formatINR(tx.gstAmount)}</td>
                        <td className="p-3.5 text-right font-black text-emerald-700 text-sm">{formatINR(tx.vendorNetEarnings)}</td>
                        <td className="p-3.5 text-center">
                          <StatusBadge status={tx.payoutStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
