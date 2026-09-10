import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NutriTrack AI — Calorie & Activity Tracker',
    short_name: 'NutriTrack AI',
    description: 'Yapay zekâ destekli günlük kalori, makro, su ve aktivite takip uygulaması.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF8FF',
    theme_color: '#006948',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
