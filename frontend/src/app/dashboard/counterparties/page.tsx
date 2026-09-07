'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, Plus, Search, Building2, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [tin, setTin] = useState('');
  const [name, setName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [phone, setPhone] = useState('+998');

  useEffect(() => {
    loadCounterparties();
  }, []);

  const loadCounterparties = async () => {
    try {
      const res = await api.get('/api/v1/counterparties');
      setCounterparties(res.data || []);
    } catch (e) {
      console.error('Kontragentlarni yuklashda xatolik:', e);
      setCounterparties([]);
    }
  };

  const handleCreateCounterparty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/counterparties', { tin, name, directorName, phone });
      setShowAddModal(false);
      setTin('');
      setName('');
      setDirectorName('');
      setPhone('+998');
      loadCounterparties();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Kontragent qo\'shishda xatolik yuz berdi');
    }
  };

  const filtered = counterparties.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tin.includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Kontragentlar Boshqaruvi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Mijozlar, yetkazib beruvchilar va hamkorlar reyestri
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Kontragent qo'shish
        </button>
      </div>

      <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="STIR yoki korxona nomi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Counterparties Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
          Hali kontragentlar mavjud emas. Yangi mijoz yoki yetkazib beruvchi qo'shing.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 text-sky-400 rounded-lg border border-slate-700 font-bold">
                  STIR: {item.tin}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {item.type}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{item.name}</h3>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p>Rahbar: {item.directorName || '-'}</p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {item.phone || '-'}
                </p>
                {item.bankAccount && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Hisob: {item.bankAccount}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Yangi Kontragent Qo'shish</h3>
            <p className="text-xs text-slate-400 mb-4">STIR orqali korxona ma'lumotlarini kiritish</p>

            <form onSubmit={handleCreateCounterparty} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">STIR (TIN) - 9 xonali</label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={tin}
                  onChange={(e) => {
                    setTin(e.target.value);
                    if (e.target.value.length === 9) {
                      setName(`"${e.target.value}" STIRli Hamkor MCHJ`);
                      setDirectorName('Rustamov Dilshod');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500 font-mono"
                  placeholder="307123456"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Korxona Nomi</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Direktor F.I.Sh.</label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Telefon raqam</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
