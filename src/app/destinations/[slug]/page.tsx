'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import VehicleCard from '@/components/marketplace/VehicleCard';
import { formatINR } from '@/lib/utils';
import {
  MapPin,
  Compass,
  Star,
  ShieldCheck,
  Fuel,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Car,
  ChevronRight,
} from 'lucide-react';
import { getDestinationPhoto } from '@/lib/vehicle-images';

export default function DestinationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [destination, setDestination] = useState<any>(null);
  const [pickupLocations, setPickupLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDest = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/destinations/${slug}`);
        const data = await res.json();
        if (data.destination) {
          setDestination(data.destination);
          setPickupLocations(data.pickupLocations || []);
          setVendors(data.vendors || []);
          setFeaturedVehicles(data.featuredVehicles || []);
        }
      } catch (err) {
        console.error('Destination load error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchDest();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-16 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-sm">Loading destination mobility guide...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="max-w-xl mx-auto p-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Destination Not Found</h2>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Destination Hero Banner */}
      <section className="relative h-[380px] sm:h-[460px] bg-navy-950 text-white flex items-end">
        <Image
          src={getDestinationPhoto(slug)}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full space-y-3">
          <span className="px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-bold uppercase">
            📍 {destination.state} Travel Mobility
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-heading text-white tracking-tight">
            Verified Bike & Scooter Rentals in {destination.name}
          </h1>
          <p className="text-slate-200 text-xs sm:text-base max-w-2xl leading-relaxed">
            {destination.tagline || destination.description}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/vehicles?destination=${destination.slug}`}
              className="px-6 py-3 rounded-2xl bg-brand-orange hover:bg-brand-dark text-white font-bold text-xs shadow-lg shadow-brand-orange/30 flex items-center gap-2"
            >
              <span>Browse All {destination.name} Rides</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Average Price Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
            Transparent Pricing
          </span>
          <h2 className="text-2xl font-extrabold font-heading text-navy-900">
            Average Rental Rates in {destination.name}
          </h2>
          <p className="text-slate-500 text-xs">Based on verified active local partners inventory.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-2xl">🛵</div>
            <div className="font-bold text-slate-900 text-sm">Scooter / Scooty</div>
            <div className="text-xl font-black font-heading text-brand-orange">
              {formatINR(destination.averagePrices?.scooter || 399)}<span className="text-xs text-slate-500 font-normal">/day</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-2xl">🏍️</div>
            <div className="font-bold text-slate-900 text-sm">Motorcycle & RE</div>
            <div className="text-xl font-black font-heading text-brand-orange">
              {formatINR(destination.averagePrices?.motorcycle || 650)}<span className="text-xs text-slate-500 font-normal">/day</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-2xl">🚗</div>
            <div className="font-bold text-slate-900 text-sm">Self-Drive Car / 4x4</div>
            <div className="text-xl font-black font-heading text-brand-orange">
              {formatINR(destination.averagePrices?.car || 1800)}<span className="text-xs text-slate-500 font-normal">/day</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-2xl">⚡</div>
            <div className="font-bold text-slate-900 text-sm">Electric EV Scooter</div>
            <div className="text-xl font-black font-heading text-brand-orange">
              {formatINR(destination.averagePrices?.ev || 450)}<span className="text-xs text-slate-500 font-normal">/day</span>
            </div>
          </div>
        </div>
      </section>

      {/* Available Vehicles in Destination */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold font-heading text-navy-900">
              Available Fleet in {destination.name}
            </h2>
            <p className="text-xs text-slate-500">Instant reservation with digital 360° inspection.</p>
          </div>
          <Link
            href={`/vehicles?destination=${destination.slug}`}
            className="text-xs font-bold text-brand-orange hover:text-brand-dark flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredVehicles.map((v) => (
            <VehicleCard key={v._id} vehicle={v} />
          ))}
        </div>
      </section>

      {/* Top Verified Vendors */}
      {vendors.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl font-extrabold font-heading text-navy-900">
            Top Verified Rental Partners in {destination.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((v) => (
              <div key={v._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-base">{v.businessName}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{v.rating || 4.8}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">📍 {v.address}</p>
                <div className="text-xs text-slate-600 flex items-center gap-2 pt-2 border-t border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Licensed Permit: {v.rentalLicenseNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Travel Tips & Safety */}
      {destination.travelTips && destination.travelTips.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-4">
            <h3 className="text-xl font-bold font-heading text-amber-400">
              💡 Mountain Riding Tips for {destination.name}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              {destination.travelTips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
