'use client';

import React from 'react';

export const CloudLayer: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      {/* Layer 1: High Distant Clouds (Slow Drift) */}
      <div className="absolute top-[8%] left-0 w-[200%] flex justify-around opacity-35 animate-cloud-drift pointer-events-none">
        <svg width="340" height="90" viewBox="0 0 340 90" fill="none">
          <path
            d="M30 65 Q60 20 110 32 Q150 5 200 18 Q250 8 280 38 Q320 50 300 70 Q240 85 30 65 Z"
            fill="#FEF3C7"
            className="blur-[5px]"
          />
        </svg>
        <svg width="420" height="100" viewBox="0 0 420 100" fill="none">
          <path
            d="M40 70 Q80 20 150 35 Q200 10 260 25 Q320 12 360 48 Q400 62 370 80 Q280 95 40 70 Z"
            fill="#FED7AA"
            className="blur-[7px]"
          />
        </svg>
      </div>

      {/* Layer 2: Mid-altitude Elongated Mountain Clouds */}
      <div className="absolute top-[18%] left-0 w-[200%] flex justify-around opacity-45 animate-cloud-drift-slow pointer-events-none">
        <svg width="380" height="85" viewBox="0 0 380 85" fill="none">
          <path
            d="M35 60 Q75 25 130 38 Q175 18 230 28 Q290 20 330 50 Q360 62 335 75 Q260 85 35 60 Z"
            fill="#FDE68A"
            className="blur-[4px]"
          />
        </svg>
        <svg width="300" height="75" viewBox="0 0 300 75" fill="none">
          <path
            d="M25 55 Q55 20 105 30 Q145 12 195 24 Q240 18 270 45 Q290 58 270 70 Q210 78 25 55 Z"
            fill="#FFEDD5"
            className="blur-[5px]"
          />
        </svg>
      </div>

      {/* Layer 3: Distant Gliding Mountain Eagles */}
      <div className="absolute top-[22%] left-0 w-full h-16 animate-birds-flight pointer-events-none opacity-50">
        <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
          <path d="M0 9 Q8 0 16 7 Q24 0 32 9 Q24 4 16 11 Q8 4 0 9 Z" fill="#334155" />
        </svg>
      </div>
      <div className="absolute top-[28%] left-0 w-full h-16 animate-birds-flight-delayed pointer-events-none opacity-40">
        <svg width="24" height="12" viewBox="0 0 32 16" fill="none">
          <path d="M0 9 Q8 0 16 7 Q24 0 32 9 Q24 4 16 11 Q8 4 0 9 Z" fill="#475569" />
        </svg>
      </div>
    </div>
  );
};

export default CloudLayer;
