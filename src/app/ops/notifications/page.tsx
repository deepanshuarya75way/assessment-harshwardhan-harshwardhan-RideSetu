'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function OpsNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const loadData = React.useCallback(async (cat = activeTab) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?category=${cat}`);
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Ops notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) loadData(activeTab);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
              Operations Control Alerts {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">{unreadCount}</span>}
            </h1>
            <p className="text-xs text-slate-600 font-medium">Critical system dispatches, vendor KYC applications, SOS alerts, and payment exception logs.</p>
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
            onClick={() => loadData(activeTab)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'ALL', label: 'All Operations' },
          { id: 'UNREAD', label: 'Unread' },
          { id: 'ACCOUNT', label: 'Vendors & KYC' },
          { id: 'BOOKING', label: 'Bookings' },
          { id: 'PAYMENT', label: 'Payments & Refunds' },
          { id: 'SAFETY', label: 'Safety & SOS Alerts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl border transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
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
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-800">No operational alerts</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Operations pipeline is clear! New vendor KYC submissions and SOS alerts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUrgent = n.priority === 'URGENT' || n.priority === 'HIGH';
            return (
              <div
                key={n._id}
                className={`p-5 bg-white border rounded-3xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                  isUrgent ? 'border-rose-300 bg-rose-50/20' : !n.read ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                    isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">{n.title}</h4>
                      {isUrgent && <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">URGENT</span>}
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
                    <span>Manage Incident</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
