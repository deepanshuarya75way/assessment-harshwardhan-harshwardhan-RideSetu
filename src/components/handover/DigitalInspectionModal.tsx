'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Camera,
  Gauge,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface DigitalInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  vehicleId: string;
  vehicleName: string;
  handoverType: 'PICKUP' | 'RETURN';
  initialOdometer?: number;
  onInspectionComplete: () => void;
}

export const DigitalInspectionModal: React.FC<DigitalInspectionModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  vehicleId,
  vehicleName,
  handoverType,
  initialOdometer = 4200,
  onInspectionComplete,
}) => {
  const [odometerReading, setOdometerReading] = useState(
    handoverType === 'RETURN' ? initialOdometer + 45 : initialOdometer
  );
  const [fuelBatteryLevel, setFuelBatteryLevel] = useState(100);
  const [scratches, setScratches] = useState<
    Array<{ id: string; zone: string; description: string; severity: 'MINOR' | 'MODERATE' | 'MAJOR' }>
  >([]);
  const [newZone, setNewZone] = useState('Front Mudguard');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'MINOR' | 'MODERATE' | 'MAJOR'>('MINOR');
  const [helmetCount, setHelmetCount] = useState(1);
  const [accessories, setAccessories] = useState<string[]>([
    'ISI Helmet',
    'Registration Certificate Copy',
    'First Aid Kit',
  ]);
  const [customerSignatureConfirmed, setCustomerSignatureConfirmed] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = handoverType === 'RETURN'
        ? `/api/bookings/${bookingId}/return`
        : `/api/bookings/${bookingId}/handover`;

      const payload = handoverType === 'RETURN'
        ? {
            vehicleId,
            returnOdometerReading: Number(odometerReading),
            returnFuelBatteryLevel: Number(fuelBatteryLevel),
            returnScratches: scratches,
            returnPhotos: {
              frontUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
              backUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
              leftUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
              rightUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
              meterUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
            },
            vendorAgentName: 'Partner Representative',
            remarks: remarks || `Digital RETURN inspection recorded by partner representative.`,
          }
        : {
            vehicleId,
            handoverType,
            odometerReading: Number(odometerReading),
            fuelBatteryLevel: Number(fuelBatteryLevel),
            existingScratches: scratches,
            helmetCount,
            accessoriesGiven: accessories,
            customerSignatureConfirmed,
            remarks: remarks || `Digital ${handoverType} inspection recorded by partner representative.`,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to save ${handoverType.toLowerCase()} inspection report.`);
      }

      onInspectionComplete();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Inspection submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-navy-900 text-white p-5 relative flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-extrabold uppercase">
              {handoverType === 'PICKUP' ? 'Pre-Pickup Inspection' : 'Return Check-in'}
            </span>
            <h2 className="text-xl font-bold font-heading mt-1">
              Digital Vehicle Inspection Report
            </h2>
            <p className="text-xs text-slate-300">{vehicleName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs sm:text-sm">
          {/* Odometer & Fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Gauge className="w-4 h-4 text-brand-orange" />
                Odometer Reading (KM)
              </label>
              <input
                type="number"
                required
                value={odometerReading}
                onChange={(e) => setOdometerReading(Number(e.target.value))}
                className="w-full font-mono text-base font-extrabold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-orange outline-none"
              />
              <span className="text-[10px] text-slate-500">Live meter cluster photo verified</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Fuel className="w-4 h-4 text-brand-orange" />
                  Fuel / Battery Level
                </label>
                <span className="font-extrabold text-navy-900 font-heading text-sm">
                  {fuelBatteryLevel}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={fuelBatteryLevel}
                onChange={(e) => setFuelBatteryLevel(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Reserve (0%)</span>
                <span>Half (50%)</span>
                <span>Full Tank (100%)</span>
              </div>
            </div>
          </div>

          {/* 360 Photo Records */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Camera className="w-4 h-4 text-brand-orange" />
              360° Photo Inspection Evidence
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {['Front', 'Back', 'Left Side', 'Right Side', 'Odometer'].map((angle) => (
                <div
                  key={angle}
                  className="aspect-square bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-2 text-center text-slate-600 hover:bg-slate-200/70 transition-colors"
                >
                  <Camera className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[10px] font-bold">{angle}</span>
                  <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded mt-1">
                    Captured
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scratch & Dent Marker Pinboard */}
          <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200">
            <label className="font-bold text-slate-900 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Existing Scratches & Dents Log ({scratches.length})
              </span>
            </label>

            {/* Existing Scratches List */}
            {scratches.length > 0 && (
              <div className="space-y-1.5">
                {scratches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 mr-2">{s.zone}:</span>
                      <span className="text-slate-600">{s.description}</span>
                      <span className="ml-2 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        {s.severity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveScratch(s.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Scratch Form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl text-xs bg-white outline-none"
              >
                <option value="Front Mudguard">Front Mudguard</option>
                <option value="Left Body Panel">Left Body Panel</option>
                <option value="Right Body Panel">Right Body Panel</option>
                <option value="Exhaust Shield">Exhaust Shield</option>
                <option value="Handlebar / Mirrors">Handlebar / Mirrors</option>
                <option value="Headlight Mask">Headlight Mask</option>
                <option value="Rear Tail Section">Rear Tail Section</option>
              </select>

              <input
                type="text"
                placeholder="Description (e.g. 2cm hairline mark)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="sm:col-span-2 p-2 border border-slate-300 rounded-xl text-xs outline-none"
              />

              <button
                type="button"
                onClick={handleAddScratch}
                className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Marker
              </button>
            </div>
          </div>

          {/* Customer E-Signature Confirmation */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="sigConfirm"
              checked={customerSignatureConfirmed}
              onChange={(e) => setCustomerSignatureConfirmed(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 mt-0.5 cursor-pointer"
            />
            <label htmlFor="sigConfirm" className="text-xs text-emerald-950 font-medium cursor-pointer">
              <strong>Traveller & Partner Mutual Sign-Off:</strong> I confirm that the vehicle condition, odometer, fuel level, and scratch markers recorded above accurately reflect the vehicle state at handover.
            </label>
          </div>

          {/* Submit CTA */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !customerSignatureConfirmed}
              className="flex-2 py-3 px-6 bg-brand-orange hover:bg-brand-dark text-white font-bold rounded-xl text-xs shadow-md shadow-brand-orange/25 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Recording Inspection...' : `Sign & Complete ${handoverType} Inspection`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DigitalInspectionModal;
