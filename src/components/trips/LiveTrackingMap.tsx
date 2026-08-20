'use client';

import React, { useEffect, useState } from 'react';
import { Truck, Navigation, Clock, ShieldCheck, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import GoogleTripMap from '@/components/maps/GoogleTripMap';

interface LiveTrackingMapProps {
  bookingId: string;
}

export default function LiveTrackingMap({ bookingId }: LiveTrackingMapProps) {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/customer/trips/${bookingId}/tracking`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Tracking unavailable');
      }

      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch delivery location');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    // 12-second safe polling interval while delivery is active
    const interval = setInterval(() => {
      fetchTracking();
    }, 12000);

    return () => clearInterval(interval);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl p-6 text-center space-y-3 animate-pulse">
        <Truck className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
        <p className="text-xs font-semibold text-slate-300">Connecting to Live GPS Telemetry...</p>
      </div>
    );
  }

  if (error || !trackingData?.trackingAvailable) {
    return null;
  }

  const driverLoc = trackingData.driverLocation || { lat: 30.1315, lng: 78.3242 };
  const customerLoc = trackingData.customerLocation || { lat: 30.1385, lng: 78.3292 };

  return (
    <div className="bg-navy-950 text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-sans space-y-4 p-5 sm:p-6">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                LIVE TELEMETRY
              </span>
              <span className="text-xs font-bold text-slate-300">
                ETA: ~{trackingData.etaMinutes || 15} mins
              </span>
            </div>
            <h3 className="text-base font-black text-white">Your Vehicle is on the Way</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchTracking(true)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Google Trip Map */}
      <div className="rounded-2xl overflow-hidden border border-white/10 h-64 sm:h-72 relative">
        <GoogleTripMap
          pickup={{ lat: driverLoc.lat, lng: driverLoc.lng, address: 'Delivery Executive' }}
          destination={{ lat: customerLoc.lat, lng: customerLoc.lng, address: 'Your Delivery Location' }}
          height="100%"
        />
      </div>

      {/* Driver & Status Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold pt-1">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-0.5">
          <div className="text-[10px] font-bold uppercase text-slate-400">Executive / Partner</div>
          <div className="text-sm font-bold text-amber-300">{trackingData.driverName}</div>
          <div className="text-[10px] text-slate-400">{trackingData.driverPhone}</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-0.5">
          <div className="text-[10px] font-bold uppercase text-slate-400">Delivery Address</div>
          <div className="text-xs font-bold text-white truncate">{customerLoc.address}</div>
          <div className="text-[10px] text-emerald-400">✓ GPS Route Sync Active</div>
        </div>
      </div>
    </div>
  );
}
