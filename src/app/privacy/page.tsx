import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowLeft, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | RideSetu',
  description: 'How RideSetu protects and securely processes customer and partner personal data.',
};

export default function PrivacyPage() {
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
          <Lock className="w-3.5 h-3.5" /> Privacy & Data Security
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Customer & Vendor Privacy Policy
        </h1>
        <p className="text-sm text-slate-600">
          Last Updated: August 2026 • Version 1.0 (Pilot Architecture)
        </p>
      </div>

      {/* Legal Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Informational Policy
        </div>
        <p>
          This document describes data privacy principles implemented in the RideSetu platform architecture. Formal compliance policies will be finalized with legal counsel before commercial launch.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">1. Information We Collect</h2>
          <p>
            To facilitate secure vehicle rentals and comply with local transport regulations, RideSetu collects:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Contact Information: Full name, phone number, email address.</li>
            <li>Identity & Driving Credentials: Driving licence number, expiry date, and secure document scans.</li>
            <li>Location Data: Delivery addresses, pickup GPS coordinates, and regional destination preference.</li>
            <li>Transaction Logs: Payment reference IDs, security deposit records, and invoice histories.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">2. Zero Unauthorized Data Sharing</h2>
          <p>
            RideSetu enforces strict data minimization. Fleet operators receive only necessary operational details (customer name, masked phone, pickup time, delivery location). Customer driving licence scans and private documents are NEVER shared with vendors or third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">3. Cryptographic Protection</h2>
          <p>
            Sensitive fields such as driving licence numbers and bank account details are encrypted server-side using AES-256-GCM. Private compliance files are stored in isolated storage with short-lived HMAC-SHA256 signed URLs (10-minute validity).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 font-heading">4. Data Retention & Deletion Rights</h2>
          <p>
            Users may request an extract or deletion of their personal information by contacting the trust and safety desk, subject to regulatory retention obligations for active rental agreements.
          </p>
        </section>
      </div>
    </div>
  );
}
