'use client';

import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ShieldCheck, X, ArrowRight, Loader2 } from 'lucide-react';

interface RentalExtensionModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RentalExtensionModal({ booking, isOpen, onClose, onSuccess }: RentalExtensionModalProps) {
  const [newReturnDate, setNewReturnDate] = useState('');
  const [newReturnTime, setNewReturnTime] = useState('10:00');
  const [checking, setChecking] = useState(false);
  const [extensionData, setExtensionData] = useState<any>(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  if (!isOpen || !booking) return null;

  const currentReturnDateStr = new Date(booking.returnDateTime).toISOString().split('T')[0];
  const minDate = new Date(new Date(booking.returnDateTime).getTime() + 24 * 3600 * 1000).toISOString().split('T')[0];

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturnDate) {
      setError('Please select a new return date');
      return;
    }

    setChecking(true);
    setError('');
    setExtensionData(null);

    try {
      const res = await fetch(`/api/customer/trips/${booking.id || booking._id}/extension/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newReturnDate, newReturnTime }),
      });

      const data = await res.json();

      if (!res.ok || !data.available) {
        throw new Error(data.error || 'Vehicle unavailable for requested extension period');
      }

      setExtensionData(data.extension);
    } catch (err: any) {
      setError(err.message || 'Availability check failed');
    } finally {
      setChecking(false);
    }
  };

  const handleProceedExtensionPayment = async () => {
    if (!extensionData) return;
    setPaying(true);
    setError('');

    try {
      // 1. Create Razorpay Extension Order
      const orderRes = await fetch(`/api/customer/trips/${booking.id || booking._id}/extension/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: extensionData.totalExtensionAmount,
          extensionDays: extensionData.additionalDays,
          newReturnDateTime: extensionData.newReturnDateTime,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // 2. Mock / Dev Razorpay Payment Verification
      const verifyRes = await fetch(`/api/customer/trips/${booking.id || booking._id}/extension/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: orderData.order.id,
          razorpayPaymentId: `pay_ext_${Date.now()}`,
          razorpaySignature: 'dev_mock_signature',
          newReturnDateTime: extensionData.newReturnDateTime,
          amount: extensionData.totalExtensionAmount,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Extension payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0 relative">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-brand-orange tracking-wider">RideSetu Flexi Extension</div>
            <h3 className="text-lg font-black font-heading">Extend Your Rental</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Return Schedule */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Current Return Date</div>
              <div className="font-black text-slate-900">
                {new Date(booking.returnDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(booking.returnDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
              Active Rental
            </span>
          </div>

          {/* Form to Select New Date */}
          {!extensionData ? (
            <form onSubmit={handleCheckAvailability} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">New Return Date</label>
                <input
                  type="date"
                  min={minDate}
                  value={newReturnDate}
                  onChange={(e) => setNewReturnDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-orange focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">New Return Time</label>
                <input
                  type="time"
                  value={newReturnTime}
                  onChange={(e) => setNewReturnTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-orange focus:outline-none"
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
                disabled={checking}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-xs shadow-lg shadow-brand-orange/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking Vehicle Availability...</span>
                  </>
                ) : (
                  <>
                    <span>Check Extension Availability</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Extension Price Summary */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold space-y-2">
                <div className="flex items-center justify-between text-emerald-900">
                  <span>Additional Duration</span>
                  <span className="font-black">{extensionData.additionalDays} Day(s) ({extensionData.additionalHours} hrs)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Extension Rental Charge</span>
                  <span>₹{extensionData.extensionRentalCharge}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Platform Fee</span>
                  <span>₹{extensionData.additionalPlatformFee}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>GST (18%)</span>
                  <span>₹{extensionData.additionalTaxes}</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 flex items-center justify-between text-sm font-black text-emerald-950">
                  <span>Total Payable Extension Amount</span>
                  <span>₹{extensionData.totalExtensionAmount}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExtensionData(null)}
                  className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleProceedExtensionPayment}
                  disabled={paying}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Razorpay Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay ₹{extensionData.totalExtensionAmount} & Extend</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
