import React from 'react';
import Link from 'next/link';
import { Car, ShieldCheck, ArrowLeft, ShieldAlert, CheckCircle2, Fuel, Clock } from 'lucide-react';

export const metadata = {
  title: 'Rental Policy | RideSetu',
  description: 'Driving licence requirements, fuel policies, and pickup guidelines on RideSetu.',
};

export default function RentalPolicyPage() {
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
          <Car className="w-3.5 h-3.5" /> Fleet & Journey Rules
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Rental Guidelines & Driving Rules
        </h1>
        <p className="text-sm text-slate-600">
          Essential guidelines for self-drive two-wheeler and four-wheeler rentals in Uttarakhand.
        </p>
      </div>

      {/* Legal Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Policy Notice
        </div>
        <p>
          This document outlines standard operating procedures for the RideSetu platform pilot. Final commercial agreements must be reviewed and confirmed with legal counsel before commercial rollout.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">1. Driving Licence & Identification</h2>
          <p>
            Riders must carry an authentic physical copy of their original driving licence during pickup. Digital verification on RideSetu ensures rapid 2-minute handover, but physical spot-verification is mandatory per state transport guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">2. Fuel & Range Policy</h2>
          <p>
            Vehicles are handed over with sufficient fuel to reach the nearest fuel station. Riders must return the vehicle with an equivalent fuel level as recorded in the pickup inspection certificate.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">3. Kilometre Limits & Excess Usage</h2>
          <p>
            Standard rentals include 150 km / day (scooters/motorcycles) unless specified as unlimited. Excess kilometres beyond the allotted limit are billed transparently at the vehicle rate (e.g. ₹4/km).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">4. Late Returns & Extensions</h2>
          <p>
            Extensions can be requested directly from the Customer Dashboard prior to scheduled return time, subject to vehicle availability. Unauthorized late returns exceeding a 30-minute grace window incur standard hourly extension charges.
          </p>
        </section>
      </div>
    </div>
  );
}
