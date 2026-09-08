'use client';

import React, { useState, useEffect } from 'react';
import HimalayanScene from './HimalayanScene';

export const HimalayanAnimation: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasRenderError, setHasRenderError] = useState(false);

  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // Fallback silently if media query is unsupported
    }
  }, []);

  // Safe error boundary catch
  if (hasRenderError) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-navy-950 via-[#0a1228] to-navy-950 pointer-events-none opacity-90" />
    );
  }

  return (
    <div
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${
        prefersReducedMotion ? 'reduce-motion-static' : ''
      }`}
      aria-hidden="true"
    >
      <HimalayanScene />
    </div>
  );
};

export default HimalayanAnimation;
