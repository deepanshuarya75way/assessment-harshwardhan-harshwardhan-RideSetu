'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DiscoverySearchBar, { SearchSchedule } from '@/components/discovery/DiscoverySearchBar';
import VendorCard, { VendorCardData } from '@/components/discovery/VendorCard';
import { DeliveryLocation } from '@/components/booking/DeliveryLocationSelector';
import { Compass, RefreshCw, AlertCircle, Filter } from 'lucide-react';

function VendorMarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const address = searchParams.get('address') || 'Rishikesh, Uttarakhand';
  const city = searchParams.get('city') || 'Rishikesh';
  const lat = parseFloat(searchParams.get('lat') || '30.1033');
  const lng = parseFloat(searchParams.get('lng') || '78.2948');

  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '10:00';
  const returnDate = searchParams.get('returnDate') || '';
  const returnTime = searchParams.get('returnTime') || '10:00';
  const rentalMode = (searchParams.get('rentalMode') || 'DAILY') as 'DAILY' | 'HOURLY';

  const [vendors, setVendors] = useState<VendorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentLocation: DeliveryLocation = {
    locationType: 'DOORSTEP',
    locationSource: 'GOOGLE_PLACE',
    address,
    city,
    lat,
    lng,
  };

  const currentSchedule: SearchSchedule = {
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    rentalMode,
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vendors/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: currentLocation,
          pickupDateTime: pickupDate ? `${pickupDate}T${pickupTime}` : undefined,
          returnDateTime: returnDate ? `${returnDate}T${returnTime}` : undefined,
          rentalMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch available vendors.');
      }

      setVendors(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load available rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [address, city, pickupDate, pickupTime, returnDate, returnTime, rentalMode]);

  const handleSearchTrigger = (loc: DeliveryLocation, sched: SearchSchedule) => {
    const params = new URLSearchParams({
      address: loc.address,
      city: loc.city || 'Rishikesh',
      lat: String(loc.lat || 30.1033),
      lng: String(loc.lng || 78.2948),
      pickupDate: sched.pickupDate,
      pickupTime: sched.pickupTime,
      returnDate: sched.returnDate,
      returnTime: sched.returnTime,
      rentalMode: sched.rentalMode,
    });
    router.push(`/vendors?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Search Bar Section */}
        <section className="space-y-4">
          <DiscoverySearchBar
            initialLocation={currentLocation}
            initialSchedule={currentSchedule}
            onSearch={handleSearchTrigger}
            compact
          />
        </section>

        {/* Header Results Overview */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              Available Rental Partners Near {city}
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Verified local vendors serving {address}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
              {vendors.length} Vendor{vendors.length === 1 ? '' : 's'} Found
            </span>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse min-h-[220px]"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={fetchVendors}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && vendors.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-md">
            <div className="w-12 h-12 bg-amber-50 text-brand-orange rounded-2xl flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            <h2 className="text-base font-black text-slate-900">No rental partners found for this location and time.</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              We couldn&apos;t find active vendors for your exact search parameters. Try adjusting your pickup dates or location.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/vendors';
                }}
                className="px-4 py-2.5 bg-brand-orange text-white font-black text-xs rounded-2xl hover:bg-amber-600 transition-all shadow-md shadow-brand-orange/20"
              >
                Reset Search Filters
              </button>
            </div>
          </div>
        )}

        {/* Vendor Grid */}
        {!loading && !error && vendors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor._id}
                vendor={vendor}
                pickupDate={pickupDate}
                pickupTime={pickupTime}
                returnDate={returnDate}
                returnTime={returnTime}
                rentalMode={rentalMode}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function VendorMarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="animate-spin text-brand-orange mb-2">
            <RefreshCw className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-xs text-slate-500 font-bold">Loading rental partners...</p>
        </div>
      }
    >
      <VendorMarketplaceContent />
    </Suspense>
  );
}
