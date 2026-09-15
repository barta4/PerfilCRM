'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Calendar, MapPin, ClipboardList,
  BarChart3, Settings, ChevronDown, Menu, X, LogOut,
  FileText, Mail, Package, ShieldCheck, Bot, Building2, Calculator, FileCode
} from 'lucide-react';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { useAuthStore } from '@/store/authStore';
import { useModuleStore } from '@/store/moduleStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguageStore, SupportedLanguage } from '@/store/languageStore';
import { ChatWidget } from '@/components/ai/ChatWidget';

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((s: any) => s.user);
  const logout = useAuthStore((s: any) => s.logout);
  const hasModule = useAuthStore((s: any) => s.hasModule);
  const { fetchModules, isModuleEnabled } = useModuleStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'PG';

  const menuItems = [
    {
      label: t('nav.dashboard', 'Inicio'),
      href: '/',
      icon: LayoutDashboard,
      type: 'direct',
      moduleId: 'dashboard',
    },
    {
      label: t('nav.comercial', 'Comercial'),
      icon: Users,
      type: 'dropdown',
      items: [
        { label: t('nav.clients', 'Clientes y Terceros'), href: '/clients', icon: Users, moduleId: 'crm_clients' },
        { label: t('nav.quotations', 'Cotizaciones / Órdenes'), href: '/quotations', icon: FileText, moduleId: 'sales_quotations' },
        { label: t('nav.campaigns', 'Campañas de Correo'), href: '/campaigns', icon: Mail, moduleId: 'email_campaigns' },
        { label: t('nav.accounting', 'Contabilidad Uruguay'), href: '/accounting', icon: Calculator, moduleId: 'accounting_uruguay' },
      ]
    },
    {
      label: t('nav.operations', 'Operaciones'),
      icon: Calendar,
      type: 'dropdown',
      items: [
        { label: t('nav.events', 'Agenda'), href: '/events', icon: Calendar, moduleId: 'ops_events' },
        { label: t('nav.visits', 'Visitas y Comunicaciones'), href: '/visits', icon: MapPin, moduleId: 'comms_visits' },
        { label: t('nav.tasks', 'Tareas'), href: '/tasks', icon: ClipboardList, moduleId: 'ops_tasks' },
        { label: t('nav.inventory', 'Inventario'), href: '/inventory', icon: Package, moduleId: 'inventory_stock' },
        { label: t('nav.inspections', 'Inspecciones'), href: '/inspections', icon: ShieldCheck, moduleId: 'inspections_field' },
      ]
    },
    {
      label: t('nav.reports', 'Reportes'),
      href: '/reports',
      icon: BarChart3,
      type: 'direct',
      moduleId: 'reports_bi',
    },
    {
      label: t('nav.admin', 'Administración'),
      icon: Settings,
      type: 'dropdown',
      items: [
        { label: t('nav.general_settings', 'Ajustes Generales'), href: '/admin', icon: Settings, moduleId: 'admin' },
        { label: t('nav.modules', 'Módulos del Sistema'), href: '/admin/modules', icon: Settings, moduleId: 'admin' },
        { label: t('nav.pdf_templates', 'Plantillas PDF'), href: '/admin/pdf-templates', icon: FileCode, moduleId: 'admin' },
        { label: t('nav.custom_fields', 'Campos Extra'), href: '/admin/custom-fields', icon: Settings, moduleId: 'admin' },
      ]
    }
  ];

  // Filtramos el menú según módulos habilitados en el sistema y permisos de usuario
  const filteredMenuItems = menuItems.map(menu => {
    if (menu.type === 'direct') {
      if (menu.moduleId && menu.moduleId !== 'dashboard' && !isModuleEnabled(menu.moduleId)) return null;
      return hasModule(menu.moduleId!) ? menu : null;
    }
    const visibleItems = menu.items!.filter(item => {
      if (item.moduleId && item.moduleId !== 'admin' && !isModuleEnabled(item.moduleId)) return false;
      return hasModule(item.moduleId!);
    });
    if (visibleItems.length === 0) return null;
    return { ...menu, items: visibleItems };
  }).filter(Boolean);

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const companyName = settings.find((s: any) => s.key === 'company_name')?.value || 'PerfilCRM';
  const companyLogo = settings.find((s: any) => s.key === 'company_logo')?.value || '';
  const accentColor = settings.find((s: any) => s.key === 'theme_accent_color')?.value || '#FFBE00';
  const navbarBg = settings.find((s: any) => s.key === 'theme_navbar_bg')?.value || '#2D2D2D';

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href);
  };

  const isGroupActive = (items: any[]) => {
    return items.some(item => isLinkActive(item.href));
  };

  return (
    <nav style={{ backgroundColor: navbarBg, borderColor: accentColor }} className="sticky top-0 z-40 shadow-md border-b-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand (Dynamic Company Logo) */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            {companyLogo ? (
              <img
                src={`/api/documents/${companyLogo}`}
                alt={companyName}
                className="h-9 max-w-[150px] object-contain group-hover:scale-105 transition-transform"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              <div
                style={{ backgroundColor: accentColor, color: '#2D2D2D' }}
                className="px-3 py-1.5 rounded-lg font-black text-sm shadow-md group-hover:scale-105 transition-transform uppercase tracking-wider"
              >
                {companyName ? companyName.substring(0, 4).toUpperCase() : 'CRM'}
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {filteredMenuItems.map((menu: any) => {
              if (menu.type === 'direct') {
                const active = isLinkActive(menu.href!);
                return (
                  <Link
                    key={menu.href}
                    href={menu.href!}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2",
                      active
                        ? "text-[#FFBE00] border-[#FFBE00] bg-white/5"
                        : "text-white/80 border-transparent hover:text-white hover:bg-white/5"
                    )}
                  >
                    <menu.icon className="w-4 h-4 shrink-0" />
                    <span>{menu.label}</span>
                  </Link>
                );
              }

              const groupActive = isGroupActive(menu.items!);
              return (
                <div key={menu.label} className="relative group">
                  <button
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2",
                      groupActive
                        ? "text-[#FFBE00] border-[#FFBE00] bg-white/5"
                        : "text-white/80 border-transparent hover:text-white hover:bg-white/5"
                    )}
                  >
                    <menu.icon className="w-4 h-4 shrink-0" />
                    <span>{menu.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:rotate-180 transition-transform" />
                  </button>

                  {/* Dropdown content */}
                  <div className="absolute top-full left-0 w-56 pt-1 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-150 z-50">
                    <div className="bg-[#2D2D2D] border border-white/10 shadow-xl p-1.5 space-y-0.5">
                      {menu.items!.map((item: any) => {
                        const active = isLinkActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                              active
                                ? "bg-white/10 text-[#FFBE00]"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <item.icon className="w-4 h-4 shrink-0 text-[#FFBE00]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Header actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <NotificationPanel />

            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/10 text-xs font-bold text-white">
              <span className="text-amber-400">🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold uppercase text-xs"
              >
                <option value="es" className="bg-slate-800 text-white">🇪🇸 ES</option>
                <option value="en" className="bg-slate-800 text-white">🇺🇸 EN</option>
                <option value="pt" className="bg-slate-800 text-white">🇧🇷 PT</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 pl-3 border-l border-white/10 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#FFBE00] text-[#2D2D2D] flex items-center justify-center text-xs font-black shadow-inner shrink-0 overflow-hidden relative">
                {user?.imageUrl && user.imageUrl !== 'Avatar' ? (
                  <img
                    src={`/api/documents/${user.imageUrl}`}
                    alt=""
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : null}
                <span>{initials}</span>
              </div>
              <div className="text-xs text-left shrink-0">
                <p className="font-bold text-white leading-tight">{user?.name || 'Usuario'}</p>
                <p className="text-[#98D500] leading-tight capitalize mt-0.5 font-semibold">{user?.role || 'sales'}</p>
              </div>
              <button
                onClick={logout}
                className="ml-1 p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-rose-400 transition-colors shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <NotificationPanel />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#2D2D2D] px-4 py-3 space-y-3 shadow-inner">
          <div className="space-y-1">
            {filteredMenuItems.map((menu: any) => {
              if (menu.type === 'direct') {
                const active = isLinkActive(menu.href!);
                return (
                  <Link
                    key={menu.href}
                    href={menu.href!}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-bold uppercase tracking-wider transition-colors",
                      active
                        ? "bg-white/10 text-[#FFBE00] border-l-4 border-[#FFBE00]"
                        : "text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                    )}
                  >
                    <menu.icon className="w-5 h-5 shrink-0" />
                    <span>{menu.label}</span>
                  </Link>
                );
              }

              return (
                <div key={menu.label} className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/40">
                    <menu.icon className="w-4 h-4 shrink-0" />
                    <span>{menu.label}</span>
                  </div>
                  <div className="pl-4 border-l border-white/10 space-y-1 ml-5">
                    {menu.items!.map((item: any) => {
                      const active = isLinkActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-none text-sm font-bold uppercase tracking-wider transition-colors",
                            active
                              ? "bg-white/10 text-[#FFBE00]"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <item.icon className="w-4 h-4 shrink-0 text-[#FFBE00]" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Profile & Logout */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFBE00] text-[#2D2D2D] flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="text-xs text-left">
                <p className="font-bold text-white">{user?.name || 'Usuario'}</p>
                <p className="text-[#98D500] capitalize">{user?.role || 'sales'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-xs font-bold uppercase tracking-wider hover:bg-rose-500 hover:border-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}

      {/* Global AI Chat Widget */}
      {isModuleEnabled('ai_automation') && <ChatWidget />}
    </nav>
  );
}
