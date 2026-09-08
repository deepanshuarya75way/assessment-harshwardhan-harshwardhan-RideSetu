'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Search, Sparkles } from 'lucide-react';
import { DeliveryLocation } from '@/components/booking/DeliveryLocationSelector';

export interface SearchSchedule {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  rentalMode: 'DAILY' | 'HOURLY';
}

interface DiscoverySearchBarProps {
  initialLocation?: DeliveryLocation | null;
  initialSchedule?: Partial<SearchSchedule>;
  onSearch?: (location: DeliveryLocation, schedule: SearchSchedule) => void;
  compact?: boolean;
}

const DESTINATION_CITIES = [
  { name: 'Rishikesh', badge: 'Tapovan & Ghats', lat: 30.1033, lng: 78.2948 },
  { name: 'Mussoorie', badge: 'Mall Road Hills', lat: 30.4598, lng: 78.0644 },
  { name: 'Dehradun', badge: 'Airport & ISBT', lat: 30.3165, lng: 78.0322 },
  { name: 'Nainital', badge: 'Lake City', lat: 29.3919, lng: 79.4542 },
  { name: 'Haridwar', badge: 'Holy Railway Hub', lat: 29.9457, lng: 78.1642 },
  { name: 'Haldwani', badge: 'Kathgodam Base', lat: 29.2183, lng: 79.5130 },
];

export default function DiscoverySearchBar({
  initialLocation,
  initialSchedule,
  onSearch,
  compact = false,
}: DiscoverySearchBarProps) {
  // Default dates: tomorrow to +2 days
  const getTomorrowString = (offsetDays = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const [selectedCity, setSelectedCity] = useState(initialLocation?.city || 'Rishikesh');
  const [pickupDate, setPickupDate] = useState(initialSchedule?.pickupDate || getTomorrowString(1));
  const [pickupTime, setPickupTime] = useState(initialSchedule?.pickupTime || '10:00');
  const [returnDate, setReturnDate] = useState(initialSchedule?.returnDate || getTomorrowString(3));
  const [returnTime, setReturnTime] = useState(initialSchedule?.returnTime || '10:00');
  const [rentalMode, setRentalMode] = useState<'DAILY' | 'HOURLY'>(initialSchedule?.rentalMode || 'DAILY');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialLocation?.city) setSelectedCity(initialLocation.city);
  }, [initialLocation]);

  useEffect(() => {
    if (initialSchedule?.pickupDate) setPickupDate(initialSchedule.pickupDate);
    if (initialSchedule?.pickupTime) setPickupTime(initialSchedule.pickupTime);
    if (initialSchedule?.returnDate) setReturnDate(initialSchedule.returnDate);
    if (initialSchedule?.returnTime) setReturnTime(initialSchedule.returnTime);
    if (initialSchedule?.rentalMode) setRentalMode(initialSchedule.rentalMode);
  }, [initialSchedule]);

  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');

    const startMs = new Date(`${pickupDate}T${pickupTime}`).getTime();
    const endMs = new Date(`${returnDate}T${returnTime}`).getTime();
    const nowMs = new Date().getTime() - 5 * 60 * 1000;

    if (isNaN(startMs) || startMs < nowMs) {
      setValidationError('Pickup date and time cannot be in the past.');
      return;
    }

    if (isNaN(endMs) || endMs <= startMs) {
      setValidationError('Return date & time must be after pickup time.');
      return;
    }

    const cityMeta = DESTINATION_CITIES.find((c) => c.name.toLowerCase() === selectedCity.toLowerCase()) || DESTINATION_CITIES[0];

    const discoveryLocation: DeliveryLocation = {
      address: `${cityMeta.name}, Uttarakhand`,
      city: cityMeta.name,
      lat: cityMeta.lat,
      lng: cityMeta.lng,
      locationType: 'VENDOR_PICKUP',
      locationSource: 'MANUAL',
    };

    const schedule: SearchSchedule = {
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      rentalMode,
    };

    if (onSearch) {
      onSearch(discoveryLocation, schedule);
    } else {
      const params = new URLSearchParams({
        address: discoveryLocation.address,
        city: discoveryLocation.city || 'Rishikesh',
        lat: String(discoveryLocation.lat),
        lng: String(discoveryLocation.lng),
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        rentalMode,
      });
      window.location.href = `/vendors?${params.toString()}`;
    }
  };

  return (
    <div className={`w-full font-sans ${compact ? 'max-w-5xl' : 'max-w-4xl'} mx-auto`}>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-6 space-y-4">
        {/* Header Title & Mode Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <span>Where are you riding?</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Find verified rental partners & book bikes in Himalayan hubs
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setRentalMode('DAILY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                rentalMode === 'DAILY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daily Rental
            </button>
            <button
              type="button"
              onClick={() => setRentalMode('HOURLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                rentalMode === 'HOURLY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hourly Rental
            </button>
          </div>
        </div>

        {/* Validation Banner */}
        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-shake">
            ⚠️ {validationError}
          </div>
        )}

        {/* Form Grid */}
        <form onSubmit={handleExecuteSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* 1. Discovery Destination City Selector */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-extrabold uppercase text-slate-500 block">Select City / Destination</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-brand-orange absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:border-brand-orange focus:bg-white appearance-none cursor-pointer"
              >
                {DESTINATION_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Pickup Date & Time */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block">Pickup Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  min={getTomorrowString(0)}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block">Time</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          </div>

          {/* 3. Return Date & Time */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block">Return Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  min={pickupDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block">Time</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          </div>

          {/* 4. Primary CTA Button */}
          <div className="md:col-span-12 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white font-black text-xs shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>SEARCH AVAILABLE VENDORS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
