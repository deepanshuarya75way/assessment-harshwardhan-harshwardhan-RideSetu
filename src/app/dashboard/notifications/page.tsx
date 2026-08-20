'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  Check,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const loadNotifications = React.useCallback(async (cat = activeTab, p = page) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customer/notifications?category=${cat}&page=${p}&limit=20`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
        if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
        if (data.pagination) setTotalPages(data.pagination.pages || 1);
      } else {
        // Fallback to legacy endpoint
        const fallbackRes = await fetch(`/api/notifications?category=${cat}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.notifications) setNotifications(fallbackData.notifications);
          if (typeof fallbackData.unreadCount === 'number') setUnreadCount(fallbackData.unreadCount);
        }
      }
    } catch (err) {
      console.error('Failed to load customer notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    loadNotifications(activeTab, page);
  }, [activeTab, page, loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/customer/notifications/read-all', { method: 'POST' }).catch(() => null);
      if (!res || !res.ok) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAll: true }),
        });
      }
      loadNotifications(activeTab, page);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch(`/api/customer/notifications/${id}/read`, { method: 'POST' }).catch(() => null);
      if (!res || !res.ok) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: id }),
        });
      }
      loadNotifications(activeTab, page);
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const getCategoryIcon = (type: string) => {
    if (type?.includes('BOOKING') || type?.includes('RIDE') || type?.includes('RENTAL')) {
      return <Calendar className="w-5 h-5 text-brand-orange" />;
    }
    if (type?.includes('PAYMENT') || type?.includes('REFUND') || type?.includes('DEPOSIT')) {
      return <CreditCard className="w-5 h-5 text-emerald-600" />;
    }
    if (type?.includes('DELIVERY') || type?.includes('PICKUP')) {
      return <Truck className="w-5 h-5 text-blue-600" />;
    }
    if (type?.includes('KYC') || type?.includes('ACCOUNT')) {
      return <ShieldCheck className="w-5 h-5 text-purple-600" />;
    }
    return <Bell className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
              Notifications {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-[#FF6B00] text-white text-xs font-bold">{unreadCount}</span>}
            </h1>
            <p className="text-xs text-slate-600 font-medium">Updates regarding your bookings, payments, and account activity.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors min-h-[44px]"
            >
              Mark All as Read
            </button>
          )}
          <button
            onClick={() => loadNotifications(activeTab, page)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'UNREAD', label: 'Unread' },
          { id: 'BOOKING', label: 'Bookings' },
          { id: 'PAYMENT', label: 'Payments' },
          { id: 'DELIVERY', label: 'Delivery' },
          { id: 'ACCOUNT', label: 'Account' },
          { id: 'SAFETY', label: 'Safety & Disputes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl border transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <DashboardSkeleton />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-800">No notifications found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">You&apos;re all caught up! New booking updates and messages will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const notifId = n.id || n._id;
            return (
              <div
                key={notifId}
                onClick={() => !n.read && handleMarkSingleRead(notifId)}
                className={`bg-white rounded-3xl border p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-orange-300 shadow-sm ${
                  !n.read ? 'border-orange-200 bg-orange-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                    !n.read ? 'bg-orange-100 text-[#FF6B00]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getCategoryIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">{n.title}</h4>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#FF6B00]"></span>}
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-slate-400 font-bold block pt-1">{formatDateTime(n.createdAt)}</span>
                  </div>
                </div>

                {n.link && (
                  <Link
                    href={n.link}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 shadow-sm flex items-center gap-1 min-h-[44px]"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs font-bold text-slate-600">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
