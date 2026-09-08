'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  FileCheck,
  Building2,
  User,
  CreditCard,
  X,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'SUSPEND' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      if (data.vendors) setVendors(data.vendors);
    } catch (err) {
      console.error('Ops vendors error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleExecuteAction = async () => {
    if (!selectedVendor || !reviewAction) return;

    if (
      (reviewAction === 'REJECT' || reviewAction === 'REQUEST_CHANGES' || reviewAction === 'SUSPEND') &&
      !actionReason.trim()
    ) {
      setActionError(`A mandatory reason is required for ${reviewAction.replace('_', ' ')}.`);
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError(null);

      const res = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: selectedVendor._id,
          action: reviewAction,
          reason: actionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update vendor status.');
      }

      setSelectedVendor(null);
      setReviewAction(null);
      setActionReason('');
      await loadVendors();
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const maskString = (str: string) => {
    if (!str) return 'Not Provided';
    if (str.length <= 4) return `••••${str}`;
    return `${str.substring(0, 2)}••••${str.substring(str.length - 4)}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-emerald-600" /> Partner Vendor Governance & Onboarding Review
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Inspect, audit, approve, or request changes on mobility partner applications and trade permits.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4 rounded-l-xl">Business Name</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">City Hub</th>
                <th className="py-3 px-4">Permit Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vendors.map((v) => {
                const status = v.verificationStatus || v.status || 'PENDING';
                return (
                  <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-heading">{v.businessName}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{v.ownerName} ({v.phone || v.email})</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{v.city || 'Rishikesh'}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-700 font-bold">{v.rentalLicenseNumber || 'PENDING'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedVendor(v)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 ml-auto min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Application</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Vendor Review Modal Drawer */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                  Partner Application Review
                </span>
                <h2 className="text-xl font-black font-heading text-slate-900">{selectedVendor.businessName}</h2>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
                {actionError}
              </div>
            )}

            {/* Application Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-extrabold text-[10px] uppercase">Account & Owner</span>
                <p className="text-slate-900 font-extrabold">{selectedVendor.ownerName}</p>
                <p className="text-slate-600">{selectedVendor.email}</p>
                <p className="text-slate-600">{selectedVendor.phone || 'No Phone'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-extrabold text-[10px] uppercase">Business Details</span>
                <p className="text-slate-900 font-extrabold">{selectedVendor.businessName} ({selectedVendor.businessType})</p>
                <p className="text-slate-600">License: {selectedVendor.rentalLicenseNumber || 'PENDING'}</p>
                <p className="text-slate-600">Address: {selectedVendor.address}, {selectedVendor.city}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-extrabold text-[10px] uppercase">KYC & Masked Data</span>
                <p className="text-slate-700 font-mono">GSTIN: {selectedVendor.gstNumber || 'None'}</p>
                <p className="text-slate-700 font-mono">Payout Ref: {maskString(selectedVendor.bankAccountReference)}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-extrabold text-[10px] uppercase">Current Application Status</span>
                <div><StatusBadge status={selectedVendor.verificationStatus || selectedVendor.status || 'PENDING'} /></div>
                {selectedVendor.rejectionReason && (
                  <p className="text-rose-700 font-medium mt-1">Notes: {selectedVendor.rejectionReason}</p>
                )}
              </div>
            </div>

            {/* Admin Action Controls */}
            {!reviewAction ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => setReviewAction('APPROVE')}
                  className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => setReviewAction('REQUEST_CHANGES')}
                  className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <AlertTriangle className="w-4 h-4" /> Request Changes
                </button>
                <button
                  onClick={() => setReviewAction('REJECT')}
                  className="py-3 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => setReviewAction('SUSPEND')}
                  className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 min-h-[44px]"
                >
                  Suspend
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">
                    Confirm Action: <strong className="uppercase text-[#FF6B00]">{reviewAction.replace('_', ' ')}</strong>
                  </span>
                  <button
                    onClick={() => setReviewAction(null)}
                    className="text-xs text-slate-500 hover:underline font-bold"
                  >
                    Cancel Action
                  </button>
                </div>

                {(reviewAction === 'REJECT' || reviewAction === 'REQUEST_CHANGES' || reviewAction === 'SUSPEND') && (
                  <div className="space-y-1">
                    <label className="text-slate-700 block text-xs font-bold">
                      Mandatory Reason / Notes for Vendor *
                    </label>
                    <textarea
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Explain what changes are needed or why this application was updated..."
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:border-[#FF6B00] outline-none"
                    />
                  </div>
                )}

                <button
                  onClick={handleExecuteAction}
                  disabled={actionSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {actionSubmitting ? 'Updating Status...' : 'Confirm Status Transition'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
