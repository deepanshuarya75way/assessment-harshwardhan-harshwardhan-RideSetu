'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loadGoogleMapsScript } from '@/lib/google-maps-loader';

export interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

export interface VendorLocationPoint extends LocationPoint {
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: Date | string;
  deliveryState?: string;
  secondsAgo?: number;
  telemetryStatus?: 'LIVE' | 'STALE' | 'OFFLINE';
}

export interface HubPoint {
  name: string;
  lat: number;
  lng: number;
  category?: string;
}

interface GoogleTripMapProps {
  pickup?: LocationPoint;
  destination?: LocationPoint;
  currentLocation?: LocationPoint;
  vendorLocation?: VendorLocationPoint;
  hubs?: HubPoint[];
  showRoute?: boolean;
  trackingMode?: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'OFF';
  selectable?: boolean;
  onLocationSelect?: (location: LocationPoint) => void;
  height?: string;
  zoom?: number;
  center?: LocationPoint;
}

export default function GoogleTripMap({
  pickup,
  destination,
  currentLocation,
  vendorLocation,
  hubs = [],
  showRoute = true,
  trackingMode = 'OFF',
  selectable = false,
  onLocationSelect,
  height = '400px',
  zoom = 13,
  center,
}: GoogleTripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const defaultCenter = center || pickup || destination || currentLocation || { lat: 30.0869, lng: 78.2676 };

  // Telemetry Status
  const telemetryStatus = vendorLocation?.telemetryStatus || 'LIVE';
  const isGpsLowAccuracy = (vendorLocation?.accuracy || 0) > 100;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => setMapLoaded(true))
      .catch((err) => setMapError(err.message || 'Google Maps API failed to load.'));
  }, []);

  // Initialize Real Google Map instance on DOM element
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || typeof window === 'undefined' || !(window as any).google?.maps?.Map) {
      return;
    }

    if (!googleMapInstanceRef.current) {
      const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        zoomControl: true,
        fullscreenControl: true,
      });

      googleMapInstanceRef.current = mapInstance;

      // Handle map click if selectable mode is enabled
      if (selectable && onLocationSelect) {
        mapInstance.addListener('click', (e: any) => {
          if (!e.latLng) return;
          onLocationSelect({
            lat: Number(e.latLng.lat().toFixed(6)),
            lng: Number(e.latLng.lng().toFixed(6)),
          });
        });
      }

      // Trigger map resize after mount to ensure full layout rendering
      setTimeout(() => {
        if ((window as any).google?.maps?.event && googleMapInstanceRef.current) {
          (window as any).google.maps.event.trigger(googleMapInstanceRef.current, 'resize');
          googleMapInstanceRef.current.setCenter({ lat: defaultCenter.lat, lng: defaultCenter.lng });
        }
      }, 150);
    }
  }, [mapLoaded]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm" style={{ height }}>
      {/* Telemetry Status HUD Badge */}
      {trackingMode !== 'OFF' && (
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-sm border backdrop-blur-md ${
            telemetryStatus === 'LIVE'
              ? 'bg-emerald-500/90 text-white border-emerald-400'
              : telemetryStatus === 'STALE'
              ? 'bg-amber-500/90 text-white border-amber-400'
              : 'bg-rose-500/90 text-white border-rose-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            {telemetryStatus === 'LIVE' ? 'LIVE TELEMETRY' : telemetryStatus === 'STALE' ? 'STALE GPS' : 'OFFLINE'}
          </span>

          {isGpsLowAccuracy && (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100/90 text-amber-900 border border-amber-300 backdrop-blur-md flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              Low Accuracy ({Math.round(vendorLocation?.accuracy || 0)}m)
            </span>
          )}
        </div>
      )}

      {mapError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-700 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <div className="font-bold text-slate-900 text-sm">Google Maps Unavailable</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm">{mapError}</div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full min-h-[300px]" style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
}
