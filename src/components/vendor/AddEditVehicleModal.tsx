'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  ShieldAlert,
  ShieldCheck,
  IndianRupee,
  ChevronRight,
  ChevronLeft,
  Eye,
  Save,
  Sparkles,
  Info,
  Layers,
  Image as ImageIcon,
  MapPin,
  Clock,
  Gauge,
  Fuel,
  Check,
} from 'lucide-react';

interface AddEditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: any;
  onSuccess: () => void;
  destinations?: any[];
}

export default function AddEditVehicleModal({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
  destinations = [],
}: AddEditVehicleModalProps) {
  const isEditing = Boolean(vehicle?._id);

  // Form State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    _id: vehicle?._id || undefined,
    brand: vehicle?.brand || 'Honda',
    model: vehicle?.model || 'Activa 6G',
    variant: vehicle?.variant || 'Standard',
    category: vehicle?.category || 'SCOOTER',
    year: vehicle?.year || 2024,
    color: vehicle?.color || 'Matte Black',
    registrationNumber: vehicle?.registrationNumber || '',
    odometer: vehicle?.odometer || 4500,
    fuelType: vehicle?.fuelType || 'PETROL',
    transmission: vehicle?.transmission || 'AUTOMATIC',
    description: vehicle?.description || 'Well-maintained vehicle suitable for Himalayan hill riding.',
    pricePerDay: vehicle?.pricePerDay || 460,
    pricePerHour: vehicle?.pricePerHour || 50,
    weeklyPrice: vehicle?.weeklyPrice || '',
    monthlyPrice: vehicle?.monthlyPrice || '',
    securityDepositEnabled: vehicle?.securityDepositEnabled ?? true,
    securityDepositAmount: vehicle?.securityDepositAmount ?? 1000,
    kmLimitPerDay: vehicle?.kmLimitPerDay ?? 150,
    excessKmCharge: vehicle?.excessKmCharge ?? 4,
    deliveryAvailable: vehicle?.deliveryAvailable ?? true,
    hotelDeliveryAvailable: vehicle?.hotelDeliveryAvailable ?? true,
    hostelDeliveryAvailable: vehicle?.hostelDeliveryAvailable ?? true,
    pickupAvailable: vehicle?.pickupAvailable ?? true,
    lateReturnFeePerHour: vehicle?.lateReturnFeePerHour ?? 100,
    helmetIncluded: vehicle?.helmetIncluded ?? true,
    roadsideAssistance: vehicle?.roadsideAssistance ?? true,
    oneWayAvailable: vehicle?.oneWayAvailable ?? false,
    images: vehicle?.images?.length ? vehicle.images : [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    ],
    photos: {
      front: vehicle?.photos?.front || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      rear: vehicle?.photos?.rear || 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
      left: vehicle?.photos?.left || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      right: vehicle?.photos?.right || '',
      dashboard: vehicle?.photos?.dashboard || '',
      odometer: vehicle?.photos?.odometer || '',
    },
    specifications: {
      engineCc: vehicle?.specifications?.engineCc || 110,
      batteryCapacityKwh: vehicle?.specifications?.batteryCapacityKwh || '',
      rangeKm: vehicle?.specifications?.rangeKm || '',
      topSpeedKmph: vehicle?.specifications?.topSpeedKmph || 85,
      seatingCapacity: vehicle?.specifications?.seatingCapacity || 2,
      luggageSpace: vehicle?.specifications?.luggageSpace || 'Standard under-seat storage',
    },
    status: vehicle?.status || 'DRAFT',
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        _id: vehicle._id,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        variant: vehicle.variant || '',
        category: vehicle.category || 'SCOOTER',
        year: vehicle.year || 2024,
        color: vehicle.color || 'Black',
        registrationNumber: vehicle.registrationNumber || '',
        odometer: vehicle.odometer || 5000,
        fuelType: vehicle.fuelType || 'PETROL',
        transmission: vehicle.transmission || 'MANUAL',
        description: vehicle.description || '',
        pricePerDay: vehicle.pricePerDay || 500,
        pricePerHour: vehicle.pricePerHour || 50,
        weeklyPrice: vehicle.weeklyPrice || '',
        monthlyPrice: vehicle.monthlyPrice || '',
        securityDepositEnabled: vehicle.securityDepositEnabled ?? true,
        securityDepositAmount: vehicle.securityDepositAmount ?? 1000,
        kmLimitPerDay: vehicle.kmLimitPerDay ?? 150,
        excessKmCharge: vehicle.excessKmCharge ?? 4,
        deliveryAvailable: vehicle.deliveryAvailable ?? true,
        hotelDeliveryAvailable: vehicle.hotelDeliveryAvailable ?? true,
        hostelDeliveryAvailable: vehicle.hostelDeliveryAvailable ?? true,
        pickupAvailable: vehicle.pickupAvailable ?? true,
        lateReturnFeePerHour: vehicle.lateReturnFeePerHour ?? 100,
        helmetIncluded: vehicle.helmetIncluded ?? true,
        roadsideAssistance: vehicle.roadsideAssistance ?? true,
        oneWayAvailable: vehicle.oneWayAvailable ?? false,
        images: vehicle.images?.length ? vehicle.images : [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
        ],
        photos: {
          front: vehicle.photos?.front || '',
          rear: vehicle.photos?.rear || '',
          left: vehicle.photos?.left || '',
          right: vehicle.photos?.right || '',
          dashboard: vehicle.photos?.dashboard || '',
          odometer: vehicle.photos?.odometer || '',
        },
        specifications: {
          engineCc: vehicle.specifications?.engineCc || 110,
          batteryCapacityKwh: vehicle.specifications?.batteryCapacityKwh || '',
          rangeKm: vehicle.specifications?.rangeKm || '',
          topSpeedKmph: vehicle.specifications?.topSpeedKmph || 85,
          seatingCapacity: vehicle.specifications?.seatingCapacity || 2,
          luggageSpace: vehicle.specifications?.luggageSpace || 'Standard',
        },
        status: vehicle.status || 'DRAFT',
      });
    }
  }, [vehicle]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value },
    }));
  };

  const handlePhotoChange = (slot: string, url: string) => {
    const newPhotos = { ...formData.photos, [slot]: url };
    const allUrls = Object.values(newPhotos).filter(Boolean) as string[];
    const mergedImages = Array.from(new Set([...allUrls, ...formData.images]));
    setFormData((prev) => ({
      ...prev,
      photos: newPhotos,
      images: mergedImages.length > 0 ? mergedImages : prev.images,
    }));
  };

  const handleAddImageUrl = (url: string) => {
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      images: Array.from(new Set([...prev.images, url])),
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_: string, i: number) => i !== index),
    }));
  };

  // Pricing preview logic
  const dailyPrice = Number(formData.pricePerDay) || 0;
  const platformFee = 49;
  const gst = Math.round((dailyPrice + platformFee) * 0.18);
  const deposit = formData.securityDepositEnabled ? (Number(formData.securityDepositAmount) || 0) : 0;
  const totalCustomerPayable = dailyPrice + platformFee + gst + deposit;

  // Validation Checklist
  const totalPhotosCount = formData.images.length + Object.values(formData.photos).filter(Boolean).length;
  const isDetailsComplete = Boolean(formData.brand && formData.model && formData.registrationNumber);
  const isPricingValid = dailyPrice > 0;
  const isPhotosSufficient = totalPhotosCount >= 3;

  const handleSubmit = async (targetStatus: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        ...formData,
        status: targetStatus,
        securityDeposit: deposit,
        securityDepositAmount: deposit,
        securityDepositEnabled: formData.securityDepositEnabled,
      };

      const url = isEditing ? `/api/vendor/vehicles/${vehicle._id}` : '/api/vendor/vehicles';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save vehicle.');
      }

      setSuccessMsg(data.message || 'Vehicle saved successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const PresetPhotoPicker = () => {
    const presets = [
      { name: 'Activa 6G Front', url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80' },
      { name: 'Royal Enfield Classic', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80' },
      { name: 'Himalayan Adventure', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80' },
      { name: 'Thar 4x4 / Car', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' },
      { name: 'EV Scooter Meter', url: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80' },
    ];
    return (
      <div className="mt-3 p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
        <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider block">
          Quick Preset Photo Library (Himalayan Fleet Approved)
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddImageUrl(p.url)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-xs font-semibold border border-white/10 transition-all"
            >
              + Add {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-heading">
                {isEditing ? `Edit Vehicle — ${formData.brand} ${formData.model}` : 'List New Vehicle in Uttarakhand Fleet'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Multi-step listing wizard. Drafts are safely saved until published.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-2 text-xs">
          {[
            { id: 1, label: '1. Basic Info' },
            { id: 2, label: '2. Specs' },
            { id: 3, label: '3. Pricing' },
            { id: 4, label: '4. Deposit' },
            { id: 5, label: '5. Extras' },
            { id: 6, label: '6. Photos' },
            { id: 7, label: '7. Preview & Publish' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                step === s.id
                  ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20 font-extrabold'
                  : step > s.id
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    placeholder="e.g. Royal Enfield, Honda, TVS, Hyundai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="e.g. Classic 350, Activa 6G, Creta"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Variant / Edition</label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={(e) => handleChange('variant', e.target.value)}
                    placeholder="e.g. Dual Channel ABS, Deluxe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Vehicle Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  >
                    <option value="SCOOTER">Scooter / Scooty</option>
                    <option value="MOTORCYCLE">Motorcycle / Bike</option>
                    <option value="CAR">Car / SUV</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Model Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Registration Number (RTO) *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. UK07-AX-1234"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-800 font-mono font-bold text-xs focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Vehicle Description & Rider Policy</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Provide vehicle condition, terrain suitability, helmet details, and pickup instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-xs font-medium focus:border-brand-orange focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Specifications */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleChange('fuelType', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric (EV)</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Transmission</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => handleChange('transmission', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                >
                  <option value="AUTOMATIC">Automatic / Gearless</option>
                  <option value="MANUAL">Manual Shift</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Engine CC / Battery kWh</label>
                <input
                  type="number"
                  value={formData.specifications.engineCc}
                  onChange={(e) => handleSpecChange('engineCc', e.target.value)}
                  placeholder="e.g. 110, 350, 411"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  value={formData.specifications.seatingCapacity}
                  onChange={(e) => handleSpecChange('seatingCapacity', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Odometer Reading (Km)</label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => handleChange('odometer', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Luggage Capacity</label>
                <input
                  type="text"
                  value={formData.specifications.luggageSpace}
                  onChange={(e) => handleSpecChange('luggageSpace', e.target.value)}
                  placeholder="e.g. Carrier / Under-seat"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Base Rental Price Per Day (₹) *</label>
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => handleChange('pricePerDay', e.target.value)}
                    placeholder="e.g. 460"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-slate-900 font-heading font-black text-sm focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Hourly Extension Rate (₹/hr)</label>
                  <input
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => handleChange('pricePerHour', e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Daily Km Limit (0 = Unlimited)</label>
                  <input
                    type="number"
                    value={formData.kmLimitPerDay}
                    onChange={(e) => handleChange('kmLimitPerDay', e.target.value)}
                    placeholder="150"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Excess Km Charge (₹/km)</label>
                  <input
                    type="number"
                    value={formData.excessKmCharge}
                    onChange={(e) => handleChange('excessKmCharge', e.target.value)}
                    placeholder="4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:border-brand-orange focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Live Customer Price Calculation Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-amber-300 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Live Customer Billable Breakdown Preview (1 Day)
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Server-Derived Pricing Engine</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Vendor Daily Rental Rate</span>
                    <span className="font-bold text-slate-900">{formatINR(dailyPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Convenience Fee</span>
                    <span>{formatINR(platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% on Rental + Fee)</span>
                    <span>{formatINR(gst)}</span>
                  </div>
                  {formData.securityDepositEnabled && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Refundable Security Deposit (Escrow)</span>
                      <span>{formatINR(deposit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200 font-heading">
                    <span>Estimated Customer Total Payable</span>
                    <span className="text-amber-700">{formatINR(totalCustomerPayable)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Security Deposit */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Security Deposit Configuration
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Configure whether a refundable security deposit is required for this vehicle. Deposits are strictly held in escrow and returned to riders post-trip.
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="depositEnabled"
                      checked={formData.securityDepositEnabled === true}
                      onChange={() => handleChange('securityDepositEnabled', true)}
                      className="w-4 h-4 text-brand-orange focus:ring-brand-orange"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">Require Security Deposit</span>
                      <span className="text-[11px] text-slate-600 font-medium">Collected during checkout and refunded upon safe vehicle return.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="depositEnabled"
                      checked={formData.securityDepositEnabled === false}
                      onChange={() => {
                        handleChange('securityDepositEnabled', false);
                        handleChange('securityDepositAmount', 0);
                      }}
                      className="w-4 h-4 text-brand-orange focus:ring-brand-orange"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">No Security Deposit (₹0)</span>
                      <span className="text-[11px] text-slate-600 font-medium">Attract higher booking volume with zero upfront deposit requirement.</span>
                    </div>
                  </label>
                </div>

                {formData.securityDepositEnabled && (
                  <div className="pt-3 border-t border-slate-200">
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Security Deposit Amount (₹) *</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={formData.securityDepositAmount}
                        onChange={(e) => handleChange('securityDepositAmount', e.target.value)}
                        placeholder="1000"
                        className="w-48 px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-sm focus:outline-none min-h-[44px]"
                      />
                      <span className="text-xs text-slate-600 font-medium">Standard range: ₹500 - ₹5,000</span>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-emerald-700" />
                  Security deposits are NEVER counted as platform revenue or vendor rental earnings.
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Delivery & Extras */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'deliveryAvailable', label: 'Doorstep Delivery Available' },
                  { key: 'hotelDeliveryAvailable', label: 'Hotel Pickup & Drop' },
                  { key: 'hostelDeliveryAvailable', label: 'Hostel Pickup & Drop' },
                  { key: 'pickupAvailable', label: 'Vendor Hub Pickup' },
                  { key: 'helmetIncluded', label: 'Complimentary Rider Helmet Included' },
                  { key: 'roadsideAssistance', label: '24/7 Uttarakhand Roadside Assistance' },
                  { key: 'oneWayAvailable', label: 'One-Way Inter-City Drop Allowed' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-amber-300">
                    <input
                      type="checkbox"
                      checked={Boolean((formData as any)[item.key])}
                      onChange={(e) => handleChange(item.key, e.target.checked)}
                      className="w-4 h-4 text-brand-orange rounded focus:ring-brand-orange"
                    />
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Photos */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-heading flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-600" /> Vehicle Photograph Gallery
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Add at least 3 high-resolution images. First image will serve as the primary marketplace cover.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${isPhotosSufficient ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                  {totalPhotosCount}/3 Minimum Photos Added
                </span>
              </div>

              {/* Photos Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.images.map((imgUrl: string, idx: number) => (
                  <div key={idx} className="relative aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden group">
                    <Image src={imgUrl} alt={`Vehicle photo ${idx + 1}`} fill className="object-cover" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase">
                        Cover Photo
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <PresetPhotoPicker />
            </div>
          )}

          {/* STEP 7: Preview & Publish */}
          {step === 7 && (
            <div className="space-y-6">
              {/* Publishing Readiness Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-black text-slate-900 font-heading">Marketplace Publishing Readiness</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {isDetailsComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span className={isDetailsComplete ? 'text-slate-800 font-semibold' : 'text-rose-700 font-semibold'}>
                      Vehicle Specifications & Registration Number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPricingValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span className={isPricingValid ? 'text-slate-800 font-semibold' : 'text-rose-700 font-semibold'}>
                      Valid Daily Rental Rate ({formatINR(dailyPrice)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPhotosSufficient ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span className={isPhotosSufficient ? 'text-slate-800 font-semibold' : 'text-rose-700 font-semibold'}>
                      Vehicle Images ({totalPhotosCount}/3 minimum added)
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Preview Card Mockup */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> PREVIEW MODE — Not visible to customers yet
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">Live Marketplace Mockup</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-full sm:w-44 aspect-video relative rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <Image src={formData.images[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-base font-black text-slate-900 font-heading">{formData.brand} {formData.model} ({formData.year})</h4>
                    <p className="text-xs text-slate-600 font-medium">Category: {formData.category} • Reg: {formData.registrationNumber || 'UK07-XX-0000'}</p>
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-black text-amber-700 text-sm font-heading">{formatINR(dailyPrice)}/day</span>
                      {formData.securityDepositEnabled && (
                        <span className="text-emerald-800 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          Deposit: {formatINR(formData.securityDepositAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 min-h-[44px]"
            >
              <Save className="w-4 h-4 text-amber-600" /> Save Draft
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {step < 7 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 min-h-[44px]"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit('UNDER_REVIEW')}
                disabled={loading || !isDetailsComplete || !isPricingValid || !isPhotosSufficient}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 min-h-[44px]"
              >
                {loading ? 'Submitting...' : 'Submit & Publish Vehicle'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
