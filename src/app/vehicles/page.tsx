'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchWidget from '@/components/marketplace/SearchWidget';
import VehicleCard from '@/components/marketplace/VehicleCard';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import { VehicleCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Car,
  Layers,
  Filter,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function VehiclesSearchContent() {
  const searchParams = useSearchParams();

  const destinationParam = searchParams.get('destination') || 'rishikesh';
  const categoryParam = searchParams.get('category') || 'ALL';
  const pickupDateTime = searchParams.get('pickupDateTime') || '';
  const returnDateTime = searchParams.get('returnDateTime') || '';

  const [filters, setFilters] = useState({
    category: categoryParam,
    minPrice: 0,
    maxPrice: 4500,
    fuelType: 'ALL',
    transmission: 'ALL',
    minRating: 0,
    deliveryOnly: false,
    verifiedOnly: true,
    sort: 'recommended',
  });

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();

        if (destinationParam) query.append('destination', destinationParam);
        if (filters.category && filters.category !== 'ALL') query.append('category', filters.category);
        if (filters.maxPrice < 4500) query.append('maxPrice', filters.maxPrice.toString());
        if (filters.fuelType && filters.fuelType !== 'ALL') query.append('fuelType', filters.fuelType);
        if (filters.transmission && filters.transmission !== 'ALL') query.append('transmission', filters.transmission);
        if (filters.deliveryOnly) query.append('delivery', 'true');
        if (filters.verifiedOnly) query.append('verifiedOnly', 'true');
        if (filters.sort) query.append('sort', filters.sort);
        if (pickupDateTime) query.append('pickupDateTime', pickupDateTime);
        if (returnDateTime) query.append('returnDateTime', returnDateTime);

        const res = await fetch(`/api/vehicles?${query.toString()}`);
        const data = await res.json();

        if (data.vehicles) {
          setVehicles(data.vehicles);
          setTotalCount(data.pagination?.totalCount || data.vehicles.length);
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [destinationParam, filters, pickupDateTime, returnDateTime]);

  const handleResetFilters = () => {
    setFilters({
      category: 'ALL',
      minPrice: 0,
      maxPrice: 4500,
      fuelType: 'ALL',
      transmission: 'ALL',
      minRating: 0,
      deliveryOnly: false,
      verifiedOnly: true,
      sort: 'recommended',
    });
  };

  const categories = [
    { id: 'ALL', label: 'All Fleet', icon: '✨' },
    { id: 'SCOOTER', label: 'Scooty', icon: '🛵' },
    { id: 'MOTORCYCLE', label: 'Bikes', icon: '🏍️' },
    { id: 'CAR', label: 'Self-Drive Cars', icon: '🚗' },
    { id: 'EV', label: 'Electric EV', icon: '⚡' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Search Widget in Compact Style */}
      <SearchWidget initialDestination={destinationParam} initialCategory={filters.category} />

      {/* Explore Verified Rides Hero Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Explore Verified Rides</span>
          </div>
          <h1 className="font-black font-heading text-2xl sm:text-3xl capitalize">
            Verified Fleet in {destinationParam}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {destinationParam.toUpperCase()}
            </span>
            {pickupDateTime && returnDateTime && (
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {pickupDateTime.split('T')[0]} to {returnDateTime.split('T')[0]}
              </span>
            )}
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              {vehicles.length} Available Vehicles
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold flex items-center gap-2 backdrop-blur-md border border-white/20"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-orange" />
            <span>Filters & Sort</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/50 px-3.5 py-2 rounded-2xl border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" /> 100% Escrow Deposit Isolation
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar for Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Filter Drawer Overlay */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full p-5 overflow-y-auto z-10 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold font-heading text-slate-900 text-base">Filters & Sort</h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-brand-orange text-white font-extrabold text-sm rounded-2xl shadow-md"
                >
                  Apply Filters ({vehicles.length} Rides)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Vehicles Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, category: c.id }))}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 focus-ring ${
                  filters.category === c.id
                    ? 'bg-navy-950 text-white shadow-md shadow-navy-950/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Vehicles Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <EmptyState
              title="No verified rides available for these dates"
              description="Try modifying your rental dates, expanding your price filter, or switching categories to view more verified local partner inventory."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle, idx) => (
                <VehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  pickupDateTime={pickupDateTime}
                  returnDateTime={returnDateTime}
                  isPriority={idx < 3}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading verified fleet...</div>}>
      <VehiclesSearchContent />
    </Suspense>
  );
}
