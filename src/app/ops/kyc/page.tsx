'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye, FileText } from 'lucide-react';

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Document image is blurry or illegible');

  const fetchKycSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ops/kyc');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load KYC submissions');
      }

      setSubmissions(data.submissions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycSubmissions();
  }, []);

  const handleReview = async (kycId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/ops/kyc/${kycId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'KYC review failed');
      }

      setReviewingId(null);
      fetchKycSubmissions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">RideSetu Operations</div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Identity Verification Console</h1>
          </div>

          <button
            type="button"
            onClick={() => fetchKycSubmissions()}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Submissions</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading KYC queue...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 max-w-md mx-auto">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900">Zero Pending Submissions</h3>
            <p className="text-xs text-slate-500 font-semibold">All customer identity documents are verified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub._id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      STATUS: {sub.status}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      {sub.documentType?.replace('_', ' ')} — {sub.maskedLicenceNumber}
                    </h3>
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-500">
                    Customer: {sub.userId?.name || 'Rider'} ({sub.userId?.phone})
                  </div>
                </div>

                {reviewingId === sub._id ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-rose-900">Reason for Rejection</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(sub._id, 'REJECT')}
                        className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewingId(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleReview(sub._id, 'APPROVE')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Approve & Verify DL
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewingId(sub._id)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Reject Submission
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
