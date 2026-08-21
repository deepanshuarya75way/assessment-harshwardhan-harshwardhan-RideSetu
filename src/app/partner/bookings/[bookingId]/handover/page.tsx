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
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';

export default function VendorHandoverInspectionPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [odometerReading, setOdometerReading] = useState<number>(4500);
  const [fuelBatteryLevel, setFuelBatteryLevel] = useState<number>(100);
  const [helmetCount, setHelmetCount] = useState<number>(1);
  const [vendorAgentName, setVendorAgentName] = useState<string>('Partner Agent');
  const [remarks, setRemarks] = useState<string>('');

  // 10-Point Checklist
  const [checklist, setChecklist] = useState<
    Record<string, { status: 'PASS' | 'ISSUE'; notes: string }>
  >({
    frontBody: { status: 'PASS', notes: '' },
    rearBody: { status: 'PASS', notes: '' },
    leftSide: { status: 'PASS', notes: '' },
    rightSide: { status: 'PASS', notes: '' },
    headlight: { status: 'PASS', notes: '' },
    indicators: { status: 'PASS', notes: '' },
    mirrors: { status: 'PASS', notes: '' },
    tyres: { status: 'PASS', notes: '' },
    dashboard: { status: 'PASS', notes: '' },
    brakes: { status: 'PASS', notes: '' },
  });

  // Photo URLs
  const [photos, setPhotos] = useState({
    frontUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    backUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    leftUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    rightUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    meterUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    dashboardUrl: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
  });

  // Scratches List
  const [scratches, setScratches] = useState<
    Array<{ id: string; zone: string; description: string; severity: 'MINOR' | 'MODERATE' | 'MAJOR' }>
  >([]);
  const [newZone, setNewZone] = useState('Front Mudguard');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'MINOR' | 'MODERATE' | 'MAJOR'>('MINOR');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/bookings/${params.bookingId}/handover`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load booking handover data.');
        }
        setBooking(data.booking);
        if (data.booking?.vehicleId?.odometer) {
          setOdometerReading(data.booking.vehicleId.odometer);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading handover page.');
      } finally {
        setLoading(false);
      }
    };

    if (params.bookingId) fetchBooking();
  }, [params.bookingId]);

  const toggleChecklist = (key: string, status: 'PASS' | 'ISSUE') => {
    setChecklist((prev) => ({
      ...prev,
      [key]: { ...prev[key], status },
    }));
  };

  const handleAddScratch = () => {
    if (!newDesc.trim()) return;
    setScratches([
      ...scratches,
      {
        id: `sc_${Date.now()}`,
        zone: newZone,
        description: newDesc.trim(),
        severity: newSeverity,
      },
    ]);
    setNewDesc('');
  };

  const handleRemoveScratch = (id: string) => {
    setScratches(scratches.filter((s) => s.id !== id));
  };

  // Validation Checklist
  const missingItems: string[] = [];
  if (!booking) missingItems.push('Booking verified');
  if (odometerReading < 0) missingItems.push('Valid odometer reading');
  if (fuelBatteryLevel < 0 || fuelBatteryLevel > 100) missingItems.push('Fuel / Battery level');
  if (!photos.frontUrl || !photos.backUrl || !photos.leftUrl || !photos.rightUrl || !photos.meterUrl) {
    missingItems.push('All 6 required inspection photos');
  }

  const isFormValid = missingItems.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMsg(`Inspection cannot be submitted. Missing: ${missingItems.join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`/api/bookings/${params.bookingId}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: booking.vehicleId._id || booking.vehicleId,
          odometerReading: Number(odometerReading),
          fuelBatteryLevel: Number(fuelBatteryLevel),
          existingScratches: scratches,
          photos,
          helmetCount,
          accessoriesGiven: ['Helmet', 'RC Copy', 'First Aid Kit'],
          vendorAgentName,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit handover inspection.');
      }

      setSuccessMsg('Inspection Saved Successfully. Waiting for customer confirmation.');
      setTimeout(() => {
        router.push('/partner/bookings');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Inspection submission failed.');
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
  const customerName = booking?.customerDetails?.fullName?.split(' ')[0] || 'Rider';
  const maskedPhone = booking?.customerDetails?.phone || '+91 98765*****';

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
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase">
              Pre-Pickup Check-In
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading mt-0.5">
              Vehicle Handover Inspection
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

      {/* Booking Summary Card */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Vehicle</span>
          <span className="text-sm font-black text-slate-900 dark:text-white font-heading">
            {vehicle.brand} {vehicle.model}
          </span>
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
            {vehicle.registrationNumber || 'UK07-XX-0000'}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Customer</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{customerName}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5">{maskedPhone}</span>
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Pickup Location</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{booking?.pickupLocation}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Odometer & Fuel */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" /> Initial Meter & Fuel Level
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Starting Odometer (KM) *</label>
              <input
                type="number"
                required
                min={0}
                value={odometerReading}
                onChange={(e) => setOdometerReading(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono font-bold text-sm focus:border-amber-400 focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Fuel / Battery Level ({fuelBatteryLevel}%) *</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={fuelBatteryLevel}
                onChange={(e) => setFuelBatteryLevel(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer min-h-[44px]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
                <span>Reserve (0%)</span>
                <span>Half (50%)</span>
                <span>Full Tank (100%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 10-Point Condition Checklist */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 10-Point Vehicle Condition Checklist
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'frontBody', label: '1. Front Body & Fender' },
              { key: 'rearBody', label: '2. Rear Body & Tail Section' },
              { key: 'leftSide', label: '3. Left Side Panel' },
              { key: 'rightSide', label: '4. Right Side Panel' },
              { key: 'headlight', label: '5. Headlight & Taillight' },
              { key: 'indicators', label: '6. Turn Signal Indicators' },
              { key: 'mirrors', label: '7. Rear-view Mirrors' },
              { key: 'tyres', label: '8. Tyre Tread & Pressure' },
              { key: 'dashboard', label: '9. Dashboard / Speedometer' },
              { key: 'brakes', label: '10. Brakes & Clutch Lever' },
            ].map((item) => {
              const current = checklist[item.key] || { status: 'PASS', notes: '' };
              return (
                <div key={item.key} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.key, 'PASS')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                          current.status === 'PASS'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        PASS
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.key, 'ISSUE')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                          current.status === 'ISSUE'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        ISSUE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6 Inspection Photos */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 font-heading flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600" /> 6 Mandatory Inspection Photos
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-md">
              6/6 Photos Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'frontUrl', label: '1. Front Photo' },
              { key: 'backUrl', label: '2. Rear Photo' },
              { key: 'leftUrl', label: '3. Left Side' },
              { key: 'rightUrl', label: '4. Right Side' },
              { key: 'dashboardUrl', label: '5. Dashboard' },
              { key: 'meterUrl', label: '6. Odometer' },
            ].map((p) => (
              <div key={p.key} className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">{p.label}</span>
                <div className="relative aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                  <Image src={(photos as any)[p.key]} alt={p.label} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Scratches Log */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 font-heading flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Scratch & Dent Markers ({scratches.length})
          </h2>

          {scratches.length > 0 && (
            <div className="space-y-2">
              {scratches.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 mr-2">{s.zone}:</span>
                    <span className="text-slate-700 font-medium">{s.description}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                      {s.severity}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleRemoveScratch(s.id)} className="text-rose-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              className="p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 min-h-[44px]"
            >
              <option value="Front Mudguard">Front Mudguard</option>
              <option value="Left Body Panel">Left Body Panel</option>
              <option value="Right Body Panel">Right Body Panel</option>
              <option value="Exhaust Shield">Exhaust Shield</option>
              <option value="Handlebar / Mirrors">Handlebar / Mirrors</option>
            </select>
            <input
              type="text"
              placeholder="Description (e.g. 2cm mark)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="sm:col-span-2 p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-500 min-h-[44px]"
            />
            <button
              type="button"
              onClick={handleAddScratch}
              className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs min-h-[44px]"
            >
              + Add Marker
            </button>
          </div>
        </div>

        {/* Validation Checklist before submission */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-amber-400/30 space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block font-heading">
            Pre-Submission Validation Checklist
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Booking verified
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vendor ownership verified
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Odometer recorded ({odometerReading} km)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 6 Inspection photos added
            </div>
          </div>
        </div>

        {/* Sticky Mobile Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-white/10 z-40 flex items-center justify-between gap-4 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/partner/bookings')}
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold min-h-[44px]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 min-h-[44px]"
          >
            {submitting ? 'Submitting Inspection...' : 'Save & Submit Handover Inspection'}
          </button>
        </div>
      </form>
    </div>
  );
}
