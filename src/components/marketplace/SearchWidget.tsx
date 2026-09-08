'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, Search, Loader2 } from 'lucide-react';

interface SearchWidgetProps {
  initialDestination?: string;
  initialCategory?: string;
  className?: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({
  initialDestination = 'rishikesh',
  initialCategory = 'ALL',
  className = '',
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tomorrow 09:00 to Day after tomorrow 20:00 default
  const defaultPickup = new Date();
  defaultPickup.setDate(defaultPickup.getDate() + 1);
  defaultPickup.setHours(9, 0, 0, 0);

  const defaultReturn = new Date(defaultPickup);
  defaultReturn.setDate(defaultReturn.getDate() + 2);
  defaultReturn.setHours(20, 0, 0, 0);

  const [destination, setDestination] = useState(initialDestination);
  const [category, setCategory] = useState(initialCategory);
  const [pickupDate, setPickupDate] = useState(defaultPickup.toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState(defaultReturn.toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('20:00');
  const [pickupLocation, setPickupLocation] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Fleet', icon: '✨' },
    { id: 'SCOOTER', label: 'Scooty', icon: '🛵' },
    { id: 'MOTORCYCLE', label: 'Bikes', icon: '🏍️' },
    { id: 'CAR', label: 'Self-Drive Cars', icon: '🚗' },
    { id: 'EV', label: 'Electric EV', icon: '⚡' },
  ];

  const destinations = [
    { slug: 'rishikesh', name: 'Rishikesh', badge: 'Tapovan & Ghats' },
    { slug: 'mussoorie', name: 'Mussoorie', badge: 'Mall Road Hills' },
    { slug: 'dehradun', name: 'Dehradun', badge: 'Airport & ISBT' },
    { slug: 'nainital', name: 'Nainital', badge: 'Lake City' },
    { slug: 'haridwar', name: 'Haridwar', badge: 'Holy Railway Hub' },
    { slug: 'haldwani', name: 'Haldwani', badge: 'Kathgodam Base' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const pickupDateTime = `${pickupDate}T${pickupTime}:00`;
    const returnDateTime = `${returnDate}T${returnTime}:00`;

    const params = new URLSearchParams({
      destination,
      category,
      pickupDateTime,
      returnDateTime,
    });

    if (pickupLocation !== 'ALL') {
      params.append('location', pickupLocation);
    }

    router.push(`/vehicles?${params.toString()}`);
  };

  return (
    <div
      className={`glass-panel rounded-3xl shadow-2xl shadow-navy-950/25 border border-white/70 p-4 sm:p-6 lg:p-7 text-slate-900 transition-all duration-300 w-full max-w-full overflow-hidden ${className}`}
    >
      {/* Category Filter Horizontal Scrollable Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-4 border-b border-slate-100/90 no-scrollbar w-full max-w-full touch-pan-x">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`flex-shrink-0 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 focus-ring ${
              category === c.id
                ? 'bg-navy-950 text-white shadow-md shadow-navy-950/20'
                : 'bg-slate-100/95 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
            }`}
          >
            <span className="text-sm">{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* 1. Destination Hub Picker (Full width on mobile) */}
        <div className="bg-slate-50/95 hover:bg-slate-100/95 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 transition-all focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 min-h-[60px] sm:min-h-[64px] flex flex-col justify-center w-full">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>Destination Hub</span>
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-transparent font-black text-slate-900 text-sm sm:text-xs lg:text-sm focus:outline-none cursor-pointer truncate"
          >
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug} className="text-slate-900">
                {d.name} ({d.badge})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Pickup Date & Time (Full width on mobile) */}
        <div className="bg-slate-50/95 hover:bg-slate-100/95 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 transition-all focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 min-h-[60px] sm:min-h-[64px] flex flex-col justify-center w-full">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>Pickup Date & Time</span>
          </label>
          <div className="flex gap-2 items-center w-full">
            <input
              type="date"
              value={pickupDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setPickupDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 text-sm sm:text-xs focus:outline-none flex-1 min-w-0 cursor-pointer"
            />
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="bg-transparent font-bold text-slate-900 text-sm sm:text-xs focus:outline-none w-20 sm:w-16 lg:w-20 cursor-pointer text-right"
            />
          </div>
        </div>

        {/* 3. Return Date & Time (Stacked on mobile) */}
        <div className="bg-slate-50/95 hover:bg-slate-100/95 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 transition-all focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 min-h-[60px] sm:min-h-[64px] flex flex-col justify-center w-full">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>Return Date & Time</span>
          </label>
          <div className="flex gap-2 items-center w-full">
            <input
              type="date"
              value={returnDate}
              min={pickupDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 text-sm sm:text-xs focus:outline-none flex-1 min-w-0 cursor-pointer"
            />
            <input
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="bg-transparent font-bold text-slate-900 text-sm sm:text-xs focus:outline-none w-20 sm:w-16 lg:w-20 cursor-pointer text-right"
            />
          </div>
        </div>

        {/* 4. Search Submit Button (Full width on mobile) */}
        <div className="flex items-center w-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] sm:min-h-[60px] px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-sm shadow-xl shadow-brand-orange/25 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] group focus-ring disabled:opacity-80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Finding Fleet...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">Search Verified Rides</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchWidget;
