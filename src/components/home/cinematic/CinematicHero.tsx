'use client';

import React, { useState, useEffect, useCallback } from 'react';
import HimalayanSky from './HimalayanSky';
import CloudLayer from './CloudLayer';
import SnowMountains from './SnowMountains';
import MidMountains from './MidMountains';
import MountainValley from './MountainValley';
import PineForest from './PineForest';
import MountainRoad from './MountainRoad';
import AdventureRider from './AdventureRider';
import ForegroundLayer from './ForegroundLayer';
import AmbientParticles from './AmbientParticles';

export const CinematicHero: React.FC = () => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // Graceful fallback
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice || prefersReducedMotion) return;
      const { clientX, innerWidth } = {
        clientX: e.clientX,
        innerWidth: window.innerWidth,
      };
      const normalizedX = (clientX - innerWidth / 2) / (innerWidth / 2); // Range: -1 to 1
      setMouseOffset({ x: normalizedX, y: 0 });
    },
    [isTouchDevice, prefersReducedMotion]
  );

  if (hasError) {
    return (
      <div className="absolute inset-0 w-full max-w-full h-full bg-gradient-to-b from-[#071426] via-[#16324F] to-navy-950 pointer-events-none" />
    );
  }

  // Calculate subtle layer offsets (Desktop only)
  const snowOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * -3;
  const midOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * -6;
  const valleyOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * -8;
  const forestOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * -11;
  const roadOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * -5;
  const riderOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * 4;
  const fgOffset = isTouchDevice || prefersReducedMotion ? 0 : mouseOffset.x * 14;

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 w-full max-w-full h-full pointer-events-none overflow-hidden select-none ${
        prefersReducedMotion ? 'reduce-motion-static' : ''
      }`}
      aria-hidden="true"
    >
      {/* Layer 1: Sky & Sun Horizon Glow */}
      <HimalayanSky />

      {/* Layer 2: Moving Mountain Clouds & Soaring Eagles */}
      <CloudLayer />

      {/* Layer 3: Distant High Snow-capped Himalayan Peaks (30% Hero Height) */}
      <SnowMountains offsetX={snowOffset} />

      {/* Layer 4: Mid-distance Green/Teal Himalayan Mountain Ridges */}
      <MidMountains offsetX={midOffset} />

      {/* Layer 5: Himalayan Valley Basin with Turquoise River Glint & Village Lights */}
      <MountainValley offsetX={valleyOffset} />

      {/* Layer 6: Dense Himalayan Pine Forest Ridge */}
      <PineForest offsetX={forestOffset} />

      {/* Layer 7: Realistic Perspective Mountain Highway */}
      <MountainRoad offsetX={roadOffset} />

      {/* Layer 8: Hero Adventure Motorcycle & Rider (2.5x Size) */}
      <AdventureRider offsetX={riderOffset} />

      {/* Layer 9: Ambient Sunset Dust & Mist Particles */}
      <AmbientParticles />

      {/* Layer 10: Fast-Moving Roadside Pine Foreground Branches */}
      <ForegroundLayer offsetX={fgOffset} />

      {/* Dark Vignette & Top Navbar Gradient Overlay for Crisp Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/75 via-navy-950/25 to-navy-950/90 pointer-events-none w-full h-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,13,23,0.65)_100%)] pointer-events-none w-full h-full" />
    </div>
  );
};

export default CinematicHero;
