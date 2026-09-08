import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RideSetu — Uttarakhand Travel Mobility Marketplace',
    short_name: 'RideSetu',
    description: 'Verified scooter, bike, and car rental marketplace across Himalayan travel destinations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#060D17',
    theme_color: '#FF6B00',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['travel', 'transportation', 'mobility'],
  };
}
