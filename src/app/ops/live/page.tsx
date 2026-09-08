'use client';

import React, { useState, useEffect } from 'react';
import GoogleTripMap from '@/components/maps/GoogleTripMap';
import { Radio, Search, Filter, RefreshCw, ShieldCheck, MapPin, AlertCircle, Compass } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function AdminLiveOpsPage() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTelemetry = React.useCallback(async (filter = activeFilter, query = searchQuery) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ops/telemetry?filter=${filter}&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.hubs) setHubs(data.hubs);
      }
    } catch (err) {
      console.error('Failed to fetch ops telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    fetchTelemetry(activeFilter, searchQuery);
    const interval = setInterval(() => fetchTelemetry(activeFilter, searchQuery), 15000);
    return () => clearInterval(interval);
  }, [activeFilter, searchQuery, fetchTelemetry]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <Radio className="w-6 h-6 text-emerald-600 animate-pulse" />
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900">Live Operations Telemetry Map</h1>
            <p className="text-xs text-slate-600 font-medium">Real-time Uttarakhand trip tracking, active deliveries, and hub readiness.</p>
          </div>
        </div>

        <button
          onClick={() => fetchTelemetry(activeFilter, searchQuery)}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {['ALL', 'ACTIVE', 'EN_ROUTE', 'NEAR_DESTINATION', 'ARRIVED'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-2 rounded-xl border transition-all shrink-0 ${
                activeFilter === f
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTelemetry(activeFilter, searchQuery)}
            placeholder="Search booking #, reg, vendor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium focus:border-[#FF6B00] outline-none"
          />
        </div>
      </div>

      {/* Interactive Google Telemetry Map */}
      <GoogleTripMap
        pickup={{ lat: 30.1317, lng: 78.3242, address: 'Rishikesh Central Hub' }}
        destination={{ lat: 30.4598, lng: 78.0645, address: 'Mussoorie Mall Road' }}
        hubs={hubs.map((h) => ({ name: h.name, lat: h.latitude || 30.1317, lng: h.longitude || 78.3242, category: h.category }))}
        trackingMode="ADMIN"
        height="480px"
      />

      {/* Active Telemetry List Cards */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {telemetry.map((t) => (
            <div key={t.bookingId} className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm">#{t.bookingNumber}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  t.telemetryStatus === 'LIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {t.telemetryStatus}
                </span>
              </div>

              <div className="space-y-1 text-xs font-medium text-slate-600">
                <p><strong className="text-slate-900">Vehicle:</strong> {t.vehicleName} ({t.registrationNumber})</p>
                <p><strong className="text-slate-900">Vendor:</strong> {t.vendorName}</p>
                <p><strong className="text-slate-900">Customer:</strong> {t.customerName}</p>
                <p><strong className="text-slate-900">State:</strong> {t.deliveryState}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
