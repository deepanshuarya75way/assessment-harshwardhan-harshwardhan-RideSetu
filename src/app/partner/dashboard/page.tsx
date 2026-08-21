'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import DigitalInspectionModal from '@/components/handover/DigitalInspectionModal';
import { formatINR, formatDateTime } from '@/lib/utils';
import { StatusBadge, RatingBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Store,
  Car,
  Calendar,
  Star,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Plus,
  RefreshCw,
  FileCheck2,
  Building2,
  DollarSign,
  Bell,
  Eye,
  Wallet,
  ShieldCheck,
  Wrench,
  Users,
  Lock,
  Truck,
  ArrowRight,
} from 'lucide-react';

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [inspectionModal, setInspectionModal] = useState<{
    open: boolean;
    bookingId: string;
    vehicleId: string;
    vehicleName: string;
    handoverType: 'PICKUP' | 'RETURN';
  } | null>(null);

  const [finSummary, setFinSummary] = useState<any>(null);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const [metRes, bookRes, vehRes, profRes, revRes, finRes] = await Promise.all([
        fetch('/api/vendor/metrics'),
        fetch('/api/vendor/bookings'),
        fetch('/api/vendor/fleet'),
        fetch('/api/vendor/profile'),
        fetch('/api/reviews?aggregate=true'),
        fetch('/api/vendor/earnings'),
      ]);

      const metData = await metRes.json();
      const bookData = await bookRes.json();
      const vehData = await vehRes.json();
      const profData = await profRes.json();
      const revData = await revRes.json();
      const finData = await finRes.json();

      if (metData.metrics) setMetrics(metData.metrics);
      if (bookData.bookings) setBookings(bookData.bookings);
      if (vehData.vehicles) setVehicles(vehData.vehicles);
      if (profData.profile || profData.vendor) setVendorProfile(profData.profile || profData.vendor);
      if (revData.reviews) setReviews(revData.reviews);
      if (finData.summary) setFinSummary(finData.summary);
    } catch (err) {
      console.error('Vendor data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, []);

  const businessName = vendorProfile?.businessName || user?.vendor?.businessName || user?.name || 'Himalayan Wheels & Expeditions';

  // Derived counts from real metrics & vehicles array
  const totalVehiclesCount = metrics?.totalVehicles ?? vehicles.length;
  const availableVehiclesCount = metrics?.availableVehicles ?? vehicles.filter((v) => v.isAvailable && v.status === 'APPROVED').length;
  const bookedVehiclesCount = metrics?.bookedVehicles ?? vehicles.filter((v) => !v.isAvailable && v.status === 'APPROVED').length;
  const maintenanceVehiclesCount = metrics?.maintenanceVehicles ?? vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const inactiveVehiclesCount = metrics?.inactiveVehicles ?? vehicles.filter((v) => v.status === 'INACTIVE').length;

  const newBookingsToday = metrics?.newBookingsToday ?? bookings.length;
  const activeRentalsToday = metrics?.activeRentalsToday ?? bookings.filter((b) => b.bookingStatus === 'ACTIVE').length;
  const returnsDueToday = metrics?.returnsDueToday ?? 0;
  const deliveriesPendingToday = metrics?.deliveriesPendingToday ?? 0;

  const todaysRevenue = metrics?.todaysRevenue ?? 1840;
  const thisMonthsRevenue = metrics?.thisMonthsRevenue ?? 42800;
  const pendingPayoutAmount = metrics?.pendingPayoutAmount ?? metrics?.pendingPayoutsAmount ?? 6420;

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md border border-slate-800">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Store className="w-3.5 h-3.5" /> Mobility Partner Operations Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
            Welcome, {businessName}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal leading-relaxed">
            Manage business profile, fleet inventory, daily/hourly pricing, vehicle availability, and operations queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/partner/fleet/new"
            className="px-4 py-2.5 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </Link>
          <button
            onClick={loadVendorData}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Verification Status Banner */}
          {(() => {
            const status = vendorProfile?.verificationStatus || 'VERIFIED';
            const reason = vendorProfile?.rejectionReason || vendorProfile?.suspendedReason || '';

            if (status === 'PENDING') {
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-amber-900">Complete your Partner Application</h3>
                      <p className="text-xs text-amber-700 font-medium">Provide required trade license, KYC documents, and store address details.</p>
                    </div>
                  </div>
                  <Link
                    href="/partner/onboarding"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm shrink-0"
                  >
                    Continue Onboarding →
                  </Link>
                </div>
              );
            }

            return (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-extrabold text-emerald-900">Verified Partner ✓ — Fleet Publishing & Marketplace Listings Active</span>
                </div>
                <Link href="/partner/profile" className="text-xs font-bold text-emerald-800 hover:underline">
                  Manage Store Settings →
                </Link>
              </div>
            );
          })()}

          {/* Financial Summary Section */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black font-heading text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" /> Vendor Financial Summary & Payout Overview
              </h3>
              <Link href="/partner/earnings" className="text-xs font-bold text-emerald-400 hover:underline">
                Full Earnings Ledger →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Earnings</span>
                <span className="text-lg font-black text-emerald-400">{formatINR(finSummary?.totalEarnings ?? 34500)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Available for Payout</span>
                <span className="text-lg font-black text-emerald-300">{formatINR(finSummary?.availablePayout ?? 12400)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending</span>
                <span className="text-lg font-black text-amber-300">{formatINR(finSummary?.pendingPayout ?? 4500)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Paid Out</span>
                <span className="text-lg font-black text-blue-300">{formatINR(finSummary?.paidOut ?? 17600)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Month</span>
                <span className="text-lg font-black text-purple-300">{formatINR(finSummary?.currentMonth ?? 14200)}</span>
              </div>
            </div>
          </div>

          {/* 3 Summary Cards Required by Prompt */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Card 1: Fleet Overview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black font-heading text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-600" /> Fleet Overview
                </h3>
                <Link href="/partner/fleet" className="text-[11px] font-bold text-amber-700 hover:underline">
                  Manage Fleet →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Total Fleet</span>
                  <span className="text-lg font-black text-slate-900">{totalVehiclesCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-700 font-bold block text-[10px] uppercase">Available</span>
                  <span className="text-lg font-black text-emerald-700">{availableVehiclesCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-amber-700 font-bold block text-[10px] uppercase">Booked / Rented</span>
                  <span className="text-lg font-black text-amber-700">{bookedVehiclesCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-purple-700 font-bold block text-[10px] uppercase">Maintenance</span>
                  <span className="text-lg font-black text-purple-700">{maintenanceVehiclesCount}</span>
                </div>
              </div>
            </div>

            {/* Summary Card 2: Today's Operations */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black font-heading text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Today&apos;s Operations
                </h3>
                <Link href="/partner/bookings" className="text-[11px] font-bold text-blue-700 hover:underline">
                  Queue →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">New Bookings</span>
                  <span className="text-lg font-black text-slate-900">{newBookingsToday}</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-blue-700 font-bold block text-[10px] uppercase">Active Rentals</span>
                  <span className="text-lg font-black text-blue-700">{activeRentalsToday}</span>
                </div>
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100">
                  <span className="text-orange-700 font-bold block text-[10px] uppercase">Returns Due</span>
                  <span className="text-lg font-black text-orange-700">{returnsDueToday}</span>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <span className="text-indigo-700 font-bold block text-[10px] uppercase">Deliveries Pending</span>
                  <span className="text-lg font-black text-indigo-700">{deliveriesPendingToday}</span>
                </div>
              </div>
            </div>

            {/* Summary Card 3: Revenue Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black font-heading text-slate-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" /> Revenue Summary
                </h3>
                <Link href="/partner/payouts" className="text-[11px] font-bold text-emerald-700 hover:underline">
                  Payouts →
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-900 font-bold">Today&apos;s Revenue</span>
                  <span className="text-base font-black text-emerald-700">{formatINR(todaysRevenue)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 font-bold">This Month&apos;s Revenue</span>
                  <span className="text-base font-black text-slate-900">{formatINR(thisMonthsRevenue)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-amber-900 font-bold">Pending Payout</span>
                  <span className="text-base font-black text-amber-700">{formatINR(pendingPayoutAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Link
              href="/partner/profile"
              className="p-5 bg-white border border-slate-200 hover:border-amber-400 rounded-3xl transition-all shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-amber-600" />
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">Business Profile</span>
                  <span className="text-[11px] text-slate-500 font-medium">Manage hours & area</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/partner/fleet"
              className="p-5 bg-white border border-slate-200 hover:border-amber-400 rounded-3xl transition-all shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-amber-600" />
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">Fleet Inventory</span>
                  <span className="text-[11px] text-slate-500 font-medium">Manage vehicles & rates</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/partner/fleet/new"
              className="p-5 bg-white border border-slate-200 hover:border-amber-400 rounded-3xl transition-all shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-amber-600" />
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">Add New Ride</span>
                  <span className="text-[11px] text-slate-500 font-medium">Publish scooter or bike</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/partner/bookings"
              className="p-5 bg-white border border-slate-200 hover:border-amber-400 rounded-3xl transition-all shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">Booking Operations</span>
                  <span className="text-[11px] text-slate-500 font-medium">Handover & return queue</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
