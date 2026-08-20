'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ShieldCheck, ArrowRight, Compass, Bike, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';

export default function CustomerTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/customer/trips?filter=${filter}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load trips');
      }

      setTrips(data.trips || []);
    } catch (err: any) {
      setError(err.message || 'Error loading trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PREPARING':
        return <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">✓ Confirmed</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200 animate-pulse">🛵 On the way</span>;
      case 'READY_FOR_HANDOVER':
      case 'PRE_PICKUP':
        return <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200">📍 Ready for Pickup</span>;
      case 'ACTIVE':
      case 'HANDED_OVER':
        return <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] shadow-sm">🏍 Rental Active</span>;
      case 'RETURN_PENDING':
      case 'RETURN_INSPECTION':
        return <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">⏰ Return Pending</span>;
      case 'EXTENDED':
        return <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px] border border-purple-200">⏳ Rental Extended</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px]">✓ Completed</span>;
      case 'DISPUTED':
        return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px]">⚠️ Under Review</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">RideSetu Mobility Vault</div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">My Trips & Bookings</h1>
          </div>

          <Link
            href="/vendors"
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-bold text-xs shadow-md shadow-brand-orange/20 flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Book Another Ride</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filter === tab
                  ? 'bg-navy-950 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading your trips...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-brand-orange rounded-2xl flex items-center justify-center mx-auto">
              <Bike className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">No {filter !== 'ALL' ? filter.toLowerCase() : ''} trips found</h3>
              <p className="text-xs text-slate-500 font-semibold">
                You don&apos;t have any rental bookings under this category yet.
              </p>
            </div>
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-navy-950 text-white font-bold text-xs shadow-lg hover:bg-black transition-all"
            >
              <span>Explore Available Rides</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Trips Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trips.map((trip) => {
              const vehicle = trip.vehicle || {};
              const isGroup = !!trip.groupBookingId;

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {isGroup ? 'Group Booking' : 'Rental Booking'}
                      </div>
                      <div className="text-xs font-black text-slate-900">
                        #{trip.bookingNumber}
                      </div>
                    </div>
                    {getStatusBadge(trip.bookingStatus)}
                  </div>

                  {/* Body Content */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-16 bg-slate-50 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border border-slate-100">
                      <img
                        src={getVehicleImage(vehicle)}
                        alt={getVehicleAltText(vehicle)}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-navy-950">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Vendor: <span className="text-slate-800 font-bold">{trip.vendor?.businessName}</span>
                      </p>
                      <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-orange shrink-0" />
                        <span>
                          {new Date(trip.pickupDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(trip.returnDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTAs */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Paid</div>
                      <div className="text-sm font-black text-emerald-950">₹{trip.pricing?.totalPayable?.toLocaleString('en-IN')}</div>
                    </div>

                    <Link
                      href={`/dashboard/trips/${trip.id}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>View Trip</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
