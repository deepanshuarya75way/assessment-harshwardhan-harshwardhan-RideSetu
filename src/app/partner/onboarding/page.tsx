'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Store,
  User,
  Building2,
  FileCheck,
  CreditCard,
  Car,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  ShieldCheck,
  Check,
  Lock,
  Clock,
} from 'lucide-react';

export default function PartnerOnboardingWizard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vendor Onboarding Form State
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessContact, setBusinessContact] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD'>('PROPRIETORSHIP');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Rishikesh');
  const [state, setState] = useState('Uttarakhand');
  const [pincode, setPincode] = useState('249201');
  const [gstNumber, setGstNumber] = useState('');
  const [rentalLicenseNumber, setRentalLicenseNumber] = useState('');

  const [panNumber, setPanNumber] = useState('');
  const [isPanSaved, setIsPanSaved] = useState(false);

  const [tradeLicenseUrl, setTradeLicenseUrl] = useState('');
  const [gstCertificateUrl, setGstCertificateUrl] = useState('');
  const [identityProofUrl, setIdentityProofUrl] = useState('');
  const [rentalPermitUrl, setRentalPermitUrl] = useState('');

  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [isBankSaved, setIsBankSaved] = useState(false);

  const [vehicleCount, setVehicleCount] = useState<number>(5);
  const [vehicleCategories, setVehicleCategories] = useState<string[]>(['Scooter', 'Motorcycle']);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(15);

  const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login/partner');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vendor/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const vp = data.profile;
            setOwnerName(vp.ownerName || user?.name || '');
            setEmail(vp.email || user?.email || '');
            setPhone(vp.phone || user?.phone || '');
            setBusinessContact(vp.phone || '');

            setBusinessName(vp.businessName || '');
            setBusinessType(vp.businessType || 'PROPRIETORSHIP');
            setAddress(vp.address || '');
            setCity(vp.city || 'Rishikesh');
            setState(vp.state || 'Uttarakhand');
            setPincode(vp.pincode || '249201');
            setGstNumber(vp.gstNumber || '');
            setRentalLicenseNumber(vp.rentalLicenseNumber || '');

            setTradeLicenseUrl(vp.documents?.tradeLicenseUrl || '');
            setGstCertificateUrl(vp.documents?.gstCertificateUrl || '');
            setIdentityProofUrl(vp.documents?.identityProofUrl || '');
            setRentalPermitUrl(vp.documents?.rentalPermitUrl || '');

            if (vp.bankAccountReference) {
              setIsBankSaved(true);
            }
            setVerificationStatus(vp.verificationStatus || 'PENDING');
          }
        }
      } catch (err) {
        console.error('Failed to load vendor onboarding profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchVendorProfile();
    }
  }, [user]);

  const saveProgress = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        businessName: businessName || `${ownerName || 'Vendor'}'s Rental Agency`,
        ownerName: ownerName || user?.name,
        email: email || user?.email,
        phone: phone || user?.phone,
        address: address || 'Hub Location',
        city: city || 'Rishikesh',
        state: state || 'Uttarakhand',
        pincode: pincode || '249201',
        businessType,
        gstNumber,
        rentalLicenseNumber,
        deliveryRadiusKm,
        bankAccountReference: bankAccountNumber ? `AC-${bankAccountNumber.slice(-4)}` : undefined,
        documents: {
          tradeLicenseUrl,
          gstCertificateUrl,
          identityProofUrl,
          rentalPermitUrl,
        },
      };

      const res = await fetch('/api/vendor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save onboarding progress.');
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setError(null);
    if (step < 7) {
      await saveProgress();
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setError(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      const missing: string[] = [];
      if (!businessName.trim()) missing.push('Business Name');
      if (!ownerName.trim()) missing.push('Owner Name');
      if (!address.trim()) missing.push('Business Address');
      if (!rentalLicenseNumber.trim()) missing.push('Rental License/Permit Number');

      if (missing.length > 0) {
        throw new Error(`Please complete required fields before submitting: ${missing.join(', ')}`);
      }

      await saveProgress();

      const res = await fetch('/api/vendor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: 'UNDER_REVIEW',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application for verification.');
      }

      setVerificationStatus('UNDER_REVIEW');
      setSuccessMessage('Your Partner Application has been submitted successfully to RideSetu Operations for review.');
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-bold text-lg animate-pulse mx-auto">
            RS
          </div>
          <p className="text-xs text-slate-500 font-bold animate-pulse">Loading B2B Partner Onboarding Portal...</p>
        </div>
      </div>
    );
  }

  const maskIdentifier = (val: string) => {
    if (!val) return 'Not Provided';
    if (val.length <= 4) return `••••${val}`;
    return `${val.substring(0, 2)}••••${val.substring(val.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black font-heading text-slate-900">RideSetu Partner Onboarding</h1>
              <p className="text-xs text-slate-500 font-medium">B2B Mobility Fleet Partner Registration</p>
            </div>
          </div>
          <Link
            href="/partner/dashboard"
            className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
          >
            <span>Back to Partner Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Stepper Navigation */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: 'Contact', icon: User },
              { num: 2, label: 'Business', icon: Building2 },
              { num: 3, label: 'Owner', icon: Lock },
              { num: 4, label: 'KYC Docs', icon: FileCheck },
              { num: 5, label: 'Payout', icon: CreditCard },
              { num: 6, label: 'Fleet', icon: Car },
              { num: 7, label: 'Review', icon: ShieldCheck },
            ].map((st) => (
              <button
                key={st.num}
                onClick={() => setStep(st.num)}
                className={`py-2 px-1 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                  step === st.num
                    ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-[#FF6B00]/20'
                    : step > st.num
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <st.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm text-emerald-900">Application Submitted for Review</h3>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">{successMessage}</p>
              </div>
            </div>
            <Link
              href="/partner/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <span>Go to Partner Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Wizard Form Cards */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          {/* STEP 1: Account & Contact */}
          {step === 1 && (
            <div className="space-y-4 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6B00]" /> Step 1: Account & Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Legal Owner Name *</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Official Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Mobile Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Business Helpline Phone</label>
                  <input
                    type="tel"
                    value={businessContact}
                    onChange={(e) => setBusinessContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Information */}
          {step === 2 && (
            <div className="space-y-4 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#FF6B00]" /> Step 2: Business Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 block font-extrabold">Business / Fleet Agency Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Himalayan Moto Rentals"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Business Entity Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  >
                    <option value="PROPRIETORSHIP">Proprietorship</option>
                    <option value="INDIVIDUAL">Sole Individual</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="PVT_LTD">Pvt Ltd Company</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Rental License / Trade Permit No. *</label>
                  <input
                    type="text"
                    value={rentalLicenseNumber}
                    onChange={(e) => setRentalLicenseNumber(e.target.value)}
                    placeholder="UK-RSH-RENT-2024"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 block font-extrabold">Registered Business Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Tapovan Main Market, Near Laxman Jhula"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  >
                    <option value="Rishikesh">Rishikesh</option>
                    <option value="Mussoorie">Mussoorie</option>
                    <option value="Dehradun">Dehradun</option>
                    <option value="Nainital">Nainital</option>
                    <option value="Haridwar">Haridwar</option>
                    <option value="Haldwani">Haldwani</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="05ABCDE1234F1Z5"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Owner Information */}
          {step === 3 && (
            <div className="space-y-4 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#FF6B00]" /> Step 3: Owner & Identification Details
              </h2>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[11px] font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Sensitive identification data is encrypted and masked for security.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Owner PAN Number</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none uppercase"
                  />
                  {panNumber && (
                    <span className="text-[11px] text-slate-500 font-bold block mt-1">
                      Display Mask: {maskIdentifier(panNumber)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Owner State of Residence</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Uttarakhand"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KYC Documents */}
          {step === 4 && (
            <div className="space-y-4 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#FF6B00]" /> Step 4: Business KYC Documents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">Trade License Document</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${tradeLicenseUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tradeLicenseUrl ? 'Uploaded' : 'Pending'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={tradeLicenseUrl}
                    onChange={(e) => setTradeLicenseUrl(e.target.value)}
                    placeholder="https://storage.ridesetu.com/docs/license.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">Rental Permit Document</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${rentalPermitUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rentalPermitUrl ? 'Uploaded' : 'Pending'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={rentalPermitUrl}
                    onChange={(e) => setRentalPermitUrl(e.target.value)}
                    placeholder="https://storage.ridesetu.com/docs/permit.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">Owner Identity Proof (Aadhaar/DL)</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${identityProofUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {identityProofUrl ? 'Uploaded' : 'Pending'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={identityProofUrl}
                    onChange={(e) => setIdentityProofUrl(e.target.value)}
                    placeholder="https://storage.ridesetu.com/docs/id.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">GST Certificate (Optional)</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${gstCertificateUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {gstCertificateUrl ? 'Uploaded' : 'Optional'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={gstCertificateUrl}
                    onChange={(e) => setGstCertificateUrl(e.target.value)}
                    placeholder="https://storage.ridesetu.com/docs/gst.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Bank / Payout Details */}
          {step === 5 && (
            <div className="space-y-4 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FF6B00]" /> Step 5: Bank Account & Payout Setup
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Bank Account Number</label>
                  <input
                    type="password"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="••••••••1234"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                  {bankAccountNumber && (
                    <span className="text-[11px] text-slate-500 font-bold block mt-1">
                      Masked Reference: Account ending ••••{bankAccountNumber.slice(-4)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="SBIN0001234"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Fleet Information */}
          {step === 6 && (
            <div className="space-y-4 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-[#FF6B00]" /> Step 6: Fleet Capabilities & Hubs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Estimated Fleet Size (Vehicles)</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={vehicleCount}
                    onChange={(e) => setVehicleCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 block font-extrabold">Doorstep Delivery Radius (km)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Application Summary & Submission */}
          {step === 7 && (
            <div className="space-y-6 text-xs font-semibold">
              <h2 className="text-base font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF6B00]" /> Step 7: Application Summary & Verification
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-800 block text-xs">Business & Owner</span>
                  <p className="text-slate-600">{businessName} ({businessType})</p>
                  <p className="text-slate-500">Owner: {ownerName} • {phone}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-800 block text-xs">Address & License</span>
                  <p className="text-slate-600">{address}, {city}, {state}</p>
                  <p className="text-slate-500">Permit: {rentalLicenseNumber || 'Pending'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-800 block text-xs">KYC Documents</span>
                  <p className="text-emerald-700">✓ Trade License: {tradeLicenseUrl ? 'Attached' : 'Not attached'}</p>
                  <p className="text-emerald-700">✓ Rental Permit: {rentalPermitUrl ? 'Attached' : 'Not attached'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-800 block text-xs">Payout Details</span>
                  <p className="text-slate-600">Bank Account: {bankAccountNumber ? `••••${bankAccountNumber.slice(-4)}` : 'Reference Set'}</p>
                  <p className="text-slate-500">Status: Secure Payout Reference</p>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-900 space-y-1">
                <span className="font-extrabold text-xs block">Verification Notice:</span>
                <p className="text-[11px] leading-relaxed">
                  Submitting your application will transition your partner status to <strong>UNDER_REVIEW</strong>. RideSetu Operations will review your submitted license and KYC documents before granting <strong>VERIFIED</strong> status. Vehicle fleet publishing is enabled only after admin verification.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {submitting ? 'Submitting Application...' : 'Submit Application for Verification'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom Action Controls */}
          {step < 7 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className="py-3 px-5 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="py-3 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/20 flex items-center gap-1.5 transition-all disabled:opacity-50 min-h-[44px]"
              >
                <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
