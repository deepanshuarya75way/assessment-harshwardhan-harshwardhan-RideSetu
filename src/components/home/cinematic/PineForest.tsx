'use client';

import React from 'react';

interface PineForestProps {
  offsetX?: number;
}

export const PineForest: React.FC<PineForestProps> = ({ offsetX = 0 }) => {
  return (
    <div
      className="absolute bottom-[10%] sm:bottom-[7%] left-0 w-full max-w-full h-[20%] sm:h-[26%] pointer-events-none select-none overflow-hidden transition-transform duration-300 ease-out"
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      <svg
        className="w-[130%] -left-[15%] relative h-full object-cover opacity-95"
        viewBox="0 0 1600 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="forestBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B2F2A" />
            <stop offset="100%" stopColor="#051714" />
          </linearGradient>
        </defs>

        {/* Forest Hill Ground Slope */}
        <path
          d="M0,160 Q260,110 540,150 Q820,100 1100,160 Q1380,120 1600,170 L1600,320 L0,320 Z"
          fill="url(#forestBaseGrad)"
        />

        {/* Pine Tree Silhouettes Band along ridge */}
        {[...Array(38)].map((_, i) => {
          const cx = 20 + i * 42 + ((i * 17) % 15);
          const baseY = 150 + Math.sin(i * 0.4) * 25;
          const h = 50 + (i % 5) * 12;
          const w = 22 + (i % 4) * 5;

          return (
            <g key={i} opacity={0.85 + (i % 3) * 0.05}>
              {/* Tree Trunk */}
              <rect x={cx - 2} y={baseY - 10} width="4" height="15" fill="#040D0C" />
              {/* Tier 3 (Bottom) */}
              <polygon
                points={`${cx},${baseY - h * 0.6} ${cx - w},${baseY - h * 0.15} ${cx + w},${baseY - h * 0.15}`}
                fill="#07201C"
              />
              {/* Tier 2 (Middle) */}
              <polygon
                points={`${cx},${baseY - h * 0.85} ${cx - w * 0.8},${baseY - h * 0.45} ${cx + w * 0.8},${baseY - h * 0.45}`}
                fill="#0B2F2A"
              />
              {/* Tier 1 (Top) */}
              <polygon
                points={`${cx},${baseY - h} ${cx - w * 0.55},${baseY - h * 0.7} ${cx + w * 0.55},${baseY - h * 0.7}`}
                fill="#0E3D36"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default PineForest;
