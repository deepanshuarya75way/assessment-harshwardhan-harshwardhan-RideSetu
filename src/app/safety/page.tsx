import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, ArrowLeft, ShieldAlert, CheckCircle2, PhoneCall, HeartHandshake } from 'lucide-react';

export const metadata = {
  title: 'Rider Safety & Roadside SOS | RideSetu',
  description: 'Mountain road safety guidelines, helmet policies, and 24/7 roadside assistance protocol on RideSetu.',
};

export default function SafetyPage() {
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
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Trust, Safety & Roadside Protocol
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Mountain Road Safety & Assistance Guidelines
        </h1>
        <p className="text-sm text-slate-600">
          Best practices for riding through the Himalayan foothills, ghats, and high-altitude highways.
        </p>
      </div>

      {/* Legal Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Informational Safety Guide
        </div>
        <p>
          This guide provides general safety suggestions for mountain road conditions. Commercial emergency service response agreements will be finalized before commercial launch.
        </p>
      </div>

      {/* 4 Pillars of Rider Safety */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center font-bold">
            ⛑️
          </div>
          <h3 className="font-bold text-slate-900 text-sm font-heading">ISI-Certified Helmet Compliance</h3>
          <p className="text-xs text-slate-600">
            Wearing an ISI-certified helmet is mandatory for rider and pillion across Uttarakhand. Every two-wheeler booking includes 1 complimentary sanitized helmet.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            🏔️
          </div>
          <h3 className="font-bold text-slate-900 text-sm font-heading">Mountain Ghat & Curve Driving</h3>
          <p className="text-xs text-slate-600">
            Always maintain low gear on steep descents. Avoid overtaking on blind curves or narrow mountain passes between Rishikesh, Devprayag, and Mussoorie.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            🌧️
          </div>
          <h3 className="font-bold text-slate-900 text-sm font-heading">Monsoon & Landslide Awareness</h3>
          <p className="text-xs text-slate-600">
            Check local weather bulletins during rainstorms. Never ride through overflowing water streams or areas prone to rockfalls.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            🆘
          </div>
          <h3 className="font-bold text-slate-900 text-sm font-heading">24/7 Roadside Assistance Workflow</h3>
          <p className="text-xs text-slate-600">
            In case of mechanical puncture or engine breakdown, trigger the Roadside SOS button in your Customer Dashboard to connect with our nearest mobile mechanic.
          </p>
        </div>
      </div>
    </div>
  );
}
