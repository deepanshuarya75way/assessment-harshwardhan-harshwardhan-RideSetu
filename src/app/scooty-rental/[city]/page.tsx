import React from 'react';
import Link from 'next/link';
import SearchWidget from '@/components/marketplace/SearchWidget';
import { ArrowRight } from 'lucide-react';

export default function ScootyRentalCityPage({ params }: { params: { city: string } }) {
  const city = params.city.charAt(0).toUpperCase() + params.city.slice(1);
  const citySlug = params.city.toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="bg-navy-950 text-white p-8 sm:p-12 rounded-3xl space-y-4 text-center max-w-4xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-bold uppercase">
          Verified Scooty Rentals
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
          Verified Scooty Rental in {city} (Honda Activa 6G, Jupiter, Ntorq)
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
          Compare verified local scooter operators in {city}. Rent Honda Activa, TVS Jupiter, and Access 125 from ₹399/day with hotel doorstep delivery.
        </p>

        <div className="pt-4 max-w-xl mx-auto">
          <Link
            href={`/vehicles?destination=${citySlug}&category=SCOOTER`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-brand-dark text-white font-bold text-sm rounded-xl shadow-lg"
          >
            <span>Explore {city} Scooters</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <SearchWidget initialDestination={citySlug} initialCategory="SCOOTER" />
      </div>
    </div>
  );
}
