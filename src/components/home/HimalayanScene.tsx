'use client';

import React from 'react';
import MountainLayers from './MountainLayers';
import RiderAnimation from './RiderAnimation';

export const HimalayanScene: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Deep Himalayan Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070D1E] via-[#0B1528] to-[#0A1020]" />

      {/* 2. Soft Drifting Clouds (Upper Sky) */}
      <div className="absolute top-[8%] left-0 w-[200%] flex justify-around opacity-30 animate-cloud-drift pointer-events-none">
        <svg width="180" height="60" viewBox="0 0 180 60" fill="none">
          <path
            d="M20 45 Q35 15 65 25 Q85 5 115 15 Q145 10 160 30 Q175 40 160 50 Q130 55 20 45 Z"
            fill="#CBD5E1"
            className="blur-[6px]"
          />
        </svg>
        <svg width="240" height="70" viewBox="0 0 240 70" fill="none">
          <path
            d="M30 50 Q50 15 90 25 Q120 5 155 18 Q195 10 215 35 Q235 48 215 60 Q170 65 30 50 Z"
            fill="#E2E8F0"
            className="blur-[8px]"
          />
        </svg>
      </div>

      <div className="absolute top-[16%] left-0 w-[200%] flex justify-around opacity-20 animate-cloud-drift-slow pointer-events-none">
        <svg width="220" height="65" viewBox="0 0 220 65" fill="none">
          <path
            d="M25 50 Q45 20 80 30 Q110 10 145 22 Q180 15 200 40 Q220 52 200 62 Q160 68 25 50 Z"
            fill="#94A3B8"
            className="blur-[10px]"
          />
        </svg>
      </div>

      {/* 3. Mountain Eagles / Birds Silhouette Gliding Across Himalayan Valley */}
      <div className="absolute top-[18%] left-0 w-full h-20 animate-birds-flight pointer-events-none opacity-40">
        <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
          <path d="M0 8 Q7 0 14 6 Q21 0 28 8 Q21 4 14 10 Q7 4 0 8 Z" fill="#E2E8F0" />
        </svg>
      </div>
      <div className="absolute top-[24%] left-0 w-full h-20 animate-birds-flight-delayed pointer-events-none opacity-30">
        <svg width="20" height="10" viewBox="0 0 28 14" fill="none">
          <path d="M0 8 Q7 0 14 6 Q21 0 28 8 Q21 4 14 10 Q7 4 0 8 Z" fill="#CBD5E1" />
        </svg>
      </div>

      {/* 4. Ambient Mountain Mist Particles */}
      <div className="absolute inset-0 bg-himalayan-dots opacity-15 pointer-events-none" />

      {/* 5. Parallax Mountain Layers (Snow Peaks, Mid Ridge, Pine Forests) */}
      <MountainLayers />

      {/* 6. Animated Adventure Motorcycle Rider & Mountain Highway */}
      <RiderAnimation />

      {/* 7. Dark Contrast Mask & Vignette ensuring 100% WCAG AAA Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,10,24,0.65)_100%)] pointer-events-none" />
    </div>
  );
};

export default HimalayanScene;
