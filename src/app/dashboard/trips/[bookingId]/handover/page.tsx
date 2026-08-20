'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Gauge,
  Fuel,
  Sparkles,
  Check,
} from 'lucide-react';

export default function CustomerHandoverAcceptancePage({
  params,
}: {
  params: { bookingId: string };
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [pickupReport, setPickupReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/bookings/${params.bookingId}/handover`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load handover inspection.');
        }
        setBooking(data.booking);
        setPickupReport(data.comparison?.pickupReport);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading inspection data.');
      } finally {
        setLoading(false);
      }
    };

    if (params.bookingId) fetchInspection();
  }, [params.bookingId]);

  const handleConfirm = async () => {
    if (!acceptedCheckbox) {
      setErrorMsg('Please select the checkbox to accept the recorded vehicle condition.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`/api/bookings/${params.bookingId}/handover/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerSignatureConfirmed: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm handover inspection.');
      }

      setSuccessMsg('Vehicle handover confirmed! Your ride is now ACTIVE.');
      setTimeout(() => {
        router.push(`/dashboard/trips/${params.bookingId}`);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Handover confirmation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const vehicle = booking?.vehicleId || {};
  const photos = pickupReport?.photos || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase">
            Handover Review & Acceptance
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading mt-0.5">
            Review Vehicle Condition Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Booking Ref: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{booking?.bookingNumber}</span>
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Vehicle Summary */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 flex items-center gap-4">
        <div className="w-16 h-12 relative rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
          <Image src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=100&q=80'} alt="" fill className="object-cover" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white font-heading">
            {vehicle.brand} {vehicle.model}
          </h2>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {vehicle.registrationNumber || 'UK07-XX-0000'}
          </span>
        </div>
      </div>

      {/* Handover Readings */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-amber-500" /> Starting Odometer
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono font-heading">
            {pickupReport?.odometerReading || vehicle.odometer || 4500} KM
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-amber-500" /> Starting Fuel Level
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono font-heading">
            {pickupReport?.fuelBatteryLevel ?? 100}%
          </span>
        </div>
      </div>

      {/* Photo Gallery */}
      {photos && (
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white font-heading">Recorded Handover Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Front', url: photos.frontUrl },
              { label: 'Rear', url: photos.backUrl },
              { label: 'Left Side', url: photos.leftUrl },
              { label: 'Right Side', url: photos.rightUrl },
              { label: 'Odometer', url: photos.meterUrl },
            ].map((p, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{p.label}</span>
                <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-200 dark:border-white/10">
                  {p.url && <Image src={p.url} alt={p.label} fill className="object-cover" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Checkbox Agreement */}
      <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
        <input
          type="checkbox"
          id="acceptCondition"
          checked={acceptedCheckbox}
          onChange={(e) => setAcceptedCheckbox(e.target.checked)}
          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer mt-0.5 min-h-[20px] min-w-[20px]"
        />
        <label htmlFor="acceptCondition" className="text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer">
          <strong className="text-emerald-600 dark:text-emerald-400 font-bold block mb-1">Rider Handover Acceptance Agreement:</strong>
          I have inspected the vehicle and accept the recorded condition, starting odometer reading, and fuel level. I agree to operate the vehicle responsibly in accordance with RideSetu policies.
        </label>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || !acceptedCheckbox}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all min-h-[48px]"
        >
          {submitting ? 'Activating Trip...' : 'Accept & Start Trip'}
        </button>
      </div>
    </div>
  );
}
