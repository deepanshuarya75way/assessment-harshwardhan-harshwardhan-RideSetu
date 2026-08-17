'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchWidget from '@/components/marketplace/SearchWidget';
import DiscoverySearchBar from '@/components/discovery/DiscoverySearchBar';
import VehicleCard from '@/components/marketplace/VehicleCard';
import StatCounter from '@/components/ui/StatCounter';
import ScrollReveal from '@/components/ui/ScrollReveal';
import CinematicHero from '@/components/home/cinematic/CinematicHero';
import { formatINR } from '@/lib/utils';
import {
  Compass,
  ShieldCheck,
  Star,
  MapPin,
  Car,
  Layers,
  Truck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  PhoneCall,
  Lock,
  ThumbsUp,
  FileCheck2,
  Store,
  HelpCircle,
  Clock,
  Award,
  Calendar,
  Gift,
} from 'lucide-react';

export default function HomePage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [destRes, vehRes] = await Promise.all([
          fetch('/api/destinations'),
          fetch('/api/vehicles?limit=8&sort=popular'),
        ]);

        const destData = await destRes.json();
        const vehData = await vehRes.json();

        if (destData.destinations) setDestinations(destData.destinations);
        if (vehData.vehicles) setFeaturedVehicles(vehData.vehicles);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const bikes = featuredVehicles.filter((v) => v.category === 'MOTORCYCLE');
  const scooters = featuredVehicles.filter((v) => v.category === 'SCOOTER');
  const cars = featuredVehicles.filter((v) => v.category === 'CAR');
  const evs = featuredVehicles.filter((v) => v.category === 'EV');

  const faqs = [
    {
      q: 'How is RideSetu different from traditional single-vendor rental apps?',
      a: 'RideSetu is India\'s verified multi-vendor marketplace. We aggregate trusted, legally licensed local rental partners across Himalayan destinations. This allows you to compare models, prices, security deposits, and customer ratings side-by-side in one place with zero hidden fees.',
    },
    {
      q: 'What is the Digital Vehicle Handover and how does it protect my deposit?',
      a: 'Before you start your ride, the partner agent conducts a 360° digital inspection recording existing scratches, fuel percentage, and odometer reading. You confirm via mutual sign-off. On return, a diff comparison ensures your deposit is refunded without false damage claims.',
    },
    {
      q: 'Can I get my rental scooter or bike delivered to my hotel or hostel?',
      a: 'Yes! Most verified partners on RideSetu offer doorstep delivery to hotels, hostels (like Zostel), railway stations, and airports for a nominal fee displayed transparently before checkout.',
    },
    {
      q: 'What documents are required to rent a vehicle?',
      a: 'A valid original Driving Licence and a Government ID (Aadhaar, Passport, or Voter ID). You can upload them digitally during checkout for instant 5-minute handover at pickup.',
    },
    {
      q: 'What happens in case of an emergency or breakdown in mountain areas?',
      a: 'Every active RideSetu rental includes 24/7 Roadside Assistance. You can press the "GET HELP / SOS" button in your live companion to instantly connect with our local mechanical dispatch unit or call 112 Emergency Services.',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-20 pb-16 w-full max-w-full overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* 1. Cinematic Animated Himalayan Hero Section */}
      <section className="relative pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24 md:pb-32 px-3 sm:px-6 lg:px-8 overflow-hidden text-white min-h-[620px] sm:min-h-[720px] md:min-h-[780px] w-full max-w-full flex items-center justify-center">
        <CinematicHero />

        <div className="w-full max-w-5xl mx-auto relative z-10 text-center space-y-4 sm:space-y-6 px-1 sm:px-4">
          <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-navy-950/85 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-extrabold text-brand-orange animate-stagger-1 shadow-xl max-w-[95%] mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Uttarakhand Verified Travel Mobility Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading text-white tracking-tight leading-[1.1] animate-stagger-2 drop-shadow-lg">
            Rent. Ride. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-amber-400 to-brand-saffron">
              Explore Himalayan Trails
            </span>
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl mx-auto animate-stagger-3 leading-relaxed drop-shadow">
            Book verified scooters, Himalayan expedition motorcycles, and self-drive SUVs with 100% deposit protection across Rishikesh, Mussoorie, Dehradun, Haridwar & Nainital.
          </p>

          <div className="pt-2 sm:pt-4 animate-stagger-4 w-full">
            <DiscoverySearchBar />
          </div>

          <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-slate-300 text-xs font-semibold">
            <Link
              href="/vehicles"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-dark hover:to-brand-orange text-white font-black text-xs shadow-lg shadow-brand-orange/30 flex items-center gap-2 group transition-all"
            >
              <span>Explore Rides</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Popular Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">Explore Hubs</div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Popular Destinations</h2>
          </div>
          <Link href="/vehicles" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
            <span>View All Hubs</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { name: 'Rishikesh', slug: 'rishikesh', count: '45+ Rides', img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=400&q=80' },
            { name: 'Mussoorie', slug: 'mussoorie', count: '38+ Rides', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=400&q=80' },
            { name: 'Dehradun', slug: 'dehradun', count: '52+ Rides', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=80' },
            { name: 'Nainital', slug: 'nainital', count: '30+ Rides', img: 'https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?auto=format&fit=crop&w=400&q=80' },
            { name: 'Haridwar', slug: 'haridwar', count: '28+ Rides', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=400&q=80' },
            { name: 'Haldwani', slug: 'haldwani', count: '24+ Rides', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' },
          ].map((d) => (
            <Link
              key={d.slug}
              href={`/destinations/${d.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] border border-slate-200 shadow-sm hover:shadow-xl transition-all"
            >
              <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-sm font-black font-heading leading-tight">{d.name}</div>
                <div className="text-[10px] text-amber-300 font-bold">{d.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Recommended For You & Category Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">Top Rated Rides</div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Recommended Vehicles</h2>
          </div>
          <Link href="/vehicles" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
            <span>Browse All Fleet</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-slate-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredVehicles.slice(0, 4).map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Category Sections: Bikes, Scooters, Cars, EVs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Expedition Bikes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Layers className="w-5 h-5 text-brand-orange" />
            <h3 className="text-xl font-black font-heading text-navy-950">Expedition Motorcycles</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(bikes.length > 0 ? bikes : featuredVehicles).slice(0, 4).map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Verified Partners & Why RideSetu */}
      <section className="bg-navy-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Trusted Marketplace
            </div>
            <h2 className="text-3xl font-black font-heading">Why Choose RideSetu?</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              We connect travellers with Uttarakhand&apos;s legal, verified rental operators under unified trust standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: '100% Deposit Escrow', desc: 'Security deposits remain isolated and strictly refundable based on verified digital handovers.' },
              { icon: FileCheck2, title: '360° Digital Inspection', desc: 'Mutual photographic check-in before pickup eliminates false damage disputes.' },
              { icon: Award, title: 'Legal & Verified Partners', desc: 'Every operator is background verified with valid rental transport permits.' },
              { icon: PhoneCall, title: '24/7 Mountain SOS', desc: 'On-demand roadside assistance and emergency mechanical dispatch across hill routes.' },
            ].map((f, i) => (
              <div key={i} className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                  <f.icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold font-heading text-white">{f.title}</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Trip Planner CTA & Loyalty Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-orange to-amber-500 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black">
              <Gift className="w-3.5 h-3.5" /> Himalayan Itinerary Assistant
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-heading">Plan Your Himalayan Road Trip</h3>
            <p className="text-xs text-white/90 max-w-xl font-medium">
              Get personalized vehicle recommendations, estimated rental costs, and suggested routes based on your destination and travellers.
            </p>
          </div>
          <Link
            href="/trip-planner"
            className="px-6 py-3.5 rounded-2xl bg-navy-950 hover:bg-slate-900 text-white font-black text-xs shadow-lg flex items-center gap-2 shrink-0 transition-colors"
          >
            <span>Launch Trip Planner</span>
            <ArrowRight className="w-4 h-4 text-brand-orange" />
          </Link>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-navy-950">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 font-medium">Everything you need to know about RideSetu rentals.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-extrabold text-xs text-slate-900 flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-brand-orange transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 font-medium border-t border-slate-100 pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
