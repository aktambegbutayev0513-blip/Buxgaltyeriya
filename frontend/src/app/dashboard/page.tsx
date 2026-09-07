'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileCheck2,
  AlertCircle,
  TrendingUp,
  Plus,
  Send,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [kpi, setKpi] = useState({
    documentsCount: 0,
    counterpartiesCount: 0,
    productsCount: 0,
    bankBalance: 0,
    receivables: 0,
    payables: 0,
    totalRevenue: 0,
  });

  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, docsRes] = await Promise.all([
        api.get('/api/v1/accounting/dashboard-kpi'),
        api.get('/api/v1/documents'),
      ]);
      if (kpiRes.data) {
        setKpi(kpiRes.data);
      }
      if (docsRes.data) {
        setRecentDocuments(docsRes.data.slice(0, 5));
      }
    } catch (e) {
      console.warn('Dashboard ma\'lumotlarini yuklashda xatolik:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (num: number) => {
    return Number(num || 0).toLocaleString('uz-UZ') + ' UZS';
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Kompaniya Moliyaviy Boshqaruvi
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real vaqt rejimida buxgalteriya balansi, elektron hisob-fakturalar va integratsiya holati
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/documents/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Hisob-faktura yaratish
          </Link>
          <Link
            href="/dashboard/accounting"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <FileText className="w-4 h-4" />
            OSV Hisoboti
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Bank Qoldig'i (5110) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Bank Hisob Qoldig'i (5110)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-white tracking-tight">
            {formatUzs(kpi.bankBalance)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Hisob-kitob schoti faol</span>
          </div>
        </div>

        {/* Debitorlik Qarzdorligi (4010) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Debitorlik (Xaridorlar qarzi)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-emerald-400 tracking-tight">
            {formatUzs(kpi.receivables)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Sotilgan tovarlar bo'yicha</span>
          </div>
        </div>

        {/* Kreditorlik Qarzdorligi (6010) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Kreditorlik (Yetkazib beruvchilarga)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-rose-400 tracking-tight">
            {formatUzs(kpi.payables)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Xaridlar va xizmatlar bo'yicha</span>
          </div>
        </div>

        {/* Realizatsiya Daromadi (9010) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Jami Tushum / Daromad (9010)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-white tracking-tight">
            {formatUzs(kpi.totalRevenue)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400">
            <span>Yillik jami aylanma</span>
          </div>
        </div>
      </div>

      {/* Elektron Hujjatlar & Provodkalar Tezkor Jurnali */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* So'nggi Hujjatlar */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">So'nggi Elektron Hujjatlar</h3>
              <p className="text-xs text-slate-400">Didox va Soliq orqali yuborilgan/qabul qilingan hisob-fakturalar</p>
            </div>
            <Link
              href="/dashboard/documents"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              Barchasini ko'rish →
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentDocuments.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Hali hujjatlar mavjud emas. Yangi hisob-faktura yarating.
              </div>
            ) : (
              recentDocuments.map((doc, i) => (
                <div key={doc.id || i} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-sky-400">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{doc.docNumber}</p>
                      <p className="text-[11px] text-slate-400">{doc.counterparty?.name || 'Kontragent'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-white">
                      {Number(doc.totalAmount || 0).toLocaleString('uz-UZ')} UZS
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-0.5 ${
                        doc.status === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : doc.status === 'SENT'
                          ? 'bg-sky-500/10 text-sky-400'
                          : doc.status === 'SIGNED_LOCAL'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Integratsiya va E-IMZO Holati */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Integratsiya Portali</h3>
            <p className="text-xs text-slate-400 mb-5">Davlat va tijorat xizmatlari holati</p>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">E-IMZO Mahalliy Agent</p>
                    <p className="text-[10px] text-slate-400">127.0.0.1:64443 ulandi</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  AKTIV
                </span>
              </div>

              <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Didox Integration API</p>
                    <p className="text-[10px] text-slate-400">Hujjat aylanishi faol</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  ULANGAN
                </span>
              </div>

              <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Soliq Rasmiy Servislar</p>
                    <p className="text-[10px] text-slate-400">Majburiyatlar va hisobotlar</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  ULANGAN
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/dashboard/settings"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Sozlamalar va ERI kalitlari
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
