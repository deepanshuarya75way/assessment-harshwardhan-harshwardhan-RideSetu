'use client';

import React from 'react';
import Link from 'next/link';
import { Star, MapPin, Bike, CheckCircle2, ShieldCheck, ArrowRight, Truck } from 'lucide-react';

export interface VendorCardData {
  _id: string;
  businessName: string;
  ownerName?: string;
  location: string;
  city: string;
  rating: number;
  totalReviews?: number;
  availableVehicleCount: number;
  minDailyPrice: number;
  minHourlyPrice?: number;
  hubPickupAvailable?: boolean;
  doorstepDeliveryAvailable?: boolean;
  hostelDeliveryAvailable?: boolean;
  categories?: string[];
  verificationStatus?: string;
}

interface VendorCardProps {
  vendor: VendorCardData;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  rentalMode?: string;
}

export default function VendorCard({
  vendor,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  rentalMode = 'DAILY',
}: VendorCardProps) {
  const queryParams = new URLSearchParams({
    ...(pickupDate && { pickupDate }),
    ...(pickupTime && { pickupTime }),
    ...(returnDate && { returnDate }),
    ...(returnTime && { returnTime }),
    ...(rentalMode && { rentalMode }),
  });

  const href = `/vendors/${vendor._id}?${queryParams.toString()}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-brand-orange/50 shadow-md hover:shadow-xl transition-all p-5 flex flex-col justify-between space-y-4 group">
      {/* Top Header: Business Name & Rating */}
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-orange transition-colors">
                {vendor.businessName}
              </h3>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{vendor.location || vendor.city}</span>
            </p>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-xl shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="text-xs font-black text-amber-900">{vendor.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Fleet & Price Overview Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold">
            <Bike className="w-3.5 h-3.5 text-brand-orange" />
            <span>{vendor.availableVehicleCount} rides available</span>
          </div>

          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-xl text-xs font-black">
            <span>From ₹{vendor.minDailyPrice}/day</span>
          </div>

          {vendor.minHourlyPrice && (
            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200/60 px-2.5 py-1 rounded-xl text-xs font-bold">
              <span>Hourly from ₹{vendor.minHourlyPrice}/hr</span>
            </div>
          )}
        </div>
      </div>

      {/* Services & Delivery Badges */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-emerald-700 font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Hub Pickup
          </span>
          {vendor.doorstepDeliveryAvailable !== false && (
            <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
              <Truck className="w-3 h-3 text-brand-orange" />
              Doorstep Delivery
            </span>
          )}
          {vendor.hostelDeliveryAvailable !== false && (
            <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
              ✓ Hostel Delivery
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Link
          href={href}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-brand-orange text-white font-black text-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <span>VIEW VEHICLES</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
