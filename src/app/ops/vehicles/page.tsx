'use client';

import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { getVehicleImageStatus } from '@/config/vehicle-images';

export default function OpsVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/vehicles');
      const data = await res.json();
      if (data.vehicles) setVehicles(data.vehicles);
    } catch (err) {
      console.error('Ops vehicles error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <Car className="w-6 h-6 text-emerald-600" /> Marketplace Fleet Verification & Control
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Master registry of all listed two-wheelers and cars across Uttarakhand destinations.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Vehicle</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Reg. Number</th>
                <th className="py-3 px-4">Daily Price</th>
                <th className="py-3 px-4">Image Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vehicles.map((v) => {
                const imgStatus = getVehicleImageStatus(v);
                return (
                  <tr key={v._id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-heading">{v.brand} {v.model}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{v.category}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-700 font-bold">{v.registrationNumber || 'UK07-XX-0000'}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{formatINR(v.pricePerDay)}/day</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        imgStatus === 'IMAGE_VERIFIED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {imgStatus === 'IMAGE_VERIFIED' ? '✓ Image Verified' : '⚠ Review Required'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right"><StatusBadge status={v.status || 'APPROVED'} size="sm" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
