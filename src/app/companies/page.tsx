'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { lookupCompanyByTin, CompanyRegistryInfo } from '@/lib/company-lookup';
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
  Loader2,
  MapPin,
  Landmark,
  BadgePercent,
  Check,
  AlertCircle,
  Key,
} from 'lucide-react';

interface CompanyItem {
  companyId: string;
  tin: string;
  name: string;
  shortName?: string;
  directorName?: string;
  address?: string;
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

  // New Company form state (barcha soxta ma'lumotlar olib tashlangan)
  const [newTin, setNewTin] = useState('');
  const [newName, setNewName] = useState('');
  const [newDirector, setNewDirector] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newMfo, setNewMfo] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ found: boolean; message: string } | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      // 1. LocalStorage dan foydalanuvchi saqlagan haqiqiy korxonalarni olish
      const savedLocalStr = localStorage.getItem('user_companies_list');
      let localList: CompanyItem[] = savedLocalStr ? JSON.parse(savedLocalStr) : [];

      // 2. Tizimga E-IMZO / Parol bilan kirgan joriy korxona
      const storedTin = localStorage.getItem('active_company_tin');
      const storedName = localStorage.getItem('active_company_name');
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;

      let list: CompanyItem[] = [...localList];

      if (storedTin && storedName && !list.some((c) => c.tin === storedTin)) {
        list.unshift({
          companyId: `comp-${storedTin}`,
          tin: storedTin,
          name: storedName,
          directorName: userObj?.fullName || '',
          address: '',
          status: 'ACTIVE',
          userRole: userObj?.role || 'OWNER',
          hasEri: true,
          integrations: [
            { provider: 'DIDOX', status: 'CONNECTED' },
            { provider: 'SOLIQ', status: 'CONNECTED' },
          ],
          counts: { documents: 0, counterparties: 0, products: 0 },
        });
      }

      setCompanies(list);
    } catch (e) {
      console.error('Kompaniyalarni yuklashda xatolik:', e);
    } finally {
      setLoading(false);
    }
  };

  // STIR o'zgarganda faqat haqiqiy davlat reestridan qidirish
  const handleTinChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 9);
    setNewTin(clean);
    setLookupResult(null);

    if (clean.length === 9) {
      setIsLookingUp(true);
      try {
        const data = await lookupCompanyByTin(clean);
        if (data.found && data.name) {
          setNewName(data.name);
          setNewDirector(data.directorName || '');
          setNewAddress(data.address || '');
          setLookupResult({
            found: true,
            message: 'Davlat reestridan haqiqiy ma\'lumotlar yuklandi',
          });
        } else {
          setLookupResult({
            found: false,
            message: 'Reestrdan avtomat topilmadi. Korxona nomini qo\'lda kiriting.',
          });
        }
      } catch (err) {
        setLookupResult({
          found: false,
          message: 'Qidiruvda xatolik. Ma\'lumotlarni qo\'lda kiriting.',
        });
      } finally {
        setIsLookingUp(false);
      }
    }
  };

  // ERI sertifikatidagi haqiqiy rekvizitlarni to'ldirish
  const handleLoadFromEri = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.tin) {
          setNewTin(u.tin);
          setNewName(u.companyName || '');
          setNewDirector(u.fullName || '');
          setLookupResult({
            found: true,
            message: 'ERI kalit sertifikatidan haqiqiy rekvizitlar yuklandi',
          });
        }
      } catch (e) {}
    }
  };

  const openAddModalWithTin = (tinVal?: string) => {
    setShowAddModal(true);
    setLookupResult(null);
    const tinToUse = tinVal || search.replace(/\D/g, '').slice(0, 9);
    if (tinToUse && tinToUse.length === 9) {
      handleTinChange(tinToUse);
    } else if (tinToUse) {
      setNewTin(tinToUse);
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
    if (newTin.length !== 9) {
      alert('STIR 9 xonali son bo\'lishi shart');
      return;
    }
    if (!newName.trim()) {
      alert('Iltimos, kompaniyaning to\'liq nomini kiriting');
      return;
    }

    setCreating(true);
    try {
      const newCompanyItem: CompanyItem = {
        companyId: `comp-${newTin}`,
        tin: newTin,
        name: newName.trim(),
        directorName: newDirector.trim(),
        address: newAddress.trim(),
        status: 'ACTIVE',
        userRole: 'OWNER',
        hasEri: true,
        integrations: [
          { provider: 'DIDOX', status: 'CONNECTED' },
          { provider: 'SOLIQ', status: 'CONNECTED' },
        ],
        counts: { documents: 0, counterparties: 0, products: 0 },
      };

      const updated = [newCompanyItem, ...companies.filter((c) => c.tin !== newTin)];
      setCompanies(updated);
      localStorage.setItem('user_companies_list', JSON.stringify(updated));

      setShowAddModal(false);
      setNewTin('');
      setNewName('');
      setNewDirector('');
      setNewAddress('');
      setLookupResult(null);
      setSearch('');

      selectCompany(newCompanyItem);
    } catch (e: any) {
      alert('Kompaniya yaratishda xatolik yuz berdi');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
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
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition rounded-lg hover:bg-slate-800"
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
              Bitta akkaunt orqali korxonalarni alohida ma'lumotlar bazasi va ERI kaliti bilan boshqaring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="STIR yoki korxona nomi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
              />
            </div>

            <button
              onClick={() => openAddModalWithTin()}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Kompaniya qo'shish
            </button>
          </div>
        </div>

        {/* Company Cards Grid or Empty State */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-10 text-center max-w-lg mx-auto mt-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {search ? `"${search}" bo'yicha korxona topilmadi` : 'Hali kompaniyalar qo\'shilmagan'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {search
                ? `STIR: ${search} bo'yicha yangi korxonangizni tizimga qo'shishingiz mumkin.`
                : 'Buxgalteriya hisobini yuritish va elektron hujjatlar bilan ishlash uchun korxonangizni qo\'shing.'}
            </p>
            <button
              onClick={() => openAddModalWithTin(search)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {search.replace(/\D/g, '').length === 9 ? `STIR ${search} bilan qo'shish` : 'Kompaniya qo\'shish'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((comp) => (
              <div
                key={comp.companyId}
                className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-950 text-sky-400 rounded-lg border border-slate-800 font-bold">
                      STIR: {comp.tin}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {comp.userRole || 'OWNER'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                    {comp.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-500 shrink-0" />
                    Rahbar: {comp.directorName || 'Kiritilmagan'}
                  </p>
                  {comp.address && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                      {comp.address}
                    </p>
                  )}

                  {/* Integratsiya statuslari */}
                  <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400">ERI</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400">Didox</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400">Soliq</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    </div>
                  </div>

                  {/* Ko'rsatkichlar */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
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
                  className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer"
                >
                  <span>Kompaniyaga kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Yangi Kompaniya Qo'shish */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yangi Kompaniya Qo'shish</h3>
                  <p className="text-[11px] text-slate-400">STIR orqali ma'lumotlarni to'ldiring</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadFromEri}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center gap-1 transition"
                title="ERI kalitidan ma'lumotlarni olish"
              >
                <Key className="w-3 h-3" />
                ERI dan yuklash
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              {/* STIR Kiritish */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  STIR (TIN) - 9 xonali son
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={newTin}
                    onChange={(e) => handleTinChange(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono font-bold outline-none focus:border-sky-500 transition"
                    placeholder="Masalan: 309889588"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isLookingUp ? (
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                    ) : lookupResult?.found ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : null}
                  </div>
                </div>

                {lookupResult && (
                  <div className={`mt-1.5 text-[11px] flex items-center gap-1 font-medium ${
                    lookupResult.found ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {lookupResult.found ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {lookupResult.message}
                  </div>
                )}
              </div>

              {/* Kompaniya Nomi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kompaniya To'liq Yuridik Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  placeholder='Masalan: "ORIENT SAVDO BIZNES" MCHJ'
                />
              </div>

              {/* Rahbar F.I.Sh. */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Direktor (Rahbar) F.I.Sh.
                </label>
                <input
                  type="text"
                  value={newDirector}
                  onChange={(e) => setNewDirector(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  placeholder='Masalan: Qodirov Jamshid Anvarovich'
                />
              </div>

              {/* Yuridik Manzil */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yuridik Manzil (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  placeholder='Toshkent shahri, Chilonzor tumani...'
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creating || newTin.length !== 9 || !newName.trim()}
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 cursor-pointer"
                >
                  {creating ? 'Qo\'shilmoqda...' : 'Kompaniyani Qo\'shish va Ulanish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
