'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Building2, ShieldCheck, Lock, CheckCircle2, AlertTriangle, ArrowLeft, Save } from 'lucide-react';

export default function PartnerPayoutSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    beneficiaryName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: 'CURRENT',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/settings/payouts');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setForm({
          beneficiaryName: data.profile.beneficiaryName || '',
          accountNumber: '', // Do not populate full account number for security
          ifscCode: data.profile.ifscCode || '',
          bankName: data.profile.bankName || '',
          accountType: data.profile.accountType || 'CURRENT',
        });
      }
    } catch (err) {
      console.error('Payout settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.beneficiaryName || !form.accountNumber || !form.ifscCode) {
      setMessage({ type: 'error', text: 'Beneficiary Name, Account Number, and IFSC Code are required.' });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/vendor/settings/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Bank account details updated successfully.' });
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update bank details.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error updating bank details.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-16">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/partner/earnings" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black font-heading text-slate-900">Vendor Bank Account & Payout Settings</h1>
            <p className="text-xs text-slate-600 font-medium">Configure beneficiary bank account details for direct settlement transfers.</p>
          </div>
        </div>
      </div>

      {/* Security & Verification Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
        <div>
          <strong className="font-black text-amber-950 block text-xs">Development Environment Notice (TEST MODE):</strong>
          <p className="mt-0.5 leading-relaxed font-medium">
            Bank verification is not configured for this development environment. Payout settlements are simulated as internal state transitions.
          </p>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          {message && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {profile?.maskedAccountNumber && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Registered Account</span>
                <span className="text-sm font-black text-slate-900 font-mono">{profile.maskedAccountNumber}</span>
                <span className="text-[11px] text-slate-500 font-medium block">IFSC: {profile.ifscCode} | {profile.bankName}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">
                <Lock className="w-3 h-3" /> PENDING_VERIFICATION
              </div>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-black text-slate-900 mb-1">Beneficiary / Account Holder Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Singh / Himalayan Mobility Services"
                value={form.beneficiaryName}
                onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-black text-slate-900 mb-1">Bank Account Number * (Encrypted & Masked)</label>
              <input
                type="password"
                required
                placeholder="Enter complete bank account number"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full text-xs font-mono font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-black text-slate-900 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={form.ifscCode}
                  onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-mono font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC BankTapovan Branch"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-900 mb-1">Account Type</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              >
                <option value="CURRENT">Current Account</option>
                <option value="SAVINGS">Savings Account</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Details...' : 'Save Bank Details'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
