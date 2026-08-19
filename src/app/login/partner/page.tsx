'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function PartnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect authenticated partner directly to portal
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'VENDOR') {
        router.replace('/partner/dashboard');
      } else if (user.role === 'ADMIN') {
        router.replace('/ops/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Read error parameter if passed from callback failure
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        throw new Error(res.error || 'Partner sign in failed.');
      }
      window.location.href = '/partner/dashboard';
    } catch (err: any) {
      setError(err.message || 'Partner login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setConnectingGoogle(true);
    window.location.href = '/api/auth/google?role=VENDOR';
  };

  if (authLoading || (user && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg animate-pulse mx-auto">
            RS
          </div>
          <p className="text-xs text-slate-500 font-bold animate-pulse">Redirecting to Partner Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center mx-auto font-bold">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black font-heading text-slate-900">
            RideSetu Partner Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Grow your fleet. Manage every ride.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={connectingGoogle}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-800 text-xs font-bold shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99] min-h-[44px] disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{connectingGoogle ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">OR</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-700 block font-extrabold">Business Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@ridesetu.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] text-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 block font-extrabold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF6B00] text-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-black text-xs shadow-md shadow-[#FF6B00]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Signing In...' : 'Sign In to Partner Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500 space-y-2">
          <div>
            Want to list your fleet?{' '}
            <Link href="/register/partner" className="text-[#FF6B00] font-bold hover:underline">
              Register as Partner
            </Link>
          </div>
          <div>
            <Link href="/login" className="text-slate-400 hover:text-slate-600 font-semibold">
              ← Back to Portal Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-bold text-lg animate-pulse">RS</div></div>}>
      <PartnerLoginForm />
    </React.Suspense>
  );
}
