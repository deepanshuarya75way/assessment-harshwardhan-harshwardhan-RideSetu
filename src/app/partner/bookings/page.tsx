'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import HandoverInspectionModal from '@/components/vendor/HandoverInspectionModal';
import ReturnInspectionModal from '@/components/vendor/ReturnInspectionModal';
import { Store, Calendar, CheckCircle2, XCircle, Truck, Clock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { getVehicleImage, getVehicleAltText } from '@/config/vehicle-images';

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'ACTIVE' | 'RETURN_PENDING' | 'COMPLETED' | 'DISPUTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [handoverModalBooking, setHandoverModalBooking] = useState<any | null>(null);
  const [returnModalBooking, setReturnModalBooking] = useState<any | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchVendorBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vendor/bookings?filter=${filter}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch vendor bookings');
      }

      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorBookings();
  }, [filter]);

  const handleAccept = async (bId: string) => {
    try {
      const res = await fetch(`/api/vendor/bookings/${bId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Accept failed');
      fetchVendorBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (bId: string) => {
    if (!rejectReason || rejectReason.trim().length < 3) {
      alert('Please enter a rejection reason.');
      return;
    }

    try {
      const res = await fetch(`/api/vendor/bookings/${bId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reject failed');
      setRejectingId(null);
      setRejectReason('');
      fetchVendorBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartDelivery = async (bId: string) => {
    try {
      const res = await fetch('/api/vendor/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bId,
          latitude: 30.1345,
          longitude: 78.3262,
          deliveryState: 'EN_ROUTE',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start delivery');
      fetchVendorBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">RideSetu Partner Portal</div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Fleet Fulfillment & Bookings</h1>
          </div>

          <button
            type="button"
            onClick={() => fetchVendorBookings()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Inbox</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          {(['ALL', 'NEW', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED', 'DISPUTED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filter === tab
                  ? 'bg-navy-950 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Inbox Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading operational inbox...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 max-w-md mx-auto">
            <Store className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-black text-slate-900">No bookings in this queue</h3>
            <p className="text-xs text-slate-500 font-semibold">Incoming partner reservations will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bookings.map((booking) => {
              const vehicle = booking.vehicle || {};
              const isDelivery = booking.pickupType === 'DOORSTEP_DELIVERY' || booking.pickupType === 'HOSTEL_DELIVERY';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4 flex flex-col justify-between"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Booking #{booking.bookingNumber}</div>
                      <div className="text-xs font-black text-slate-900">{booking.customerDetails?.fullName} ({booking.customerDetails?.phone})</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black uppercase">
                      {booking.bookingStatus}
                    </span>
                  </div>

                  {/* Vehicle Spec */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-14 bg-slate-50 rounded-xl p-1 shrink-0 flex items-center justify-center border border-slate-100">
                      <img src={getVehicleImage(vehicle)} alt={getVehicleAltText(vehicle)} className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="font-black text-navy-950">{vehicle.brand} {vehicle.model}</div>
                      <div className="text-[11px] text-slate-500 font-bold">Rider: {booking.riderDetails?.fullName || booking.customerDetails?.fullName} (✓ DL Verified)</div>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {booking.bookingStatus === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(booking.id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                        >
                          Accept Booking
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectingId(booking.id)}
                          className="px-3 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'PREPARING' || booking.bookingStatus === 'VENDOR_ACCEPTED') && (
                      <button
                        type="button"
                        onClick={() => setHandoverModalBooking(booking)}
                        className="w-full py-2.5 bg-navy-950 text-white font-bold text-xs rounded-xl hover:bg-black transition-all"
                      >
                        Start Handover Inspection
                      </button>
                    )}

                    {isDelivery && (booking.bookingStatus === 'READY_FOR_HANDOVER' || booking.bookingStatus === 'PREPARING') && (
                      <button
                        type="button"
                        onClick={() => handleStartDelivery(booking.id)}
                        className="w-full py-2.5 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Start Doorstep Delivery</span>
                      </button>
                    )}

                    {(booking.bookingStatus === 'ACTIVE' || booking.bookingStatus === 'HANDED_OVER' || booking.bookingStatus === 'RETURN_PENDING') && (
                      <button
                        type="button"
                        onClick={() => setReturnModalBooking(booking)}
                        className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all"
                      >
                        Process Return Inspection
                      </button>
                    )}
                  </div>

                  {/* Reject Modal Prompt */}
                  {rejectingId === booking.id && (
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 pt-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection (e.g. Vehicle maintenance)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-semibold"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReject(booking.id)}
                          className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(null)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Handover Inspection Modal */}
      {handoverModalBooking && (
        <HandoverInspectionModal
          booking={handoverModalBooking}
          isOpen={!!handoverModalBooking}
          onClose={() => setHandoverModalBooking(null)}
          onSuccess={() => fetchVendorBookings()}
        />
      )}

      {/* Return Inspection Modal */}
      {returnModalBooking && (
        <ReturnInspectionModal
          booking={returnModalBooking}
          isOpen={!!returnModalBooking}
          onClose={() => setReturnModalBooking(null)}
          onSuccess={() => fetchVendorBookings()}
        />
      )}
    </div>
  );
}
