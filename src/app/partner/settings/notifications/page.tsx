'use client';

import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PartnerNotificationSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [marketingPromotions, setMarketingPromotions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/notifications/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setEmailNotifications(Boolean(data.preferences.emailNotifications));
            setBookingUpdates(Boolean(data.preferences.bookingUpdates));
            setMarketingPromotions(Boolean(data.preferences.marketingPromotions));
          }
        }
      } catch (err) {
        console.error('Failed to fetch partner preferences:', err);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSavedMessage(null);
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications, bookingUpdates, marketingPromotions }),
      });
      if (res.ok) {
        setSavedMessage('Partner notification preferences updated successfully.');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black font-heading text-slate-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-amber-600" /> Partner Operational Alert Settings
        </h1>
        <p className="text-xs text-slate-600 font-medium">Configure alert channels for new bookings, handover alerts, and payout notices.</p>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-semibold flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Critical partner alerts (KYC status updates, vehicle approval/rejection, customer safety SOS) cannot be disabled.</span>
        </div>

        <div className="space-y-4 divide-y divide-slate-100 text-xs font-bold">
          <div className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-slate-900 text-sm font-extrabold block">Email Notifications</span>
              <p className="text-slate-500 font-medium text-xs">Receive instant emails for new customer bookings and payout settlement statements.</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-slate-900 text-sm font-extrabold block">Fleet & Handover Alerts</span>
              <p className="text-slate-500 font-medium text-xs">Operational reminders for customer pickup time and vehicle return inspection deadlines.</p>
            </div>
            <input
              type="checkbox"
              checked={bookingUpdates}
              onChange={(e) => setBookingUpdates(e.target.checked)}
              className="w-5 h-5 accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all disabled:opacity-50 min-h-[44px]"
        >
          {saving ? 'Saving Preferences...' : 'Save Partner Preferences'}
        </button>
      </div>
    </div>
  );
}
