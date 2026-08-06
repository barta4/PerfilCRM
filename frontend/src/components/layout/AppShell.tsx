'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from './Navbar';
import { BrandingSync } from './BrandingSync';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  
  const isLoginPage = pathname === '/login';
  const isResetPage = pathname === '/reset-password';
  const isOutlook = pathname.startsWith('/outlook');
  const isPublicPage = isLoginPage || isResetPage || isOutlook;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOutlook) return; // Outlook handles its own auth
    
    if (!isAuthenticated() && !isPublicPage) {
      router.push('/login');
    }
    if (isAuthenticated() && isLoginPage) {
      router.push('/');
    }
  }, [isAuthenticated, isLoginPage, isPublicPage, isOutlook, router, mounted]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pureza-blue"></div>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <>
        <BrandingSync />
        {children}
      </>
    );
  }

  // Si no está autenticado y no es la página de login, no mostramos nada mientras redirige
  if (!isAuthenticated()) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pureza-blue"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BrandingSync />
      <Navbar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}
