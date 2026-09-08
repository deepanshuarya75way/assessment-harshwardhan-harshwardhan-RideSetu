import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ridesetu.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/vehicles', '/destinations/*', '/compare', '/terms', '/privacy', '/cancellation-policy', '/refund-policy', '/rental-policy', '/safety', '/contact'],
        disallow: ['/admin', '/admin/*', '/vendor/*', '/dashboard/*', '/api/*'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
