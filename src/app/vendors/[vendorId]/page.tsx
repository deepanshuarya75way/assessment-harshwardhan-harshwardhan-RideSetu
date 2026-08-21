'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import DiscoverySearchBar, { SearchSchedule } from '@/components/discovery/DiscoverySearchBar';
import { DeliveryLocation } from '@/components/booking/DeliveryLocationSelector';
import { Star, MapPin, ShieldCheck, CheckCircle2, Truck, Bike, ArrowRight, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { getVehicleImage, getVehicleAltText, getVehicleImageLoadingConfig } from '@/config/vehicle-images';

interface VendorDetails {
  _id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  totalReviews: number;
  deliveryRadiusKm: number;
  baseDeliveryFee: number;
  operatingHours: { open: string; close: string; days: string };
  verificationStatus: string;
  businessDescription: string;
}

interface VehicleItem {
  _id: string;
  brand: string;
  model: string;
  variant?: string;
  category: string;
  fuelType?: string;
  transmission?: string;
  pricePerDay: number;
  pricePerHour?: number;
  securityDeposit: number;
  isCurrentlyAvailable: boolean;
  reservationConflict?: boolean;
  images?: string[];
  imageUrl?: string;
  imageAlt?: string;
  rating?: number;
}

function VendorStorefrontContent() {
  const params = useParams();
  const vendorId = params.vendorId as string;
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

  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [cartSuccessId, setCartSuccessId] = useState<string | null>(null);

  const currentLocation: DeliveryLocation = {
    locationType: 'DOORSTEP',
    locationSource: 'GOOGLE_PLACE',
    address,
    city,
    lat,
    lng,
  };
  const currentSchedule: SearchSchedule = { pickupDate, pickupTime, returnDate, returnTime, rentalMode };

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        ...(pickupDate && { pickupDateTime: `${pickupDate}T${pickupTime}` }),
        ...(returnDate && { returnDateTime: `${returnDate}T${returnTime}` }),
      });

      const res = await fetch(`/api/vendors/${vendorId}?${query.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch vendor storefront.');
      }

      setVendor(data.vendor);
      setVehicles(data.vehicles || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load vendor storefront details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
    }
  }, [vendorId, pickupDate, pickupTime, returnDate, returnTime]);

  const handleAddToCart = async (vehicle: VehicleItem) => {
    setAddingToCartId(vehicle._id);

    try {
      // Add to existing groupBooking cart session
      const res = await fetch('/api/group-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_RIDE',
          vehicleId: vehicle._id,
          pickupLocation: currentLocation,
          pickupDate: pickupDate || undefined,
          pickupTime: pickupTime || undefined,
          returnDate: returnDate || undefined,
          returnTime: returnTime || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add vehicle to rental cart.');
      }

      setCartSuccessId(vehicle._id);
      setTimeout(() => setCartSuccessId(null), 2500);

      // Trigger cart event for Navbar synchronization
      window.dispatchEvent(new Event('ridesetu_cart_updated'));

      // Redirect to checkout /book/[vehicleId] with preserved search params
      const navParams = new URLSearchParams({
        ...(pickupDate && { pickupDate }),
        ...(pickupTime && { pickupTime }),
        ...(returnDate && { returnDate }),
        ...(returnTime && { returnTime }),
      });

      router.push(`/book/${vehicle._id}?${navParams.toString()}`);
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle to cart.');
    } finally {
      setAddingToCartId(null);
    }
  };

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
    router.push(`/vendors/${vendorId}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Search Schedule Bar */}
        <section className="space-y-4">
          <DiscoverySearchBar
            initialLocation={currentLocation}
            initialSchedule={currentSchedule}
            onSearch={handleSearchTrigger}
            compact
          />
        </section>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-32 bg-slate-100 rounded-2xl w-full" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={fetchVendorDetails}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Vendor Profile Header */}
        {!loading && !error && vendor && (
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                    {vendor.businessName}
                  </h1>
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                </div>

                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{vendor.address}, {vendor.city}, {vendor.state}</span>
                </p>

                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {vendor.businessDescription}
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-3.5 py-1.5 rounded-2xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="text-sm font-black text-amber-900">{vendor.rating.toFixed(1)}</span>
                  <span className="text-xs font-bold text-amber-700">({vendor.totalReviews} reviews)</span>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Operating Hours: {vendor.operatingHours?.open || '08:00 AM'} - {vendor.operatingHours?.close || '09:00 PM'}
                </div>
              </div>
            </div>

            {/* Delivery Availability Badges */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Vendor Hub Pickup
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                <Truck className="w-3.5 h-3.5 text-brand-orange" />
                Doorstep Delivery (up to {vendor.deliveryRadiusKm || 15}km)
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                ✓ Hotel / Hostel Delivery
              </span>
            </div>
          </section>
        )}

        {/* Available Fleet Grid */}
        {!loading && !error && vendor && (
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-xl font-black text-slate-900 font-heading flex items-center gap-2">
                <Bike className="w-5 h-5 text-brand-orange" />
                <span>Available Rides ({vehicles.filter((v) => v.isCurrentlyAvailable).length})</span>
              </h2>
            </div>

            {vehicles.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                <p className="text-xs font-bold text-slate-500">No rides available from this vendor for the selected schedule.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle, idx) => {
                  const imgUrl = getVehicleImage({
                    brand: vehicle.brand,
                    model: vehicle.model,
                    category: vehicle.category,
                    images: vehicle.images,
                  });
                  const altText = getVehicleAltText({
                    brand: vehicle.brand,
                    model: vehicle.model,
                    category: vehicle.category,
                  });
                  const imgConfig = getVehicleImageLoadingConfig({ brand: vehicle.brand, model: vehicle.model }, idx === 0);

                  return (
                    <div
                      key={vehicle._id}
                      className={`bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 flex flex-col justify-between space-y-4 transition-all ${
                        !vehicle.isCurrentlyAvailable ? 'opacity-60 bg-slate-50' : 'hover:shadow-xl hover:border-brand-orange/40'
                      }`}
                    >
                      {/* Vehicle Image */}
                      <div className="relative w-full h-40 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                        <Image
                          src={imgUrl}
                          alt={altText}
                          fill
                          className="object-contain p-2"
                          priority={imgConfig.priority}
                          loading={imgConfig.loading}
                          sizes={imgConfig.sizes}
                        />
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase text-brand-orange bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              {vehicle.category}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 mt-1">
                              {vehicle.brand} {vehicle.model}
                            </h3>
                          </div>
                          {vehicle.rating && (
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-900">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>{vehicle.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          {vehicle.fuelType && <span>⛽ {vehicle.fuelType}</span>}
                          {vehicle.transmission && <span>⚙️ {vehicle.transmission}</span>}
                        </div>
                      </div>

                      {/* Rates & CTA */}
                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center gap-2">
                        <div>
                          <p className="text-base font-black text-slate-900">
                            ₹{vehicle.pricePerDay}<span className="text-xs font-bold text-slate-500">/day</span>
                          </p>
                          {vehicle.pricePerHour && (
                            <p className="text-[11px] font-extrabold text-slate-500">
                              ₹{vehicle.pricePerHour}/hour
                            </p>
                          )}
                        </div>

                        {vehicle.isCurrentlyAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(vehicle)}
                            disabled={addingToCartId === vehicle._id}
                            className={`py-2.5 px-4 rounded-2xl font-black text-xs flex items-center gap-2 transition-all min-h-[42px] ${
                              cartSuccessId === vehicle._id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white shadow-md shadow-brand-orange/20'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                              {addingToCartId === vehicle._id
                                ? 'Adding...'
                                : cartSuccessId === vehicle._id
                                ? 'Added!'
                                : 'ADD TO CART'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default function VendorStorefrontPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="animate-spin text-brand-orange mb-2">
            <RefreshCw className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-xs text-slate-500 font-bold">Loading vendor storefront...</p>
        </div>
      }
    >
      <VendorStorefrontContent />
    </Suspense>
  );
}
