'use client';

import React, { useState } from 'react';
import { Camera, CheckCircle2, ShieldCheck, X, AlertCircle, Loader2 } from 'lucide-react';

interface HandoverInspectionModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HandoverInspectionModal({ booking, isOpen, onClose, onSuccess }: HandoverInspectionModalProps) {
  const [odometerReading, setOdometerReading] = useState(12540);
  const [fuelBatteryLevel, setFuelBatteryLevel] = useState(100);
  const [helmetCount, setHelmetCount] = useState(1);
  const [remarks, setRemarks] = useState('Vehicle cleaned, sanitized, and ready for customer handover');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/vendor/bookings/${booking.id || booking._id}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odometerReading: Number(odometerReading),
          fuelBatteryLevel: Number(fuelBatteryLevel),
          helmetCount: Number(helmetCount),
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit handover inspection');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Inspection submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0">
        <div className="p-5 bg-gradient-to-r from-navy-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">RideSetu Handover Protocol</div>
            <h3 className="text-base font-black">Pre-Pickup Handover Inspection</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Handover Odometer Reading (km)</label>
            <input
              type="number"
              value={odometerReading}
              onChange={(e) => setOdometerReading(Number(e.target.value))}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Fuel / Battery Level (%)</label>
            <input
              type="range"
              min="10"
              max="100"
              value={fuelBatteryLevel}
              onChange={(e) => setFuelBatteryLevel(Number(e.target.value))}
              className="w-full accent-brand-orange"
            />
            <div className="text-right text-xs font-black text-slate-800">{fuelBatteryLevel}%</div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Helmets Provided</label>
            <select
              value={helmetCount}
              onChange={(e) => setHelmetCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
            >
              <option value={1}>1 Helmet</option>
              <option value={2}>2 Helmets</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Inspection Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-navy-900 hover:bg-black text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            <span>Complete Inspection & Mark Ready</span>
          </button>
        </form>
      </div>
    </div>
  );
}
