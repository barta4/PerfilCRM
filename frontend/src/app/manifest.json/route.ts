import { NextResponse } from 'next/server';

export async function GET() {
  let companyName = 'PerfilCRM';

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const res = await fetch(`${apiUrl}/settings/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.company_name && data.company_name.trim()) {
        companyName = data.company_name.trim();
      }
    }
  } catch {
    // Fallback if backend fetch fails
  }

  const fullName = companyName.toLowerCase().includes('crm')
    ? companyName
    : `${companyName} CRM`;

  return NextResponse.json({
    name: fullName,
    short_name: companyName,
    description: `Sistema de Gestión Comercial — ${companyName}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#2D2D2D',
    theme_color: '#2D2D2D',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  });
}
