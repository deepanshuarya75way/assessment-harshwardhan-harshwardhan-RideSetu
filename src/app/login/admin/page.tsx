'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        throw new Error(res.error || 'Admin authentication failed.');
      }
      router.push('/ops/dashboard');
    } catch (err: any) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black font-heading text-white">
            RideSetu Operations
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Secure marketplace operations & governance.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-300 block font-extrabold">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ridesetu.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-emerald-500 text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 block font-extrabold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-emerald-500 text-white outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Admin Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-white/10 pt-4 text-center text-xs text-slate-400 space-y-2">
          <div>
            <Link href="/login" className="text-slate-500 hover:text-slate-300 font-semibold">
              ← Back to Portal Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
