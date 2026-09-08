'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Initial status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white py-2 px-4 shadow-lg text-center animate-fade-in text-xs font-extrabold flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
        <span>You are offline. Some booking, KYC and payment features require an active internet connection.</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white py-2 px-4 shadow-lg text-center animate-fade-in text-xs font-extrabold flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Back online. Your mountain rental portal is synchronized.</span>
      </div>
    );
  }

  return null;
};

export default NetworkStatus;
