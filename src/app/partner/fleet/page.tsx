'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Car,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Wrench,
  Power,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Layers,
  Sparkles,
  DollarSign,
  Clock,
} from 'lucide-react';

export default function PartnerFleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadFleet = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/vendor/fleet');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load fleet');
      }
      if (data.vehicles) setVehicles(data.vehicles);
    } catch (err: any) {
      console.error('Fleet loading error:', err);
      setErrorMsg(err.message || 'Failed to fetch partner fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleet();
  }, []);

  // Action 1: Toggle Availability
  const handleToggleAvailability = async (v: any) => {
    try {
      setProcessingId(v._id);
      setErrorMsg('');
      const targetState = !v.isAvailable;

      const res = await fetch(`/api/vendor/fleet/${v._id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: targetState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update availability');

      setActionSuccessMsg(`Vehicle ${v.brand} ${v.model} availability set to ${targetState ? 'AVAILABLE' : 'UNAVAILABLE'}.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadFleet();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change availability.');
    } finally {
      setProcessingId(null);
    }
  };

  // Action 2: Toggle Maintenance Mode
  const handleToggleMaintenance = async (v: any) => {
    try {
      setProcessingId(v._id);
      setErrorMsg('');
      const isMaintenance = v.status === 'MAINTENANCE';

      const res = await fetch(`/api/vendor/fleet/${v._id}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ underMaintenance: !isMaintenance }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update maintenance mode');

      setActionSuccessMsg(`Vehicle ${v.brand} ${v.model} ${!isMaintenance ? 'placed under MAINTENANCE' : 'released from maintenance'}.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadFleet();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update maintenance state.');
    } finally {
      setProcessingId(null);
    }
  };

  // Action 3: Deactivate Vehicle (or Delete if 0 historical bookings)
  const handleDeactivateOrDelete = async (v: any) => {
    if (!confirm(`Are you sure you want to deactivate ${v.brand} ${v.model} (${v.registrationNumber}) from your fleet?`)) {
      return;
    }

    try {
      setProcessingId(v._id);
      setErrorMsg('');

      const res = await fetch(`/api/vendor/fleet/${v._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate vehicle');

      setActionSuccessMsg(data.message || `Vehicle ${v.brand} ${v.model} deactivated.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadFleet();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deactivate vehicle.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'AVAILABLE') return v.isAvailable && v.status === 'APPROVED';
    if (statusFilter === 'MAINTENANCE') return v.status === 'MAINTENANCE';
    if (statusFilter === 'INACTIVE') return v.status === 'INACTIVE' || !v.isAvailable;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900">Fleet Inventory Management</h1>
            <p className="text-xs text-slate-600 font-medium">Control daily/hourly pricing, security deposit, availability, and vehicle maintenance status.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/partner/fleet/new"
            className="px-4 py-2.5 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-black text-xs shadow-md flex items-center gap-2 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Vehicle</span>
          </Link>
          <button
            onClick={loadFleet}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Fleet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'ALL', label: `All Vehicles (${vehicles.length})` },
          { id: 'AVAILABLE', label: `Available (${vehicles.filter((v) => v.isAvailable && v.status === 'APPROVED').length})` },
          { id: 'MAINTENANCE', label: `Maintenance (${vehicles.filter((v) => v.status === 'MAINTENANCE').length})` },
          { id: 'INACTIVE', label: `Inactive (${vehicles.filter((v) => v.status === 'INACTIVE' || !v.isAvailable).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl border transition-all shrink-0 ${
              statusFilter === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vehicle Cards Grid */}
      {loading ? (
        <DashboardSkeleton />
      ) : filteredVehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found in fleet"
          description="Click [Add New Vehicle] to register scooters, motorcycles, or cars to your rental fleet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const primaryImg = vehicle.images?.[0] || vehicle.photos?.front || '/images/vehicles/activa.jpg';
            const maskedReg = vehicle.registrationNumber ? `${vehicle.registrationNumber.slice(0, 4)}••••${vehicle.registrationNumber.slice(-2)}` : 'REG-••••';

            return (
              <div
                key={vehicle._id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-400 transition-all"
              >
                <div className="space-y-3">
                  {/* Image & Status Badge */}
                  <div className="relative h-44 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                    <img
                      src={primaryImg}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {vehicle.status === 'MAINTENANCE' ? (
                        <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase shadow-sm">
                          UNDER MAINTENANCE
                        </span>
                      ) : vehicle.isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase shadow-sm">
                          AVAILABLE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-700 text-white text-[10px] font-black uppercase shadow-sm">
                          INACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Specs */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">{vehicle.category} • {vehicle.fuelType}</span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">{maskedReg}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 font-heading">
                      {vehicle.brand} {vehicle.model} {vehicle.variant}
                    </h3>
                  </div>

                  {/* Pricing Overview */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Daily Rate</span>
                      <span className="font-black text-slate-900">{formatINR(vehicle.pricePerDay)}/day</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Hourly Rate</span>
                      <span className="font-black text-amber-700">{formatINR(vehicle.pricePerHour)}/hr</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Deposit</span>
                      <span className="font-black text-slate-900">{formatINR(vehicle.securityDeposit || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: EDIT, AVAILABILITY, MAINTENANCE, VIEW, DEACTIVATE */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      href={`/partner/fleet/${vehicle._id}/edit`}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-center flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </Link>

                    <button
                      onClick={() => handleToggleAvailability(vehicle)}
                      disabled={processingId === vehicle._id}
                      className={`px-3 py-2 rounded-xl font-bold border text-center flex items-center justify-center gap-1.5 transition-colors min-h-[40px] ${
                        vehicle.isAvailable
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{vehicle.isAvailable ? 'DISABLE' : 'ENABLE'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleToggleMaintenance(vehicle)}
                      disabled={processingId === vehicle._id}
                      className={`px-3 py-2 rounded-xl font-bold border text-center flex items-center justify-center gap-1.5 transition-colors min-h-[40px] ${
                        vehicle.status === 'MAINTENANCE'
                          ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{vehicle.status === 'MAINTENANCE' ? 'END SERVICE' : 'SERVICE'}</span>
                    </button>

                    <button
                      onClick={() => handleDeactivateOrDelete(vehicle)}
                      disabled={processingId === vehicle._id}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-center flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>DEACTIVATE</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
