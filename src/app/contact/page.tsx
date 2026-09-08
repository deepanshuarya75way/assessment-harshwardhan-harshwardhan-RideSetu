'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, MessageSquare, ArrowLeft, ShieldAlert, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
          <MessageSquare className="w-3.5 h-3.5" /> Support & Inquiries
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 font-heading">
          Get in Touch with RideSetu
        </h1>
        <p className="text-sm text-slate-600">
          Have questions about bookings, KYC verification, vendor onboarding, or roadside support?
        </p>
      </div>

      {/* Pilot Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="font-bold flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" /> Pilot Support Desk
        </div>
        <p>
          RideSetu is currently operating in controlled pilot mode across Uttarakhand destinations. Support requests submitted below are monitored by our pilot operations team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Operations & Helpdesk</h3>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Email Support</div>
                <div className="text-slate-600">support@ridesetu.com</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Operating Hours</div>
                <div className="text-slate-600">07:00 AM – 10:00 PM IST (Mon – Sun)</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Office Location</div>
                <div className="text-slate-600 italic">
                  Office location will be published before commercial launch.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm font-heading">Send Support Message</h3>
          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-bold text-emerald-950 text-sm">Message Sent Successfully</div>
              <p className="text-xs text-emerald-700">Thank you! Your inquiry has been received by the RideSetu support desk.</p>
              <button onClick={() => setSubmitted(false)} className="text-xs font-bold text-emerald-800 underline mt-2">Send Another Message</button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Name *</label>
                <input type="text" required placeholder="Aman Sharma" className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input type="email" required placeholder="aman@example.com" className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select className="w-full p-2.5 border rounded-xl bg-white">
                  <option>Booking & Cancellation Query</option>
                  <option>Driving Licence / KYC Assistance</option>
                  <option>Vendor Fleet Onboarding</option>
                  <option>Roadside Assistance Feedback</option>
                  <option>General Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Message *</label>
                <textarea required rows={3} placeholder="How can our team help you?" className="w-full p-2.5 border rounded-xl outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Submit Support Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
