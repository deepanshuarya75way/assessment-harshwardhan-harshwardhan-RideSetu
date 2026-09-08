import React from 'react';
import Link from 'next/link';
import SearchWidget from '@/components/marketplace/SearchWidget';
import { ShieldCheck, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BikeRentalCityPage({ params }: { params: { city: string } }) {
  const city = params.city.charAt(0).toUpperCase() + params.city.slice(1);
  const citySlug = params.city.toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="bg-navy-950 text-white p-8 sm:p-12 rounded-3xl space-y-4 text-center max-w-4xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-bold uppercase">
          Verified Motorcycle Rentals
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
          Verified Bike Rental in {city} (Royal Enfield, Adventure & Cruisers)
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          Compare verified local bike rental shops in {city}. Rent Royal Enfield Classic 350, Himalayan 450, and KTM Duke with zero hidden fees and 100% refundable deposits.
        </p>

        <div className="pt-4 max-w-xl mx-auto">
          <Link
            href={`/vehicles?destination=${citySlug}&category=MOTORCYCLE`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-brand-dark text-white font-bold text-sm rounded-xl shadow-lg"
          >
            <span>Explore {city} Bikes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <SearchWidget initialDestination={citySlug} initialCategory="MOTORCYCLE" />
      </div>

      {/* SEO Info Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-xs text-slate-700">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">✓ Compliant Local Permits</h3>
          <p className="text-slate-500">Every motorcycle listed in {city} operates with official commercial rental permits.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">✓ Free Helmet Included</h3>
          <p className="text-slate-500">ISI-certified helmet is provided with every bike rental at no extra cost.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2">
          <h3 className="font-bold text-slate-900 text-sm">✓ 24/7 Mountain SOS</h3>
          <p className="text-slate-500">Local mechanical dispatch units stationed along major highway approaches.</p>
        </div>
      </div>
    </div>
  );
}
