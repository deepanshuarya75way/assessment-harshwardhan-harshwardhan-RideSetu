import React from 'react';
import { ShieldCheck, Star, Sparkles, AlertCircle, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = (status || '').toUpperCase().trim();
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (['VERIFIED', 'APPROVED', 'COMPLETED', 'PUBLISHED', 'PROCESSED', 'CONFIRMED', 'ACTIVE', 'PAID'].includes(norm)) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${pad} ${className}`}>
        <CheckCircle2 className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        {norm.replace(/_/g, ' ')}
      </span>
    );
  }

  if (['PENDING', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'IN_REVIEW', 'FLAGGED'].includes(norm)) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${pad} ${className}`}>
        <Clock className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        {norm.replace(/_/g, ' ')}
      </span>
    );
  }

  if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(norm)) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${pad} ${className}`}>
        <RotateCcw className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        {norm.replace(/_/g, ' ')}
      </span>
    );
  }

  if (['REJECTED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'CANCELLED_BY_ADMIN', 'HIDDEN', 'FAILED', 'SUSPENDED'].includes(norm)) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${pad} ${className}`}>
        <XCircle className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        {norm.replace(/_/g, ' ')}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${pad} ${className}`}>
      {norm.replace(/_/g, ' ')}
    </span>
  );
};

export const RatingBadge: React.FC<{ rating: number; reviewCount?: number; size?: 'sm' | 'md' }> = ({
  rating,
  reviewCount,
  size = 'md',
}) => {
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const val = Number(rating || 5.0).toFixed(1);

  return (
    <span className={`inline-flex items-center gap-1 font-black rounded-lg bg-amber-50 text-amber-950 border border-amber-200/90 shadow-sm ${pad}`}>
      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
      <span>{val}</span>
      {reviewCount !== undefined && (
        <span className="font-medium text-slate-500 text-[10px]">({reviewCount})</span>
      )}
    </span>
  );
};

export const VerifiedPartnerBadge: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 font-extrabold rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 ${pad}`}>
      <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      Verified Partner
    </span>
  );
};
