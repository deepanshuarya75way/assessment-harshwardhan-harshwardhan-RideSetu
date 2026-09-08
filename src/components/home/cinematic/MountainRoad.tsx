'use client';

import React from 'react';

interface MountainRoadProps {
  offsetX?: number;
}

export const MountainRoad: React.FC<MountainRoadProps> = ({ offsetX = 0 }) => {
  return (
    <div
      className="absolute bottom-0 left-0 w-full h-[18%] sm:h-[22%] pointer-events-none select-none z-10 overflow-hidden transition-transform duration-300 ease-out"
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      {/* 1. Curved Mountain Highway Asphalt Surface */}
      <svg
        className="w-[110%] -left-[5%] relative h-full object-cover"
        viewBox="0 0 1600 240"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="asphaltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="40%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="guardRailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Road Base Curve */}
        <path
          d="M0,80 Q400,20 900,45 Q1300,70 1600,30 L1600,240 L0,240 Z"
          fill="url(#asphaltGrad)"
        />

        {/* Road Shoulder / Outer Edge Border */}
        <path
          d="M0,80 Q400,20 900,45 Q1300,70 1600,30"
          stroke="#475569"
          strokeWidth="6"
          fill="none"
          opacity="0.8"
        />

        {/* Mountain Highway Steel Guard Rail & Posts */}
        <path
          d="M0,74 Q400,14 900,39 Q1300,64 1600,24"
          stroke="url(#guardRailGrad)"
          strokeWidth="4.5"
          fill="none"
        />
        {/* Guard rail support posts */}
        {[...Array(22)].map((_, i) => {
          const px = 40 + i * 72;
          const py = 74 - Math.sin((px / 1600) * Math.PI) * 45;
          return (
            <line
              key={i}
              x1={px}
              y1={py}
              x2={px}
              y2={py + 16}
              stroke="#64748B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Roadside Reflectors (Red / Amber glowing markers) */}
        {[...Array(12)].map((_, i) => {
          const rx = 80 + i * 130;
          const ry = 72 - Math.sin((rx / 1600) * Math.PI) * 45;
          return (
            <circle
              key={i}
              cx={rx}
              cy={ry}
              r="2"
              fill="#F59E0B"
              className="shadow-[0_0_8px_#F59E0B]"
            />
          );
        })}
      </svg>

      {/* 2. Moving Centerline Perspective Highway Dashes */}
      <div className="absolute top-[52%] sm:top-[48%] left-0 w-[200%] h-2 flex items-center space-x-12 sm:space-x-20 animate-road-dashes pointer-events-none opacity-85">
        {[...Array(32)].map((_, i) => (
          <div
            key={i}
            className="w-14 sm:w-24 h-1 sm:h-1.5 bg-gradient-to-r from-amber-300 to-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] shrink-0 transform rotate-[2deg]"
          />
        ))}
      </div>

      {/* 3. Authentic Uttarakhand Highway Milestone ("NH-7 • Rishikesh 45 KM") */}
      <div className="absolute top-[28%] sm:top-[22%] left-10 sm:left-24 z-20 flex flex-col items-center pointer-events-none drop-shadow-lg scale-90 sm:scale-100">
        <div className="w-8 h-12 sm:w-10 sm:h-14 bg-white rounded-t-full border-2 border-slate-900 flex flex-col items-center justify-start overflow-hidden shadow-xl">
          {/* Green top dome (State/National highway standard) */}
          <div className="w-full h-4 sm:h-5 bg-emerald-600 rounded-t-full flex items-center justify-center">
            <span className="text-[6px] sm:text-[7px] font-black text-white leading-none tracking-tight">NH-7</span>
          </div>
          {/* Lower milestone body */}
          <div className="flex flex-col items-center justify-center pt-0.5 text-center leading-tight">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-950">RISHIKESH</span>
            <span className="text-[8px] sm:text-[9px] font-black text-slate-900 font-heading">45 KM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MountainRoad;
