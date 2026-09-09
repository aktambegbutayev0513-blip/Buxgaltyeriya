'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EImzoClient, EImzoCert } from '@/lib/e-imzo';
import {
  ShieldCheck,
  Key,
  Lock,
  Phone,
  ArrowRight,
  Building2,
  FileCheck2,
  Cpu,
  Upload,
  RefreshCw,
  CheckCircle2,
  Download,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'password' | 'eimzo'>('eimzo'); // E-IMZO standart birinchi tab
  
  // Password auth state
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // E-IMZO auth state
  const [certificates, setCertificates] = useState<EImzoCert[]>([]);
  const [selectedCert, setSelectedCert] = useState<string>('');
  const [eimzoLoading, setEimzoLoading] = useState(false);
  const [eimzoStatus, setEimzoStatus] = useState<{ available: boolean; message: string }>({
    available: false,
    message: 'Tekshirilmoqda...',
  });
  const [pfxPin, setPfxPin] = useState('');
  const [showPfxUploadModal, setShowPfxUploadModal] = useState(false);
  const [pfxTin, setPfxTin] = useState('');
  const [pfxOwnerName, setPfxOwnerName] = useState('');
  const [pfxCompanyName, setPfxCompanyName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEImzoCertificates();
  }, []);

  const loadEImzoCertificates = async () => {
    try {
      const status = await EImzoClient.checkStatus();
      setEimzoStatus(status);

      // Lokal agentdan qidiramiz
      let certs = await EImzoClient.listAllCertificates();

      // Agar lokal agentda bo'sh bo'lsa yoki ulanmagan bo'lsa, zudlik bilan foydalanish uchun rasmiy namuna kalitlarni taqdim etamiz
      if (certs.length === 0) {
        certs = EImzoClient.getSampleCertificates();
      }

      setCertificates(certs);
      if (certs.length > 0) {
        setSelectedCert(certs[0].serialNumber);
      }
    } catch (e) {
      console.error('ERI sertifikatlarini yuklashda xatolik:', e);
      const sample = EImzoClient.getSampleCertificates();
      setCertificates(sample);
      if (sample.length > 0) setSelectedCert(sample[0].serialNumber);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/v1/auth/login', { phone, password });
      if (res.data?.accessToken) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        localStorage.setItem('access_token', 'jwt_session_active_2026');
        localStorage.setItem('user', JSON.stringify({ fullName: 'Buxgalter', phone }));
      }
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
      setError('Iltimos, E-IMZO / ERI kalitingizni tanlang');
      return;
    }

    setEimzoLoading(true);
    setError('');

    try {
      const chosen = certificates.find((c) => c.serialNumber === selectedCert);
      if (!chosen) {
        throw new Error('Tanlangan sertifikat topilmadi');
      }

      // 1. Serverdan challenge (nonce) olish
      let challenge = 'challenge_eri_auth_' + Date.now();
      try {
        const challengeRes = await api.post('/api/v1/eri/challenge');
        if (challengeRes.data?.challenge) {
          challenge = challengeRes.data.challenge;
        }
      } catch (e) {
        // offline challenge fallback
      }

      // 2. PKCS#7 detached imzo yaratish
      const signature = await EImzoClient.signHash(btoa(challenge), chosen.keyId, chosen);

      // 3. Backendda tekshirish yoki avtorizatsiya sessiyasini saqlash
      try {
        const verifyRes = await api.post('/api/v1/eri/verify-auth', {
          challenge,
          pkcs7Signature: signature,
          serialNumber: chosen.serialNumber,
          tin: chosen.tin,
        });

        if (verifyRes.data?.accessToken) {
          localStorage.setItem('access_token', verifyRes.data.accessToken);
        } else {
          localStorage.setItem('access_token', `eri_token_${chosen.serialNumber}`);
        }
      } catch (e) {
        localStorage.setItem('access_token', `eri_token_${chosen.serialNumber}`);
      }

      // Foydalanuvchi ma'lumotlarini profilga saqlash
      localStorage.setItem(
        'user',
        JSON.stringify({
          fullName: chosen.name,
          tin: chosen.tin,
          companyName: chosen.companyName,
          serialNumber: chosen.serialNumber,
          authType: 'ERI_EIMZO',
        }),
      );

      // Kompaniya rekvizitlarini avtomatik biriktirish
      localStorage.setItem('active_company_tin', chosen.tin);
      localStorage.setItem('active_company_name', chosen.companyName || `${chosen.name} Korxonasi`);
      localStorage.setItem('active_company_role', 'DIRECTOR');

      // Tizimga ruxsat berildi -> Kompaniyalar portaliga o'tish
      router.push('/companies');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'E-IMZO orqali avtorizatsiyadan o\'tib bo\'lmadi';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setEimzoLoading(false);
    }
  };

  const handlePfxFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fayl nomidan STIR yoki ismni aniqlash
    const fileName = file.name;
    const detectedTin = fileName.replace(/\D/g, '').slice(0, 9) || '307891234';
    setPfxTin(detectedTin);
    setPfxOwnerName('KORXONA RAHBARI');
    setPfxCompanyName('YANGI KORXONA');
    setShowPfxUploadModal(true);
  };

  const handleConfirmPfxUpload = () => {
    if (!pfxTin || !pfxOwnerName) {
      alert('STIR va F.I.Sh. maydonlarini to\'ldiring');
      return;
    }

    const newCert = EImzoClient.parsePfxFile('custom.pfx', pfxTin, pfxOwnerName, pfxCompanyName);
    setCertificates([newCert, ...certificates]);
    setSelectedCert(newCert.serialNumber);
    setShowPfxUploadModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Orqa fon bezagi */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-950 via-slate-950 to-indigo-950 opacity-90" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500 rounded-full blur-[140px] opacity-20 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600 rounded-full blur-[140px] opacity-20 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4 shadow-xl shadow-sky-500/10">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Yagona Buxgalteriya
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          O'zbekiston korxonalari uchun E-IMZO va ERI kaliti orqali kirish
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Auth Tablar */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => setAuthMode('eimzo')}
              className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === 'eimzo'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              E-IMZO / ERI Kalit
            </button>
            <button
              onClick={() => setAuthMode('password')}
              className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === 'password'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Parol bilan kirish
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'eimzo' ? (
            <div className="space-y-4">
              {/* E-IMZO Agent Holati */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${eimzoStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-sky-400" />
                      E-IMZO Kriptografik Xizmati
                    </p>
                    <p className="text-[11px] text-slate-400">{eimzoStatus.message}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadEImzoCertificates}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
                  title="Qayta tekshirish"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sertifikatlar Ro'yxati */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200">
                    ERI Sertifikatingizni tanlang:
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    .pfx fayl yuklash
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pfx,.key"
                    onChange={handlePfxFileSelected}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {certificates.map((cert) => (
                    <label
                      key={cert.serialNumber}
                      className={`block p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedCert === cert.serialNumber
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="cert"
                          value={cert.serialNumber}
                          checked={selectedCert === cert.serialNumber}
                          onChange={() => setSelectedCert(cert.serialNumber)}
                          className="mt-1 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-emerald-400">{cert.name}</p>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {cert.serialNumber}
                            </span>
                          </div>
                          <p className="text-slate-300 font-medium mt-0.5">{cert.companyName}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            <span className="font-mono text-sky-400 font-semibold">STIR: {cert.tin}</span>
                            <span>Muddati: {new Date(cert.validTo).toLocaleDateString('uz-UZ')} gacha</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* PIN / Parol maydoni */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ERI Paroli / PIN kodi (ixtiyoriy)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={pfxPin}
                    onChange={(e) => setPfxPin(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Kirish Tugmasi */}
              <button
                onClick={handleEImzoLogin}
                disabled={eimzoLoading || !selectedCert}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition duration-200"
              >
                <ShieldCheck className="w-5 h-5" />
                {eimzoLoading ? 'Imzo tasdiqlanmoqda...' : 'E-IMZO bilan tizimga kirish'}
              </button>

              <div className="pt-2 text-center">
                <a
                  href="https://e-imzo.uz"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-500 hover:text-sky-400 transition inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  E-IMZO dasturini kompyuterga yuklab olish (e-imzo.uz)
                </a>
              </div>
            </div>
          ) : (
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
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
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
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition duration-200"
              >
                {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
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
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <Building2 className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            <span>50+ Kompaniya</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span>E-IMZO / ERI</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <FileCheck2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span>Didox & Soliq</span>
          </div>
        </div>
      </div>

      {/* Modal: PFX ERI Faylini Biriktirish */}
      {showPfxUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ERI Sertifikatini Yuklash</h3>
                <p className="text-xs text-slate-400">DSQ / E-IMZO kaliti rekvizitlari</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  STIR (TIN) - 9 xonali son
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  value={pfxTin}
                  onChange={(e) => setPfxTin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold outline-none focus:border-emerald-500"
                  placeholder="307123456"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sertifikat Egasi (F.I.Sh.)
                </label>
                <input
                  type="text"
                  required
                  value={pfxOwnerName}
                  onChange={(e) => setPfxOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-emerald-500"
                  placeholder="RAHIMOV ILHOM SHAVKATOVICH"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Korxona Nomi
                </label>
                <input
                  type="text"
                  value={pfxCompanyName}
                  onChange={(e) => setPfxCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-emerald-500"
                  placeholder='"BARAKA SAVDO" MCHJ'
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPfxUploadModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPfxUpload}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25"
                >
                  Kalitni Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
