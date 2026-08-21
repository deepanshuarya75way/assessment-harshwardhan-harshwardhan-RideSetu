'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ArrowRight, RefreshCw, Store } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';

export default function PartnerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const loadNotifs = React.useCallback(async (cat = activeTab) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?category=${cat}`);
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Partner notifications load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadNotifs(activeTab);
  }, [activeTab, loadNotifs]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) loadNotifs(activeTab);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
              Partner Operations & KYC Alerts {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-xs font-bold">{unreadCount}</span>}
            </h1>
            <p className="text-xs text-slate-600 font-medium">Instant alerts for new customer bookings, digital inspection handovers, KYC verification, and payout settlements.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors min-h-[44px]"
            >
              Mark All Read
            </button>
          )}
          <button
            onClick={() => loadNotifs(activeTab)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: 'Unread' },
          { id: 'BOOKING', label: 'Bookings' },
          { id: 'PAYMENT', label: 'Payouts' },
          { id: 'ACCOUNT', label: 'KYC & Fleet' },
          { id: 'SAFETY', label: 'Safety & Emergency' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl border transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications found" description="Operational alerts and new booking requests will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 bg-white border rounded-3xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                !n.read ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  !n.read ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 font-heading">{n.title}</h4>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-amber-600"></span>}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 font-bold block pt-1">{formatDateTime(n.createdAt)}</span>
                </div>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-sm flex items-center gap-1 min-h-[44px]"
                >
                  <span>Open Operational Task</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
