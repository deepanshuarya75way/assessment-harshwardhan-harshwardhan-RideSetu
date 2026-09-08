import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, PhoneCall, Mail, MapPin, Heart, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Trust Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-white/10 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">100% Verified Partners</div>
              <p className="text-slate-400 mt-0.5">Every local vendor passes physical trade, permit and RC verification.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <span className="font-black text-sm">₹0</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm">Zero Hidden Charges</div>
              <p className="text-slate-400 mt-0.5">Transparent bills separating rental fee and 100% refundable deposit.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Digital Handover</div>
              <p className="text-slate-400 mt-0.5">Pre-ride 360 photo inspections protect you from false damage claims.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">24/7 Roadside SOS</div>
              <p className="text-slate-400 mt-0.5">Instant emergency helpline and mechanical support across mountain trails.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-white/10 text-xs">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center font-black text-white text-sm">
                RS
              </div>
              <span className="text-xl font-bold font-heading text-white">RideSetu</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              RideSetu is India leading verified travel mobility marketplace aggregating trusted local vehicle rental businesses across Himalayan tourist destinations.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-orange" /> Tapovan Hub, Rishikesh, Uttarakhand 249192
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-brand-orange" /> Roadside SOS Helpline: 1800-RIDESETU (Demo: +91 98765 00000)
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-orange" /> support@ridesetu.demo
              </div>
            </div>
          </div>

          {/* Destinations */}
          <div className="space-y-2.5">
            <div className="font-bold text-white text-sm">Destinations</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/destinations/rishikesh" className="hover:text-brand-orange">Rishikesh Rentals</Link></li>
              <li><Link href="/destinations/mussoorie" className="hover:text-brand-orange">Mussoorie Hills</Link></li>
              <li><Link href="/destinations/dehradun" className="hover:text-brand-orange">Dehradun Airport Hub</Link></li>
              <li><Link href="/destinations/nainital" className="hover:text-brand-orange">Nainital Lake Rides</Link></li>
              <li><Link href="/destinations/haridwar" className="hover:text-brand-orange">Haridwar Pilgrimage</Link></li>
              <li><Link href="/destinations/haldwani" className="hover:text-brand-orange">Haldwani / Kathgodam</Link></li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-2.5">
            <div className="font-bold text-white text-sm">Popular Fleet</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/vehicles?category=SCOOTER" className="hover:text-brand-orange">Honda Activa 6G Rentals</Link></li>
              <li><Link href="/vehicles?category=MOTORCYCLE" className="hover:text-brand-orange">Royal Enfield Classic 350</Link></li>
              <li><Link href="/vehicles?category=MOTORCYCLE" className="hover:text-brand-orange">Himalayan 450 Expeditions</Link></li>
              <li><Link href="/vehicles?category=CAR" className="hover:text-brand-orange">Mahindra Thar 4x4 Mountain</Link></li>
              <li><Link href="/vehicles?category=EV" className="hover:text-brand-orange">Ather & Ola Electric Scooters</Link></li>
              <li><Link href="/compare" className="hover:text-brand-orange font-semibold text-brand-orange">Compare All Vehicles</Link></li>
            </ul>
          </div>

          {/* Partner & Platform */}
          <div className="space-y-2.5">
            <div className="font-bold text-white text-sm">Partner Ecosystem</div>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/vendor" className="hover:text-brand-orange">Vendor Dashboard</Link></li>
              <li><Link href="/#partner-cta" className="hover:text-brand-orange">List Your Rental Fleet</Link></li>
              <li><Link href="/admin" className="hover:text-brand-orange">Admin Control Console</Link></li>
              <li><Link href="/dashboard" className="hover:text-brand-orange">Customer Live Companion</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-brand-orange">Digital Inspection Guide</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Links Bar */}
        <div className="pt-8 pb-4 flex flex-wrap items-center justify-between gap-4 text-xs border-b border-white/10 text-slate-400">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terms" className="hover:text-brand-orange transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-brand-orange transition-colors">Privacy Policy</Link>
            <Link href="/cancellation-policy" className="hover:text-brand-orange transition-colors">Cancellation Policy</Link>
            <Link href="/refund-policy" className="hover:text-brand-orange transition-colors">Refund & Deposit Policy</Link>
            <Link href="/rental-policy" className="hover:text-brand-orange transition-colors">Rental Guidelines</Link>
            <Link href="/safety" className="hover:text-brand-orange transition-colors">Rider Safety & SOS</Link>
            <Link href="/contact" className="hover:text-brand-orange transition-colors">Contact Support</Link>
          </div>
          <div className="text-[11px] text-slate-500">
            Controlled Pilot Mode • Uttarakhand
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} RideSetu Technologies. All rights reserved. Built for Himalayan Travel Mobility.
          </div>
          <div className="flex gap-4">
            <span className="text-slate-400">Compliant with Uttarakhand Transport & Rental Motor Cycle Scheme 1997</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
