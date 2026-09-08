'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompare } from '@/context/CompareContext';
import { formatINR } from '@/lib/utils';
import { getVehiclePhotos } from '@/lib/vehicle-images';
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
  ArrowRight,
  Lock,
} from 'lucide-react';

interface VehicleCardProps {
  vehicle: any;
  pickupDateTime?: string;
  returnDateTime?: string;
  isPriority?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  pickupDateTime,
  returnDateTime,
  isPriority = false,
}) => {
  const { addToCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(vehicle._id);

  const photos = getVehiclePhotos(vehicle);
  const [imgSrc, setImgSrc] = useState(photos[0]);

  const bookingUrl = `/book/${vehicle._id}${
    pickupDateTime && returnDateTime
      ? `?pickup=${encodeURIComponent(pickupDateTime)}&return=${encodeURIComponent(returnDateTime)}`
      : ''
  }`;

  const detailUrl = `/vehicles/${vehicle._id}`;

  const depositEnabled = vehicle.securityDepositEnabled !== false;
  const depositAmount = vehicle.securityDepositAmount ?? vehicle.securityDeposit ?? 1000;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/85 shadow-sm hover:shadow-2xl hover:border-brand-orange/40 hover:-translate-y-1 transition-all duration-200 ease-out flex flex-col justify-between overflow-hidden group">
      {/* Top Media & Badges */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <Image
          src={imgSrc}
          alt={getVehicleAltText(vehicle)}
          fill
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          fetchPriority={isPriority ? 'high' : 'auto'}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgSrc(getVehicleImage(vehicle))}
          className="object-contain p-2 group-hover:scale-[1.03] transition-transform duration-250 ease-out"
        />

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-0.5 rounded-full bg-navy-950/85 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/15">
            {vehicle.category}
          </span>
          {vehicle.isVerified && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1 shadow-sm border border-emerald-400/30 group-hover:bg-emerald-500 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-200">
              <ShieldCheck className="w-3 h-3" /> Verified Partner
            </span>
          )}
        </div>

        {/* Compare Toggle */}
        <button
          onClick={(e) => {
            e.preventDefault();
            addToCompare(vehicle);
          }}
          className={`absolute top-3 right-3 p-2 rounded-2xl backdrop-blur-md transition-all z-10 ${
            inCompare
              ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/40 scale-105'
              : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white'
          }`}
          title={inCompare ? 'Remove from comparison' : 'Add to comparison'}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Bottom Image Overlay Overlay Rating & City */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-white">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold border border-white/10">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{vehicle.rating ? vehicle.rating.toFixed(1) : '4.8'}</span>
            <span className="text-[10px] text-slate-300 font-normal">
              ({vehicle.totalReviews || 12})
            </span>
          </div>

          {vehicle.destinationId?.name && (
            <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-200 border border-white/10">
              {vehicle.destinationId.name}
            </span>
          )}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-extrabold font-heading text-slate-900 group-hover:text-brand-orange transition-colors line-clamp-1">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">{vehicle.variant || 'Standard Model'}</p>
            </div>
            {depositEnabled ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                <Lock className="w-2.5 h-2.5 text-brand-orange" /> Deposit {formatINR(depositAmount)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ⚡ No Deposit Needed
              </span>
            )}
          </div>

          {/* Quick Specs */}
          <div className="grid grid-cols-3 gap-2 my-3 text-[11px] text-slate-600 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1 truncate">
              <Fuel className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              <span className="capitalize">{vehicle.fuelType?.toLowerCase() || 'petrol'}</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <Gauge className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              <span className="capitalize">{vehicle.transmission?.toLowerCase() || 'manual'}</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{vehicle.deliveryAvailable ? 'Delivery' : 'Hub Pickup'}</span>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Per Day</div>
            <div className="text-lg font-black text-navy-950 font-heading">
              {formatINR(vehicle.pricePerDay)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={detailUrl}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Details
            </Link>
            <Link
              href={bookingUrl}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white text-xs font-black shadow-md shadow-brand-orange/20 flex items-center gap-1 group/btn transition-all"
            >
              <span>Book</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
