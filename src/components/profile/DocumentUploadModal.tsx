'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, ShieldCheck, X, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploadModalProps {
  documentType: 'DRIVING_LICENCE' | 'AADHAAR';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentUploadModal({ documentType, isOpen, onClose, onSuccess }: DocumentUploadModalProps) {
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate max size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 5 MB.');
      setSelectedFile(null);
      return;
    }

    // Validate MIME types (JPG, JPEG, PNG, PDF)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Only JPG, PNG, or PDF document formats are supported.');
      setSelectedFile(null);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber || documentNumber.trim().length < 4) {
      setError('Please enter a valid document number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/customer/profile/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          documentNumber: documentNumber.trim(),
          documentFileUrl: `/uploads/${documentType.toLowerCase()}_${Date.now()}.jpg`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 space-y-0">
        <div className="p-5 bg-gradient-to-r from-navy-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">RideSetu Identity Vault</div>
            <h3 className="text-base font-black">
              Upload {documentType === 'DRIVING_LICENCE' ? 'Driving License' : 'Aadhaar Card'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {documentType === 'DRIVING_LICENCE' ? 'Driving License Number' : 'Aadhaar Number'}
            </label>
            <input
              type="text"
              placeholder={documentType === 'DRIVING_LICENCE' ? 'e.g. DL-1420110012345' : 'e.g. 1234-5678-9012'}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Upload Document File (Max 5 MB: JPG, PNG, PDF)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="w-full text-xs font-semibold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-navy-900 file:text-white hover:file:bg-black cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="truncate">{selectedFile.name}</span>
              <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Submit for Smart KYC Verification</span>
          </button>
        </form>
      </div>
    </div>
  );
}
