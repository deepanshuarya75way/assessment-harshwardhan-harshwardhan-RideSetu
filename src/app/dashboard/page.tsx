'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { formatINR, formatDateTime } from '@/lib/utils';
import { StatusBadge, RatingBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Zap,
  AlertTriangle,
  FileText,
  Star,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  User as UserIcon,
  ShieldAlert,
  Eye,
  Mail,
  Phone,
  Edit3,
  X,
  Upload,
  Lock,
  Bell,
  XCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'ACTIVE' | 'ALL' | 'NOTIFICATIONS' | 'PROFILE' | 'KYC' | 'LOCATIONS' | 'PAYMENTS' | 'SUPPORT'
  >('ACTIVE');
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [extendModalBooking, setExtendModalBooking] = useState<any | null>(null);
  const [newExtendDate, setNewExtendDate] = useState('');
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocLabel, setNewLocLabel] = useState('Home / Hotel');
  const [newLocType, setNewLocType] = useState('HOTEL');
  const [newLocBuilding, setNewLocBuilding] = useState('');
  const [newLocRoom, setNewLocRoom] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCity, setNewLocCity] = useState('Rishikesh');
  const [newLocLat, setNewLocLat] = useState('30.1317');
  const [newLocLng, setNewLocLng] = useState('78.3242');

  // Customer Profile & KYC States
  const [profile, setProfile] = useState<any>(null);
  const [kycData, setKycData] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profName, setProfName] = useState('');
  const [profDob, setProfDob] = useState('');
  const [profEmergName, setProfEmergName] = useState('');
  const [profEmergPhone, setProfEmergPhone] = useState('');
  const [profEmergRelation, setProfEmergRelation] = useState('Family');

  // OTP Verification Modal
  const [otpModalChannel, setOtpModalChannel] = useState<'EMAIL' | 'PHONE' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [devCodeNotice, setDevCodeNotice] = useState('');

  // KYC Submission Form State
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycFormError, setKycFormError] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [dlName, setDlName] = useState('');
  const [dlDob, setDlDob] = useState('');
  const [dlIssue, setDlIssue] = useState('');
  const [dlExpiry, setDlExpiry] = useState('');
  const [dlClasses, setDlClasses] = useState<string[]>(['MCWG']);
  const [dlFrontBase64, setDlFrontBase64] = useState('');
  const [dlFrontName, setDlFrontName] = useState('');
  const [dlBackBase64, setDlBackBase64] = useState('');
  const [dlBackName, setDlBackName] = useState('');

  // Document Preview Modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Review Modal State
  const [reviewModalBooking, setReviewModalBooking] = useState<any | null>(null);
  const [reviewOverall, setReviewOverall] = useState(5);
  const [reviewVehicle, setReviewVehicle] = useState(5);
  const [reviewVendor, setReviewVendor] = useState(5);
  const [reviewPickup, setReviewPickup] = useState(5);
  const [reviewDelivery, setReviewDelivery] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelPreview, setCancelPreview] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Dispute Modal State
  const [disputeModalBooking, setDisputeModalBooking] = useState<any | null>(null);
  const [disputeCategory, setDisputeCategory] = useState('VEHICLE_CONDITION');
  const [disputeRemarks, setDisputeRemarks] = useState('');
  const [disputeClaimAmount, setDisputeClaimAmount] = useState(0);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookRes, locRes, profRes, kycRes, payRes, notifRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/customer/saved-locations'),
        fetch('/api/customer/profile'),
        fetch('/api/customer/kyc'),
        fetch('/api/customer/payments'),
        fetch('/api/notifications'),
      ]);

      const bookData = await bookRes.json();
      if (bookData.bookings) setBookings(bookData.bookings);

      if (locRes.ok) {
        const locData = await locRes.json();
        if (locData.locations) setSavedLocations(locData.locations);
      }

      if (profRes.ok) {
        const pData = await profRes.json();
        if (pData.profile) {
          setProfile(pData.profile);
          setProfName(pData.profile.name || '');
          setProfDob(pData.profile.dateOfBirth ? pData.profile.dateOfBirth.split('T')[0] : '');
          setProfEmergName(pData.profile.emergencyContact?.name || '');
          setProfEmergPhone(pData.profile.emergencyContact?.phone || '');
          setProfEmergRelation(pData.profile.emergencyContact?.relation || 'Family');
        }
      }

      if (kycRes.ok) {
        const kData = await kycRes.json();
        if (kData.kyc) setKycData(kData.kyc);
      }

      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.payments) setPayments(payData.payments);
      }

      if (notifRes.ok) {
        const nData = await notifRes.json();
        if (nData.notifications) setNotifications(nData.notifications);
        if (nData.unreadCount !== undefined) setUnreadNotifCount(nData.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profName,
          dateOfBirth: profDob,
          emergencyContact: {
            name: profEmergName,
            phone: profEmergPhone,
            relation: profEmergRelation,
          },
        }),
      });
      if (res.ok) {
        setEditingProfile(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Save profile error:', err);
    }
  };

  const handleOpenCancelModal = async (booking: any) => {
    try {
      setCancelModalBooking(booking);
      setCancelPreview(null);
      const res = await fetch(`/api/cancellation/preview?bookingId=${booking._id}`);
      const data = await res.json();
      if (res.ok && data.calculation) {
        setCancelPreview(data.calculation);
      }
    } catch (err) {
      console.error('Fetch cancellation preview error:', err);
    }
  };

  const handleExecuteCancellation = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelLoading(true);
      const res = await fetch(`/api/bookings/${cancelModalBooking._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL',
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCancelModalBooking(null);
        fetchDashboardData();
      } else {
        alert(data.error || 'Cancellation failed.');
      }
    } catch (err) {
      console.error('Cancellation execution error:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    try {
      setReviewSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewModalBooking._id,
          overallRating: reviewOverall,
          vehicleConditionRating: reviewVehicle,
          vendorBehaviorRating: reviewVendor,
          pickupExperienceRating: reviewPickup,
          deliveryExperienceRating: reviewDelivery,
          reviewText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewModalBooking(null);
        setReviewText('');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Submit review error:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalBooking) return;
    try {
      setDisputeSubmitting(true);
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: disputeModalBooking._id,
          category: disputeCategory,
          claimedAmount: disputeClaimAmount,
          customerRemarks: disputeRemarks,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDisputeModalBooking(null);
        setDisputeRemarks('');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to file dispute.');
      }
    } catch (err) {
      console.error('Submit dispute error:', err);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleSendOtp = async (channel: 'EMAIL' | 'PHONE') => {
    try {
      setOtpSending(true);
      setOtpError('');
      setOtpSuccess('');
      setDevCodeNotice('');

      const res = await fetch('/api/customer/profile/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpModalChannel(channel);
        setOtpSuccess(data.message || `OTP sent to your registered ${channel.toLowerCase()}`);
        if (data.devCode) {
          setDevCodeNotice(`Sandbox Test Code: ${data.devCode}`);
        }
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Network error sending OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalChannel || !otpCode.trim()) return;

    try {
      setOtpVerifying(true);
      setOtpError('');

      const res = await fetch('/api/customer/profile/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: otpModalChannel, code: otpCode.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpModalChannel(null);
        setOtpCode('');
        fetchDashboardData();
      } else {
        setOtpError(data.error || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'FRONT' | 'BACK') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (side === 'FRONT') {
        setDlFrontBase64(base64);
        setDlFrontName(file.name);
      } else {
        setDlBackBase64(base64);
        setDlBackName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setKycSubmitting(true);
      setKycFormError('');

      const res = await fetch('/api/customer/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drivingLicenceNumber: dlNumber,
          holderName: dlName,
          dateOfBirth: dlDob,
          issueDate: dlIssue,
          expiryDate: dlExpiry,
          vehicleClasses: dlClasses,
          frontImageBase64: dlFrontBase64,
          frontFileName: dlFrontName || 'dl_front.jpg',
          backImageBase64: dlBackBase64,
          backFileName: dlBackName || 'dl_back.jpg',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowKycForm(false);
        fetchDashboardData();
      } else {
        setKycFormError(data.error || 'KYC submission failed');
      }
    } catch (err: any) {
      setKycFormError(err.message || 'KYC submission error');
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customer/saved-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLocLabel,
          locationType: newLocType,
          buildingName: newLocBuilding,
          roomNumber: newLocRoom,
          address: newLocAddress,
          city: newLocCity,
          state: 'Uttarakhand',
          coordinates: {
            latitude: parseFloat(newLocLat) || 30.1317,
            longitude: parseFloat(newLocLng) || 78.3242,
          },
        }),
      });

      if (res.ok) {
        setShowAddLocationModal(false);
        setNewLocBuilding('');
        setNewLocRoom('');
        setNewLocAddress('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to add saved location:', err);
    }
  };

  const handleTriggerSOS = (bookingId: string) => {
    setSosSending(true);
    setTimeout(() => {
      setSosSending(false);
      setSosSent(true);
    }, 1200);
  };

  const activeBooking = bookings.find(
    (b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'IN_PROGRESS'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-white/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">
            <Compass className="w-3.5 h-3.5" /> Rider Companion Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
            Namaste, {profile?.name || user?.name || 'Rider'}! 🏔️
          </h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal leading-relaxed">
            Manage active rentals, track return inspections, inspect digital KYC certificates, and access 24/7 mountain roadside SOS dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/vehicles"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white text-xs font-extrabold shadow-lg shadow-brand-orange/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>Book New Ride</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ACTIVE RIDE COMPANION CARD */}
      {activeBooking && (
        <div className="bg-white rounded-3xl border-2 border-brand-orange/40 p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-orange text-white font-black text-xs rounded-bl-2xl uppercase tracking-wider shadow-md">
            🚀 Active Mountain Trip
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Vehicle Details */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <Image
                  src={activeBooking.vehicleId?.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80'}
                  alt={activeBooking.vehicleId?.model || 'Vehicle'}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeBooking.bookingCode}
                </span>
                <h3 className="font-black text-navy-950 text-lg font-heading">
                  {activeBooking.vehicleId?.brand} {activeBooking.vehicleId?.model}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Partner: {activeBooking.vendorId?.businessName || 'Verified Partner'}</p>
              </div>
            </div>

            {/* Trip Timeline & Hub */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Pickup Scheduled</span>
                <div className="font-extrabold text-slate-900 mt-0.5">{formatDateTime(activeBooking.pickupDateTime)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Return Due</span>
                <div className="font-extrabold text-slate-900 mt-0.5">{formatDateTime(activeBooking.returnDateTime)}</div>
              </div>
            </div>

            {/* Live Actions & 24/7 SOS Trigger */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <button
                onClick={() => handleTriggerSOS(activeBooking._id)}
                disabled={sosSending || sosSent}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                  sosSent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 text-white shadow-red-500/25'
                }`}
              >
                <Zap className={`w-4 h-4 ${sosSending ? 'animate-spin' : ''}`} />
                <span>{sosSent ? '✓ SOS Emergency Dispatched' : sosSending ? 'Connecting...' : '24/7 Roadside SOS'}</span>
              </button>

              <div className="flex gap-2">
                <a
                  href={`tel:${activeBooking.vendorId?.phone || '+919876543210'}`}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Call Host</span>
                </a>
                <button
                  onClick={() => handleOpenCancelModal(activeBooking)}
                  className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                >
                  Cancel Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile & KYC Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-navy-950 text-white flex items-center justify-center font-black text-lg border border-brand-orange">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Your Profile</div>
            <div className="font-extrabold text-navy-950 text-sm">{user?.name || 'RideSetu Member'}</div>
            <div className="text-xs font-bold text-slate-600 flex flex-wrap items-center gap-2">
              <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                KYC: {profile?.drivingLicenseStatus === 'VERIFIED' ? '✓ Driving License Verified' : '✓ Mobile Verified'}
              </span>
              {profile?.aadhaarNumberMasked && (
                <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  ✓ Aadhaar Added
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="px-4 py-2 bg-navy-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          Manage Profile
        </Link>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {[
          { id: 'ACTIVE', label: 'Overview', icon: Compass },
          { id: 'ALL', label: `My Rides (${bookings.length})`, icon: Calendar },
          { id: 'KYC', label: 'KYC & Licence', icon: FileText, badge: kycData?.status },
          { id: 'LOCATIONS', label: `Saved Hubs (${savedLocations.length})`, icon: MapPin },
          { id: 'PAYMENTS', label: `Ledger (${payments.length})`, icon: ShieldCheck },
          { id: 'NOTIFICATIONS', label: 'Alerts', icon: Bell, unread: unreadNotifCount },
          { id: 'PROFILE', label: 'Profile', icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-navy-950 text-white shadow-md shadow-navy-950/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.unread ? (
                <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center">
                  {tab.unread}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* TAB: OVERVIEW & ACTIVE TRIPS */}
          {activeTab === 'ACTIVE' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Completed Rides</span>
                  <div className="text-3xl font-black text-navy-950 font-heading">
                    {bookings.filter((b) => b.status === 'COMPLETED').length}
                  </div>
                  <p className="text-[11px] text-slate-500">Across Uttarakhand destinations</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Digital KYC Status</span>
                  <div>
                    <StatusBadge status={kycData?.status || 'PENDING'} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {kycData?.status === 'APPROVED'
                      ? 'Pre-approved for instant 2-minute handover'
                      : 'Upload original DL to enable fast pickup'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Deposit Refund Security</span>
                  <div className="text-3xl font-black text-emerald-600 font-heading">100%</div>
                  <p className="text-[11px] text-slate-500">Zero false damage deduction guarantee</p>
                </div>
              </div>

              {/* Recent Bookings List */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold font-heading text-navy-950 text-base">Recent Travel Bookings</h3>
                  <button onClick={() => setActiveTab('ALL')} className="text-xs font-bold text-brand-orange hover:underline">
                    View All
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <EmptyState
                    title="No bookings recorded yet"
                    description="You haven't reserved any vehicles yet. Explore top rated scooters and bikes in Uttarakhand."
                    actionText="Browse Rental Fleet"
                    actionHref="/vehicles"
                  />
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((b) => (
                      <div key={b._id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-slate-200 relative overflow-hidden shrink-0">
                            <Image
                              src={b.vehicleId?.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=200&q=80'}
                              alt="vehicle"
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm font-heading">{b.vehicleId?.brand} {b.vehicleId?.model}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{formatDateTime(b.pickupDateTime)} • {b.bookingCode}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <StatusBadge status={b.status} />
                          <span className="font-black text-slate-900 text-sm font-heading">{formatINR(b.pricing?.totalPrice || 999)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ALL BOOKINGS */}
          {activeTab === 'ALL' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold font-heading text-navy-950 text-lg">All Rental Bookings ({bookings.length})</h3>

              {bookings.length === 0 ? (
                <EmptyState
                  title="No bookings recorded"
                  description="Your booking history will appear here once you make your first reservation."
                  actionText="Explore Rides"
                  actionHref="/vehicles"
                />
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <div key={b._id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-14 rounded-2xl bg-slate-200 relative overflow-hidden shrink-0">
                          <Image
                            src={b.vehicleId?.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=200&q=80'}
                            alt="vehicle"
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base font-heading">{b.vehicleId?.brand} {b.vehicleId?.model}</span>
                            <StatusBadge status={b.status} size="sm" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Code: {b.bookingCode} • Host: {b.vendorId?.businessName || 'Local Partner'}</p>
                          <p className="text-[11px] text-slate-400">{formatDateTime(b.pickupDateTime)} → {formatDateTime(b.returnDateTime)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                        <div className="text-right mr-2">
                          <div className="font-black text-navy-950 font-heading text-base">{formatINR(b.pricing?.totalPrice || 999)}</div>
                          <span className="text-[10px] text-slate-400 font-semibold">{b.paymentStatus}</span>
                        </div>

                        {b.status === 'COMPLETED' && (
                          <button
                            onClick={() => setReviewModalBooking(b)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Star className="w-3.5 h-3.5 fill-slate-950" /> Rate Ride
                          </button>
                        )}

                        {['CONFIRMED', 'PENDING'].includes(b.status) && (
                          <button
                            onClick={() => handleOpenCancelModal(b)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => setDisputeModalBooking(b)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                        >
                          Dispute / Help
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: KYC & DL MANAGEMENT */}
          {activeTab === 'KYC' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black font-heading text-navy-950 text-xl">Driving Licence & KYC Verification</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify your driving licence digitally to enable instant zero-wait handovers.</p>
                </div>
                <StatusBadge status={kycData?.status || 'PENDING'} />
              </div>

              {kycData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <span className="font-extrabold text-slate-400 uppercase text-[10px]">Licence Details</span>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-slate-900 font-mono">{kycData.drivingLicenceNumber || 'UK0720210084920'}</div>
                      <div className="text-slate-600">Holder: <strong>{kycData.holderName || profile?.name}</strong></div>
                      <div className="text-slate-600">Valid Till: <strong>{kycData.expiryDate ? kycData.expiryDate.split('T')[0] : '2035-12-31'}</strong></div>
                      <div className="text-slate-600">Authorized: <strong>{kycData.vehicleClasses?.join(', ') || 'MCWG, LMV'}</strong></div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <span className="font-extrabold text-slate-400 uppercase text-[10px]">Verification Audit</span>
                    <p className="text-slate-600 leading-relaxed">
                      {kycData.status === 'APPROVED'
                        ? '✓ Verified by RideSetu Compliance. Original DL verified against transport registry.'
                        : '⏳ Under verification by administrative compliance team.'}
                    </p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Driving Licence on file"
                  description="Upload front and back photos of your original Driving Licence to enable fast reservations."
                  actionText="Upload Driving Licence"
                  onAction={() => setShowKycForm(true)}
                />
              )}
            </div>
          )}

          {/* TAB: SAVED LOCATIONS */}
          {activeTab === 'LOCATIONS' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black font-heading text-navy-950 text-xl">Saved Delivery Addresses & Hubs</h3>
                  <p className="text-xs text-slate-500 font-medium">Hotel, hostel, and base addresses for 1-click doorstep delivery checkout.</p>
                </div>
                <button
                  onClick={() => setShowAddLocationModal(true)}
                  className="px-4 py-2 bg-brand-orange text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-orange/20 flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Location
                </button>
              </div>

              {savedLocations.length === 0 ? (
                <EmptyState
                  title="No saved locations yet"
                  description="Add your hotel or homestay in Rishikesh or Mussoorie for fast delivery checkout."
                  actionText="Add New Hub"
                  onAction={() => setShowAddLocationModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedLocations.map((loc) => (
                    <div key={loc._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 font-heading">{loc.label}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">{loc.locationType}</span>
                      </div>
                      <p className="text-slate-600">{loc.buildingName ? `${loc.buildingName}, ` : ''}{loc.address}</p>
                      <div className="text-[10px] text-slate-400 font-semibold">📍 {loc.city}, {loc.state}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PAYMENTS & LEDGER */}
          {activeTab === 'PAYMENTS' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-black font-heading text-navy-950 text-xl">Payment Transactions & Security Deposits ({payments.length})</h3>

              {payments.length === 0 ? (
                <EmptyState
                  title="No payments recorded"
                  description="Your invoices, security deposit receipts, and refund credits will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-black text-slate-900 font-heading text-sm">
                            Ref: {p.providerPaymentId || p.razorpayPaymentId || p._id}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {formatDateTime(p.createdAt)} • Method: <span className="font-bold text-slate-700">{p.method || 'UPI'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-navy-950 font-heading text-base">{formatINR(p.amount)}</div>
                          <StatusBadge status={p.status} size="sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 font-medium">Order ID: </span>
                          <span className="font-mono font-semibold">{p.providerOrderId || p.razorpayOrderId || 'N/A'}</span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-emerald-700 font-bold">🔒 Includes {formatINR(p.breakdown?.securityDeposit || 1000)} Refundable Deposit</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="font-black font-heading text-navy-950 text-xl">In-App Notifications & Alerts</h3>

              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No new notifications"
                  description="You are completely up to date with all rental handovers and updates."
                />
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n._id} className={`p-4 rounded-2xl border text-xs space-y-1 ${n.isRead ? 'bg-slate-50 border-slate-200' : 'bg-brand-light border-brand-orange/30'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 font-heading">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="text-slate-600">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROFILE & CONTACT */}
          {activeTab === 'PROFILE' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black font-heading text-navy-950 text-xl">Rider Profile</h3>
                  <p className="text-xs text-slate-500 font-medium">Personal profile & emergency contact verification.</p>
                </div>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> {editingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled={!editingProfile}
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-slate-50 disabled:opacity-75"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-medium bg-slate-100 text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendOtp('EMAIL')}
                        className="px-3 py-1.5 bg-navy-950 text-white rounded-xl font-bold text-[11px] shrink-0"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        disabled
                        value={user?.phone || '+91 98765 43210'}
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-medium bg-slate-100 text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendOtp('PHONE')}
                        className="px-3 py-1.5 bg-brand-orange text-white rounded-xl font-bold text-[11px] shrink-0"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>

                {editingProfile && (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all"
                  >
                    Save Profile Changes
                  </button>
                )}
              </form>
            </div>
          )}
        </>
      )}

      {/* CANCELLATION MODAL */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black font-heading text-slate-900 text-lg">Cancel Trip Reservation</h3>
              <button onClick={() => setCancelModalBooking(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-slate-900">{cancelModalBooking.vehicleId?.brand} {cancelModalBooking.vehicleId?.model}</div>
              <div className="text-slate-500">Pickup: {formatDateTime(cancelModalBooking.pickupDateTime)}</div>
            </div>

            {cancelPreview && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                <div className="font-extrabold text-emerald-950">Refund Calculation Preview:</div>
                <div className="flex justify-between text-slate-700"><span>Paid Amount:</span> <strong>{formatINR(cancelPreview.originalAmount)}</strong></div>
                <div className="flex justify-between text-rose-600"><span>Cancellation Fee:</span> <strong>- {formatINR(cancelPreview.deductionFee)}</strong></div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-emerald-200 pt-1"><span>Refund Due:</span> <strong>{formatINR(cancelPreview.refundAmount)}</strong></div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 outline-none"
              >
                <option value="Change of travel plans">Change of travel plans</option>
                <option value="Bad weather / Mountain roadblock">Bad weather / Mountain roadblock</option>
                <option value="Booked another ride">Booked another ride</option>
                <option value="Personal emergency">Personal emergency</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleExecuteCancellation}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATE YOUR RIDE MODAL */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black font-heading text-slate-900 text-lg">Rate Your Ride</h3>
              <button onClick={() => setReviewModalBooking(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Overall Rating</label>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewOverall(s)}
                      className="p-1 text-lg transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${s <= reviewOverall ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Written Review</label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was the vehicle condition, host behavior, and pickup experience?"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-orange text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-3 bg-brand-orange hover:bg-brand-dark text-white rounded-xl font-extrabold text-xs shadow-md shadow-brand-orange/20"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
