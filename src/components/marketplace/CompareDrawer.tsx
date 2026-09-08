'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompare } from '@/context/CompareContext';
import { formatINR } from '@/lib/utils';
import { Layers, X, ArrowRight, Trash2 } from 'lucide-react';

export const CompareDrawer: React.FC = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-navy-950/95 backdrop-blur-md text-white border-t border-white/15 p-3 sm:p-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Info & Items */}
        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold font-heading">
                Compare Selected ({compareList.length}/4)
              </div>
              <p className="text-[10px] text-slate-400">Side-by-side pricing & inclusions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {compareList.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0 text-xs"
              >
                <Image
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=100&q=80'}
                  alt={item.model}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-md object-cover"
                />
                <div>
                  <div className="font-bold text-[11px] truncate max-w-[90px]">{item.brand} {item.model}</div>
                  <div className="text-[10px] text-amber-400 font-semibold">{formatINR(item.pricePerDay)}/day</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCompare(item._id)}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Remove from comparison"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={clearCompare}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <Link
            href="/compare"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white text-xs font-bold shadow-lg shadow-brand-orange/30 flex items-center gap-1.5"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareDrawer;
