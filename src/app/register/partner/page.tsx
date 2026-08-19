'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Phone, Lock, User, Store, MapPin, FileText, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Rishikesh');
  const [rentalLicenseNumber, setRentalLicenseNumber] = useState('');

  // Verification State
  const [verificationMethod, setVerificationMethod] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [challengeId, setChallengeId] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // UI Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devNotice, setDevNotice] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (step === 3) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !businessName.trim() || !rentalLicenseNumber.trim()) {
      setError('Please fill in all business and personal details.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setStep(2);
  };

  const handleSendOtp = async (method: 'EMAIL' | 'SMS') => {
    setVerificationMethod(method);
    setError(null);
    setLoading(true);
    setDevNotice(null);

    try {
      const targetIdentifier = method === 'EMAIL' ? email.trim() : phone.trim();
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetIdentifier,
          method,
          purpose: 'SIGNUP',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      setChallengeId(data.challengeId);
      setTimerSeconds(data.expiresIn || 300);
      setResendCooldown(data.resendAvailableIn || 60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);

      if (data.devOtp) {
        setDevNotice(`[Development Mode] Your OTP code is: ${data.devOtp}`);
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error sending OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
    setOtpDigits(updated);

    if (value && index < 5) {
      const nextInput = document.getElementById(`partner-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      setOtpDigits(pasteData.split(''));
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const otp = otpDigits.join('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify OTP Challenge
      const targetIdentifier = verificationMethod === 'EMAIL' ? email.trim() : phone.trim();
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          identifier: targetIdentifier,
          otp,
          method: verificationMethod,
          purpose: 'SIGNUP',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Invalid verification code.');
      }

      // 2. Complete Partner Registration
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: 'VENDOR',
          businessName: businessName.trim(),
          city,
          destinationId: 'rishikesh-hub',
          rentalLicenseNumber: rentalLicenseNumber.trim(),
          signupChallengeId: challengeId,
          verificationMethod,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || 'Partner registration failed.');
      }

      setStep(4);
      setSuccessMsg('Verification successful! Account created under review. Redirecting to onboarding...');
      setTimeout(() => {
        router.push('/partner/onboarding');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification or registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Ride<span className="text-[#FF6B00]">Setu</span> Partner
            </h1>
          </Link>
          <p className="text-xs text-slate-400 mt-1">Vendor Fleet Operator Registration</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-100 h-1.5 w-full">
          <div
            className="bg-[#FF6B00] h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {devNotice && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs font-mono">
              {devNotice}
            </div>
          )}

          {/* STEP 1: Business Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Partner & Fleet Information</h2>
              <p className="text-sm text-slate-600 mb-4">Register your vehicle rental agency on RideSetu.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Business Name</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                    placeholder="Uttarakhand Wheels Pvt Ltd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Owner Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                      placeholder="Vikram Singh"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Operating City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                    >
                      <option value="Rishikesh">Rishikesh</option>
                      <option value="Dehradun">Dehradun</option>
                      <option value="Mussoorie">Mussoorie</option>
                      <option value="Haridwar">Haridwar</option>
                      <option value="Nainital">Nainital</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Trade / Rental License No.</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={rentalLicenseNumber}
                    onChange={(e) => setRentalLicenseNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                    placeholder="UK-RNT-2024-9988"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Business Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                      placeholder="vendor@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Business Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-[#FF6B00] hover:bg-[#e66000] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/20"
              >
                <span>Continue to OTP Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Verification Method */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to details</span>
                </button>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Select Verification Channel</h2>
                <p className="text-sm text-slate-600">Choose how to receive your 6-digit partner verification OTP.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleSendOtp('EMAIL')}
                  disabled={loading}
                  className="p-5 border-2 border-slate-200 hover:border-[#FF6B00] bg-slate-50 hover:bg-orange-50/30 rounded-2xl text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">Verify with Business Email</div>
                      <div className="text-xs text-slate-500">{email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => handleSendOtp('SMS')}
                  disabled={loading}
                  className="p-5 border-2 border-slate-200 hover:border-[#FF6B00] bg-slate-50 hover:bg-orange-50/30 rounded-2xl text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">Verify with Business Mobile</div>
                      <div className="text-xs text-slate-500">{phone}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {loading && (
                <div className="text-center text-slate-500 text-sm flex items-center justify-center gap-2 pt-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FF6B00]" />
                  <span>Sending verification code...</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: OTP Input */}
          {step === 3 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div>
                <button
                  onClick={() => setStep(2)}
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change verification channel</span>
                </button>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Verify Partner Account</h2>
                <p className="text-sm text-slate-600">
                  Enter the 6-digit verification code sent to{' '}
                  <span className="font-semibold text-slate-900">
                    {verificationMethod === 'EMAIL' ? email : phone}
                  </span>
                </p>
              </div>

              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`partner-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        const prev = document.getElementById(`partner-otp-${idx - 1}`);
                        prev?.focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/20 focus:outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  OTP expires in:{' '}
                  <span className="font-mono font-bold text-slate-900">{formatTime(timerSeconds)}</span>
                </div>
                <div>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(verificationMethod)}
                      className="font-bold text-[#FF6B00] hover:underline"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span>Resend in {resendCooldown}s</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#e66000] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Partner...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify & Submit Partner Application</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Partner Account Verified!</h2>
              <p className="text-sm text-slate-600">{successMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
