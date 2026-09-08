'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { getVehiclePhotos } from '@/lib/vehicle-images';

interface VehicleGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  images: string[];
  photos?: {
    front?: string;
    rear?: string;
    left?: string;
    right?: string;
    dashboard?: string;
    odometer?: string;
  };
}

export const VehicleGalleryModal: React.FC<VehicleGalleryModalProps> = ({
  isOpen,
  onClose,
  title,
  images,
  photos,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fallbackPhotos = getVehiclePhotos({ images });

  // Consolidate all available photos
  const allPhotos: { label: string; url: string }[] = [];

  if (photos?.front && photos.front.startsWith('http')) allPhotos.push({ label: 'Front View', url: photos.front });
  if ((photos?.right || photos?.left) && (photos?.right || photos?.left)?.startsWith('http')) {
    allPhotos.push({ label: 'Side Profile', url: photos?.right || photos?.left || '' });
  }
  if (photos?.rear && photos.rear.startsWith('http')) allPhotos.push({ label: 'Rear View', url: photos.rear });
  if (photos?.dashboard && photos.dashboard.startsWith('http')) allPhotos.push({ label: 'Dashboard & Controls', url: photos.dashboard });
  if (photos?.odometer && photos.odometer.startsWith('http')) allPhotos.push({ label: 'Odometer Reading', url: photos.odometer });

  images.forEach((img, idx) => {
    if (img && img.startsWith('http') && !allPhotos.some((p) => p.url === img)) {
      allPhotos.push({ label: `Angle #${allPhotos.length + 1}`, url: img });
    }
  });

  if (allPhotos.length === 0) {
    fallbackPhotos.forEach((url, idx) => {
      allPhotos.push({
        label: idx === 0 ? 'Front View' : idx === 1 ? 'Side View' : idx === 2 ? 'Rear View' : idx === 3 ? 'Dashboard' : 'Detail',
        url,
      });
    });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev + 1) % allPhotos.length);
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, allPhotos.length]);

  if (!isOpen) return null;

  const currentPhoto = allPhotos[selectedIndex] || allPhotos[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-orange" />
            <span className="font-extrabold text-white text-base font-heading">{title} — Photo Gallery</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Viewing Stage */}
        <div className="relative aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.label}
            fill
            sizes="(max-width: 1200px) 100vw, 800px"
            className="object-contain"
          />

          {/* Navigation Controls */}
          <button
            onClick={() => setSelectedIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)}
            className="absolute left-4 p-3 rounded-2xl bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => setSelectedIndex((prev) => (prev + 1) % allPhotos.length)}
            className="absolute right-4 p-3 rounded-2xl bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Label Badge & Counter */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-white text-xs font-bold flex items-center gap-2">
            <span>{currentPhoto.label}</span>
            <span className="text-amber-400 font-extrabold">({selectedIndex + 1} / {allPhotos.length})</span>
          </div>
        </div>

        {/* Thumbnail Selector */}
        <div className="p-4 border-t border-white/10 bg-slate-950/50 overflow-x-auto flex items-center gap-3">
          {allPhotos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                selectedIndex === idx
                  ? 'border-brand-orange scale-105 shadow-md shadow-brand-orange/30'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={photo.url} alt={photo.label} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleGalleryModal;
