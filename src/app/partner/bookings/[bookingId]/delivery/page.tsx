'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import GoogleTripMap from '@/components/maps/GoogleTripMap';
import {
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Phone,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Radio,
  Lock,
} from 'lucide-react';
import { formatINR, formatDateTime } from '@/lib/utils';

export default function VendorDeliveryTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consent & Tracking State
  const [consentGranted, setConsentGranted] = useState(true);
  const [watchActive, setWatchActive] = useState(false);
  const [deliveryState, setDeliveryState] = useState<string>('EN_ROUTE');
  const [nearDestination, setNearDestination] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState<number>(1500);

  const watchIdRef = useRef<number | null>(null);

  const fetchTripTelemetry = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${bookingId}/location`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        if (data.latestLocation?.deliveryState) {
          setDeliveryState(data.latestLocation.deliveryState);
        }
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    }
  }, [bookingId]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch (err) {
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
      fetchTripTelemetry();
    }
  }, [bookingId, fetchTripTelemetry]);

  // Handle GPS location posting with server-side validation & throttling
  const sendGpsUpdate = async (lat: number, lng: number, acc = 10, head = 0, spd = 0, state?: string) => {
    if (!consentGranted) return;
    try {
      const res = await fetch(`/api/trips/${bookingId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          heading: head,
          speed: spd,
          deliveryState: state || deliveryState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes('Arrival validation failed')) {
          setError(data.error);
        }
      } else {
        if (data.nearDestination) setNearDestination(true);
        if (typeof data.distanceToDestinationMeters === 'number') {
          setDistanceMeters(data.distanceToDestinationMeters);
        }
        fetchTripTelemetry();
      }
    } catch (err) {
      console.error('GPS update post error:', err);
    }
  };

  // Start watchPosition GPS Tracking
  const handleStartDelivery = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your device browser.');
      return;
    }

    setUpdating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        setDeliveryState('EN_ROUTE');
        sendGpsUpdate(latitude, longitude, accuracy || 10, heading || 0, speed || 0, 'EN_ROUTE');

        // Watch position for continuous telemetry
        const id = navigator.geolocation.watchPosition(
          (watchPos) => {
            const { latitude: wLat, longitude: wLng, accuracy: wAcc, heading: wHead, speed: wSpd } = watchPos.coords;
            sendGpsUpdate(wLat, wLng, wAcc || 10, wHead || 0, wSpd || 0);
          },
          (err) => {
            console.warn('watchPosition warning:', err.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );

        watchIdRef.current = id;
        setWatchActive(true);
        setUpdating(false);
      },
      (err) => {
        setUpdating(false);
        setError('Location permission is required to provide live delivery tracking.');
      }
    );
  };

  const handleUpdateDeliveryState = async (newState: string) => {
    try {
      setUpdating(true);
      setError(null);

      // Current fallback coordinates
      const currentLat = telemetry?.latestLocation?.latitude || 30.1317;
      const currentLng = telemetry?.latestLocation?.longitude || 78.3242;

      await sendGpsUpdate(currentLat, currentLng, 10, 0, 0, newState);
      setDeliveryState(newState);
    } catch (err: any) {
      setError(err.message || 'Failed to update delivery state.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-bold text-lg animate-pulse mx-auto">
            RS
          </div>
          <p className="text-xs text-slate-500 font-bold animate-pulse">Loading Vendor Delivery Tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Bookings
          </button>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-900">Live Delivery Dispatch Portal</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Telemetry Header Banner */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Delivery Mode Active • {deliveryState}
              </span>
              <h1 className="text-xl font-black font-heading text-white mt-1">
                Booking #{booking?.bookingNumber} — {booking?.vehicleId?.brand} {booking?.vehicleId?.model}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Destination: {booking?.deliveryLocation?.formattedAddress || booking?.pickupLocation || 'Customer Handover Point'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400">
                {distanceMeters <= 100 ? 'Near Destination (≤100m)' : `${(distanceMeters / 1000).toFixed(1)} km away`}
              </span>
            </div>
          </div>
        </div>

        {/* Embedded Google Maps Telemetry */}
        <GoogleTripMap
          pickup={{ lat: 30.1317, lng: 78.3242, address: 'Vendor Hub' }}
          destination={{
            lat: booking?.deliveryLocation?.latitude || 30.1257,
            lng: booking?.deliveryLocation?.longitude || 78.3276,
            address: booking?.deliveryLocation?.formattedAddress || booking?.pickupLocation,
          }}
          vendorLocation={{
            lat: telemetry?.latestLocation?.latitude || 30.1317,
            lng: telemetry?.latestLocation?.longitude || 78.3242,
            speed: telemetry?.latestLocation?.speed || 28,
            heading: telemetry?.latestLocation?.heading || 45,
            telemetryStatus: telemetry?.telemetryStatus || 'LIVE',
            secondsAgo: telemetry?.secondsAgo || 4,
          }}
          trackingMode="VENDOR"
          height="420px"
        />

        {/* Vendor Operational Controls & State Transitions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 font-heading">Vendor Delivery Workflow Action</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              onClick={handleStartDelivery}
              disabled={updating || watchActive}
              className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 min-h-[44px]"
            >
              {watchActive ? 'GPS Watch Active ✓' : '1. Start Delivery (GPS)'}
            </button>

            <button
              onClick={() => handleUpdateDeliveryState('NEAR_DESTINATION')}
              disabled={updating}
              className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 min-h-[44px]"
            >
              2. Near Destination
            </button>

            <button
              onClick={() => handleUpdateDeliveryState('ARRIVED')}
              disabled={updating}
              className="py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 min-h-[44px]"
            >
              3. I&apos;ve Arrived
            </button>

            <Link
              href={`/partner/bookings/${bookingId}/handover`}
              className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>4. Start Handover Inspection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Location Opt-In Consent Status:</span>
            <button
              onClick={() => setConsentGranted(!consentGranted)}
              className={`px-3 py-1 rounded-full text-[11px] font-black ${
                consentGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {consentGranted ? 'Opted-In (Sharing Active)' : 'Opted-Out (Paused)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
