'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';
import { formatINR } from '@/lib/utils';
import { Plus, Check, Search, X, Loader2, AlertCircle } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingVehicleIds: string[];
  onAddVehicle: (vehicleId: string) => Promise<void>;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  existingVehicleIds,
  onAddVehicle,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const pStr = `${pickupDate}T${pickupTime}:00`;
        const rStr = `${returnDate}T${returnTime}:00`;
        const res = await fetch(`/api/vehicles?pickupDateTime=${encodeURIComponent(pStr)}&returnDateTime=${encodeURIComponent(rStr)}`);
        const data = await res.json();
        if (data.vehicles) {
          setVehicles(data.vehicles);
        } else {
          setVehicles([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load available vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isOpen, pickupDate, pickupTime, returnDate, returnTime]);

  if (!isOpen) return null;

  const filteredVehicles = vehicles.filter((v) => {
    const nameMatch = `${v.brand} ${v.model} ${v.variant || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const catMatch = categoryFilter === 'ALL' || v.category === categoryFilter;
    return nameMatch && catMatch;
  });

  const handleSelect = async (vId: string) => {
    try {
      setAddingId(vId);
      setError(null);
      await onAddVehicle(vId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle to group');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 relative animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 font-heading">
              Select Another Vehicle to Add
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Trip dates: {new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bike, scooter, car..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto text-xs font-bold">
            {['ALL', 'SCOOTER', 'MOTORCYCLE', 'CAR'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl transition-colors ${
                  categoryFilter === cat
                    ? 'bg-brand-orange text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Global Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />
              <p className="text-xs font-black text-slate-600">Loading available rides...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">No matching vehicles available.</p>
              <p className="text-xs text-slate-400">Try adjusting your search filter or trip dates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredVehicles.map((vehicle) => {
                const isAdded = existingVehicleIds.some((id) => id.toString() === (vehicle._id || vehicle.id).toString());
                const isAddingThis = addingId === (vehicle._id || vehicle.id).toString();

                return (
                  <div
                    key={vehicle._id || vehicle.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isAdded
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-brand-orange/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex gap-3 mb-3">
                      <div className="relative w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={getVehicleImage(vehicle)}
                          alt={getVehicleAltText(vehicle)}
                          fill
                          sizes="80px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange px-2 py-0.5 rounded-md bg-brand-orange/10">
                          {vehicle.category || 'Rental'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {vehicle.brand} {vehicle.model}
                        </h4>
                        {vehicle.variant && (
                          <p className="text-[11px] text-slate-500 font-medium">{vehicle.variant}</p>
                        )}
                        <p className="text-xs font-extrabold text-slate-800 mt-1">
                          {formatINR(vehicle.dailyRate || vehicle.pricePerDay || 0)} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={isAdded || isAddingThis}
                      onClick={() => handleSelect(vehicle._id || vehicle.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                        isAdded
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-brand-orange text-white hover:bg-brand-orange/90 shadow-md shadow-brand-orange/20'
                      }`}
                    >
                      {isAddingThis ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                        </>
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" /> Already Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Add to Group
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
