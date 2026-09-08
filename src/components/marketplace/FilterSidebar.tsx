'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { Filter, RotateCcw, ShieldCheck, Truck, Zap, Check, Star } from 'lucide-react';

interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  fuelType: string;
  transmission: string;
  minRating: number;
  deliveryOnly: boolean;
  verifiedOnly: boolean;
  sort: string;
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-extrabold font-heading text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-brand-orange" />
          <span>Filters & Sort</span>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] font-bold text-slate-500 hover:text-brand-orange flex items-center gap-1 transition-colors active:scale-95"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sorting Dropdown */}
      <div>
        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
          Sort Marketplace
        </label>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full text-xs font-bold p-3 border border-slate-200/80 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-brand-orange outline-none cursor-pointer text-slate-900"
        >
          <option value="recommended">⭐ Recommended & Top Rated</option>
          <option value="price_asc">💰 Price: Low to High</option>
          <option value="price_desc">💎 Price: High to Low</option>
          <option value="popular">🔥 Most Booked Fleet</option>
          <option value="newest">✨ Newest Models (2024)</option>
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
          Vehicle Category
        </label>
        <div className="space-y-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All Fleet Types' },
            { id: 'SCOOTER', label: 'Scooter / Scooty (110-125cc)' },
            { id: 'MOTORCYCLE', label: 'Motorcycle & Cruiser' },
            { id: 'CAR', label: 'Self-Drive Car & 4x4' },
            { id: 'EV', label: 'Electric EV Scooters' },
          ].map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                filters.category === cat.id
                  ? 'border-brand-orange bg-brand-light font-extrabold text-brand-dark shadow-sm'
                  : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              <span>{cat.label}</span>
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.id}
                onChange={() => updateFilter('category', cat.id)}
                className="hidden"
              />
              {filters.category === cat.id && <Check className="w-3.5 h-3.5 text-brand-orange" />}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[11px]">Max Price / Day</span>
          <span className="font-black text-navy-950 font-heading text-sm">
            {formatINR(filters.maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min={300}
          max={4500}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => updateFilter('maxPrice', Number(e.target.value))}
          className="w-full accent-brand-orange cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
          <span>₹300/day</span>
          <span>₹4,500/day</span>
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
          Transmission
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'AUTOMATIC', label: 'Auto' },
            { id: 'MANUAL', label: 'Manual' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateFilter('transmission', item.id)}
              className={`py-2 text-center rounded-xl border font-bold transition-all ${
                filters.transmission === item.id
                  ? 'border-navy-950 bg-navy-950 text-white shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
          Fuel Type
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'Any Fuel' },
            { id: 'PETROL', label: 'Petrol' },
            { id: 'ELECTRIC', label: 'Electric EV' },
            { id: 'DIESEL', label: 'Diesel' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateFilter('fuelType', item.id)}
              className={`py-2 px-2.5 text-left rounded-xl border text-xs font-bold transition-all ${
                filters.fuelType === item.id
                  ? 'border-brand-orange bg-brand-light text-brand-dark'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Toggles */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
        <label className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> Doorstep Delivery
          </span>
          <input
            type="checkbox"
            checked={filters.deliveryOnly}
            onChange={(e) => updateFilter('deliveryOnly', e.target.checked)}
            className="w-4 h-4 accent-brand-orange rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Vendors Only
          </span>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
            className="w-4 h-4 accent-brand-orange rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};

export default FilterSidebar;
