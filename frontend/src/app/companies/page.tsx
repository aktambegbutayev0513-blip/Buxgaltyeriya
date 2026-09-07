'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Building2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Users,
  FileText,
  Briefcase,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface CompanyItem {
  companyId: string;
  tin: string;
  name: string;
  shortName?: string;
  directorName?: string;
  status: string;
  userRole: string;
  hasEri: boolean;
  integrations?: { provider: string; status: string }[];
  counts?: { documents: number; counterparties: number; products: number };
}

export default function CompaniesPortalPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Company form state
  const [newTin, setNewTin] = useState('');
  const [newName, setNewName] = useState('');
  const [newDirector, setNewDirector] = useState('');
  const [newPhone, setNewPhone] = useState('+998');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/companies');
      setCompanies(res.data || []);
    } catch (e) {
      console.error('Kompaniyalarni yuklashda xatolik:', e);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company: CompanyItem) => {
    localStorage.setItem('active_company_id', company.companyId);
    localStorage.setItem('active_company_name', company.name);
    localStorage.setItem('active_company_tin', company.tin);
    localStorage.setItem('active_company_role', company.userRole);
    router.push('/dashboard');
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/v1/companies', {
        tin: newTin,
        name: newName,
        directorName: newDirector,
        phone: newPhone,
      });
      setShowAddModal(false);
      setNewTin('');
      setNewName('');
      setNewDirector('');
      loadCompanies();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Kompaniya yaratishda xatolik yuz berdi');
    } finally {
      setCreating(false);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tin.includes(search),
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">
                Yagona Buxgalteriya Platformasi
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Mening Kompaniyalarim Portali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/');
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" />
              Chiqish
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Boshqaruvdagi Korxonalar
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Bitta akkaunt orqali 50+ gacha kompaniyalarni alohida ma'lumotlar bazasi va ERI kaliti bilan boshqaring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="STIR yoki korxona nomi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/20 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Kompaniya qo'shish
            </button>
          </div>
        </div>

        {/* Company Cards Grid or Empty State */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center max-w-lg mx-auto mt-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hali kompaniyalar qo'shilmagan</h3>
            <p className="text-xs text-slate-400 mb-6">
              Buxgalteriya hisobini yuritish va elektron hujjatlar bilan ishlash uchun birinchi korxonangizni tizimga qo'shing.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Kompaniya qo'shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((comp) => {
              const isDidoxConnected = comp.integrations?.find((i) => i.provider === 'DIDOX')?.status === 'CONNECTED';
              const isSoliqConnected = comp.integrations?.find((i) => i.provider === 'SOLIQ')?.status === 'CONNECTED';

              return (
                <div
                  key={comp.companyId}
                  className="bg-slate-800/80 border border-slate-700/70 hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/5 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-900/80 text-sky-400 rounded-lg border border-slate-700 font-semibold">
                        STIR: {comp.tin}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {comp.userRole}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                      {comp.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      Rahbar: {comp.directorName || 'Kiritilmagan'}
                    </p>

                    {/* Integratsiya statuslari */}
                    <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 bg-slate-900/50 rounded-xl border border-slate-700/40 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">ERI</span>
                        {comp.hasEri ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-600 mt-0.5" />
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Didox</span>
                        {isDidoxConnected ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-600 mt-0.5" />
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Soliq</span>
                        {isSoliqConnected ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-600 mt-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Ko'rsatkichlar */}
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-700/50">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        {comp.counts?.documents || 0} hujjat
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {comp.counts?.counterparties || 0} kontragent
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => selectCompany(comp)}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-700/70 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition duration-200"
                  >
                    <span>Kompaniyaga kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Yangi Kompaniya Qo'shish */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Yangi Kompaniya Qo'shish</h3>
            <p className="text-xs text-slate-400 mb-4">
              Korxona STIRini kiriting. Tizim avtomatik tarzda korxona ma'lumotlarini yuklaydi.
            </p>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  STIR (TIN) - 9 xonali
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={newTin}
                  onChange={(e) => {
                    setNewTin(e.target.value);
                    if (e.target.value.length === 9) {
                      setNewName(`"INNOVATSIYA SERVIS" MCHJ`);
                      setNewDirector('Aliyev Vali Karimboyevich');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-sky-500"
                  placeholder="307123456"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kompaniya To'liq Nomi
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-sky-500"
                  placeholder='"BARAKA SAVDO" MCHJ'
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Direktor F.I.Sh.
                </label>
                <input
                  type="text"
                  value={newDirector}
                  onChange={(e) => setNewDirector(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-sky-500"
                  placeholder='Karimov Alisher...'
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/25"
                >
                  {creating ? 'Qo\'shilmoqda...' : 'Saqlash va Ulanish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
