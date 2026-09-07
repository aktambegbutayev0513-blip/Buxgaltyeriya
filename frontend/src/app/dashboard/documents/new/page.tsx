'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Building2,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  name: string;
  ikpuCode: string;
  unitCode: string;
  quantity: number;
  price: number;
  vatRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // Invoice header state
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [counterpartyTin, setCounterpartyTin] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');

  // Items table state
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      name: '',
      ikpuCode: '',
      unitCode: '1001',
      quantity: 1,
      price: 0,
      vatRate: 12,
    },
  ]);

  const [saving, setSaving] = useState(false);

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: '',
        ikpuCode: '',
        unitCode: '1001',
        quantity: 1,
        price: 0,
        vatRate: 12,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
  };

  const calculateTotalVat = () => {
    return items.reduce((sum, item) => {
      const itemSum = Number(item.quantity || 0) * Number(item.price || 0);
      return sum + (itemSum * Number(item.vatRate || 12)) / 100;
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTotalVat();
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber || !counterpartyTin || !counterpartyName) {
      alert('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    setSaving(true);

    try {
      // 1. Kontragentni yaratish yoki mavjudini olish
      let counterpartyId = '';
      try {
        const cpRes = await api.post('/api/v1/counterparties', {
          tin: counterpartyTin,
          name: counterpartyName,
        });
        counterpartyId = cpRes.data?.id;
      } catch (e: any) {
        // Agar allaqachon mavjud bo'lsa
        const listRes = await api.get(`/api/v1/counterparties?search=${counterpartyTin}`);
        counterpartyId = listRes.data?.[0]?.id;
      }

      if (!counterpartyId) {
        throw new Error('Kontragentni aniqlab bo\'lmadi');
      }

      const payload = {
        docType: 'FACTURA',
        docNumber,
        docDate,
        counterpartyId,
        items: items.map((it) => ({
          name: it.name,
          ikpuCode: it.ikpuCode,
          unitCode: it.unitCode,
          quantity: Number(it.quantity),
          price: Number(it.price),
          vatRate: Number(it.vatRate),
        })),
      };

      await api.post('/api/v1/documents', payload);
      router.push('/dashboard/documents');
    } catch (e: any) {
      alert(e.response?.data?.message || e.message || 'Hisob-fakturani saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Hujjatlar ro'yxatiga qaytish
        </button>

        <h2 className="text-xl font-black text-white">Yangi Elektron Hisob-Faktura</h2>
      </div>

      <form onSubmit={handleSaveInvoice} className="space-y-6">
        {/* Hujjat Rekvizitlari */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4">
            1. Asosiy Hujjat Ma'lumotlari
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hisob-faktura №</label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Hujjat Sanasi</label>
              <input
                type="date"
                required
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Xaridor STIRi</label>
              <input
                type="text"
                required
                value={counterpartyTin}
                onChange={(e) => {
                  setCounterpartyTin(e.target.value);
                  if (e.target.value.length === 9) {
                    setCounterpartyName(`"${e.target.value}" STIRli Hamkor MCHJ`);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Xaridor Nomi</label>
              <input
                type="text"
                required
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500 truncate"
              />
            </div>
          </div>
        </div>

        {/* Nomenklatura & Mahsulotlar Jadvali */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              2. Tovar va Xizmatlar (MXIK / IKPU)
            </h3>
            <button
              type="button"
              onClick={addItemRow}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Qator qo'shish
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/40 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Nomi</th>
                  <th className="py-2.5 px-3">MXIK (IKPU)</th>
                  <th className="py-2.5 px-3 w-20">Miqdor</th>
                  <th className="py-2.5 px-3 w-32">Narx (UZS)</th>
                  <th className="py-2.5 px-3 w-20">QQS %</th>
                  <th className="py-2.5 px-3 text-right">Jami summa</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {items.map((item) => {
                  const lineTotal =
                    Number(item.quantity) * Number(item.price) * (1 + Number(item.vatRate) / 100);
                  return (
                    <tr key={item.id}>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.ikpuCode}
                          onChange={(e) => updateItem(item.id, 'ikpuCode', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white font-mono outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white text-center outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.vatRate}
                          onChange={(e) => updateItem(item.id, 'vatRate', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white text-center outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {lineTotal.toLocaleString('uz-UZ')} UZS
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Jami Hisob-kitob bloki */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>QQS siz summa:</span>
                <span>{calculateSubtotal().toLocaleString('uz-UZ')} UZS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hisoblangan QQS (12%):</span>
                <span>{calculateTotalVat().toLocaleString('uz-UZ')} UZS</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-700">
                <span>JAMI TO'LOVGA:</span>
                <span className="text-sky-400">{calculateGrandTotal().toLocaleString('uz-UZ')} UZS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saqlanmoqda...' : 'Qoralama sifatida saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}
