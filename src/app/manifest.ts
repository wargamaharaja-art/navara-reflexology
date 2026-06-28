import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Navara Reflexology Admin & Clinic',
    short_name: 'Navara Reflexology',
    description: 'Aplikasi Reservasi & Manajemen Klinik Navara Reflexology',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/navara-logo.png',
        sizes: 'any',
        type: 'image/png',
      },
      // Idealnya tambahkan icon 192x192 dan 512x512 berformat kotak di masa mendatang
    ],
  };
}
