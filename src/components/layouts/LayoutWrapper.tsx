'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import CompareDrawer from '@/components/marketplace/CompareDrawer';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import NetworkStatus from '@/components/common/NetworkStatus';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  const isPartnerRoute = pathname.startsWith('/partner');
  const isAdminRoute = pathname.startsWith('/ops');
  const isAuthRoute = pathname.startsWith('/login');

  const isRoleIsolatedRoute = isPartnerRoute || isAdminRoute || isAuthRoute;

  return (
    <>
      <NetworkStatus />
      {!isRoleIsolatedRoute && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isRoleIsolatedRoute && <CompareDrawer />}
      {!isRoleIsolatedRoute && <InstallPrompt />}
      {!isRoleIsolatedRoute && <Footer />}
    </>
  );
}
