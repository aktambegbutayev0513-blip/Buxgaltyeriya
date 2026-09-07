'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Package,
  Settings,
  ArrowLeftRight,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { EImzoClient } from '@/lib/e-imzo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [companyName, setCompanyName] = useState('Yuklanmoqda...');
  const [companyTin, setCompanyTin] = useState('');
  const [companyRole, setCompanyRole] = useState('ACCOUNTANT');
  const [eimzoAvailable, setEimzoAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('active_company_name');
      const storedTin = localStorage.getItem('active_company_tin');
      const storedRole = localStorage.getItem('active_company_role');

      if (!storedName) {
        router.push('/companies');
        return;
      }

      setCompanyName(storedName);
      setCompanyTin(storedTin || '');
      setCompanyRole(storedRole || 'ACCOUNTANT');

      // Check E-IMZO health
      EImzoClient.checkStatus().then((status) => {
        setEimzoAvailable(status.available);
      });
    }
  }, [router]);

  const navItems = [
    { label: 'Boshqaruv Paneli', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Elektron Hujjatlar', href: '/dashboard/documents', icon: FileText },
    { label: 'Buxgalteriya & OSV', href: '/dashboard/accounting', icon: BookOpen },
    { label: 'Kontragentlar', href: '/dashboard/counterparties', icon: Users },
    { label: 'Mahsulotlar & MXIK', href: '/dashboard/products', icon: Package },
    { label: 'Integratsiya & ERI', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Active Company Badge & Switcher */}
          <div className="p-4 border-b border-slate-800">
            <Link
              href="/companies"
              className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate group-hover:text-sky-400 transition">
                    {companyName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    STIR: {companyTin}
                  </p>
                </div>
              </div>
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* E-IMZO Status & User Info */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={`w-4 h-4 ${
                  eimzoAvailable ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <span className="text-[11px] font-medium text-slate-300">
                E-IMZO Agent
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                eimzoAvailable
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {eimzoAvailable ? 'FAOL' : 'TAYYOR'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs">
              <p className="font-semibold text-white">Buxgalteriya</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono">
                Rol: {companyRole}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/');
              }}
              className="text-slate-400 hover:text-rose-400 transition p-1"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Faol Korxona:
            </span>
            <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              {companyName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Didox / Soliq: Sinxronlangan
            </div>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
