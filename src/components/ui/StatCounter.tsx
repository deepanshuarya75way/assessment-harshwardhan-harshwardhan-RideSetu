'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StatCounterProps {
  target: number;
  suffix?: string;
  label: string;
  duration?: number;
  colorClass?: string;
  className?: string;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  target,
  suffix = '+',
  label,
  duration = 1000,
  colorClass = 'text-white',
  className = '',
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCount(target);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            // Ease-out cubic formula
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeOutProgress * target);

            setCount(currentVal);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [target, duration, hasAnimated]);

  return (
    <div
      ref={elementRef}
      className={`p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-lg ${className}`}
    >
      <div className={`text-2xl sm:text-3xl font-black font-heading tracking-tight ${colorClass}`}>
        {count}
        {suffix}
      </div>
      <div className="text-slate-400 text-xs mt-1 font-medium">{label}</div>
    </div>
  );
};

export default StatCounter;
