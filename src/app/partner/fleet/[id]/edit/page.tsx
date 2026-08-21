'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditVehicleModal from '@/components/vendor/AddEditVehicleModal';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/vendor/vehicles/${params.id}`);
        const data = await res.json();
        if (data.vehicle) {
          setVehicle(data.vehicle);
        }
      } catch (err) {
        console.error('Error fetching vehicle for edit:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchVehicle();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <AddEditVehicleModal
      isOpen={true}
      vehicle={vehicle}
      onClose={() => router.push('/partner/fleet')}
      onSuccess={() => router.push('/partner/fleet')}
    />
  );
}
