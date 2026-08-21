'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, CheckCircle2, ShieldAlert, Edit3, Save, X, MapPin, Clock, Truck, Store, Phone, Mail, User } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function PartnerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    businessDescription: '',
    address: '',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '',
    openTime: '08:00 AM',
    closeTime: '09:00 PM',
    deliveryRadiusKm: 15,
    hubPickupAvailable: true,
    doorstepDeliveryAvailable: true,
    hostelDeliveryAvailable: true,
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/profile');
      const data = await res.json();
      const prof = data.profile || data.vendor;
      if (prof) {
        setProfile(prof);
        setFormData({
          businessName: prof.businessName || '',
          ownerName: prof.ownerName || '',
          phone: prof.phone || '',
          email: prof.email || '',
          businessDescription: prof.businessDescription || '',
          address: prof.address || '',
          city: prof.city || 'Rishikesh',
          state: prof.state || 'Uttarakhand',
          pincode: prof.pincode || '',
          openTime: prof.operatingHours?.open || '08:00 AM',
          closeTime: prof.operatingHours?.close || '09:00 PM',
          deliveryRadiusKm: prof.deliveryRadiusKm || 15,
          hubPickupAvailable: prof.hubPickupAvailable !== false,
          doorstepDeliveryAvailable: prof.doorstepDeliveryAvailable !== false,
          hostelDeliveryAvailable: prof.hostelDeliveryAvailable !== false,
        });
      }
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          businessDescription: formData.businessDescription,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          operatingHours: { open: formData.openTime, close: formData.closeTime, days: 'Mon - Sun' },
          deliveryRadiusKm: formData.deliveryRadiusKm,
          hubPickupAvailable: formData.hubPickupAvailable,
          doorstepDeliveryAvailable: formData.doorstepDeliveryAvailable,
          hostelDeliveryAvailable: formData.hostelDeliveryAvailable,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update business profile');
      }

      setProfile(data.profile);
      setEditing(false);
      setMessage({ text: 'Business profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const businessName = profile?.businessName || user?.vendor?.businessName || user?.name || 'RideSetu Partner Store';
  const verificationStatus = profile?.verificationStatus || 'VERIFIED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900">Partner Business Profile</h1>
            <p className="text-xs text-slate-600 font-medium">Manage your storefront information, store address, operating hours, and delivery area settings.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Edit3 className="w-4 h-4" />
              <span>EDIT PROFILE</span>
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <X className="w-4 h-4" />
              <span>CANCEL</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Mobility Partner Account</span>
                <h2 className="text-xl font-black text-slate-900 font-heading">{businessName}</h2>
              </div>

              {/* Verification Status Badge (Admin Controlled Only) */}
              <div className="shrink-0">
                {verificationStatus === 'VERIFIED' ? (
                  <span className="font-black uppercase px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> VERIFIED PARTNER
                  </span>
                ) : (
                  <span className="font-black uppercase px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 text-xs inline-flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> {verificationStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Business Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Business Name</label>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.businessName || 'N/A'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Owner / Primary Contact Name</label>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.ownerName || 'N/A'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Contact Phone</label>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.phone || 'N/A'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Contact Email</label>
                {editing ? (
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.email || 'N/A'}</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-slate-500 font-bold block mb-1">Business Description</label>
              {editing ? (
                <textarea
                  rows={3}
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Describe your rental fleet, store specialty, or customer service guarantee..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                />
              ) : (
                <p className="text-slate-700 font-medium text-xs leading-relaxed">{profile?.businessDescription || 'No description added yet.'}</p>
              )}
            </div>
          </div>

          {/* Store Location & Operating Hours */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" /> Store Location & Operating Hours
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Store Address</label>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.address || 'N/A'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">City</label>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.city || 'Rishikesh'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">State & Pincode</label>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 min-h-[44px]"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 min-h-[44px]"
                      placeholder="Pincode"
                    />
                  </div>
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.state || 'Uttarakhand'} - {profile?.pincode || '249201'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Opening Time</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.operatingHours?.open || '08:00 AM'}</span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Closing Time</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 min-h-[44px]"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.operatingHours?.close || '09:00 PM'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Capabilities & Service Area */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" /> Delivery Capabilities & Service Radius
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 gap-2">
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">Vendor Hub Pickup</span>
                    <span className="text-slate-500 text-[11px]">Customers can pick up vehicles directly at your store.</span>
                  </div>
                </div>
                {editing ? (
                  <input
                    type="checkbox"
                    checked={formData.hubPickupAvailable}
                    onChange={(e) => setFormData({ ...formData, hubPickupAvailable: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 cursor-pointer min-h-[24px]"
                  />
                ) : (
                  <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${formData.hubPickupAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {formData.hubPickupAvailable ? 'SUPPORTED' : 'DISABLED'}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 gap-2">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">Doorstep Delivery</span>
                    <span className="text-slate-500 text-[11px]">Deliver vehicles to customer residence / private address.</span>
                  </div>
                </div>
                {editing ? (
                  <input
                    type="checkbox"
                    checked={formData.doorstepDeliveryAvailable}
                    onChange={(e) => setFormData({ ...formData, doorstepDeliveryAvailable: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 cursor-pointer min-h-[24px]"
                  />
                ) : (
                  <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${formData.doorstepDeliveryAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {formData.doorstepDeliveryAvailable ? 'SUPPORTED' : 'DISABLED'}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 gap-2">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">Hotel / Hostel Delivery</span>
                    <span className="text-slate-500 text-[11px]">Deliver vehicles to tourist hotels, resorts, and hostels.</span>
                  </div>
                </div>
                {editing ? (
                  <input
                    type="checkbox"
                    checked={formData.hostelDeliveryAvailable}
                    onChange={(e) => setFormData({ ...formData, hostelDeliveryAvailable: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 cursor-pointer min-h-[24px]"
                  />
                ) : (
                  <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${formData.hostelDeliveryAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {formData.hostelDeliveryAvailable ? 'SUPPORTED' : 'DISABLED'}
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1 pt-2">Service Radius (km from store)</label>
                {editing ? (
                  <select
                    value={formData.deliveryRadiusKm}
                    onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km (Recommended)</option>
                    <option value={20}>20 km</option>
                    <option value={30}>30 km</option>
                  </select>
                ) : (
                  <span className="font-extrabold text-slate-900 text-sm block">{profile?.deliveryRadiusKm || 15} km</span>
                )}
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
