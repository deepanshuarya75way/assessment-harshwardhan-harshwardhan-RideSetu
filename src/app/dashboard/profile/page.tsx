'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, ShieldCheck, FileText, CheckCircle2, AlertCircle, RefreshCw, Upload, Edit3, ArrowRight, Lock, MapPin, Calendar, Mail, Phone, Save, X } from 'lucide-react';
import DocumentVault from '@/components/profile/DocumentVault';

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    avatar: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customer/profile');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setProfile(data.profile);
      if (data.profile) {
        setFormData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          dateOfBirth: data.profile.dateOfBirth || '',
          gender: data.profile.gender || '',
          street: data.profile.address?.street || '',
          city: data.profile.address?.city || '',
          state: data.profile.address?.state || '',
          pincode: data.profile.address?.pincode || '',
          avatar: data.profile.avatar || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          avatar: formData.avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">RideSetu Identity Vault</div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Customer Profile & KYC</h1>
          </div>

          <button
            type="button"
            onClick={() => fetchProfile()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Profile</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading identity profile...</p>
          </div>
        ) : error && !profile ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : !profile ? null : (
          <div className="space-y-6">
            {/* Feedback Notifications */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* KYC Status Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Verification Checklist</div>
                  <h2 className="text-base font-black text-navy-950">Identity Verification Summary</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">KYC Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full font-black text-xs ${
                      profile.kycStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {profile.kycStatus}
                  </span>
                </div>
              </div>

              {/* Checklist Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mobile Verified</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email Verified</span>
                </div>
                <div className={`p-3 rounded-2xl border flex items-center gap-2 ${
                  profile.drivingLicenseStatus === 'VERIFIED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  {profile.drivingLicenseStatus === 'VERIFIED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>DL {profile.drivingLicenseStatus === 'VERIFIED' ? 'Verified' : 'Pending'}</span>
                </div>
                <div className={`p-3 rounded-2xl border flex items-center gap-2 ${
                  profile.aadhaarStatus === 'VERIFIED' || profile.aadhaarNumberMasked
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  {profile.aadhaarStatus === 'VERIFIED' || profile.aadhaarNumberMasked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>Aadhaar {profile.aadhaarNumberMasked ? 'Added' : 'Missing'}</span>
                </div>
              </div>

              {profile.kycStatus !== 'VERIFIED' && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-amber-950">Complete your profile to make future bookings faster.</div>
                    <p className="text-amber-800 font-semibold">
                      Uploaded verification documents automatically populate your rider profile on checkout.
                    </p>
                  </div>
                  <a
                    href="#documents"
                    className="px-4 py-2 bg-brand-orange hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm shrink-0 transition-all text-center"
                  >
                    COMPLETE KYC
                  </a>
                </div>
              )}
            </div>

            {/* Personal Information Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-navy-950 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-brand-orange">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                    ) : profile.name ? (
                      profile.name[0].toUpperCase()
                    ) : (
                      'U'
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-navy-950">{profile.name}</h2>
                    <p className="text-xs font-semibold text-slate-500">{profile.email}</p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 mt-1 inline-block">
                      Role: {profile.role}
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-navy-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-orange" />
                    <span>EDIT PROFILE</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>CANCEL</span>
                  </button>
                )}
              </div>

              {!isEditing ? (
                /* Read-Only Profile View */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-brand-orange" /> Full Name
                    </div>
                    <div className="font-bold text-navy-950 text-sm">{profile.name}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3 h-3 text-brand-orange" /> Email Address
                    </div>
                    <div className="font-bold text-navy-950 text-sm">{profile.email}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="w-3 h-3 text-brand-orange" /> Mobile Number
                    </div>
                    <div className="font-bold text-navy-950 text-sm flex items-center justify-between">
                      <span>{profile.phone}</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-brand-orange" /> Date of Birth & Gender
                    </div>
                    <div className="font-bold text-navy-950 text-sm">
                      {profile.dateOfBirth || 'Not Specified'} {profile.gender ? `(${profile.gender})` : ''}
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-orange" /> Residential Address
                    </div>
                    <div className="font-bold text-navy-950 text-sm">
                      {[profile.address?.street, profile.address?.city, profile.address?.state, profile.address?.pincode]
                        .filter(Boolean)
                        .join(', ') || 'No address saved.'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Editable Form */
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Street Address</label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="e.g. 108 Tapovan Main Road"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Rishikesh"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Uttarakhand"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-950"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-dark text-white font-black text-xs shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'SAVE CHANGES'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Document Vault Component Section */}
            <div id="documents">
              <DocumentVault profile={profile} onRefresh={() => fetchProfile()} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
