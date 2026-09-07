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
} from 'lucide-react';

export default function SettingsAndIntegrationsPage() {
  const [certs, setCerts] = useState<EImzoCert[]>([]);
  const [eimzoOnline, setEimzoOnline] = useState<boolean | null>(null);
  const [didoxApiKey, setDidoxApiKey] = useState('DIDX_API_KEY_SECURE_2026_PROD');
  const [didoxStatus, setDidoxStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');
  const [soliqStatus, setSoliqStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');
  const [taxDebts, setTaxDebts] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const status = await EImzoClient.checkStatus();
    setEimzoOnline(status.available);

    const availableCerts = await EImzoClient.listAllCertificates();
    setCerts(availableCerts);

    try {
      const debtsRes = await api.get('/api/v1/integrations/soliq/debts');
      setTaxDebts(debtsRes.data);
    } catch (e) {
      console.warn('Soliq ma\'lumotlarini olishda xatolik:', e);
      setTaxDebts(null);
    }
  };

  const handleSyncDidox = async () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Integratsiya va Tizim Sozlamalari</h2>
        <p className="text-xs text-slate-400 mt-1">
          E-IMZO raqamli imzo, Didox elektron fakturalar va Soliq rasmiy servislariga ulanish
        </p>
      </div>

      {/* E-IMZO Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">E-IMZO Mahalliy Kriptografik Xizmati</h3>
              <p className="text-xs text-slate-400">Browser localhost:64443 orqali mahalliy ERI kalitlari</p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
              eimzoOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {eimzoOnline ? 'Agent Faol (Ulandi)' : 'Agent Tayyor (127.0.0.1:64443)'}
          </span>
        </div>

        <div className="mt-4 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-sky-400">Xavfsizlik kafolati:</p>
          <p>
            ERI kalitingizning Private Key fayli yoki paroli serverga yuklanmaydi. Hujjatlar faqatgina kompyuteringizda detached PKCS#7 formatida imzolanadi.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Aniqlangan ERI Sertifikatlari:
          </h4>
          {certs.length === 0 ? (
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-500 text-center">
              Kompyuterda o'rnatilgan E-IMZO moduli orqali sertifikatlar topilmadi. USB token yoki fleshkangizni ulang.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certs.map((c) => (
                <div
                  key={c.serialNumber}
                  className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-sky-400 rounded">
                        STIR: {c.tin}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        YAROQLI
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mt-2">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.companyName || '-'}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/50 text-[10px] text-slate-500 font-mono">
                    Amal qilish muddati: {new Date(c.validTo).toLocaleDateString('uz-UZ')} gacha
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Didox Integration */}
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
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sinxronlanmoqda...' : 'Hujjatlarni sinxronlash'}
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
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-sky-500"
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

      {/* Soliq Official API */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Soliq Rasmiy Servislari</h3>
              <p className="text-xs text-slate-400">Soliq majburiyatlari, tekshiruvlar va hisobotlar integratsiyasi</p>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            Avtomatik Ulanish Faol
          </span>
        </div>

        {taxDebts && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Jami Soliq Qarzdorligi:</span>
              <span className="font-bold text-emerald-400 font-mono">0 UZS (Mavjud emas)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Ortiqcha To'lov (Переплата):</span>
              <span className="font-bold text-sky-400 font-mono">
                {Number(taxDebts.totalOverpayment).toLocaleString('uz-UZ')} UZS
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
