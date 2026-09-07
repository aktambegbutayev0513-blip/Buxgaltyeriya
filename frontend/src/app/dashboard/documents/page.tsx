'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { EImzoClient, EImzoCert } from '@/lib/e-imzo';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  FileDown,
  ShieldCheck,
  Eye,
  Key,
} from 'lucide-react';

export default function DocumentsListPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'SIGNED' | 'SENT' | 'ACCEPTED'>('ALL');
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<EImzoCert[]>([]);
  const [selectedCert, setSelectedCert] = useState<string>('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
    EImzoClient.listAllCertificates().then((certs) => {
      setCertificates(certs);
      if (certs.length > 0) setSelectedCert(certs[0].serialNumber);
    });
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.get('/api/v1/documents');
      setDocuments(res.data || []);
    } catch (e) {
      console.error('Hujjatlarni yuklashda xatolik:', e);
      setDocuments([]);
    }
  };

  const openSignModal = (docId: string) => {
    setSigningDocId(docId);
    setShowSignModal(true);
  };

  const executeSigning = async () => {
    if (!signingDocId || !selectedCert) return;
    setSigningLoading(true);

    try {
      // 1. Backenddan xesh olish
      const hashRes = await api.get(`/api/v1/documents/${signingDocId}/sign-hash`);
      const hash = hashRes.data?.hash;
      if (!hash) throw new Error('Hujjat xeshi olinmadi');

      // 2. Mahalliy E-IMZO orqali imzolash
      const chosenCert = certificates.find((c) => c.serialNumber === selectedCert);
      if (!chosenCert) throw new Error('Tanlangan sertifikat topilmadi');

      const pkcs7 = await EImzoClient.signHash(hash, chosenCert.keyId);

      // 3. Imzoni backendga saqlash
      await api.post(`/api/v1/documents/${signingDocId}/sign`, {
        pkcs7Signature: pkcs7,
        certificateSerial: chosenCert.serialNumber,
        signerTin: chosenCert.tin,
        signerName: chosenCert.name,
        signerRole: 'DIREKTOR',
      });

      setShowSignModal(false);
      loadDocuments();
    } catch (e: any) {
      alert(e.response?.data?.message || e.message || 'Hujjatni imzolashda xatolik yuz berdi');
    } finally {
      setSigningLoading(false);
    }
  };

  const sendToDidox = async (docId: string) => {
    try {
      await api.post(`/api/v1/documents/${docId}/send`);
      loadDocuments();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Didoxga yuborishda xatolik yuz berdi');
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.counterparty?.name.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'ALL') return matchesSearch;
    if (activeTab === 'DRAFT') return matchesSearch && d.status === 'DRAFT';
    if (activeTab === 'SIGNED') return matchesSearch && d.status === 'SIGNED_LOCAL';
    if (activeTab === 'SENT') return matchesSearch && d.status === 'SENT';
    if (activeTab === 'ACCEPTED') return matchesSearch && d.status === 'ACCEPTED';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Elektron Hujjatlar va Fakturalar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Didox va Soliq orqali yuboriladigan barcha hisob-faktura, dalolatnoma va ishonchnomalar
          </p>
        </div>

        <Link
          href="/dashboard/documents/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Yangi Hisob-faktura
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Barchasi' },
            { id: 'DRAFT', label: 'Qoralamalar' },
            { id: 'SIGNED', label: 'Imzolangan' },
            { id: 'SENT', label: 'Yuborilgan' },
            { id: 'ACCEPTED', label: 'Qabul qilingan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Hujjat № yoki mijoz..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Turi / Raqami</th>
                <th className="py-3 px-4">Sana</th>
                <th className="py-3 px-4">Kontragent (STIR)</th>
                <th className="py-3 px-4 text-right">Summa (QQS bilan)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">ERI Imzo</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Hali elektron hujjatlar mavjud emas. Yangi hisob-faktura yarating.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>{doc.docNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(doc.docDate).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{doc.counterparty?.name || '-'}</p>
                      <p className="text-[10px] text-slate-500">STIR: {doc.counterparty?.tin || '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {Number(doc.totalAmount || 0).toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          doc.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'SENT'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : doc.status === 'SIGNED_LOCAL'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {doc.signatures && doc.signatures.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" />
                          {doc.signatures[0].signerName?.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Imzolanmagan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {doc.status === 'DRAFT' && (
                        <button
                          onClick={() => openSignModal(doc.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition"
                        >
                          <Key className="w-3 h-3" />
                          ERI Imzolash
                        </button>
                      )}

                      {doc.status === 'SIGNED_LOCAL' && (
                        <button
                          onClick={() => sendToDidox(doc.id)}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition shadow"
                        >
                          <Send className="w-3 h-3" />
                          Didoxga yuborish
                        </button>
                      )}

                      <a
                        href={`http://localhost:4000/api/v1/documents/${doc.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white inline-block transition"
                        title="PDF ko'rish / yuklab olish"
                      >
                        <FileDown className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: E-IMZO bilan imzolash */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">E-IMZO bilan Imzolash</h3>
                <p className="text-xs text-slate-400">Detached PKCS#7 kriptografik imzo</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold text-slate-300">
                Imzolovchi sertifikatni tanlang:
              </label>
              {certificates.map((cert) => (
                <label
                  key={cert.serialNumber}
                  className={`block p-3 rounded-xl border cursor-pointer transition ${
                    selectedCert === cert.serialNumber
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="signingCert"
                      value={cert.serialNumber}
                      checked={selectedCert === cert.serialNumber}
                      onChange={() => setSelectedCert(cert.serialNumber)}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-400">{cert.name}</p>
                      <p className="text-[11px] text-slate-400">{cert.companyName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        STIR: {cert.tin} | Seriya: {cert.serialNumber}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={executeSigning}
                disabled={signingLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {signingLoading ? 'Imzolanmoqda...' : 'Imzoni tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
