'use client';

import React from 'react';

interface SnowMountainsProps {
  offsetX?: number;
}

export const SnowMountains: React.FC<SnowMountainsProps> = ({ offsetX = 0 }) => {
  return (
    <div
      className="absolute bottom-[30%] sm:bottom-[28%] left-0 w-full max-w-full h-[40%] sm:h-[48%] pointer-events-none select-none overflow-hidden transition-transform duration-300 ease-out"
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      <svg
        className="w-[120%] -left-[10%] relative h-full object-cover opacity-90 drop-shadow-[0_12px_24px_rgba(11,19,43,0.35)]"
        viewBox="0 0 1600 500"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="snowPeakGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="40%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <linearGradient id="snowCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="sunsetRimLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* --- Back Mountain Ridge Silhouette --- */}
        <polygon
          points="0,320 180,240 340,300 520,160 680,280 880,120 1060,260 1260,150 1440,270 1600,200 1600,500 0,500"
          fill="#1E293B"
          opacity="0.8"
        />

        {/* --- Main High Snow Peak (Left - Trishul silhouette) --- */}
        <polygon
          points="200,480 460,110 720,480"
          fill="url(#snowPeakGrad1)"
        />
        {/* Trishul Snow Cap & Glaciers */}
        <polygon
          points="460,110 400,210 430,200 460,230 490,195 530,220"
          fill="url(#snowCapGrad)"
        />
        <polygon
          points="460,110 490,195 530,220 720,480 460,480"
          fill="#0F172A"
          opacity="0.35"
        />

        {/* --- Main High Snow Peak (Center - Nanda Devi silhouette) --- */}
        <polygon
          points="580,480 880,80 1180,480"
          fill="url(#snowPeakGrad1)"
        />
        {/* Nanda Devi Snow Cap & Crevasses */}
        <polygon
          points="880,80 800,200 840,190 880,225 930,185 970,215"
          fill="url(#snowCapGrad)"
        />
        {/* Sunset Ridge Rim Light */}
        <polygon
          points="880,80 800,200 840,190 880,225"
          fill="url(#sunsetRimLight)"
        />
        <polygon
          points="880,80 930,185 970,215 1180,480 880,480"
          fill="#0F172A"
          opacity="0.4"
        />

        {/* --- Secondary Peak (Right - Panchachuli silhouette) --- */}
        <polygon
          points="1060,480 1300,130 1540,480"
          fill="url(#snowPeakGrad1)"
        />
        <polygon
          points="1300,130 1240,210 1275,200 1300,230 1335,195 1370,215"
          fill="url(#snowCapGrad)"
        />
        <polygon
          points="1300,130 1335,195 1370,215 1540,480 1300,480"
          fill="#0F172A"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};

export default SnowMountains;
