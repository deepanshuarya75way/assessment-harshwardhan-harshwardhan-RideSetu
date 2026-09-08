'use client';

import React from 'react';

export const MountainLayers: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      {/* 1. Golden Hour Sun & Ambient Horizon Glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[540px] sm:h-[540px] rounded-full bg-gradient-to-b from-amber-500/25 via-orange-600/15 to-transparent blur-[80px] sm:blur-[120px] pointer-events-none animate-pulse-slow" />
      
      {/* Sun Disc */}
      <div className="absolute top-[32%] left-[48%] -translate-x-1/2 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-t from-amber-300 to-orange-400 opacity-60 blur-md shadow-[0_0_80px_rgba(251,146,60,0.6)] pointer-events-none" />

      {/* 2. Distant High Peaks (Snow-capped Himalayan Silhouettes - Trishul / Nanda Devi) */}
      <svg
        className="absolute bottom-[28%] sm:bottom-[22%] left-0 w-[200%] sm:w-full h-44 sm:h-64 object-cover opacity-45 transform-gpu"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#1E293B"
          d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,202.7C840,192,960,128,1080,133.3C1200,139,1320,213,1380,250.7L1440,288L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
        {/* Snow Cap Accents */}
        <polygon points="360,165 330,200 390,200" fill="#E2E8F0" opacity="0.6" />
        <polygon points="1080,133 1040,180 1120,180" fill="#E2E8F0" opacity="0.6" />
      </svg>

      {/* 3. Mid-range Mountain Ridge (Warm orange rim-light edge) */}
      <svg
        className="absolute bottom-[20%] sm:bottom-[15%] left-0 w-[200%] sm:w-full h-48 sm:h-72 object-cover opacity-60 transform-gpu animate-parallax-mid"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#0F172A"
          d="M0,160L48,176C96,192,192,224,288,208C384,192,480,128,576,128C672,128,768,192,864,218.7C960,245,1056,235,1152,208C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* 4. Near Forested Himalayan Ridge with Pine Forest Silhouettes */}
      <svg
        className="absolute bottom-[10%] sm:bottom-[6%] left-0 w-[200%] sm:w-full h-40 sm:h-60 object-cover opacity-75 transform-gpu animate-parallax-near"
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
      >
        <path
          fill="#06281E"
          d="M0,96L30,106.7C60,117,120,139,180,133.3C240,128,300,96,360,101.3C420,107,480,149,540,154.7C600,160,660,128,720,122.7C780,117,840,139,900,154.7C960,171,1020,181,1080,165.3C1140,149,1200,107,1260,101.3C1320,96,1380,128,1410,144L1440,160L1440,240L1410,240C1380,240,1320,240,1260,240C1200,240,1140,240,1080,240C1020,240,960,240,900,240C840,240,780,240,720,240C660,240,600,240,540,240C480,240,420,240,360,240C300,240,240,240,180,240C120,240,60,240,30,240L0,240Z"
        />
      </svg>

      {/* Pine Trees Silhouette Band */}
      <div className="absolute bottom-[12%] sm:bottom-[8%] left-0 w-full h-10 flex items-end justify-around opacity-40 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="w-0 h-0 border-l-[6px] sm:border-l-[10px] border-l-transparent border-r-[6px] sm:border-r-[10px] border-r-transparent border-b-[18px] sm:border-b-[28px] border-b-emerald-950 inline-block"
            style={{
              transform: `scale(${0.7 + (i % 5) * 0.15}) translateY(${(i % 3) * 3}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MountainLayers;
