'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Download, X, Sparkles, ShieldCheck } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if dismissed previously within the last 7 days
    const dismissedTimestamp = localStorage.getItem('ridesetu_pwa_dismissed');
    if (dismissedTimestamp) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 3 seconds after load to show non-intrusively
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ridesetu_pwa_dismissed', Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 animate-fade-in-up">
      <div className="bg-navy-950/95 backdrop-blur-xl border border-white/15 p-4 sm:p-5 rounded-3xl shadow-2xl text-white space-y-3 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-orange/30 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-orange/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-white text-sm font-heading">Install RideSetu</h4>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Faster booking & offline roadside assistance</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Install RideSetu on your home screen for quick access to your verified rides, digital KYC certificates, and 24/7 mountain SOS.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-orange/30 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
