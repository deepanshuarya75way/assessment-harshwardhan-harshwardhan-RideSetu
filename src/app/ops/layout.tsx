import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';

export const metadata = {
  title: 'RideSetu Operations Console — Enterprise Administration & Governance',
  description: 'Master operations dashboard for RideSetu platform governance, KYC approvals, vendor review, payment ledger, and audit logs.',
};

export default function OpsAppLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
