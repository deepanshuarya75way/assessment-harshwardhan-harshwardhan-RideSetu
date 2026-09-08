'use client';

import React, { useState } from 'react';
import { Camera, CheckCircle2, ShieldCheck, X, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

interface ReturnInspectionModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnInspectionModal({ booking, isOpen, onClose, onSuccess }: ReturnInspectionModalProps) {
  const [returnOdometerReading, setReturnOdometerReading] = useState(12650);
  const [fuelBatteryLevel, setFuelBatteryLevel] = useState(100);
  const [hasNewDamage, setHasNewDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [claimedDamageAmount, setClaimedDamageAmount] = useState(500);
  const [remarks, setRemarks] = useState('Vehicle returned in good condition');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/vendor/bookings/${booking.id || booking._id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnOdometerReading: Number(returnOdometerReading),
          fuelBatteryLevel: Number(fuelBatteryLevel),
          hasNewDamage,
          damageDescription: hasNewDamage ? damageDescription : '',
          claimedDamageAmount: hasNewDamage ? Number(claimedDamageAmount) : 0,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return inspection');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Return inspection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0">
        <div className="p-5 bg-gradient-to-r from-navy-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">RideSetu Return Protocol</div>
            <h3 className="text-base font-black">Vehicle Return Inspection</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Return Odometer Reading (km)</label>
            <input
              type="number"
              value={returnOdometerReading}
              onChange={(e) => setReturnOdometerReading(Number(e.target.value))}
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
              className="w-full accent-emerald-600"
            />
            <div className="text-right text-xs font-black text-slate-800">{fuelBatteryLevel}%</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNewDamage}
                onChange={(e) => setHasNewDamage(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Report New Damage / Scratch</span>
            </label>

            {hasNewDamage && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Damage Description</label>
                  <input
                    type="text"
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="e.g. Scratch on left side panel"
                    required={hasNewDamage}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">Claimed Damage Estimate (₹)</label>
                  <input
                    type="number"
                    value={claimedDamageAmount}
                    onChange={(e) => setClaimedDamageAmount(Number(e.target.value))}
                    required={hasNewDamage}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            )}
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
            className={`w-full py-3 rounded-2xl text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              hasNewDamage ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-white" />}
            <span>{hasNewDamage ? 'Report Damage & Hold Deposit' : 'Complete Return & Refund Deposit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
