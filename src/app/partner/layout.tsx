import React from 'react';
import PartnerLayout from '@/components/layouts/PartnerLayout';

export const metadata = {
  title: 'RideSetu Partner Portal — Mobility Partner & Fleet Management Console',
  description: 'Manage your vehicle fleet, active rider bookings, earnings, and payout requests on the RideSetu Partner Portal.',
};

export default function PartnerAppLayout({ children }: { children: React.ReactNode }) {
  return <PartnerLayout>{children}</PartnerLayout>;
}
