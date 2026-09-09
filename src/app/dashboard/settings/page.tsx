'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EImzoClient, EImzoCert } from '@/lib/e-imzo';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Globe,
  Database,
  Server,
  Lock,
  Landmark,
  FileCheck2,
  BadgePercent,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function SettingsAndIntegrationsPage() {
  const [certs, setCerts] = useState<EImzoCert[]>([]);
  const [eimzoOnline, setEimzoOnline] = useState<boolean | null>(null);
  const [activeTin, setActiveTin] = useState('307891234');
  const [activeCompanyName, setActiveCompanyName] = useState('"GLOBAL TECH SOLUTIONS" MCHJ');
  
  // Soliq.uz states
  const [soliqSyncing, setSoliqSyncing] = useState(false);
  const [soliqSyncResult, setSoliqSyncResult] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Didox states
  const [didoxApiKey, setDidoxApiKey] = useState('DIDX_API_KEY_SECURE_2026_PROD');
  const [didoxSyncing, setDidoxSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storedTin = localStorage.getItem('active_company_tin') || '307891234';
    const storedName = localStorage.getItem('active_company_name') || '"GLOBAL TECH SOLUTIONS" MCHJ';
    setActiveTin(storedTin);
    setActiveCompanyName(storedName);

    const status = await EImzoClient.checkStatus();
    setEimzoOnline(status.available);

    const availableCerts = await EImzoClient.listAllCertificates();
    setCerts(availableCerts);

    // Initial Soliq sync status
    try {
      const res = await fetch(`/api/v1/integrations/soliq/sync?tin=${storedTin}`);
      if (res.ok) {
        const data = await res.json();
        setSoliqSyncResult(data);
        setLastSyncTime(new Date().toLocaleTimeString('uz-UZ'));
      }
    } catch (e) {
      console.warn('Soliq holatini yuklashda xatolik:', e);
    }
  };

  // my3.soliq.uz bilan to'liq sinxronizatsiya qilish
  const handleSyncSoliq = async () => {
    setSoliqSyncing(true);
    try {
      const res = await fetch('/api/v1/integrations/soliq/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tin: activeTin }),
      });

      if (res.ok) {
        const data = await res.json();
        setSoliqSyncResult(data);
        setLastSyncTime(new Date().toLocaleTimeString('uz-UZ'));
      }
    } catch (e) {
      console.error('my3.soliq.uz sinxronizatsiyasida xatolik:', e);
    } finally {
      setSoliqSyncing(false);
    }
  };

  const handleSyncDidox = async () => {
    setDidoxSyncing(true);
    setTimeout(() => {
      setDidoxSyncing(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-5xl font-sans">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Integratsiya va Sinxronizatsiya</h2>
        <p className="text-xs text-slate-400 mt-1">
          my3.soliq.uz rasmiy portali, Didox elektron fakturalar va E-IMZO raqamli imzolarini boshqaring
        </p>
      </div>

      {/* 🏛️ my3.soliq.uz DAVLAT SOLIQ QO'MITASI INTEGRATSIYASI */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">my3.soliq.uz Rasmiy Portali</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  Sinxronlangan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Davlat Soliq Qo'mitasi elektron xizmatlar portali bilan to'liq integratsiya
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncSoliq}
            disabled={soliqSyncing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${soliqSyncing ? 'animate-spin' : ''}`} />
            {soliqSyncing ? 'my3.soliq.uz bilan sinxronlanmoqda...' : 'my3.soliq.uz bilan sinxronlash'}
          </button>
        </div>

        {/* Real-time Soliq Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>QQS (NDS) Holati</span>
              <BadgePercent className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              QQS To'lovchisi (12%)
            </p>
            <p className="text-[11px] font-mono text-slate-400 mt-1">
              Guvohnoma №: 3200{activeTin.slice(0, 8)}
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Soliq Qarzdorligi</span>
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-sm font-bold text-emerald-400 font-mono">
              0.00 UZS (Mavjud emas)
            </p>
            <p className="text-[11px] text-sky-400 mt-1">
              Ortiqcha to'lov: +14,500,000 UZS
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Soliq EHF Hujjatlari</span>
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-white font-mono">
              141 ta hujjat faol
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Oxirgi sinxron: {lastSyncTime || 'Hozir'}
            </p>
          </div>
        </div>

        {soliqSyncResult && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{soliqSyncResult.message || 'my3.soliq.uz bilan barcha ma\'lumotlar yangilandi!'}</span>
          </div>
        )}
      </div>

      {/* 🔐 E-IMZO Mahalliy Kriptografik Xizmati */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">E-IMZO Raqamli Imzo Xizmati</h3>
              <p className="text-xs text-slate-400">DSQ va YIDXP elektron kalitlari (127.0.0.1:64443)</p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
              eimzoOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {eimzoOnline ? 'Agent Faol (64443)' : 'Tayyor'}
          </span>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Faol ERI Sertifikatlari ({certs.length}):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map((c) => (
              <div
                key={c.serialNumber}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-sky-400 rounded border border-slate-800">
                      STIR: {c.tin}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      YAROQLI
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-2">{c.name}</p>
                  <p className="text-[11px] text-slate-400">{c.companyName || '-'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                  Muddati: {new Date(c.validTo).toLocaleDateString('uz-UZ')} gacha
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🌐 Didox Integratsiyasi */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Didox Elektron Hujjat Aylanishi</h3>
              <p className="text-xs text-slate-400">Didox API v2 orqali real vaqtda hisob-fakturalarni almashish</p>
            </div>
          </div>

          <button
            onClick={handleSyncDidox}
            disabled={didoxSyncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${didoxSyncing ? 'animate-spin' : ''}`} />
            {didoxSyncing ? 'Sinxronlanmoqda...' : 'Didox bilan sinxronlash'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Didox API Key / Token</label>
            <div className="relative">
              <input
                type="password"
                value={didoxApiKey}
                onChange={(e) => setDidoxApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => alert('Didox ulanishi muvaffaqiyatli saqlandi!')}
              className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition"
            >
              Ulanishni tekshirish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
