'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils';
import { ShieldCheck, QrCode, CreditCard, Building2, CheckCircle2, XCircle, X, ExternalLink, Zap } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId?: string;
  keyId?: string;
  bookingNumber?: string;
  vehicleName?: string;
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onPaymentComplete: (paymentDetails: {
    method: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
    status: 'SUCCESS' | 'FAILED';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  orderId = `order_sandbox_${Date.now()}`,
  keyId = 'rzp_test_ridesetu_sandbox',
  bookingNumber = 'RS-2026-XXXX',
  vehicleName = 'Verified Vehicle',
  customerDetails,
  onPaymentComplete,
}) => {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const isRealRazorpayKey =
    keyId &&
    keyId.startsWith('rzp_test_') &&
    keyId !== 'rzp_test_ridesetu_sandbox' &&
    !keyId.includes('placeholder');

  useEffect(() => {
    if (!isOpen) return;

    // Load Razorpay Standard Checkout script dynamically
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => setRazorpayLoaded(false);
      document.body.appendChild(script);
    } else if ((window as any).Razorpay) {
      setRazorpayLoaded(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunchRazorpayStandard = () => {
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      alert('Razorpay Checkout SDK is not loaded. Using Sandbox Simulator instead.');
      return;
    }

    try {
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'RideSetu Technologies',
        description: `Rental Booking — ${vehicleName}`,
        order_id: orderId,
        handler: function (response: any) {
          onPaymentComplete({
            method: 'UPI',
            status: 'SUCCESS',
            razorpayOrderId: response.razorpay_order_id || orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: customerDetails?.name || 'RideSetu Traveler',
          email: customerDetails?.email || 'traveler@ridesetu.com',
          contact: customerDetails?.phone || '+919876543210',
        },
        theme: {
          color: '#FF6B00',
        },
        modal: {
          ondismiss: function () {
            // User closed Razorpay modal without completing payment
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        onPaymentComplete({
          method: 'UPI',
          status: 'FAILED',
          razorpayOrderId: response.error?.metadata?.order_id || orderId,
        });
      });
      rzp.open();
    } catch (err: any) {
      console.error('[Razorpay Standard Checkout Error]:', err);
      alert('Failed to launch Razorpay Standard Checkout: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSimulate = (status: 'SUCCESS' | 'FAILED') => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (status === 'SUCCESS') {
        const paymentId = `pay_sandbox_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        // Pre-computed valid HMAC signature format for sandbox test flows
        const signature = `sandbox_sig_${Date.now()}`;
        onPaymentComplete({
          method,
          status: 'SUCCESS',
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        });
      } else {
        onPaymentComplete({
          method,
          status: 'FAILED',
          razorpayOrderId: orderId,
        });
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-brand-orange text-white text-[10px] font-extrabold uppercase">
              {isRealRazorpayKey ? 'Razorpay Test Mode' : 'Razorpay Sandbox'}
            </span>
            <span className="text-xs text-slate-300">256-Bit Encrypted</span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <h3 className="font-bold text-white text-base font-heading">RideSetu Checkout</h3>
              <p className="text-xs text-slate-300 truncate max-w-[200px]">{vehicleName}</p>
            </div>
            <div className="text-2xl font-black text-white font-heading">
              {formatINR(amount)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            Order: {orderId}
          </div>
        </div>

        {/* Real Razorpay Key Banner & CTA */}
        {isRealRazorpayKey && (
          <div className="p-4 bg-amber-50/70 border-b border-amber-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Zap className="w-3.5 h-3.5 text-brand-orange" />
              <span>Razorpay Test API Keys Connected</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-snug">
              Launch the official Razorpay Checkout popup to test real sandbox UPI apps or cards.
            </p>
            <button
              type="button"
              onClick={handleLaunchRazorpayStandard}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-xs shadow-md shadow-brand-orange/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Razorpay Standard Popup</span>
            </button>
          </div>
        )}

        {/* Payment Methods Simulator */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isRealRazorpayKey ? 'Or Instant Test Simulator' : 'Select Test Payment Method'}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Test Sandbox
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMethod('UPI')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                method === 'UPI'
                  ? 'border-brand-orange bg-brand-light text-brand-dark shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-5 h-5 text-brand-orange" />
              <span>Instant UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('CARD')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                method === 'CARD'
                  ? 'border-brand-orange bg-brand-light text-brand-dark shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('NETBANKING')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                method === 'NETBANKING'
                  ? 'border-brand-orange bg-brand-light text-brand-dark shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>NetBanking</span>
            </button>
          </div>

          {/* Method Details */}
          {method === 'UPI' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-32 h-32 bg-white p-2 mx-auto rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center">
                <QrCode className="w-20 h-20 text-slate-800" />
                <span className="text-[10px] text-slate-500 font-bold mt-1">UPI Test QR</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Simulate: <strong className="text-slate-900">GPay, PhonePe, Paytm, BHIM</strong>
              </p>
            </div>
          )}

          {method === 'CARD' && (
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Test Card Number</label>
                <input
                  type="text"
                  disabled
                  value="4111 •••• •••• 1111 (Razorpay Test Card)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Expiry</label>
                  <input
                    type="text"
                    disabled
                    value="12/28"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">CVV</label>
                  <input
                    type="password"
                    disabled
                    value="•••"
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'NETBANKING' && (
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {['HDFC Bank (Test)', 'SBI (Test)', 'ICICI Bank (Test)', 'Axis Bank (Test)'].map((b) => (
                <div key={b} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-center">
                  🏦 {b}
                </div>
              ))}
            </div>
          )}

          {/* Action Simulation Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              disabled={processing}
              onClick={() => handleSimulate('SUCCESS')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {processing ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pay Securely ({formatINR(amount)})</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={() => handleSimulate('FAILED')}
              className="w-full py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              Simulate Payment Failure / Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
