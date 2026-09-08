'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { VendorGuard } from '@/components/common/RoleGuard';
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  TrendingUp,
  Wallet,
  Star,
  FileCheck,
  Building2,
  Bell,
  HelpCircle,
  Menu,
  X,
  Compass,
  LogOut,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

interface PartnerLayoutProps {
  children: React.ReactNode;
}

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const vendorStatus = (user?.vendor as any)?.status || user?.vendor?.verificationStatus || 'VERIFIED';
  const businessName = user?.vendor?.businessName || user?.name || 'RideSetu Partner';

  const navItems = [
    { name: 'Overview', href: '/partner/dashboard', icon: LayoutDashboard },
    { name: 'Fleet Management', href: '/partner/fleet', icon: Car },
    { name: 'Fleet Insights', href: '/partner/fleet/insights', icon: TrendingUp },
    { name: 'Bookings & Handovers', href: '/partner/bookings', icon: CalendarDays },
    { name: 'Schedule Calendar', href: '/partner/calendar', icon: CalendarDays },
    { name: 'Rider Customers', href: '/partner/customers', icon: Users },
    { name: 'Earnings Ledger', href: '/partner/earnings', icon: TrendingUp },
    { name: 'Payout Requests', href: '/partner/payouts', icon: Wallet },
    { name: 'Customer Reviews', href: '/partner/reviews', icon: Star },
    { name: 'Safety & Incidents', href: '/partner/safety', icon: ShieldAlert },
    { name: 'Legal Documents', href: '/partner/documents', icon: FileCheck },
    { name: 'Business Profile', href: '/partner/profile', icon: Building2 },
    { name: 'Notifications', href: '/partner/notifications', icon: Bell },
    { name: 'Partner Help', href: '/partner/help', icon: HelpCircle },
  ];

  return (
    <VendorGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased selection:bg-brand-orange selection:text-white">
        {/* ONE Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <Link href="/partner/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-brand-orange flex items-center justify-center text-white font-black shadow-md shadow-amber-500/20">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-base font-heading tracking-tight flex items-center gap-1">
                  Ride<span className="text-amber-600">Setu</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300">
                    Partner
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">B2B Mobility Portal</p>
              </div>
            </Link>
          </div>

          {/* Business Profile Card */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-2">
            <div className="font-extrabold text-xs text-slate-900 truncate">{businessName}</div>
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={`font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  vendorStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : vendorStatus === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-rose-100 text-rose-700 border-rose-300'
                }`}
              >
                {vendorStatus === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                {vendorStatus === 'UNDER_REVIEW' && <Clock className="w-3 h-3 text-amber-600" />}
                {vendorStatus === 'REJECTED' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                {vendorStatus}
              </span>
              <span className="text-slate-500 font-semibold">
                Operator ID #{( (user as any)?.userId || (user as any)?._id || '849201' ).slice(-6)}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-bold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 font-extrabold border border-amber-300 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer / Sign Out */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Compass className="w-4 h-4 text-brand-orange" /> Switch to Marketplace
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
          <Link href="/partner/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-base font-heading">
              Ride<span className="text-amber-600">Setu</span> Partner
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200"
            aria-label="Open Partner Navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-black text-slate-900 text-sm font-heading">Partner Portal</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="min-w-[44px] min-h-[44px] p-2 text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-xs text-slate-900 truncate">{businessName}</div>
                <div className="text-[10px] text-amber-600 uppercase font-black">{vendorStatus}</div>
              </div>

              <nav className="space-y-1 text-xs font-bold flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl transition-colors ${
                        isActive
                          ? 'bg-amber-50 text-amber-700 font-extrabold border border-amber-300'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-amber-600" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl border border-rose-200"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </VendorGuard>
  );
};

export default PartnerLayout;
