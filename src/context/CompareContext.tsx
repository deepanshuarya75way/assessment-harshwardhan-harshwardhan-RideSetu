'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompareVehicleItem {
  _id: string;
  brand: string;
  model: string;
  variant?: string;
  category: string;
  images: string[];
  pricePerDay: number;
  securityDeposit: number;
  kmLimitPerDay: number;
  excessKmCharge: number;
  fuelType: string;
  transmission: string;
  helmetIncluded: boolean;
  deliveryAvailable: boolean;
  roadsideAssistance: boolean;
  rating: number;
  totalReviews: number;
  vendorId: {
    _id: string;
    businessName: string;
    rating: number;
    totalReviews: number;
    baseDeliveryFee?: number;
    isTopRated?: boolean;
  };
  specifications?: {
    engineCc?: number;
    batteryCapacityKwh?: number;
    topSpeedKmph?: number;
    seatingCapacity?: number;
    fuelTankCapacityL?: number;
  };
}

interface CompareContextType {
  compareList: CompareVehicleItem[];
  addToCompare: (vehicle: any) => void;
  removeFromCompare: (vehicleId: string) => void;
  isInCompare: (vehicleId: string) => boolean;
  clearCompare: () => void;
  isCompareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<CompareVehicleItem[]>([]);
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ridesetu_compare');
      if (saved) {
        setCompareList(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ridesetu_compare', JSON.stringify(compareList));
    } catch {
      // ignore
    }
  }, [compareList]);

  const addToCompare = (vehicle: any) => {
    if (compareList.some((v) => v._id === vehicle._id)) {
      removeFromCompare(vehicle._id);
      return;
    }
    if (compareList.length >= 4) {
      alert('You can compare a maximum of 4 vehicles at a time.');
      return;
    }
    setCompareList((prev) => [...prev, vehicle]);
  };

  const removeFromCompare = (vehicleId: string) => {
    setCompareList((prev) => prev.filter((v) => v._id !== vehicleId));
  };

  const isInCompare = (vehicleId: string) => {
    return compareList.some((v) => v._id === vehicleId);
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        isCompareModalOpen,
        setCompareModalOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
