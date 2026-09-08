'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Lock, Mail, Phone, ArrowRight, User as UserIcon, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// DEVELOPMENT TEST ACCOUNTS - REMOVE BEFORE PRODUCTION DEPLOYMENT

export type AuthCardMode = 'PASSWORD' | 'OTP' | 'FORGOT_PASSWORD';

interface CustomerAuthCardProps {
  initialMode?: AuthCardMode;
  redirectUrl?: string;
}

export default function CustomerAuthCard({ initialMode = 'PASSWORD', redirectUrl }: CustomerAuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();

  const [mode, setMode] = useState<AuthCardMode>(initialMode);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 1. Password Login state (Primary)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // 2. Phone OTP state (Secondary)
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // New Customer Name state
  const [requireNameStep, setRequireNameStep] = useState(false);
  const [customerName, setCustomerName] = useState('');

  // 3. Forgot Password state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryOtpDigits, setRecoveryOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [recoveryOtpSent, setRecoveryOtpSent] = useState(false);
  const [recoveryChallengeId, setRecoveryChallengeId] = useState('');
  const [recoveryResendTimer, setRecoveryResendTimer] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Google Login loading
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // OTP Input Box Refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recoveryOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-redirect authenticated user directly to their designated portal
  useEffect(() => {
    if (!authLoading && user) {
      const target = redirectUrl || (user.role === 'VENDOR' ? '/partner/dashboard' : user.role === 'ADMIN' ? '/ops/dashboard' : '/dashboard');
      router.replace(target);
    }
  }, [user, authLoading, router, redirectUrl]);

  // Read error parameter from OAuth callbacks
  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam) {
      if (errParam === 'google_access_denied') {
        setError('Google sign-in was cancelled or access was denied.');
      } else if (errParam === 'invalid_oauth_state') {
        setError('Security state verification failed. Please try signing in again.');
      } else {
        setError(decodeURIComponent(errParam));
      }
    }
  }, [searchParams]);

  // Resend Timer Countdown for OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (recoveryResendTimer <= 0) return;
    const interval = setInterval(() => {
      setRecoveryResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [recoveryResendTimer]);

  const handleGoogleLogin = () => {
    setConnectingGoogle(true);
    window.location.href = '/api/auth/google?role=CUSTOMER';
  };

  // Format masked phone for UI
  const formatMaskedPhone = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.length >= 10) {
      const last4 = clean.slice(-4);
      return `+91 ******${last4}`;
    }
    return num;
  };

  // DEVELOPMENT TEST ACCOUNT QUICK FILL (Preserved for QA & testing phase)
  // DEVELOPMENT ONLY - REMOVE BEFORE PRODUCTION DEPLOYMENT
  const fillDemoCreds = (type: 'CUSTOMER' | 'VENDOR' | 'ADMIN') => {
    if (type === 'CUSTOMER') {
      setLoginIdentifier('customer@ridesetu.demo');
      setLoginPassword('customer123');
    } else if (type === 'VENDOR') {
      setLoginIdentifier('vendor@ridesetu.demo');
      setLoginPassword('vendor123');
    } else {
      setLoginIdentifier('admin@ridesetu.demo');
      setLoginPassword('admin123');
    }
  };

  // ----------------------------------------------------
  // OTP HANDLERS
  // ----------------------------------------------------
  const handleSendOtp = async (purpose: 'SIGNUP' | 'PASSWORD_RESET' = 'SIGNUP') => {
    setError('');
    setMessage('');

    const targetNum = purpose === 'PASSWORD_RESET' ? recoveryIdentifier : phone;
    const cleanDigits = targetNum.replace(/\D/g, '');

    if (cleanDigits.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    if (purpose === 'SIGNUP') {
      setSendingOtp(true);
    } else {
      setResettingPassword(true);
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetNum,
          method: 'SMS',
          purpose,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to send verification code. Please try again.');
      }

      if (purpose === 'SIGNUP') {
        setChallengeId(data.challengeId);
        setOtpSent(true);
        setResendTimer(data.resendAvailableIn || 60);
        setMessage(`Verification code sent to ${formatMaskedPhone(targetNum)}.`);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        setRecoveryChallengeId(data.challengeId);
        setRecoveryOtpSent(true);
        setRecoveryResendTimer(data.resendAvailableIn || 60);
        setMessage(`Verification code sent to ${formatMaskedPhone(targetNum)}.`);
        setTimeout(() => recoveryOtpInputRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to send verification code.');
    } finally {
      setSendingOtp(false);
      setResettingPassword(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string, isRecovery = false) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const targetDigits = isRecovery ? [...recoveryOtpDigits] : [...otpDigits];
    targetDigits[index] = digit;

    if (isRecovery) {
      setRecoveryOtpDigits(targetDigits);
    } else {
      setOtpDigits(targetDigits);
    }

    // Auto move to next input box
    if (digit && index < 5) {
      const refs = isRecovery ? recoveryOtpInputRefs : otpInputRefs;
      refs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isRecovery = false) => {
    if (e.key === 'Backspace') {
      const targetDigits = isRecovery ? recoveryOtpDigits : otpDigits;
      if (!targetDigits[index] && index > 0) {
        const refs = isRecovery ? recoveryOtpInputRefs : otpInputRefs;
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>, isRecovery = false) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split('');
    const newDigits = Array(6).fill('');
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });

    if (isRecovery) {
      setRecoveryOtpDigits(newDigits);
      recoveryOtpInputRefs.current[Math.min(digits.length, 5)]?.focus();
    } else {
      setOtpDigits(newDigits);
      otpInputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleVerifyOtpLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/otp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          phone,
          otp: otpCode,
          name: customerName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP. Please try again.');
      }

      if (data.requireName) {
        setRequireNameStep(true);
        setMessage('Mobile number verified! Please enter your full name to complete registration.');
        return;
      }

      // Success -> Auto redirect via AuthContext reload
      window.location.href = redirectUrl || '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ----------------------------------------------------
  // PASSWORD LOGIN HANDLER (PRIMARY)
  // ----------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!loginIdentifier || !loginPassword) {
      setError('Please enter your User ID and password.');
      return;
    }

    setSubmittingPassword(true);

    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        throw new Error(res.error || 'Invalid User ID or password.');
      }
      const isVendor = loginIdentifier.includes('vendor');
      const isAdmin = loginIdentifier.includes('admin');
      const target = redirectUrl || (isVendor ? '/partner/dashboard' : isAdmin ? '/ops/dashboard' : '/dashboard');
      window.location.href = target;
    } catch (err: any) {
      setError(err.message || 'Invalid User ID or password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // ----------------------------------------------------
  // FORGOT PASSWORD HANDLER
  // ----------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const otpCode = recoveryOtpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setResettingPassword(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: recoveryChallengeId,
          identifier: recoveryIdentifier,
          method: recoveryIdentifier.includes('@') ? 'EMAIL' : 'SMS',
          otp: otpCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      window.location.href = redirectUrl || '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (authLoading || (user && !authLoading)) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold text-lg animate-spin mx-auto">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-500 font-bold">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-6 text-slate-900 font-sans">
      {/* Brand & Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-orange/30">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black font-heading text-slate-900">
            Ride<span className="text-brand-orange">Setu</span>
          </span>
        </Link>

        <h1 className="text-xl font-extrabold font-heading text-slate-900 mt-1">
          {mode === 'PASSWORD' ? 'Welcome Back' : mode === 'OTP' ? 'Phone Sign In' : 'Reset Your Password'}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {mode === 'PASSWORD'
            ? 'Sign in with your User ID & password'
            : mode === 'OTP'
            ? 'Quick sign in via mobile number'
            : 'Recover access using verification code'}
        </p>
      </div>

      {/* Global Banners */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-shake">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold leading-relaxed">
          {message}
        </div>
      )}

      {/* MODE 1: PRIMARY LOGIN (USER ID + PASSWORD) */}
      {mode === 'PASSWORD' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-slate-700 block text-xs font-extrabold">User ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Email address or Mobile number"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-slate-700 block text-xs font-extrabold">Password</label>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMessage('');
                  setMode('FORGOT_PASSWORD');
                }}
                className="text-brand-orange font-bold text-[11px] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingPassword || !loginIdentifier || !loginPassword}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white font-black text-xs shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {submittingPassword ? 'Signing In...' : 'SIGN IN'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-extrabold text-slate-400 absolute">OR</span>
          </div>

          {/* SECONDARY LOGIN OPTION: PHONE OTP */}
          <button
            type="button"
            onClick={() => {
              setError('');
              setMessage('');
              setMode('OTP');
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Phone className="w-4 h-4 text-brand-orange" />
            <span>Sign in with Phone Number</span>
          </button>

          {/* GOOGLE LOGIN */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={connectingGoogle}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm flex items-center justify-center gap-2.5 transition-all min-h-[44px] disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{connectingGoogle ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* DEVELOPMENT QUICK FILL DEMO ACCOUNTS */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="pt-3 border-t border-slate-100 text-xs">
              <p className="text-[11px] text-slate-500 font-bold mb-2 text-center">Development Test Accounts:</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => fillDemoCreds('CUSTOMER')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-brand-orange/10 border border-slate-200 rounded-xl text-slate-700 text-[11px] font-bold transition-colors"
                >
                  👤 Customer
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('VENDOR')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] font-bold transition-colors"
                >
                  🏪 Vendor
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('ADMIN')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] font-bold transition-colors"
                >
                  🛡️ Admin
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* MODE 2: SECONDARY LOGIN (PHONE OTP) */}
      {mode === 'OTP' && (
        <div className="space-y-4">
          {!otpSent ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 block text-xs font-extrabold">Mobile Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 font-extrabold text-xs select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="82103 26930"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSendOtp('SIGNUP')}
                disabled={sendingOtp || phone.replace(/\D/g, '').length < 10}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white font-black text-xs shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-700 font-extrabold">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setRequireNameStep(false);
                      setOtpDigits(Array(6).fill(''));
                    }}
                    className="text-brand-orange font-bold text-[11px] hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={(e) => handleOtpPaste(e)}
                      className="w-10 h-12 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-black bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-slate-900 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-1">
                  <span>OTP sent to {formatMaskedPhone(phone)}</span>
                  {resendTimer > 0 ? (
                    <span className="text-slate-400">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp('SIGNUP')}
                      className="text-brand-orange hover:underline font-extrabold"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: New Customer Name Input */}
              {requireNameStep && (
                <div className="space-y-1 pt-2 animate-fade-in-up">
                  <label className="text-slate-700 block text-xs font-extrabold">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingOtp || otpDigits.join('').length < 6 || (requireNameStep && !customerName.trim())}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white font-black text-xs shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {verifyingOtp ? 'Verifying...' : requireNameStep ? 'Complete Registration' : 'Verify & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setMode('PASSWORD');
              }}
              className="text-slate-600 hover:text-brand-orange font-extrabold text-xs transition-colors"
            >
              ← Back to Sign In with Password
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: FORGOT PASSWORD */}
      {mode === 'FORGOT_PASSWORD' && (
        <div className="space-y-4">
          {!recoveryOtpSent ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 block text-xs font-extrabold">Mobile Number or Email</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="82103 26930 or user@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSendOtp('PASSWORD_RESET')}
                disabled={resettingPassword || !recoveryIdentifier.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white font-black text-xs shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {resettingPassword ? 'Sending OTP...' : 'Send Recovery OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-700 font-extrabold">Enter 6-Digit Verification Code</label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryOtpSent(false);
                      setRecoveryOtpDigits(Array(6).fill(''));
                    }}
                    className="text-brand-orange font-bold text-[11px] hover:underline"
                  >
                    Change Identifier
                  </button>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {recoveryOtpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        recoveryOtpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value, true)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e, true)}
                      onPaste={(e) => handleOtpPaste(e, true)}
                      className="w-10 h-12 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-black bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 text-slate-900 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-1">
                  <span>Code sent to {recoveryIdentifier}</span>
                  {recoveryResendTimer > 0 ? (
                    <span className="text-slate-400">Resend in {recoveryResendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp('PASSWORD_RESET')}
                      className="text-brand-orange hover:underline font-extrabold"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block text-xs font-extrabold">New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block text-xs font-extrabold">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-orange text-slate-900 text-xs font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resettingPassword || recoveryOtpDigits.join('').length < 6 || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-600 hover:to-brand-orange text-white font-black text-xs shadow-md shadow-brand-orange/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {resettingPassword ? 'Resetting Password...' : 'Reset Password & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setMode('PASSWORD');
              }}
              className="text-slate-600 hover:text-brand-orange font-extrabold text-xs transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500 space-y-2">
        <div>
          <Link href="/login" className="text-slate-400 hover:text-slate-600 font-semibold">
            ← Select Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
