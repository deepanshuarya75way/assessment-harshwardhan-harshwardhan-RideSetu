'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import CustomerAuthCard from '@/components/auth/CustomerAuthCard';
import { X, Lock, Mail, User, Phone, Store, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'LOGIN' | 'REGISTER_CUSTOMER' | 'REGISTER_VENDOR';
  redirectUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'LOGIN',
  redirectUrl,
}) => {
  const { user, register } = useAuth();
  const [tab, setTab] = useState<'CUSTOMER' | 'REGISTER_VENDOR'>(
    initialTab === 'REGISTER_VENDOR' ? 'REGISTER_VENDOR' : 'CUSTOMER'
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Vendor form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Rishikesh');
  const [rentalLicenseNumber, setRentalLicenseNumber] = useState('');

  // Auto close modal if user becomes authenticated
  React.useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  if (!isOpen) return null;

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register({
        name,
        email,
        phone,
        password,
        role: 'VENDOR',
        businessName,
        city,
        rentalLicenseNumber,
      });

      if (!res.success) {
        setError(res.error || 'Vendor onboarding application failed.');
      } else {
        onClose();
        window.location.href = '/partner/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong during partner onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Selector Header */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold pt-2 px-2">
          <button
            onClick={() => {
              setTab('CUSTOMER');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-all border-b-2 font-heading ${
              tab === 'CUSTOMER'
                ? 'border-brand-orange text-brand-orange bg-white rounded-t-2xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Rider Account
          </button>
          <button
            onClick={() => {
              setTab('REGISTER_VENDOR');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-all border-b-2 font-heading ${
              tab === 'REGISTER_VENDOR'
                ? 'border-amber-500 text-amber-600 bg-white rounded-t-2xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Partner Join
          </button>
        </div>

        {/* Modal Body */}
        {tab === 'CUSTOMER' ? (
          <div className="p-2 sm:p-4">
            <CustomerAuthCard
              initialMode={initialTab === 'REGISTER_CUSTOMER' ? 'OTP' : 'PASSWORD'}
              redirectUrl={redirectUrl}
            />
          </div>
        ) : (
          <div className="p-6 space-y-4 text-slate-900 font-sans">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black font-heading text-slate-900">
                Partner Registration
              </h3>
              <p className="text-xs text-slate-500">
                Join RideSetu as a verified vehicle rental partner
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVendorSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Owner / Contact Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Business / Fleet Name</label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Himalayan Moto Rentals"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  >
                    <option value="Rishikesh">Rishikesh</option>
                    <option value="Mussoorie">Mussoorie</option>
                    <option value="Dehradun">Dehradun</option>
                    <option value="Nainital">Nainital</option>
                    <option value="Haridwar">Haridwar</option>
                    <option value="Haldwani">Haldwani</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Rental License / Permit</label>
                  <input
                    type="text"
                    required
                    placeholder="UK-RSH-RENT-2024"
                    value={rentalLicenseNumber}
                    onChange={(e) => setRentalLicenseNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Business Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="partner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Mobile Phone (WhatsApp)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 text-slate-900 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Submit Partner Application'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
