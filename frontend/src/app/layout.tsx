import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';
import Script from 'next/script';

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PerfilCRM',
  description: 'Sistema de Gestión Comercial y Acopio de Granos',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PerfilCRM',
  },
};

export const viewport = {
  themeColor: '#2D2D2D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 antialiased`}>
        {googleMapsKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`}
            strategy="beforeInteractive"
          />
        )}
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
