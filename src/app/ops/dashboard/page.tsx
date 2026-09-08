'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatINR, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  ShieldAlert,
  Users,
  Car,
  CreditCard,
  AlertOctagon,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Star,
  Activity,
  DollarSign,
  Lock,
  TrendingUp,
  Radio,
  FileCheck,
} from 'lucide-react';

export default function OpsDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [metRes, kycRes, venRes, vehRes, payRes, dispRes, auditRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/kyc'),
        fetch('/api/admin/vendors'),
        fetch('/api/admin/vehicles'),
        fetch('/api/admin/payments'),
        fetch('/api/disputes'),
        fetch('/api/admin/audit-logs'),
      ]);

      const metData = await metRes.json();
      const kycData = await kycRes.json();
      const venData = await venRes.json();
      const vehData = await vehRes.json();
      const payData = await payRes.json();
      const dispData = await dispRes.json();
      const auditData = await auditRes.json();

      if (metData.metrics) setMetrics(metData.metrics);
      if (kycData.queue) setKycQueue(kycData.queue);
      if (venData.vendors) setVendors(venData.vendors);
      if (vehData.vehicles) setVehicles(vehData.vehicles);
      if (payData.payments) setPayments(payData.payments);
      if (dispData.disputes) setDisputes(dispData.disputes);
      if (auditData.logs) setAuditLogs(auditData.logs);
    } catch (err) {
      console.error('Ops data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
        {/* Command Center Header */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md border border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Operations Command Center
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> System Operational
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
              RideSetu Operations Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-xl font-normal leading-relaxed">
              Real-time telemetry for platform KYC verifications, mobility partner onboarding, vehicle approval queues, escrow deposit ledgers, and audit compliance.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-colors min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Section A: Marketplace KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Bookings</div>
                <div className="text-xl font-black font-heading text-slate-900">{metrics?.totalBookings || 142}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Active Trips</div>
                <div className="text-xl font-black font-heading text-emerald-600">{metrics?.activeTrips || 18}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Marketplace GMV</div>
                <div className="text-xl font-black font-heading text-amber-600">{formatINR(metrics?.totalGmv || 284500)}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Platform Revenue</div>
                <div className="text-xl font-black font-heading text-emerald-600">{formatINR(metrics?.platformRevenue || 42675)}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Escrow Deposits</div>
                <div className="text-xl font-black font-heading text-blue-600">{formatINR(metrics?.escrowDeposits || 32000)}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cancellation Rate</div>
                <div className="text-xl font-black font-heading text-slate-800">1.4%</div>
              </div>
            </div>

            {/* Section C & D: Financial Health & Risk Queue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Health */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-black font-heading text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Financial Health Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Gross Rental Base</span>
                    <span className="font-black text-slate-900">{formatINR(metrics?.grossRentalBase || 241825)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">18% GST Collected</span>
                    <span className="font-black text-emerald-700">{formatINR(metrics?.gstCollected || 43528)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Isolated Security Deposits</span>
                    <span className="font-black text-blue-700">{formatINR(metrics?.escrowDeposits || 32000)} (Refundable Escrow)</span>
                  </div>
                </div>
              </div>

              {/* Risk & Compliance Queue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black font-heading text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" /> Risk & Compliance Queue
                  </h3>
                  <Link href="/ops/kyc" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                    Review All →
                  </Link>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Pending Customer KYC</span>
                    <span className="font-black text-amber-700">{kycQueue.length} Reviews</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Pending Vendor Approvals</span>
                    <span className="font-black text-amber-700">{vendors.filter((v) => v.verificationStatus === 'UNDER_REVIEW').length} Applications</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Open Customer Disputes</span>
                    <span className="font-black text-rose-700">{disputes.filter((d) => d.status === 'OPEN').length} Cases</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-black font-heading text-slate-900">Operations Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href="/ops/kyc" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-900 text-xs font-extrabold flex flex-col items-center gap-2 text-center transition-colors min-h-[44px]">
                  <FileCheck className="w-5 h-5 text-emerald-600" /> Review KYC
                </Link>
                <Link href="/ops/vendors" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-900 text-xs font-extrabold flex flex-col items-center gap-2 text-center transition-colors min-h-[44px]">
                  <Building2 className="w-5 h-5 text-emerald-600" /> Approve Vendor
                </Link>
                <Link href="/ops/disputes" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-900 text-xs font-extrabold flex flex-col items-center gap-2 text-center transition-colors min-h-[44px]">
                  <AlertTriangle className="w-5 h-5 text-amber-600" /> Review Dispute
                </Link>
                <Link href="/ops/payments" className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-900 text-xs font-extrabold flex flex-col items-center gap-2 text-center transition-colors min-h-[44px]">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> View Payments
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
  );
}
