import React from 'react';
import Link from 'next/link';
import { CreditCard, ShieldCheck, ArrowLeft, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy | RideSetu',
  description: 'Understanding refund timelines, deposit release, and payment methods on RideSetu.',
};

export default function RefundPolicyPage() {
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
          <CreditCard className="w-3.5 h-3.5" /> Payments & Settlements
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Refund Policy & Deposit Protections
        </h1>
        <p className="text-sm text-slate-600">
          How refunds and security deposits are calculated, processed, and tracked on RideSetu.
        </p>
      </div>

      {/* Legal Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Informational Policy
        </div>
        <p>
          This document describes the automated refund pipeline and deposit security mechanism on RideSetu. Final legal text must be verified by a legal professional before commercial release.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">1. Refund Processing Channels</h2>
          <p>
            All refunds are credited back to the original source payment method (UPI, Debit/Credit Card, Net Banking) used during booking. No store credits or wallet lock-ins are enforced.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">2. Settlement Timelines</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>UPI & Instant Payments:</strong> Typically credited within 2 to 24 hours.</li>
            <li><strong>Net Banking & Cards:</strong> Typically processed by banking rails within 3 to 5 business days.</li>
            <li><strong>Security Deposit Release:</strong> Initiated automatically upon submission of the Digital Return Inspection certificate without damage dispute.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">3. Dispute Protection & Escrow Holding</h2>
          <p>
            In the event of an alleged damage dispute between a rider and vendor, the security deposit remains in HELD status until platform administrators inspect the 360° pickup and return photo certificates. Uncontested funds are promptly refunded.
          </p>
        </section>
      </div>
    </div>
  );
}
