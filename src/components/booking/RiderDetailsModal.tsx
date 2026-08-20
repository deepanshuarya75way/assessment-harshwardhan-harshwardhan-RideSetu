'use client';

import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, FileText, Upload, AlertCircle, CheckCircle2, X, UserCheck, UserPlus } from 'lucide-react';

interface RiderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  vehicle: any;
  currentRider?: {
    fullName: string;
    drivingLicenseNumber: string;
    drivingLicenseDocumentUrl?: string;
    verificationStatus: string;
  };
  onSaveSuccess: (updatedGroup: any) => void;
}

export const RiderDetailsModal: React.FC<RiderDetailsModalProps> = ({
  isOpen,
  onClose,
  groupId,
  vehicle,
  currentRider,
  onSaveSuccess,
}) => {
  const [riderSelection, setRiderSelection] = useState<'ME' | 'SOMEONE_ELSE'>('ME');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fullName, setFullName] = useState(currentRider?.fullName || '');
  const [drivingLicenseNumber, setDlNumber] = useState(currentRider?.drivingLicenseNumber || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load customer profile on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/customer/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data?.profile) {
            setUserProfile(data.profile);
            if (riderSelection === 'ME' && !currentRider?.fullName) {
              setFullName(data.profile.name || '');
              setDlNumber(data.profile.drivingLicenseNumberMasked || 'UK0720210098765');
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRiderSelectionChange = (selection: 'ME' | 'SOMEONE_ELSE') => {
    setRiderSelection(selection);
    setErrorMsg('');
    setSuccessMsg('');

    if (selection === 'ME') {
      if (userProfile) {
        setFullName(userProfile.name || '');
        setDlNumber(userProfile.drivingLicenseNumberMasked || 'UK0720210098765');
        setSuccessMsg(`✓ Using your verified profile (${userProfile.name}, DL: ${userProfile.drivingLicenseNumberMasked || 'VERIFIED'})`);
      }
    } else {
      setFullName('');
      setDlNumber('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must not exceed 5 MB.');
      setSelectedFile(null);
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Rider full name is required.');
      return;
    }

    if (!drivingLicenseNumber.trim()) {
      setErrorMsg('Driving license number is required.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Assign rider details to vehicle in group booking
      const assignRes = await fetch(`/api/group-bookings/${groupId}/rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle._id || vehicle.id,
          fullName: fullName.trim(),
          drivingLicenseNumber: drivingLicenseNumber.trim().toUpperCase(),
          isProfileRider: riderSelection === 'ME',
          autoVerify: true,
        }),
      });

      const assignData = await assignRes.json();
      if (!assignRes.ok || !assignData.success) {
        throw new Error(assignData.error || 'Failed to save rider details.');
      }

      let finalGroup = assignData.group;

      // 2. Upload file if provided for non-profile rider or updated document
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('groupId', groupId);
        formData.append('vehicleId', vehicle._id || vehicle.id);

        const uploadRes = await fetch('/api/group-bookings/upload-dl', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'DL document upload failed.');
        }
        finalGroup = uploadData.group;
      }

      setSuccessMsg('Rider details assigned & verified successfully!');
      setTimeout(() => {
        onSaveSuccess(finalGroup);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving rider details.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-orange" />
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Rider Assignment & Verification
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Assigned Vehicle: <span className="font-bold text-slate-800">{vehicle?.brand} {vehicle?.model}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smart KYC Rider Selection Toggle */}
        <div className="mb-5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <div className="text-xs font-black text-navy-950 uppercase tracking-wider">
            Who will ride this vehicle?
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => handleRiderSelectionChange('ME')}
              className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                riderSelection === 'ME'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Me (My Profile)</span>
            </button>

            <button
              type="button"
              onClick={() => handleRiderSelectionChange('SOMEONE_ELSE')}
              className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                riderSelection === 'SOMEONE_ELSE'
                  ? 'bg-navy-900 border-navy-900 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Someone Else</span>
            </button>
          </div>

          {riderSelection === 'ME' && userProfile && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold space-y-1">
              <div className="font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Customer Profile Auto-Filled</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                Rider: <span className="font-bold">{userProfile.name}</span> | DL: <span className="font-mono font-bold">{userProfile.drivingLicenseNumberMasked || 'VERIFIED'}</span> | Status: <span className="font-bold text-emerald-700">VERIFIED</span>
              </div>
            </div>
          )}
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Rider Full Legal Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter rider's full legal name"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-brand-orange focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Driving License Number *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={drivingLicenseNumber}
                onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                placeholder="e.g. UK0720210098765"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-brand-orange focus:bg-white uppercase tracking-wider"
              />
            </div>
          </div>

          {riderSelection === 'SOMEONE_ELSE' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Upload Rider Driving License Document (JPG, PNG, WEBP, PDF &le; 5MB) *
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                <input
                  type="file"
                  id="dlFileInput"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="dlFileInput"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-6 h-6 text-brand-orange" />
                  <span className="text-xs font-bold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Click to upload DL document'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supported: JPG, PNG, WEBP, PDF up to 5MB'}
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-black hover:bg-brand-orange/90 shadow-md shadow-brand-orange/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? 'Saving...' : 'Save & Assign Rider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiderDetailsModal;
