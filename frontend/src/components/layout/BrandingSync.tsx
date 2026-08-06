'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function BrandingSync() {
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data).catch(() => []),
  });

  useEffect(() => {
    if (!Array.isArray(settings) || settings.length === 0) return;

    const nameSetting = settings.find((s: any) => s.key === 'company_name')?.value;
    if (nameSetting && nameSetting.trim() !== '') {
      const formattedTitle = nameSetting.toLowerCase().includes('crm')
        ? nameSetting.trim()
        : `${nameSetting.trim()} CRM`;
      document.title = formattedTitle;
    }

    const themeColorSetting = settings.find((s: any) => s.key === 'theme_navbar_bg')?.value;
    if (themeColorSetting) {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', themeColorSetting);
    }
  }, [settings]);

  return null;
}
