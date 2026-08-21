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
  Camera,
  Gauge,
  Fuel,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function VendorReturnInspectionPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [pickupReport, setPickupReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Return Inspection Form State
  const [returnOdometer, setReturnOdometer] = useState<number>(4550);
  const [returnFuel, setReturnFuel] = useState<number>(100);
  const [vendorAgentName, setVendorAgentName] = useState<string>('Partner Agent');
  const [damageDescription, setDamageDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Return Photos
  const [returnPhotos, setReturnPhotos] = useState({
    frontUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    backUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    leftUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    rightUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    meterUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    dashboardUrl: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
  });

  // Scratches List
  const [returnScratches, setReturnScratches] = useState<
    Array<{ id: string; zone: string; description: string; severity: 'MINOR' | 'MODERATE' | 'MAJOR' }>
  >([]);
  const [newZone, setNewZone] = useState('Front Mudguard');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'MINOR' | 'MODERATE' | 'MAJOR'>('MINOR');

  useEffect(() => {
    const fetchHandover = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/bookings/${params.bookingId}/handover`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load booking handover data.');
        }
        setBooking(data.booking);
        const pReport = data.comparison?.pickupReport;
        setPickupReport(pReport);
        if (pReport?.odometerReading) {
          setReturnOdometer(pReport.odometerReading + 50);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading return inspection page.');
      } finally {
        setLoading(false);
      }
    };

    if (params.bookingId) fetchHandover();
  }, [params.bookingId]);

  const handleAddScratch = () => {
    if (!newDesc.trim()) return;
    setReturnScratches([
      ...returnScratches,
      {
        id: `sc_ret_${Date.now()}`,
        zone: newZone,
        description: newDesc.trim(),
        severity: newSeverity,
      },
    ]);
    setNewDesc('');
  };

  const handleRemoveScratch = (id: string) => {
    setReturnScratches(returnScratches.filter((s) => s.id !== id));
  };

  // Calculations
  const handoverOdometer = pickupReport?.odometerReading || booking?.vehicleId?.odometer || 0;
  const kmTravelled = Math.max(0, returnOdometer - handoverOdometer);
  const isOdometerInvalid = returnOdometer < handoverOdometer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOdometerInvalid) {
      setErrorMsg('Return odometer cannot be lower than handover odometer.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`/api/bookings/${params.bookingId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: booking.vehicleId._id || booking.vehicleId,
          returnOdometerReading: Number(returnOdometer),
          returnFuelBatteryLevel: Number(returnFuel),
          returnScratches,
          returnPhotos,
          vendorAgentName,
          damageDescription,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit return inspection.');
      }

      setSuccessMsg(data.message || 'Return inspection recorded successfully.');
      setTimeout(() => {
        router.push('/partner/bookings');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Return inspection submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const vehicle = booking?.vehicleId || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/partner/bookings')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase">
              Return Check-In
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading mt-0.5">
              Vehicle Return Inspection
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Booking Ref: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{booking?.bookingNumber}</span>
            </p>
          </div>
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

      {/* BEFORE vs AFTER COMPARISON PANEL */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 space-y-4">
        <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> BEFORE HANDOVER vs AFTER RETURN COMPARISON
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Handover Odometer</span>
            <span className="text-base font-black text-slate-900 dark:text-white font-mono font-heading">
              {handoverOdometer} KM
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Return Odometer</span>
            <span className={`text-base font-black font-mono font-heading ${isOdometerInvalid ? 'text-rose-500' : 'text-emerald-500'}`}>
              {returnOdometer} KM
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-amber-500 uppercase block">Distance Travelled</span>
            <span className="text-lg font-black text-amber-500 font-heading">
              {kmTravelled} KM
            </span>
          </div>
        </div>

        {isOdometerInvalid && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Return odometer cannot be lower than handover odometer.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Return Readings */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" /> Return Meter & Fuel Level
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Return Odometer (KM) *</label>
              <input
                type="number"
                required
                min={handoverOdometer}
                value={returnOdometer}
                onChange={(e) => setReturnOdometer(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold text-sm focus:border-amber-400 focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Return Fuel Level ({returnFuel}%) *</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={returnFuel}
                onChange={(e) => setReturnFuel(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Damage Reporting Toggle */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 font-heading flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Damage & Discrepancy Assessment
          </h2>

          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">
              New Damage / Incident Notes (Leave blank if zero damage)
            </label>
            <textarea
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              rows={2}
              placeholder="Describe any new scratch, dent, or missing accessory observed upon return..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-xs font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/partner/bookings')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold min-h-[44px]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || isOdometerInvalid}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 min-h-[44px]"
          >
            {submitting ? 'Submitting Return...' : 'Complete Return Inspection'}
          </button>
        </div>
      </form>
    </div>
  );
}
