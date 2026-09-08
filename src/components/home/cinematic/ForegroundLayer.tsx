'use client';

import React from 'react';

interface ForegroundLayerProps {
  offsetX?: number;
}

export const ForegroundLayer: React.FC<ForegroundLayerProps> = ({ offsetX = 0 }) => {
  return (
    <div
      className="absolute inset-0 w-full max-w-full h-full pointer-events-none select-none z-30 overflow-hidden transition-transform duration-300 ease-out"
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      {/* 1. Fast-Moving Foreground Pine Branches on Roadside (Desktop/Tablet) */}
      <div className="hidden sm:flex absolute -bottom-6 left-0 w-[200%] h-24 justify-between animate-foreground-travel opacity-85 pointer-events-none overflow-hidden">
        {/* Branch Group A */}
        <svg width="220" height="120" viewBox="0 0 220 120" fill="none" className="transform rotate-[-6deg]">
          <path d="M0,120 Q50,70 120,40 Q170,20 220,10" stroke="#04120F" strokeWidth="12" strokeLinecap="round" />
          <polygon points="120,40 100,20 135,15" fill="#061F1B" />
          <polygon points="150,30 135,5 165,8" fill="#082A24" />
          <polygon points="180,20 170,-5 200,-2" fill="#0B3730" />
          <polygon points="210,12 205,-15 230,-10" fill="#0E443C" />
        </svg>

        {/* Branch Group B */}
        <svg width="260" height="130" viewBox="0 0 260 130" fill="none" className="transform rotate-[-12deg]">
          <path d="M0,130 Q70,75 160,35 Q210,15 260,0" stroke="#04120F" strokeWidth="14" strokeLinecap="round" />
          <polygon points="140,45 120,18 160,12" fill="#061F1B" />
          <polygon points="180,30 160,2 200,6" fill="#082A24" />
          <polygon points="220,15 205,-12 240,-8" fill="#0B3730" />
        </svg>
      </div>

      {/* 2. Bottom Foreground Vignette & Gradient leading to subsequent sections */}
      <div className="absolute bottom-0 left-0 w-full h-28 sm:h-36 bg-gradient-to-t from-navy-950 via-navy-950/70 to-transparent pointer-events-none" />
    </div>
  );
};

export default ForegroundLayer;
