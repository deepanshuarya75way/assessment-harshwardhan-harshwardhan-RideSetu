'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminGuard } from '@/components/common/RoleGuard';
import {
  ShieldCheck,
  Users,
  Store,
  Car,
  Calendar,
  CreditCard,
  RefreshCw,
  FileText,
  Star,
  AlertOctagon,
  Activity,
  Settings,
  Menu,
  X,
  Compass,
  LogOut,
  Bell,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Command Center', href: '/ops/dashboard', icon: ShieldCheck },
    { name: 'Live Operations', href: '/ops/live', icon: Activity },
    { name: 'Rider Customers', href: '/ops/customers', icon: Users },
    { name: 'Partner Vendors', href: '/ops/vendors', icon: Store },
    { name: 'Marketplace Fleet', href: '/ops/vehicles', icon: Car },
    { name: 'All Bookings', href: '/ops/bookings', icon: Calendar },
    { name: 'Payment Ledger', href: '/ops/payments', icon: CreditCard },
    { name: 'Refund Ledger', href: '/ops/refunds', icon: RefreshCw },
    { name: 'KYC Queue', href: '/ops/kyc', icon: FileText },
    { name: 'Reviews Moderation', href: '/ops/reviews', icon: Star },
    { name: 'Dispute Resolution', href: '/ops/disputes', icon: AlertOctagon },
    { name: 'Safety & Incidents', href: '/ops/safety', icon: ShieldCheck },
    { name: 'BI & Analytics', href: '/ops/analytics', icon: Activity },
    { name: 'Finance & Escrow', href: '/ops/finance', icon: CreditCard },
    { name: 'Promotions & Coupons', href: '/ops/promotions', icon: Star },
    { name: 'Demand Intelligence', href: '/ops/demand', icon: Activity },
    { name: 'Conversion Funnel', href: '/ops/funnel', icon: Activity },
    { name: 'Notifications', href: '/ops/notifications', icon: Bell },
    { name: 'System Health', href: '/ops/system-health', icon: Activity },
    { name: 'Immutable Audit Logs', href: '/ops/audit-logs', icon: FileText },
    { name: 'Ops Settings', href: '/ops/settings', icon: Settings },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row antialiased selection:bg-brand-orange selection:text-white">
        {/* ONE Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <Link href="/ops/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-base font-heading tracking-tight flex items-center gap-1">
                  Ride<span className="text-emerald-600">Setu</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300">
                    Ops
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Enterprise Operations</p>
              </div>
            </Link>
          </div>

          {/* Admin User Card */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-1.5">
            <div className="font-extrabold text-xs text-slate-900 truncate">{user?.name || 'Master Admin'}</div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300">
                Super Admin
              </span>
              <span className="text-slate-500 font-semibold">Session Active</span>
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
                      ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-300 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
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
              <Compass className="w-4 h-4 text-brand-orange" /> Public Marketplace View
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
          <Link href="/ops/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-base font-heading">
              Ride<span className="text-emerald-600">Setu</span> Operations
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200"
            aria-label="Open Operations Navigation"
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
                <span className="font-black text-slate-900 text-sm font-heading">Operations Console</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="min-w-[44px] min-h-[44px] p-2 text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-xs text-slate-900 truncate">{user?.name || 'Master Admin'}</div>
                <div className="text-[10px] text-emerald-700 uppercase font-black">Super Admin</div>
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
                          ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-300'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
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
        <main className="flex-1 bg-slate-100 min-h-screen p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
};

export default AdminLayout;
