'use client';

import React from 'react';

export const RiderAnimation: React.FC = () => {
  return (
    <div className="absolute bottom-2 sm:bottom-6 left-0 w-full pointer-events-none select-none z-10 overflow-hidden h-28 sm:h-36">
      {/* 1. Himalayan Mountain Highway Road Layer */}
      <div className="absolute bottom-0 left-0 w-full h-8 sm:h-12 bg-gradient-to-t from-slate-950 via-[#0a0f1d] to-transparent border-t border-slate-700/40">
        {/* Moving Yellow Centerline Road Dashes */}
        <div className="absolute top-2 sm:top-3 left-0 w-[200%] h-1 flex items-center space-x-6 sm:space-x-12 animate-road-dashes opacity-70">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="w-8 sm:w-16 h-0.5 sm:h-1 bg-amber-400/90 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)] shrink-0" />
          ))}
        </div>
      </div>

      {/* Uttarakhand Highway Milestone (e.g., "UK-07 Rishikesh") */}
      <div className="absolute bottom-3 sm:bottom-4 right-12 sm:right-32 opacity-70 scale-75 sm:scale-90 flex flex-col items-center">
        <div className="w-5 h-7 sm:w-6 sm:h-9 bg-amber-400 rounded-t-full border border-slate-900 flex flex-col items-center justify-start pt-0.5 shadow-md">
          <div className="w-full h-2.5 bg-emerald-700 rounded-t-full mb-0.5" />
          <span className="text-[6px] font-black text-slate-950 leading-none">NH-7</span>
        </div>
      </div>

      {/* 2. Stylized Motorcycle & Adventurer Rider Unit */}
      <div className="absolute bottom-2 sm:bottom-3 left-0 animate-rider-travel">
        <div className="relative animate-bike-suspension transform scale-75 sm:scale-100 origin-bottom-left">
          {/* Headlight Beam Casting on Road */}
          <div className="absolute -right-24 -top-2 w-36 sm:w-56 h-12 bg-gradient-to-r from-amber-300/40 via-amber-400/15 to-transparent blur-md transform rotate-6 pointer-events-none rounded-r-full" />

          {/* Motorcycle & Rider SVG Asset */}
          <svg
            width="120"
            height="85"
            viewBox="0 0 120 85"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          >
            {/* --- REAR WHEEL --- */}
            <g className="animate-wheel-spin origin-[24px_64px]">
              <circle cx="24" cy="64" r="16" stroke="#0F172A" strokeWidth="5" fill="#1E293B" />
              <circle cx="24" cy="64" r="11" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
              <circle cx="24" cy="64" r="4" fill="#E2E8F0" />
            </g>

            {/* --- FRONT WHEEL --- */}
            <g className="animate-wheel-spin origin-[96px_64px]">
              <circle cx="96" cy="64" r="16" stroke="#0F172A" strokeWidth="5" fill="#1E293B" />
              <circle cx="96" cy="64" r="11" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
              <circle cx="96" cy="64" r="4" fill="#E2E8F0" />
            </g>

            {/* --- MOTORCYCLE CHASSIS & EXHAUST --- */}
            {/* Swingarm / Chain drive */}
            <path d="M24 64 L50 60 L54 52 L36 54 Z" fill="#334155" />
            {/* Chrome Exhaust Pipe */}
            <path d="M48 56 L30 58 L12 56" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
            {/* Engine block */}
            <rect x="46" y="44" width="16" height="15" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <line x1="48" y1="48" x2="60" y2="48" stroke="#64748B" strokeWidth="1" />
            <line x1="48" y1="52" x2="60" y2="52" stroke="#64748B" strokeWidth="1" />

            {/* --- FUEL TANK & BODYWORK (RideSetu Himalayan Orange) --- */}
            {/* Main Adventure Tank */}
            <path d="M52 38 Q65 32 78 39 L74 48 L48 46 Z" fill="#FF6B00" />
            {/* Fairing accent */}
            <path d="M78 39 L88 34 L85 46 L74 48 Z" fill="#EA580C" />
            {/* Seat & Tail */}
            <path d="M32 40 Q44 40 52 38 L50 45 L30 43 Z" fill="#0F172A" />

            {/* Front Forks & Handlebars */}
            <line x1="96" y1="64" x2="84" y2="30" stroke="#64748B" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="80" y="27" width="10" height="3" rx="1.5" fill="#334155" />
            {/* Windscreen */}
            <path d="M84 28 L90 18 L87 28 Z" fill="#38BDF8" opacity="0.6" />
            {/* Glowing Golden Headlight */}
            <circle cx="89" cy="35" r="4" fill="#FBBF24" className="shadow-[0_0_12px_#FBBF24]" />

            {/* Tail Expedition Pannier / Luggage Bag */}
            <rect x="18" y="32" width="16" height="12" rx="3" fill="#047857" stroke="#064E3B" strokeWidth="1" />
            <line x1="18" y1="36" x2="34" y2="36" stroke="#F59E0B" strokeWidth="1" />

            {/* --- ADVENTURER RIDER --- */}
            {/* Rider Legs */}
            <path d="M42 42 L56 50 L56 60 L62 61" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Rider Torso & Adventure Jacket */}
            <path d="M44 42 L58 26 L68 28 L60 45 Z" fill="#0F766E" />
            {/* Adventure Backpack */}
            <path d="M38 32 Q42 22 52 25 L48 38 Z" fill="#B45309" />
            {/* Arms holding handlebar */}
            <path d="M58 28 L74 31 L82 29" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {/* Rider Helmet (with visor gleam) */}
            <circle cx="64" cy="17" r="8" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.5" />
            {/* Visor */}
            <path d="M66 14 Q73 16 71 21 L65 20 Z" fill="#0F172A" />
            <line x1="67" y1="16" x2="70" y2="18" stroke="#38BDF8" strokeWidth="1" />
          </svg>

          {/* Dust / Exhaust Particle Puffs */}
          <div className="absolute -left-3 bottom-1 w-3 h-3 rounded-full bg-slate-400/20 blur-[2px] animate-ping-slow" />
          <div className="absolute -left-6 bottom-2 w-2 h-2 rounded-full bg-slate-300/15 blur-[1px] animate-ping-slow delay-150" />
        </div>
      </div>
    </div>
  );
};

export default RiderAnimation;
