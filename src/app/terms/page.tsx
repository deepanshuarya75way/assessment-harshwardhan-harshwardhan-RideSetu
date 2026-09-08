import React from 'react';
import Link from 'next/link';
import { FileText, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | RideSetu',
  description: 'Terms and Conditions governing the use of RideSetu self-drive mobility marketplace.',
};

export default function TermsPage() {
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
          <FileText className="w-3.5 h-3.5" /> Legal & Governance
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Platform Terms of Service
        </h1>
        <p className="text-sm text-slate-600">
          Last Updated: August 2026 • Version 1.0 (Pilot Readiness)
        </p>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Important Legal Notice
        </div>
        <p>
          This document serves as an informational framework for the RideSetu controlled mobility marketplace pilot. Final binding legal text must be reviewed and certified by a qualified legal counsel prior to full commercial rollout.
        </p>
      </div>

      {/* Terms Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">1. Marketplace Platform Structure</h2>
          <p>
            RideSetu acts as a technology facilitator connecting independent verified fleet operators (Vendors) with verified riders (Customers) across Uttarakhand destinations including Rishikesh, Dehradun, Haridwar, and Mussoorie.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">2. Eligibility & Verification Requirements</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Riders must hold a valid, non-expired driving licence authorized for the selected vehicle category (e.g., MCWG for two-wheelers, LMV for four-wheelers).</li>
            <li>Riders must be at least 18 years of age (or 21+ for select high-capacity motorcycles).</li>
            <li>Identity and driving credentials undergo verification review by the RideSetu trust & safety team prior to vehicle handover.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">3. Booking, Payments & Security Deposit</h2>
          <p>
            All bookings require server-side reservation verification. The security deposit (₹1,000 standard) remains completely isolated from vendor commission and platform revenue, and is 100% refundable subject to post-trip vehicle inspection.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">4. Digital Handover & Inspection Protocol</h2>
          <p>
            Customers and Vendors must complete the 360° Digital Inspection Handover at pickup and return. Odometer readings, fuel levels, and existing exterior scratches are digitally stamped with timestamped certificates to prevent unfair damage claims.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">5. Prohibited Vehicle Uses</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Sub-leasing or permitting unverified third parties to operate the vehicle.</li>
            <li>Riding under the influence of alcohol, drugs, or intoxicating substances.</li>
            <li>Participating in unauthorized motor racing, stunts, or commercial carriage.</li>
            <li>Operating vehicles outside permitted regional geographical bounds without prior authorization.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
