import React from 'react';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, ArrowLeft, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export const metadata = {
  title: 'Cancellation Policy | RideSetu',
  description: 'Transparent cancellation policy windows and refund breakdown for RideSetu rentals.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5" /> Rental Policies
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Cancellation & Refund Policy
        </h1>
        <p className="text-sm text-slate-600">
          Transparent, server-calculated cancellation windows for travellers across Uttarakhand.
        </p>
      </div>

      {/* Legal Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Important Notice
        </div>
        <p>
          This policy details the automated server-side refund calculation applied to bookings on the RideSetu platform. Final commercial policies will be finalized with legal counsel before commercial rollout.
        </p>
      </div>

      {/* Cancellation Windows Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              More than 48 Hours
            </span>
            <span className="text-lg font-black text-slate-900">100% Refund</span>
          </div>
          <p className="text-xs text-slate-600">
            Cancel 48+ hours prior to scheduled pickup time to receive a 100% refund of base rental fees, delivery fees, and 100% security deposit.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              24 to 48 Hours
            </span>
            <span className="text-lg font-black text-slate-900">75% Refund</span>
          </div>
          <p className="text-xs text-slate-600">
            Cancel between 24 and 48 hours prior to pickup to receive a 75% refund of base rental fees, 100% delivery fees, and 100% security deposit.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              12 to 24 Hours
            </span>
            <span className="text-lg font-black text-slate-900">50% Refund</span>
          </div>
          <p className="text-xs text-slate-600">
            Cancel between 12 and 24 hours prior to pickup to receive a 50% refund of base rental fees, 100% delivery fees, and 100% security deposit.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
              Less than 12 Hours
            </span>
            <span className="text-lg font-black text-slate-900">0% Rental Refund</span>
          </div>
          <p className="text-xs text-slate-600">
            Cancellations under 12 hours forfeit base rental charges. Security deposit (100%) and delivery fees remain 100% refunded.
          </p>
        </div>
      </div>

      {/* Security Deposit Isolation Assurance */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700">
        <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Complete Security Deposit Isolation
        </h2>
        <p>
          Regardless of the cancellation timeframe, the refundable security deposit (₹1,000) is NEVER withheld as a cancellation fee before vehicle handover. It is returned 100% to your original payment method.
        </p>
        <p>
          If a booking is cancelled by a vendor or platform administrator due to unforeseen circumstances, the customer receives a 100% complete refund of all charges and fees.
        </p>
      </div>
    </div>
  );
}
