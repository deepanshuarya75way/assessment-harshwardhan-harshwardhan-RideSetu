import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CompareProvider } from '@/context/CompareContext';
import { ThemeProvider } from '@/context/ThemeContext';
import LayoutWrapper from '@/components/layouts/LayoutWrapper';

export const viewport: Viewport = {
  themeColor: '#FF6B00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'RideSetu — Verified Bike & Car Rentals in Uttarakhand',
    template: '%s | RideSetu',
  },
  description:
    'Book verified bikes, scooters and self-drive cars across Rishikesh, Mussoorie, Dehradun, Haridwar and Nainital with transparent prices and 100% deposit protection.',
  keywords: [
    'bike rental rishikesh',
    'scooty rental mussoorie',
    'car rental dehradun',
    'bike rental nainital',
    'self drive rental uttarakhand',
    'ridesetu travel mobility marketplace',
  ],
  authors: [{ name: 'RideSetu Technologies' }],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RideSetu',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'RideSetu',
    title: 'RideSetu — Verified Bike & Car Rentals in Uttarakhand',
    description: 'Book verified bikes, scooters and self-drive cars across Rishikesh, Mussoorie, Dehradun, Haridwar and Nainital.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RideSetu — Verified Bike & Car Rentals in Uttarakhand',
    description: 'Book verified bikes, scooties, and cars across Uttarakhand travel hubs with 360° digital handover.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-brand-orange selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            <CompareProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </CompareProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
