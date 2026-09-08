'use client';

import React from 'react';

export const HimalayanSky: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full max-w-full h-full pointer-events-none select-none overflow-hidden">
      {/* 1. Golden Hour Himalayan Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#071426] via-[#16324F] via-60% to-[#F59E0B]/80 w-full h-full" />

      {/* 2. Horizon Sunset Glow Layer */}
      <div className="absolute bottom-[28%] left-0 w-full h-[45%] bg-gradient-to-t from-[#FF6B00]/40 via-[#FB923C]/25 to-transparent pointer-events-none blur-[30px]" />

      {/* 3. Golden Sun Disc nestled behind mountain horizon */}
      <div className="absolute bottom-[36%] sm:bottom-[34%] left-[65%] sm:left-[58%] -translate-x-1/2 w-32 h-32 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-[#FF6B00] via-[#FBBF24] to-[#FEF08A] opacity-90 blur-sm shadow-[0_0_90px_rgba(251,146,60,0.85)] pointer-events-none animate-pulse-slow" />

      {/* 4. Atmospheric Light Shafts / Sun Rays */}
      <div className="absolute bottom-[30%] left-[65%] sm:left-[58%] -translate-x-1/2 w-[340px] sm:w-[700px] h-[250px] sm:h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(254,240,138,0.18)_0%,rgba(251,146,60,0.08)_45%,transparent_75%)] pointer-events-none blur-2xl transform rotate-[-8deg]" />
    </div>
  );
};

export default HimalayanSky;
