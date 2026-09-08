'use client';

import React from 'react';

export const AmbientParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-15">
      {/* 1. Atmospheric Mountain Dot Grid */}
      <div className="absolute inset-0 bg-himalayan-dots opacity-15 pointer-events-none" />

      {/* 2. Floating Golden Sunset Spores / Particles */}
      {[...Array(16)].map((_, i) => {
        const left = 5 + (i * 6.2) + ((i * 13) % 7);
        const top = 20 + ((i * 17) % 55);
        const size = 2 + (i % 3);
        const delay = (i * 0.8) % 6;
        const duration = 6 + (i % 5) * 2;

        return (
          <div
            key={i}
            className="absolute rounded-full bg-amber-300 pointer-events-none animate-float opacity-40 shadow-[0_0_8px_#FBBF24]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default AmbientParticles;
