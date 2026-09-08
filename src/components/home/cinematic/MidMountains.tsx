'use client';

import React from 'react';

interface MidMountainsProps {
  offsetX?: number;
}

export const MidMountains: React.FC<MidMountainsProps> = ({ offsetX = 0 }) => {
  return (
    <div
      className="absolute bottom-[22%] sm:bottom-[18%] left-0 w-full max-w-full h-[36%] sm:h-[42%] pointer-events-none select-none overflow-hidden transition-transform duration-300 ease-out"
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      <svg
        className="w-[125%] -left-[12%] relative h-full object-cover opacity-95 drop-shadow-[0_16px_32px_rgba(7,20,38,0.4)]"
        viewBox="0 0 1600 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="midMountainGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#244A52" />
            <stop offset="50%" stopColor="#173F3A" />
            <stop offset="100%" stopColor="#0E2824" />
          </linearGradient>

          <linearGradient id="midRidgeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Back Mid-Ridge */}
        <path
          d="M0,220 Q180,140 380,180 Q560,90 780,160 Q960,110 1180,170 Q1380,80 1600,190 L1600,400 L0,400 Z"
          fill="#1C383E"
          opacity="0.85"
        />

        {/* Foreground Mid-Ridge */}
        <path
          d="M0,160 Q220,240 440,150 Q660,260 880,130 Q1100,240 1340,140 Q1480,210 1600,150 L1600,400 L0,400 Z"
          fill="url(#midMountainGrad1)"
        />

        {/* Golden Hour Rim Light on Mountain Pass Ridge */}
        <path
          d="M440,150 Q660,260 880,130 Q1100,240 1340,140"
          stroke="url(#midRidgeGlow)"
          strokeWidth="3"
          fill="none"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};

export default MidMountains;
