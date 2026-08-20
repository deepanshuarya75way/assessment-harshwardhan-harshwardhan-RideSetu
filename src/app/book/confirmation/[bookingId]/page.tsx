'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Calendar, MapPin, ShieldCheck, ArrowRight, Home, Bike, Fuel, Clock, Truck } from 'lucide-react';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;

    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/customer/trips/${bookingId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load booking details');
        }

        setTrip(data.trip);
      } catch (err: any) {
        setError(err.message || 'Booking details unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading your confirmed booking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-900">Booking Confirmed!</h2>
            <p className="text-xs text-slate-500">Your payment was successful and your reservation is confirmed.</p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/dashboard/trips"
                className="w-full py-3 bg-navy-900 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition-all"
              >
                Go to My Trips
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDelivery = trip.pickupType === 'DOORSTEP_DELIVERY' || trip.pickupType === 'HOSTEL_DELIVERY' || trip.deliveryLocation?.locationType === 'DOORSTEP';
  const vehicle = trip.vehicle || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12 w-full space-y-6">
        {/* Celebration Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-navy-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">Payment Successful</div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">Booking Confirmed!</h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-md mx-auto">
              {isDelivery
                ? 'Your vendor is preparing your vehicle for doorstep delivery.'
                : 'Your vehicle will be ready for pickup at the vendor hub.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-extrabold text-amber-300 border border-white/10">
            Booking ID: #{trip.bookingNumber}
          </div>
        </div>

        {/* Booking Card Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          {/* Vehicle Info */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-24 h-20 bg-slate-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
              <img
                src={getVehicleImage(vehicle)}
                alt={getVehicleAltText(vehicle)}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                {vehicle.category || 'SCOOTER'}
              </span>
              <h2 className="text-lg font-black text-navy-950">
                {vehicle.brand} {vehicle.model}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Partner: <span className="text-slate-800">{trip.vendor?.businessName || 'RideSetu Partner'}</span>
              </p>
            </div>
          </div>

          {/* Trip Timings & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Pickup Schedule
              </div>
              <div className="text-sm font-black text-slate-900">
                {new Date(trip.pickupDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-slate-500 font-bold">
                {new Date(trip.pickupDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Return Schedule
              </div>
              <div className="text-sm font-black text-slate-900">
                {new Date(trip.returnDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-slate-500 font-bold">
                {new Date(trip.returnDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase text-emerald-800">Total Amount Paid</div>
              <div className="text-xl font-black text-emerald-950">₹{trip.pricing?.totalPayable?.toLocaleString('en-IN')}</div>
            </div>
            <div className="text-right text-xs font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Deposit Protection
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/dashboard/trips/${trip.id}`}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-xs shadow-lg shadow-brand-orange/25 text-center flex items-center justify-center gap-2 group transition-all"
            >
              <span>View My Trip</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
