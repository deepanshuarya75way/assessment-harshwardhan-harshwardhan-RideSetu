'use client';

import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle2, AlertCircle, Clock, Upload, Eye, Lock } from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';

interface DocumentVaultProps {
  profile: any;
  onRefresh: () => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ profile, onRefresh }) => {
  const [activeModalDoc, setActiveModalDoc] = useState<'DRIVING_LICENCE' | 'AADHAAR' | null>(null);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  const dl = profile?.documents?.drivingLicense;
  const aadhaar = profile?.documents?.aadhaar;

  const dlStatus = dl?.status || profile?.drivingLicenseStatus || 'NOT_STARTED';
  const aadhaarStatus = aadhaar?.status || profile?.aadhaarStatus || (profile?.aadhaarNumberMasked ? 'PENDING' : 'NOT_STARTED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-[11px] flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
          </span>
        );
      case 'UNDER_REVIEW':
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[11px] flex items-center gap-1 shadow-sm">
            <Clock className="w-3.5 h-3.5" /> PENDING VERIFICATION
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-[11px] flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-700 font-extrabold text-[11px] flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" /> EXPIRED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px]">
            NOT ADDED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-navy-950 font-heading flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-orange" />
            KYC & Identity Document Vault
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Encrypted document vault for fast, single-click rider verification.
          </p>
        </div>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driving License Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-950">Driving License</h3>
                  <span className="text-[11px] font-semibold text-slate-400">Required for vehicle rentals</span>
                </div>
              </div>
              {getStatusBadge(dlStatus)}
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">License Number</div>
              <div className="font-mono text-sm font-black text-navy-900 tracking-wider">
                {dl?.maskedNumber || profile?.drivingLicenseNumberMasked || 'Not Provided'}
              </div>
            </div>

            {dl?.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Rejection Reason: {dl.rejectionReason}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModalDoc('DRIVING_LICENCE')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-navy-950 hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-brand-orange" />
              <span>{dlStatus === 'NOT_STARTED' ? 'ADD DRIVING LICENSE' : 'UPDATE DOCUMENT'}</span>
            </button>
            {dl && (
              <button
                type="button"
                onClick={() => setViewingDoc(dl)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>VIEW</span>
              </button>
            )}
          </div>
        </div>

        {/* Aadhaar Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-950">Aadhaar Card</h3>
                  <span className="text-[11px] font-semibold text-slate-400">Government Identity Proof</span>
                </div>
              </div>
              {getStatusBadge(aadhaarStatus)}
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Masked Aadhaar Number</span>
              </div>
              <div className="font-mono text-sm font-black text-navy-900 tracking-wider">
                {aadhaar?.maskedNumber || profile?.aadhaarNumberMasked || 'XXXX-XXXX-XXXX'}
              </div>
            </div>

            {aadhaar?.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Rejection Reason: {aadhaar.rejectionReason}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModalDoc('AADHAAR')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-navy-950 hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-brand-orange" />
              <span>{aadhaarStatus === 'NOT_STARTED' ? 'ADD AADHAAR' : 'UPDATE DOCUMENT'}</span>
            </button>
            {aadhaar && (
              <button
                type="button"
                onClick={() => setViewingDoc(aadhaar)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>VIEW</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {activeModalDoc && (
        <DocumentUploadModal
          documentType={activeModalDoc}
          isOpen={!!activeModalDoc}
          onClose={() => setActiveModalDoc(null)}
          onSuccess={() => {
            setActiveModalDoc(null);
            onRefresh();
          }}
        />
      )}

      {/* Document View Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider">
                Document Details
              </h3>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Document Type</span>
                <span className="font-bold text-navy-950">{viewingDoc.documentType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Masked Reference</span>
                <span className="font-mono font-bold text-navy-950">{viewingDoc.maskedNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Verification Status</span>
                <span className="font-bold">{getStatusBadge(viewingDoc.status)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Submitted Date</span>
                <span className="font-bold text-slate-700">
                  {viewingDoc.submittedAt ? new Date(viewingDoc.submittedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Secure Storage Verified
              </div>
              <p>Document raw images are encrypted and restricted to authorized background verification only.</p>
            </div>

            <button
              type="button"
              onClick={() => setViewingDoc(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
