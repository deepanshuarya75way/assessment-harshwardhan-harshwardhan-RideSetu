'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCompare } from '@/context/CompareContext';
import { formatINR } from '@/lib/utils';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';
import {
  ShieldCheck,
  Star,
  Fuel,
  Gauge,
  CheckCircle2,
  Layers,
  Truck,
  Zap,
  PhoneCall,
  Calendar,
  Clock,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  FileCheck2,
  User,
  Sparkles,
  MapPin,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const { addToCompare, isInCompare } = useCompare();
  const [vehicle, setVehicle] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Default dates
  const defaultPickup = new Date();
  defaultPickup.setDate(defaultPickup.getDate() + 1);
  const defaultReturn = new Date(defaultPickup);
  defaultReturn.setDate(defaultReturn.getDate() + 2);

  const [pickupDate, setPickupDate] = useState(defaultPickup.toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState(defaultReturn.toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('20:00');

  // Server-calculated pricing preview state
  const [pricing, setPricing] = useState<any>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const fetchServerPricing = useCallback(async () => {
    if (!vehicleId) return;
    try {
      setPriceLoading(true);
      const query = new URLSearchParams({
        vehicleId,
        pickupDateTime: `${pickupDate}T${pickupTime}:00`,
        returnDateTime: `${returnDate}T${returnTime}:00`,
      });

      const res = await fetch(`/api/pricing/calculate?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pricing) {
          setPricing(data.pricing);
        }
      }
    } catch (err) {
      console.error('Pricing preview fetch error:', err);
    } finally {
      setPriceLoading(false);
    }
  }, [vehicleId, pickupDate, pickupTime, returnDate, returnTime]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/vehicles/${vehicleId}`);
        const data = await res.json();
        if (data.vehicle) {
          setVehicle(data.vehicle);
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error('Failed to load vehicle:', err);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicle();
      fetchServerPricing();
    }
  }, [vehicleId, fetchServerPricing]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="inline-block w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-bold">Loading verified vehicle specifications...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-14 h-14 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-extrabold text-navy-950 font-heading">Vehicle Not Found</h2>
        <p className="text-sm text-slate-500">This vehicle may no longer be available in the marketplace inventory.</p>
        <Link href="/vehicles" className="inline-block px-6 py-3 rounded-2xl bg-brand-orange text-white text-xs font-extrabold shadow-lg shadow-brand-orange/30">
          Browse All Verified Vehicles
        </Link>
      </div>
    );
  }

  const inCompare = isInCompare(vehicle._id);
  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'];

  const vendor = vehicle.vendorId || {};
  const destination = vehicle.destinationId || {};

  const bookingUrl = `/book/${vehicle._id}?pickup=${pickupDate}T${pickupTime}:00&return=${returnDate}T${returnTime}:00`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28 lg:pb-12">
      {/* Back link */}
      <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to All Fleet
      </Link>

      {/* Main Grid: Gallery & Details on Left, Sticky Booking Box on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photos & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 relative group">
              <Image
                src={images[activeImageIndex] || getVehicleImage(vehicle)}
                alt={getVehicleAltText(vehicle)}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                <span className="px-3 py-1 rounded-full bg-navy-950/80 backdrop-blur-md text-white text-xs font-extrabold uppercase tracking-wider border border-white/10">
                  {vehicle.category}
                </span>
                {vehicle.isVerified && (
                  <span className="px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1 shadow-sm border border-emerald-400/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Local Partner
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => addToCompare(vehicle)}
                className={`absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md ${
                  inCompare
                    ? 'bg-brand-orange text-white ring-2 ring-white shadow-brand-orange/30'
                    : 'bg-white/90 text-slate-800 hover:bg-white hover:text-brand-orange'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{inCompare ? 'In Comparison' : 'Add to Compare'}</span>
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-brand-orange ring-2 ring-brand-orange/30 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="thumbnail" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Specifications */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-xl text-amber-950 font-black text-sm">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{Number(vehicle.rating || 4.8).toFixed(1)}</span>
                  <span className="text-slate-400 font-medium text-xs">({vehicle.totalReviews || 12} reviews)</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {vehicle.variant} • {vehicle.year} Model • {typeof destination === 'object' ? destination.name : 'Uttarakhand Hub'}
              </p>
            </div>

            {/* Spec Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-extrabold uppercase text-[10px]">Engine / Power</span>
                <div className="font-black text-slate-900">{vehicle.specifications?.engineCc ? `${vehicle.specifications.engineCc} cc` : vehicle.fuelType}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-extrabold uppercase text-[10px]">Transmission</span>
                <div className="font-black text-slate-900">{vehicle.transmission}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-extrabold uppercase text-[10px]">Daily KM Limit</span>
                <div className="font-black text-slate-900">{vehicle.kmLimitPerDay ? `${vehicle.kmLimitPerDay} km/day` : 'Unlimited KM'}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-extrabold uppercase text-[10px]">Excess KM Rate</span>
                <div className="font-black text-slate-900">₹{vehicle.excessKmCharge || 4}/km</div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm font-heading mb-3">Rental Inclusions & Benefits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 Complimentary ISI-Certified Helmet</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>24/7 Roadside Mechanical SOS Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Doorstep Hotel & Hostel Delivery Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>360° Digital Handover Scratch Protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Local Partner Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-navy-950 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  🏢
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-heading">{vendor.businessName || 'Verified Partner'}</h3>
                  <p className="text-xs text-slate-500 font-medium">📍 {vendor.address || 'Tapovan Hub, Rishikesh'}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                Trade Licensed
              </span>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-heading">
                  Verified Traveller Reviews ({reviews.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">Authentic feedback from travellers who completed their trip on this vehicle.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-950 font-black text-sm">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{Number(vehicle.rating || 4.8).toFixed(1)} / 5.0</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No reviews yet. Be the first to rent and review this ride!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image
                          src={r.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={r.customerName}
                          width={26}
                          height={26}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <span className="font-bold text-slate-900">{r.customerName}</span>
                        {r.isVerifiedRental && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified Ride
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.overallRating || 5 }).map((_, si) => (
                          <Star key={si} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Sub-ratings Breakdown */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 py-1">
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200">Vehicle: <strong>{r.vehicleConditionRating || r.overallRating}★</strong></span>
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200">Host: <strong>{r.vendorBehaviorRating || r.overallRating}★</strong></span>
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200">Pickup: <strong>{r.pickupExperienceRating || r.overallRating}★</strong></span>
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200">Delivery: <strong>{r.deliveryExperienceRating || r.overallRating}★</strong></span>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-normal">{r.reviewText}</p>

                    {r.vendorReply && r.vendorReply.text && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 mt-2 space-y-0.5">
                        <strong className="text-slate-900 block text-[11px] flex items-center gap-1">
                          🏢 Partner Response:
                        </strong>
                        <p className="text-xs text-slate-700">{r.vendorReply.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Booking Summary Card (Desktop) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xl sticky top-24 space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-3xl font-black font-heading text-navy-950">
                  {formatINR(vehicle.pricePerDay)}
                </span>
                <span className="text-xs text-slate-500 font-bold"> / day</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  {formatINR(vehicle.securityDeposit)} Deposit
                </span>
              </div>
            </div>

            {/* Dates Selection */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Pickup Date & Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setPickupDate(e.target.value);
                      if (e.target.value > returnDate) setReturnDate(e.target.value);
                    }}
                    className="col-span-2 p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none bg-slate-50 focus:ring-2 focus:ring-brand-orange text-xs"
                  />
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none bg-slate-50 focus:ring-2 focus:ring-brand-orange text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-orange" /> Return Date & Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="col-span-2 p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none bg-slate-50 focus:ring-2 focus:ring-brand-orange text-xs"
                  />
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none bg-slate-50 focus:ring-2 focus:ring-brand-orange text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Pricing Breakdown Preview */}
            {pricing && (
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Base Rental ({pricing.durationDays} days)</span>
                  <span className="font-bold text-slate-900">{formatINR(pricing.basePrice)}</span>
                </div>
                {pricing.platformFee > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Platform Service Fee</span>
                    <span className="font-bold text-slate-900">{formatINR(pricing.platformFee)}</span>
                  </div>
                )}
                {pricing.gstAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>GST (18%)</span>
                    <span className="font-bold text-slate-900">{formatINR(pricing.gstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200 font-bold">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Refundable Deposit
                  </span>
                  <span>{formatINR(pricing.securityDeposit)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-navy-950 pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="text-brand-orange">{formatINR(pricing.totalPayable)}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1">
                  * {formatINR(pricing.securityDeposit)} security deposit is refundable and isolated from rental revenue.
                </p>
              </div>
            )}

            {/* Direct Booking CTA */}
            <Link
              href={bookingUrl}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-sm shadow-xl shadow-brand-orange/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Instant Reserve Ride</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-[11px] text-slate-500 text-center space-y-1 pt-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instant Confirmation & Digital Voucher
              </div>
              <p>Refundable security deposit is returned on ride completion.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Mobile Viewports */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-4 border-t border-slate-200 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <div className="text-xl font-black text-navy-950 font-heading">
            {pricing ? formatINR(pricing.totalPayable) : formatINR(vehicle.pricePerDay)}
            <span className="text-xs text-slate-500 font-normal"> {pricing ? 'total' : '/ day'}</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-bold">
            + {formatINR(vehicle.securityDeposit)} Refundable Deposit
          </div>
        </div>
        <Link
          href={bookingUrl}
          className="px-6 py-3 bg-brand-orange hover:bg-brand-dark text-white font-black text-xs rounded-2xl shadow-lg shadow-brand-orange/30 flex items-center gap-1.5 active:scale-95"
        >
          <span>Book Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
