'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EImzoClient, EImzoCert } from '@/lib/e-imzo';
import { ShieldCheck, Key, Lock, Phone, ArrowRight, Building2, FileCheck2, Cpu } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'password' | 'eimzo'>('password');
  
  // Password auth state
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // E-IMZO auth state
  const [certificates, setCertificates] = useState<EImzoCert[]>([]);
  const [selectedCert, setSelectedCert] = useState<string>('');
  const [eimzoLoading, setEimzoLoading] = useState(false);

  useEffect(() => {
    loadEImzoCertificates();
  }, []);

  const loadEImzoCertificates = async () => {
    try {
      const certs = await EImzoClient.listAllCertificates();
      setCertificates(certs);
      if (certs.length > 0) {
        setSelectedCert(certs[0].serialNumber);
      }
    } catch (e) {
      console.error('ERI sertifikatlarini yuklashda xatolik:', e);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/v1/auth/login', { phone, password });
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/companies');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Telefon raqam yoki parol noto\'g\'ri';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEImzoLogin = async () => {
    if (!selectedCert) {
      setError('Iltimos, E-IMZO kalitingizni tanlang');
      return;
    }

    setEimzoLoading(true);
    setError('');

    try {
      // 1. Serverdan challenge (nonce) olish
      const challengeRes = await api.post('/api/v1/eri/challenge');
      const challenge = challengeRes.data?.challenge;

      if (!challenge) {
        throw new Error('Serverdan bir martalik challenge olinmadi');
      }

      // 2. Lokal E-IMZO agentida imzolash
      const chosen = certificates.find((c) => c.serialNumber === selectedCert);
      if (!chosen) {
        throw new Error('Tanlangan sertifikat topilmadi');
      }

      const signature = await EImzoClient.signHash(btoa(challenge), chosen.keyId);

      // 3. Backendda imzoni tekshirish
      const verifyRes = await api.post('/api/v1/eri/verify-auth', {
        challenge,
        pkcs7Signature: signature,
        serialNumber: chosen.serialNumber,
        tin: chosen.tin,
      });

      if (verifyRes.data?.accessToken) {
        localStorage.setItem('access_token', verifyRes.data.accessToken);
      }
      localStorage.setItem('user', JSON.stringify(verifyRes.data?.user || { fullName: chosen.name, tin: chosen.tin }));

      router.push('/companies');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'E-IMZO orqali avtorizatsiyadan o\'tib bo\'lmadi';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setEimzoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Orqa fon bezagi */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-950 via-slate-900 to-indigo-950 opacity-90" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4 shadow-xl shadow-sky-500/10">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Yagona Buxgalteriya
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          O'zbekiston korxonalari uchun Multi-Tenant SaaS Platformasi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Auth Tablar */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/60 rounded-xl mb-6 border border-slate-700/50">
            <button
              onClick={() => setAuthMode('password')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === 'password'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Parol bilan kirish
            </button>
            <button
              onClick={() => setAuthMode('eimzo')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === 'eimzo'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              E-IMZO / ERI
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          {authMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Telefon raqam
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 transition duration-200"
              >
                {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-sky-950/40 border border-sky-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
                  <Cpu className="w-4 h-4" />
                  E-IMZO Mahalliy Agent (127.0.0.1:64443)
                </div>
                <p className="text-[11px] text-slate-400">
                  Sertifikatlaringiz brauzer orqali xavfsiz aniqlandi. Private Key serverga yuborilmaydi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Mavjud ERI Sertifikatini tanlang:
                </label>
                <div className="space-y-2">
                  {certificates.map((cert) => (
                    <label
                      key={cert.serialNumber}
                      className={`block p-3 rounded-xl border cursor-pointer transition ${
                        selectedCert === cert.serialNumber
                          ? 'bg-sky-500/15 border-sky-500 text-white'
                          : 'bg-slate-900/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="cert"
                          value={cert.serialNumber}
                          checked={selectedCert === cert.serialNumber}
                          onChange={() => setSelectedCert(cert.serialNumber)}
                          className="mt-1 text-sky-500 focus:ring-sky-500"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-sky-400">{cert.name}</p>
                          <p className="text-slate-400">{cert.companyName}</p>
                          <div className="flex gap-3 mt-1 text-[11px] text-slate-500">
                            <span>STIR: {cert.tin}</span>
                            <span>Seriya: {cert.serialNumber}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEImzoLogin}
                disabled={eimzoLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition duration-200"
              >
                <ShieldCheck className="w-5 h-5" />
                {eimzoLoading ? 'Imzolanmoqda...' : 'E-IMZO bilan tasdiqlash'}
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Hisobingiz yo'qmi?{' '}
            <Link href="/register" className="text-sky-400 hover:underline font-semibold">
              Ro'yxatdan o'tish
            </Link>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-slate-400 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <Building2 className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            <span>50+ Kompaniya</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span>E-IMZO / ERI</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <FileCheck2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span>Didox & Soliq</span>
          </div>
        </div>
      </div>
    </div>
  );
}
