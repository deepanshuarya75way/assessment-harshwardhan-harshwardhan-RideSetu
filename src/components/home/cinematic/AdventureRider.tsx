'use client';

import React from 'react';

interface AdventureRiderProps {
  offsetX?: number;
}

export const AdventureRider: React.FC<AdventureRiderProps> = ({ offsetX = 0 }) => {
  return (
    <div
      className="absolute bottom-3 sm:bottom-6 right-3 sm:right-[12%] md:right-[18%] z-20 pointer-events-none select-none transition-transform duration-300 ease-out max-w-full overflow-hidden"
      style={{
        transform: `translate3d(${offsetX}px, 0, 0)`,
      }}
    >
      <div className="relative animate-bike-suspension origin-bottom transform scale-[0.85] sm:scale-110 md:scale-130 drop-shadow-[0_16px_20px_rgba(0,0,0,0.75)]">
        {/* 1. Powerful LED Headlight Beam Cone Casting on Asphalt Ahead (Contained) */}
        <div className="absolute -right-24 -top-6 w-36 sm:w-60 h-20 sm:h-28 bg-gradient-to-r from-amber-300/50 via-amber-400/20 to-transparent blur-md transform rotate-[6deg] pointer-events-none rounded-r-full" />
        <div className="absolute -right-12 -top-1 w-20 h-10 bg-amber-200/40 blur-sm transform rotate-[6deg] pointer-events-none rounded-r-full" />

        {/* 2. Hero Motorcycle & Adventurer Rider Vector */}
        <svg
          width="160"
          height="115"
          viewBox="0 0 160 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* --- REAR WHEEL (Spinning Spoke Assembly) --- */}
          <g className="animate-wheel-spin origin-[32px_86px]">
            {/* Rubber Tire with Tread */}
            <circle cx="32" cy="86" r="22" stroke="#0F172A" strokeWidth="7" fill="#1E293B" />
            <circle cx="32" cy="86" r="22" stroke="#334155" strokeWidth="1" strokeDasharray="4 3" />
            {/* Silver Rim & Cross-Laced Spokes */}
            <circle cx="32" cy="86" r="15" stroke="#64748B" strokeWidth="1.5" />
            <line x1="32" y1="64" x2="32" y2="108" stroke="#94A3B8" strokeWidth="1" />
            <line x1="10" y1="86" x2="54" y2="86" stroke="#94A3B8" strokeWidth="1" />
            <line x1="16" y1="70" x2="48" y2="102" stroke="#94A3B8" strokeWidth="1" />
            <line x1="16" y1="102" x2="48" y2="70" stroke="#94A3B8" strokeWidth="1" />
            {/* Disc Brake & Axle Hub */}
            <circle cx="32" cy="86" r="8" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="32" cy="86" r="4" fill="#F8FAFC" />
          </g>

          {/* --- FRONT WHEEL (Spinning Spoke Assembly) --- */}
          <g className="animate-wheel-spin origin-[128px_86px]">
            {/* Rubber Tire with Tread */}
            <circle cx="128" cy="86" r="22" stroke="#0F172A" strokeWidth="7" fill="#1E293B" />
            <circle cx="128" cy="86" r="22" stroke="#334155" strokeWidth="1" strokeDasharray="4 3" />
            {/* Silver Rim & Cross-Laced Spokes */}
            <circle cx="128" cy="86" r="15" stroke="#64748B" strokeWidth="1.5" />
            <line x1="128" y1="64" x2="128" y2="108" stroke="#94A3B8" strokeWidth="1" />
            <line x1="106" y1="86" x2="150" y2="86" stroke="#94A3B8" strokeWidth="1" />
            <line x1="112" y1="70" x2="144" y2="102" stroke="#94A3B8" strokeWidth="1" />
            <line x1="112" y1="102" x2="144" y2="70" stroke="#94A3B8" strokeWidth="1" />
            {/* Disc Brake & Axle Hub */}
            <circle cx="128" cy="86" r="8" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="128" cy="86" r="4" fill="#F8FAFC" />
          </g>

          {/* --- MOTORCYCLE CHASSIS, ENGINE & EXHAUST --- */}
          {/* Swingarm & Heavy-duty Chain Drive */}
          <path d="M32 86 L68 80 L74 68 L48 72 Z" fill="#334155" stroke="#1E293B" strokeWidth="1" />
          {/* Chrome Upswept Scrambler Exhaust */}
          <path d="M64 74 L38 78 L14 74" stroke="#CBD5E1" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M14 74 L26 72" stroke="#F59E0B" strokeWidth="2.5" />
          {/* Engine Crankcase & Cooling Fins */}
          <rect x="62" y="58" width="22" height="20" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
          <line x1="65" y1="64" x2="81" y2="64" stroke="#64748B" strokeWidth="1.5" />
          <line x1="65" y1="70" x2="81" y2="70" stroke="#64748B" strokeWidth="1.5" />

          {/* --- BODYWORK & TANK (RideSetu Himalayan Saffron-Orange) --- */}
          {/* Sculpted Adventure Fuel Tank */}
          <path d="M70 50 Q88 42 105 52 L100 64 L65 62 Z" fill="#FF6B00" />
          <path d="M70 50 Q88 42 105 52 L100 56 L72 54 Z" fill="#FFA14A" />
          {/* Front Beak & Cowl */}
          <path d="M105 52 L118 45 L114 62 L100 64 Z" fill="#EA580C" />
          {/* Ergonomic Touring Seat */}
          <path d="M42 54 Q60 54 70 50 L68 60 L40 58 Z" fill="#090E17" />

          {/* Front Upside-Down (USD) Suspension Forks & Handlebars */}
          <line x1="128" y1="86" x2="112" y2="40" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="108" y="36" width="14" height="4" rx="2" fill="#334155" />
          {/* Tall Touring Windscreen */}
          <path d="M112 38 L122 22 L116 38 Z" fill="#38BDF8" opacity="0.65" stroke="#BAE6FD" strokeWidth="0.5" />
          {/* Glowing Dual Projector Headlight */}
          <circle cx="119" cy="46" r="5" fill="#FEF08A" />
          <circle cx="119" cy="46" r="3" fill="#FFFFFF" className="shadow-[0_0_15px_#FBBF24]" />

          {/* Expedition Tail Pannier / Metal Luggage Box */}
          <rect x="22" y="44" width="22" height="16" rx="4" fill="#047857" stroke="#064E3B" strokeWidth="1.5" />
          <line x1="22" y1="52" x2="44" y2="52" stroke="#FBBF24" strokeWidth="1.5" />
          <circle cx="33" cy="52" r="1.5" fill="#0F172A" />

          {/* --- ADVENTURER RIDER --- */}
          {/* Rider Legs & Moto Boots */}
          <path d="M58 56 L76 68 L76 82 L84 84" stroke="#1E293B" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Rider Torso & Waterproof Adventure Jacket */}
          <path d="M60 56 L78 34 L92 37 L82 60 Z" fill="#0F766E" />
          <path d="M78 34 L88 36 L84 48 L76 46 Z" fill="#14B8A6" />
          {/* Mountain Touring Backpack with Hydration Pack */}
          <path d="M52 42 Q58 28 72 32 L66 50 Z" fill="#D97706" />
          <line x1="56" y1="36" x2="68" y2="39" stroke="#FEF3C7" strokeWidth="1.5" />
          {/* Riding Arms & Gauntlet Gloves */}
          <path d="M78 36 L100 40 L110 38" stroke="#0D9488" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Adventure Helmet (Full-face with Sun Peak & Visor) */}
          <circle cx="86" cy="22" r="11" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
          {/* Helmet Peak */}
          <path d="M86 12 L100 16 L88 18 Z" fill="#0F172A" />
          {/* Tinted Visor with Sky/Sun Reflection */}
          <path d="M88 18 Q98 21 96 28 L87 27 Z" fill="#0F172A" />
          <line x1="90" y1="21" x2="95" y2="24" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* 3. Atmospheric Road Dust & Exhaust Particle Puffs */}
        <div className="absolute -left-3 bottom-2 w-3.5 h-3.5 rounded-full bg-slate-300/25 blur-[1.5px] animate-ping-slow" />
        <div className="absolute -left-6 bottom-3 w-2.5 h-2.5 rounded-full bg-amber-400/20 blur-[1.5px] animate-ping-slow delay-150" />
      </div>
    </div>
  );
};

export default AdventureRider;
