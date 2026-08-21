'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AddEditVehicleModal from '@/components/vendor/AddEditVehicleModal';

export default function NewVehiclePage() {
  const router = useRouter();

  return (
    <AddEditVehicleModal
      isOpen={true}
      onClose={() => router.push('/partner/fleet')}
      onSuccess={() => router.push('/partner/fleet')}
    />
  );
}
