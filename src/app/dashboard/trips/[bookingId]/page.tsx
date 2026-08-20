'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import LiveTrackingMap from '@/components/trips/LiveTrackingMap';
import RentalExtensionModal from '@/components/trips/RentalExtensionModal';
import GoogleTripMap from '@/components/maps/GoogleTripMap';
import { Calendar, MapPin, ShieldCheck, ArrowRight, UserCheck, AlertCircle, RefreshCw, FileText, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';

export default function CustomerTripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [handoverAccepting, setHandoverAccepting] = useState(false);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/customer/trips/${bookingId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load trip details');
      }

      setTrip(data.trip);
    } catch (err: any) {
      setError(err.message || 'Error fetching trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchTripDetails();
    }
  }, [bookingId]);

  const handleCustomerAcceptHandover = async () => {
    setHandoverAccepting(true);
    try {
      const res = await fetch(`/api/vendor/bookings/${trip.id || trip._id}/handover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept vehicle handover');
      }

      fetchTripDetails();
    } catch (err: any) {
      alert(err.message || 'Handover acceptance failed');
    } finally {
      setHandoverAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading trip details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900">Trip Not Found</h3>
            <p className="text-xs text-slate-500 font-semibold">{error}</p>
            <Link href="/dashboard/trips" className="inline-block px-5 py-2.5 bg-navy-900 text-white font-bold text-xs rounded-xl">
              Back to My Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vehicle = trip.vehicle || {};
  const vendor = trip.vendor || {};
  const isDelivery = trip.pickupType === 'DOORSTEP_DELIVERY' || trip.pickupType === 'HOSTEL_DELIVERY' || trip.deliveryLocation?.locationType === 'DOORSTEP';
  const showLiveTracking = isDelivery && (trip.bookingStatus === 'OUT_FOR_DELIVERY' || trip.bookingStatus === 'READY_FOR_HANDOVER');
  const isHandoverReady = trip.bookingStatus === 'READY_FOR_HANDOVER' || trip.bookingStatus === 'DELIVERED';
  const isActive = trip.bookingStatus === 'ACTIVE' || trip.bookingStatus === 'HANDED_OVER' || trip.bookingStatus === 'EXTENDED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/trips"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-navy-950 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to My Trips</span>
          </Link>

          <div className="text-xs font-extrabold text-slate-400">
            Booking #{trip.bookingNumber}
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className="bg-navy-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                {trip.bookingStatus}
              </span>
              <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
                {isActive
                  ? 'Rental Active'
                  : trip.bookingStatus === 'OUT_FOR_DELIVERY'
                  ? 'Your Vehicle is Out for Delivery'
                  : trip.bookingStatus === 'READY_FOR_HANDOVER'
                  ? 'Vehicle Ready for Handover'
                  : 'Trip Booking Overview'}
              </h1>
            </div>

            {/* Extension CTA if eligible */}
            {(isActive || trip.bookingStatus === 'CONFIRMED') && (
              <button
                type="button"
                onClick={() => setShowExtensionModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-xs shadow-lg shadow-brand-orange/25 transition-all"
              >
                Extend Rental
              </button>
            )}
          </div>
        </div>

        {/* Live Delivery Tracking Map */}
        {showLiveTracking && (
          <LiveTrackingMap bookingId={trip.id || trip._id} />
        )}

        {/* Customer Handover Acceptance Card */}
        {isHandoverReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-amber-950">Vehicle Delivered / Ready at Location</h3>
                <p className="text-xs font-semibold text-amber-800">
                  Please inspect the vehicle condition and odometer reading before accepting handover.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCustomerAcceptHandover}
              disabled={handoverAccepting}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Accept Vehicle & Start Rental</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Vehicle & Vendor Info */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-20 bg-slate-50 rounded-2xl p-2 flex items-center justify-center shrink-0 border border-slate-100">
                <img
                  src={getVehicleImage(vehicle)}
                  alt={getVehicleAltText(vehicle)}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {vehicle.category || 'SCOOTER'}
                </span>
                <h2 className="text-lg font-black text-navy-950">
                  {vehicle.brand} {vehicle.model} {vehicle.variant}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Registration: <span className="text-slate-800 font-bold">{vehicle.registrationNumber || 'UT-07-REG'}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-right space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Vendor Partner</div>
              <div className="text-xs font-black text-slate-900">{vendor.businessName}</div>
              <div className="text-[10px] text-slate-500 font-semibold">{vendor.phone}</div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
              <div className="text-[10px] font-bold uppercase text-slate-400">Pickup Date & Time</div>
              <div className="text-sm font-black text-slate-900">
                {new Date(trip.pickupDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-slate-500 font-bold">
                {new Date(trip.pickupDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
              <div className="text-[10px] font-bold uppercase text-slate-400">Return Date & Time</div>
              <div className="text-sm font-black text-slate-900">
                {new Date(trip.returnDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-slate-500 font-bold">
                {new Date(trip.returnDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Rider Details */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Assigned Rider Details</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
              <div>
                <div className="font-black text-slate-900">{trip.riderDetails?.fullName || trip.customerDetails?.fullName}</div>
                <div className="text-slate-500 font-mono">
                  DL: {trip.riderDetails?.drivingLicenseNumber || trip.customerDetails?.drivingLicenseNumber}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                ✓ DL Verified
              </span>
            </div>
          </div>

          {/* Delivery Location Map */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-brand-orange" />
              <span>Delivery / Pickup Location</span>
            </div>

            <p className="text-xs text-slate-600 font-semibold">{trip.pickupLocation || trip.deliveryLocation?.address}</p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 h-52">
              <GoogleTripMap
                pickup={{ lat: trip.deliveryLocation?.latitude || 30.1315, lng: trip.deliveryLocation?.longitude || 78.3242, address: 'Delivery Location' }}
                height="100%"
              />
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Payment & Charges Breakdown</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Base Rental Charges</span>
                <span>₹{trip.pricing?.basePrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>₹{trip.pricing?.deliveryCharge}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>₹{trip.pricing?.platformFee}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{trip.pricing?.taxes}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold">
                <span>Refundable Security Deposit</span>
                <span>₹{trip.pricing?.securityDeposit} ({trip.depositStatus})</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-navy-950">
                <span>Total Paid</span>
                <span>₹{trip.pricing?.totalPayable?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Extension Modal */}
      {showExtensionModal && (
        <RentalExtensionModal
          booking={trip}
          isOpen={showExtensionModal}
          onClose={() => setShowExtensionModal(false)}
          onSuccess={() => fetchTripDetails()}
        />
      )}
    </div>
  );
}
