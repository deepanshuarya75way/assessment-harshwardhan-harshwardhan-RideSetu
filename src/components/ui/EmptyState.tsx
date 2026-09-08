import React from 'react';
import { LucideIcon, Compass } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Compass,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-10 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center space-y-4 max-w-md mx-auto my-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-900 font-heading">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>

      {actionText && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
