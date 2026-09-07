'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

export default function AccountingLedgerPage() {
  const [activeTab, setActiveTab] = useState<'OSV' | 'JOURNAL' | 'CHART'>('OSV');
  const [osvData, setOsvData] = useState<any[]>([]);
  const [journalData, setJournalData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);

  // New Journal Entry state
  const [entryNumber, setEntryNumber] = useState(`JV-${Date.now().toString().slice(-4)}`);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [debitAccount, setDebitAccount] = useState('5110');
  const [creditAccount, setCreditAccount] = useState('4010');
  const [amount, setAmount] = useState('15000000');
  const [description, setDescription] = useState('Xaridordan bank hisobiga to\'lov kelib tushdi');

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      const [osvRes, journalRes, chartRes] = await Promise.all([
        api.get('/api/v1/accounting/reports/osv'),
        api.get('/api/v1/accounting/journal'),
        api.get('/api/v1/accounting/chart-of-accounts'),
      ]);
      setOsvData(osvRes.data || []);
      setJournalData(journalRes.data || []);
      setChartData(chartRes.data || []);
    } catch (e) {
      console.error('Buxgalteriya ma\'lumotlarini yuklashda xatolik:', e);
      setOsvData([]);
      setJournalData([]);
      setChartData([]);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/accounting/journal', {
        entryNumber,
        entryDate,
        description,
        lines: [
          {
            debitAccount,
            creditAccount,
            amount: Number(amount),
            comment: description,
          },
        ],
      });
      setShowAddEntryModal(false);
      loadAccountingData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Provodka kiritishda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Buxgalteriya Hisobi va Jurnallar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            BHMS (O'zbekiston) standartlari bo'yicha hisoblar rejasi, provodkalar va Aylanma-qoldiq vedomosti (OSV)
          </p>
        </div>

        <button
          onClick={() => setShowAddEntryModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Provodka kiritish
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('OSV')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'OSV'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Aylanma-Qoldiq Vedomosti (OSV)
        </button>
        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'JOURNAL'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Bosh Provodkalar Jurnali
        </button>
        <button
          onClick={() => setActiveTab('CHART')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'CHART'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Hisoblar Rejasi (BHMS)
        </button>
      </div>

      {/* Tab Content: OSV */}
      {activeTab === 'OSV' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-white">
              Barcha Schotlar Bo'yicha Aylanma va Yakuniy Qoldiq
            </span>
            <span className="text-[11px] text-slate-400">Valyuta: UZS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold text-[10px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Schot</th>
                  <th className="py-3 px-4">Hisob Nomi</th>
                  <th className="py-3 px-4 text-right">Debet Aylanma</th>
                  <th className="py-3 px-4 text-right">Kredit Aylanma</th>
                  <th className="py-3 px-4 text-right">Debet Qoldiq</th>
                  <th className="py-3 px-4 text-right">Kredit Qoldiq</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {osvData.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {row.code}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{row.name}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {Number(row.debitTurnover).toLocaleString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {Number(row.creditTurnover).toLocaleString('uz-UZ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {row.closingDebit > 0
                        ? Number(row.closingDebit).toLocaleString('uz-UZ')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {row.closingCredit > 0
                        ? Number(row.closingCredit).toLocaleString('uz-UZ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Journal */}
      {activeTab === 'JOURNAL' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800">
            {journalData.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-slate-800/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {entry.entryNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.entryDate).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{entry.description}</span>
                </div>

                <div className="space-y-1.5 pl-4 border-l-2 border-sky-500/40 my-2">
                  {entry.lines.map((line: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-emerald-400 font-bold">Dt {line.debitAccount}</span>
                        <span className="text-slate-600">—</span>
                        <span className="text-rose-400 font-bold">Kt {line.creditAccount}</span>
                        {line.comment && <span className="text-slate-400 font-sans text-[11px]">({line.comment})</span>}
                      </div>
                      <span className="font-bold text-white font-mono">
                        {Number(line.amount).toLocaleString('uz-UZ')} UZS
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Chart of Accounts */}
      {activeTab === 'CHART' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">
            O'zbekiston Respublikasi Buxgalteriya Hisobi Milliy Standarti (BHMS) Schotlar Rejasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { code: '5010', name: 'Milliy valyutadagi pul mablag\'lari (Kassa)', type: 'ASSET' },
              { code: '5110', name: 'Hisob-kitob schoti (Bank)', type: 'ASSET' },
              { code: '4010', name: 'Xaridorlar va buyurtmachilar bilan hisob-kitob', type: 'ASSET' },
              { code: '6010', name: 'Mollarni yetkazib beruvchilarga to\'lanadigan schotlar', type: 'LIABILITY' },
              { code: '6410', name: 'Byudjetga to\'lovlar bo\'yicha qarzlar (QQS)', type: 'LIABILITY' },
              { code: '9010', name: 'Tayyor mahsulotlarni sotishdan daromadlar', type: 'REVENUE' },
              { code: '9420', name: 'Ma\'muriy xarajatlar', type: 'EXPENSE' },
            ].map((acc) => (
              <div key={acc.code} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-sky-400">{acc.code}</span>
                  <p className="text-xs font-semibold text-white mt-0.5">{acc.name}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                  {acc.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Qo'lda Provodka Kiritish */}
      {showAddEntryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Qo'lda Buxgalteriya Provodkasi</h3>
            <p className="text-xs text-slate-400 mb-4">Debet va Kredit schotlari bo'yicha operatsiya kiritish</p>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Hujjat №</label>
                  <input
                    type="text"
                    required
                    value={entryNumber}
                    onChange={(e) => setEntryNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sana</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-emerald-400 font-bold mb-1">Debet Schot</label>
                  <input
                    type="text"
                    required
                    value={debitAccount}
                    onChange={(e) => setDebitAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                    placeholder="5110"
                  />
                </div>
                <div>
                  <label className="block text-xs text-rose-400 font-bold mb-1">Kredit Schot</label>
                  <input
                    type="text"
                    required
                    value={creditAccount}
                    onChange={(e) => setCreditAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-rose-400 text-xs font-mono font-bold outline-none focus:border-rose-500"
                    placeholder="6010"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Summa (UZS)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Mazmuni / Tavsif</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEntryModal(false)}
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
