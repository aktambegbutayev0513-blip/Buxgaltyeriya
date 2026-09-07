'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Package, Plus, Search, Tag, Barcode, Layers } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [ikpuCode, setIkpuCode] = useState('06201001001000000');
  const [unitCode, setUnitCode] = useState('1001');
  const [price, setPrice] = useState('1000000');
  const [vatRate, setVatRate] = useState('12');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/v1/products');
      setProducts(res.data || []);
    } catch (e) {
      console.error('Mahsulotlarni yuklashda xatolik:', e);
      setProducts([]);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/products', {
        name,
        ikpuCode,
        unitCode,
        sellingPrice: Number(price),
        vatRate: Number(vatRate),
      });
      setShowAddModal(false);
      setName('');
      setPrice('0');
      loadProducts();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Mahsulot qo\'shishda xatolik yuz berdi');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ikpuCode.includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Mahsulotlar va Nomenklatura</h2>
          <p className="text-xs text-slate-400 mt-1">
            MXIK (IKPU) kodlari, o'lchov birliklari, QQS stavkalari va narxlar katalogi
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Mahsulot qo'shish
        </button>
      </div>

      <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Nomi yoki MXIK kodi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Nomi</th>
                <th className="py-3 px-4">MXIK (IKPU) Kodi</th>
                <th className="py-3 px-4 text-center">Birligi</th>
                <th className="py-3 px-4 text-right">Sotuv Narxi</th>
                <th className="py-3 px-4 text-center">QQS %</th>
                <th className="py-3 px-4 text-center">Qoldiq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    Hali mahsulot yoki xizmatlar mavjud emas. Yangi tovar qo'shing.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-sky-400" />
                      <span>{prod.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sky-400 font-semibold">{prod.ikpuCode}</td>
                    <td className="py-3.5 px-4 text-center">{prod.unitName || 'dona'}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {Number(prod.sellingPrice || 0).toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                        {prod.vatRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {prod.stockQuantity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Yangi Mahsulot / Xizmat</h3>
            <p className="text-xs text-slate-400 mb-4">MXIK va narx parametrlarini kiritish</p>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nomi</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  placeholder="Xizmat yoki tovar nomi..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">MXIK (IKPU) - 17 xonali kod</label>
                <input
                  type="text"
                  required
                  value={ikpuCode}
                  onChange={(e) => setIkpuCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sotuv Narxi (UZS)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">QQS Stavka (%)</label>
                  <input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-sky-500"
                  />
                </div>
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
