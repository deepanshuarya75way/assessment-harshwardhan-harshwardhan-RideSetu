'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import DeliveryLocationSelector, { DeliveryLocationData } from '@/components/booking/DeliveryLocationSelector';
import RiderDetailsModal from '@/components/booking/RiderDetailsModal';
import AddVehicleModal from '@/components/booking/AddVehicleModal';
import AuthModal from '@/components/common/AuthModal';

const PaymentModal = dynamic(() => import('@/components/booking/PaymentModal'), { ssr: false });
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';
import { formatINR } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Lock,
  RefreshCw,
  Plus,
  Trash2,
  Car,
  ShieldCheck,
  FileText,
} from 'lucide-react';

function BookingFlowContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const currentVehicleId = params.vehicleId as string;

  const initialPickup = searchParams.get('pickup') || '';
  const initialReturn = searchParams.get('return') || '';

  const [groupBooking, setGroupBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default dates
  const defaultPickupDate = initialPickup ? initialPickup.split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const defaultPickupTime = initialPickup && initialPickup.includes('T') ? initialPickup.split('T')[1].substring(0, 5) : '09:00';
  const defaultReturnDate = initialReturn ? initialReturn.split('T')[0] : new Date(Date.now() + 172800000).toISOString().split('T')[0];
  const defaultReturnTime = initialReturn && initialReturn.includes('T') ? initialReturn.split('T')[1].substring(0, 5) : '20:00';

  const [pickupDate, setPickupDate] = useState(defaultPickupDate);
  const [pickupTime, setPickupTime] = useState(defaultPickupTime);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [returnTime, setReturnTime] = useState(defaultReturnTime);
  const [pickupType, setPickupType] = useState<string>('VENDOR_PICKUP');
  const [pickupLocation, setPickupLocation] = useState('Vendor Hub');
  const [deliveryLocationData, setDeliveryLocationData] = useState<DeliveryLocationData | null>(null);

  // Modals state
  const [selectedRiderVehicle, setSelectedRiderVehicle] = useState<any>(null);
  const [isRiderModalOpen, setRiderModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  // Payment state
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  /**
   * Idempotent Sync & Real-time Date/Price Recalculation
   */
  const syncGroupBooking = useCallback(async (
    vIdTarget?: string,
    overrideDates?: { pickupDate?: string; pickupTime?: string; returnDate?: string; returnTime?: string },
    overrideLocation?: DeliveryLocationData | null
  ) => {
    try {
      setLoading(true);
      setError(null);

      const targetVehicleId = vIdTarget || currentVehicleId;
      const pD = overrideDates?.pickupDate || pickupDate;
      const pT = overrideDates?.pickupTime || pickupTime;
      const rD = overrideDates?.returnDate || returnDate;
      const rT = overrideDates?.returnTime || returnTime;

      const pDateTime = `${pD}T${pT}:00`;
      const rDateTime = `${rD}T${rT}:00`;
      const locData = overrideLocation !== undefined ? overrideLocation : deliveryLocationData;

      const res = await fetch('/api/group-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: targetVehicleId,
          pickupDateTime: pDateTime,
          returnDateTime: rDateTime,
          pickupType: locData?.locationType || pickupType,
          pickupLocation: locData?.address || pickupLocation,
          dropoffLocation: locData?.address || pickupLocation,
          deliveryLocation: locData || undefined,
          groupId: groupBooking?.groupBookingId,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setGroupBooking(data.group);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('Failed to sync rental cart:', err);
      setError('Unable to load your rental checkout. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [currentVehicleId, pickupDate, pickupTime, returnDate, returnTime, pickupType, pickupLocation, deliveryLocationData, groupBooking?.groupBookingId]);

  useEffect(() => {
    if (currentVehicleId) {
      syncGroupBooking();
    }
  }, [currentVehicleId, syncGroupBooking]);

  const handleDateChange = (field: 'pDate' | 'pTime' | 'rDate' | 'rTime', val: string) => {
    let pD = pickupDate;
    let pT = pickupTime;
    let rD = returnDate;
    let rT = returnTime;

    if (field === 'pDate') { pD = val; setPickupDate(val); }
    if (field === 'pTime') { pT = val; setPickupTime(val); }
    if (field === 'rDate') { rD = val; setReturnDate(val); }
    if (field === 'rTime') { rT = val; setReturnTime(val); }

    syncGroupBooking(undefined, { pickupDate: pD, pickupTime: pT, returnDate: rD, returnTime: rT });
  };

  const handleAddVehicleFromModal = async (vIdToAdd: string) => {
    await syncGroupBooking(vIdToAdd);
  };

  const handleRemoveVehicle = async (vId: string) => {
    if (!groupBooking) return;
    if (groupBooking.vehicles.length === 1 && !confirm('Removing this ride will clear your cart. Continue?')) {
      return;
    }
    try {
      setUpdatingGroup(true);
      setError(null);
      const res = await fetch(`/api/group-bookings?groupId=${groupBooking.groupBookingId}&vehicleId=${vId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.group) {
        setGroupBooking(data.group);
        if (data.group.vehicles.length === 0) {
          router.push('/vehicles');
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove ride');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleLocationConfirmed = (location: DeliveryLocationData) => {
    setDeliveryLocationData(location);
    setPickupType(location.locationType);
    setPickupLocation(location.address || location.city || '');
    syncGroupBooking(undefined, undefined, location);
  };

  const handleInitiatePayment = async () => {
    if (!groupBooking) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      setInitiatingPayment(true);
      setError(null);

      const res = await fetch(`/api/group-bookings/${groupBooking.groupBookingId}/pay`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate payment.');
      }

      setOrderData(data);
      setPaymentOpen(true);
    } catch (err: any) {
      setError(err.message || 'Payment initiation error');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      setPaymentOpen(false);
      setLoading(true);

      const res = await fetch(`/api/group-bookings/${groupBooking.groupBookingId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayPaymentId: paymentResult.razorpayPaymentId,
          razorpayOrderId: paymentResult.razorpayOrderId,
          razorpaySignature: paymentResult.razorpaySignature,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment verification failed.');
      }

      setConfirmedBooking(data);
    } catch (err: any) {
      setError(err.message || 'Payment verification error');
    } finally {
      setLoading(false);
    }
  };

  const vehiclesList = groupBooking?.vehicles || [];
  const vehicleCount = vehiclesList.length;
  const pricingSummary = groupBooking?.pricingSummary || {
    totalBasePrice: 0,
    totalDeliveryCharge: 0,
    totalPlatformFee: 0,
    totalTaxes: 0,
    totalSecurityDeposit: 0,
    grandTotal: 0,
  };
  const allRidersVerified = vehicleCount > 0 && vehiclesList.every((v: any) => v.rider && v.rider.verificationStatus === 'VERIFIED');

  if (loading && !groupBooking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs font-black text-slate-700">Loading your rental checkout...</p>
        </div>
      </div>
    );
  }

  // Booking Confirmation View
  if (confirmedBooking) {
    return (
      <main className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6 animate-fade-in-up">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 font-heading">
              Rental Booking Confirmed!
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              Booking Reference: <span className="text-brand-orange font-mono">{confirmedBooking.group?.groupBookingId}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Confirmed Rides ({confirmedBooking.subBookings?.length || 0})
            </h4>
            <div className="space-y-2">
              {confirmedBooking.subBookings?.map((sb: any, i: number) => (
                <div key={sb._id || i} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-slate-900">Ride #{i + 1}: {sb.bookingNumber}</span>
                    <p className="text-[11px] text-slate-500">Rider: {sb.riderDetails?.fullName} ({sb.riderDetails?.drivingLicenseNumber})</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                    CONFIRMED
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-2xl bg-brand-orange text-white text-xs font-black shadow-md hover:bg-brand-orange/90"
            >
              View My Trips
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Vehicles
          </button>
          <h1 className="text-lg font-black text-slate-900 font-heading">
            Rental Checkout ({vehicleCount} {vehicleCount === 1 ? 'Ride' : 'Rides'})
          </h1>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => syncGroupBooking()}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-black hover:bg-rose-700 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* MAIN UNIFIED CHECKOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: SCHEDULE, RIDES CART, RIDERS, LOCATION */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. TRIP SCHEDULE */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-brand-orange" />
                <span>Trip Schedule</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Pickup Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => handleDateChange('pDate', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => handleDateChange('pTime', e.target.value)}
                      className="w-28 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Return Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => handleDateChange('rDate', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    />
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => handleDateChange('rTime', e.target.value)}
                      className="w-28 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. YOUR RIDES (RENTAL CART) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 font-heading">
                  <Car className="w-4 h-4 text-brand-orange" />
                  Your Rides ({vehicleCount})
                </h2>
                <button
                  onClick={() => setAddVehicleModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 text-xs font-black flex items-center gap-1 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Ride
                </button>
              </div>

              <div className="space-y-4">
                {vehiclesList.map((item: any, idx: number) => {
                  const vObj = typeof item.vehicleId === 'object' ? item.vehicleId : null;
                  const rider = item.rider || {};
                  const isVerified = rider.verificationStatus === 'VERIFIED';
                  const hasDocument = !!rider.drivingLicenseDocumentUrl;

                  const vBrand = vObj?.brand || 'Rental';
                  const vModel = vObj?.model || 'Vehicle';
                  const vVariant = vObj?.variant || '';
                  const vCategory = vObj?.category || 'SCOOTER';
                  const dailyRate = vObj?.dailyRate || vObj?.pricePerDay || 480;
                  const vehicleTotalPayable = item.pricing?.totalPayable || 0;

                  return (
                    <div
                      key={vObj?._id || item.vehicleId || idx}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-200">
                            <Image
                              src={getVehicleImage(vObj || { category: vCategory })}
                              alt={getVehicleAltText(vObj || { category: vCategory })}
                              fill
                              priority
                              fetchPriority="high"
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Ride #{idx + 1}
                              </span>
                              <span className="text-[9px] font-black uppercase text-brand-orange px-1.5 py-0.5 rounded bg-brand-orange/10">
                                {vCategory}
                              </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 mt-0.5">
                              {vBrand} {vModel} {vVariant && <span className="font-normal text-slate-500 text-xs">({vVariant})</span>}
                            </h3>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">
                              {formatINR(dailyRate)} <span className="text-[10px] text-slate-400 font-normal">/ day</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 font-bold block">Subtotal</span>
                            <span className="text-sm font-black text-slate-900">{formatINR(vehicleTotalPayable)}</span>
                          </div>
                          <button
                            disabled={updatingGroup}
                            onClick={() => handleRemoveVehicle(vObj?._id || item.vehicleId)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Rider Box */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-brand-orange" />
                          <span className="font-bold text-slate-700">
                            Assigned Rider: <span className="font-black text-slate-900">{rider.fullName || 'Not Assigned'}</span>
                            {rider.drivingLicenseNumber && <span className="font-mono text-slate-500 ml-2">({rider.drivingLicenseNumber})</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          ) : hasDocument ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1">
                              <FileText className="w-3 h-3 text-amber-600" /> Uploaded
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600" /> Verification Needed
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedRiderVehicle(vObj || { _id: item.vehicleId });
                              setRiderModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-orange text-slate-800 text-[11px] font-black transition-colors"
                          >
                            {rider.fullName ? 'Edit Rider' : 'Add Rider'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => setAddVehicleModalOpen(true)}
                  className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4 text-brand-orange" />
                  Add Another Ride to Cart
                </button>
              </div>
            </div>

            {/* 3. PICKUP / DELIVERY LOCATION & MAPS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-brand-orange" />
                <span>Pickup / Delivery Location</span>
              </div>

              <DeliveryLocationSelector
                destinationCity="Dehradun"
                initialType={pickupType}
                onLocationConfirmed={handleLocationConfirmed}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: PRICE SUMMARY CARD & PAYMENT */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 sticky top-24">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 font-heading">
                Price Summary ({vehicleCount} {vehicleCount === 1 ? 'Ride' : 'Rides'})
              </h3>

              <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Base Rental</span>
                  <span className="font-bold text-slate-800">{formatINR(pricingSummary.totalBasePrice || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-800">{formatINR(pricingSummary.totalDeliveryCharge || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-slate-800">{formatINR(pricingSummary.totalPlatformFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST & Taxes (18%)</span>
                  <span className="font-bold text-slate-800">{formatINR(pricingSummary.totalTaxes || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-700">
                  <span>Refundable Deposit</span>
                  <span className="font-extrabold text-emerald-700">{formatINR(pricingSummary.totalSecurityDeposit || 0)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-lg text-brand-orange">{formatINR(pricingSummary.grandTotal || 0)}</span>
              </div>

              {!allRidersVerified ? (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Please complete rider + driving license verification for all rides before payment.</span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>All riders verified! Ready to pay.</span>
                </div>
              )}

              <button
                disabled={!allRidersVerified || initiatingPayment}
                onClick={handleInitiatePayment}
                className="w-full py-3.5 rounded-2xl bg-brand-orange text-white text-xs font-black uppercase tracking-wider hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {initiatingPayment ? (
                  'Processing Payment...'
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> PAY NOW ({formatINR(pricingSummary.grandTotal || 0)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Rider Details Modal */}
        {selectedRiderVehicle && groupBooking && (
          <RiderDetailsModal
            isOpen={isRiderModalOpen}
            onClose={() => {
              setRiderModalOpen(false);
              setSelectedRiderVehicle(null);
            }}
            groupId={groupBooking.groupBookingId}
            vehicle={selectedRiderVehicle}
            currentRider={
              groupBooking.vehicles.find(
                (v: any) =>
                  (v.vehicleId?._id || v.vehicleId).toString() ===
                  (selectedRiderVehicle._id || selectedRiderVehicle).toString()
              )?.rider
            }
            onSaveSuccess={(updatedGroup) => {
              setGroupBooking(updatedGroup);
            }}
          />
        )}

        {/* Add Another Vehicle Modal */}
        {groupBooking && (
          <AddVehicleModal
            isOpen={isAddVehicleModalOpen}
            onClose={() => setAddVehicleModalOpen(false)}
            existingVehicleIds={groupBooking.vehicles.map((v: any) => v.vehicleId?._id || v.vehicleId)}
            onAddVehicle={handleAddVehicleFromModal}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            returnDate={returnDate}
            returnTime={returnTime}
          />
        )}

        {/* Auth Modal for Unauthenticated Booking Guard */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setAuthModalOpen(false)}
          redirectUrl={`/book/${currentVehicleId}`}
        />

        {/* Razorpay Payment Modal */}
        {isPaymentOpen && orderData && (
          <PaymentModal
            isOpen={isPaymentOpen}
            onClose={() => setPaymentOpen(false)}
            amount={orderData.amount || pricingSummary?.grandTotal || 0}
            orderId={orderData.razorpayOrderId}
            bookingNumber={groupBooking?.groupBookingId}
            onPaymentComplete={(details) => {
              if (details.status === 'SUCCESS') {
                handlePaymentSuccess({
                  razorpayPaymentId: details.razorpayPaymentId || `pay_cart_${Date.now()}`,
                  razorpayOrderId: details.razorpayOrderId || orderData.razorpayOrderId,
                  razorpaySignature: details.razorpaySignature || 'sig_mock_cart',
                });
              } else {
                setError('Payment was cancelled or failed.');
              }
            }}
          />
        )}
      </div>
    </main>
  );
}

export default function BookingFlowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-center text-xs font-black">Loading your rental checkout...</div>}>
      <BookingFlowContent />
    </Suspense>
  );
}
