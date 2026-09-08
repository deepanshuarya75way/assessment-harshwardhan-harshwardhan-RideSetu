'use client';

import React from 'react';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import {
  Car,
  X,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';

interface VehiclePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
}

export default function VehiclePreviewModal({
  isOpen,
  onClose,
  vehicle,
}: VehiclePreviewModalProps) {
  if (!isOpen || !vehicle) return null;

  const primaryImage = getVehicleImage(vehicle);
  const altText = getVehicleAltText(vehicle);
  const images = vehicle?.images?.length ? vehicle.images : [primaryImage];

  const depositEnabled = vehicle.securityDepositEnabled ?? true;
  const depositAmount = depositEnabled ? (vehicle.securityDepositAmount ?? vehicle.securityDeposit ?? 1000) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner */}
        <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between font-black text-xs uppercase tracking-wider shadow-sm">
          <span className="flex items-center gap-1.5 font-heading">
            <Sparkles className="w-4 h-4" /> PREVIEW MODE — Not visible to customers yet
          </span>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-video rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
              <Image src={images[0] || primaryImage} alt={altText} fill className="object-contain p-2" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: string, idx: number) => (
                  <div key={idx} className="w-20 h-14 relative rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details & Specifications */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase border border-amber-200">
                  {vehicle.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">{vehicle.registrationNumber || 'UK07-XX-0000'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-heading mt-1">
                {vehicle.brand} {vehicle.model} {vehicle.variant}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-1">{vehicle.description || 'Verified vehicle available for rental in Uttarakhand.'}</p>
            </div>

            {/* Pricing Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wider">Daily Rental Rate</span>
                <span className="text-base font-black text-slate-900 font-heading">{formatINR(vehicle.pricePerDay)}/day</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wider">Security Deposit</span>
                <span className={`text-base font-black font-heading ${depositEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {depositEnabled ? formatINR(depositAmount) : '₹0 Deposit'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wider">Km Limit / Day</span>
                <span className="text-sm font-bold text-slate-800">{vehicle.kmLimitPerDay || 150} Km</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wider">Excess Charge</span>
                <span className="text-sm font-bold text-slate-800">₹{vehicle.excessKmCharge || 4}/km</span>
              </div>
            </div>

            {/* Inclusions & Policies */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Helmet Included
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Roadside Assistance
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Doorstep Delivery
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold text-xs transition-colors min-h-[44px]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
