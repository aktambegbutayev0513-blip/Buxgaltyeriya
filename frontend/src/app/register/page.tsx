'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Building2, Phone, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/v1/auth/send-otp', { phone });
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'SMS kod yuborishda xatolik yuz berdi';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/v1/auth/verify-otp', { phone, code: otpCode });
      const res = await api.post('/api/v1/auth/register', {
        fullName,
        phone,
        password,
      });
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/companies');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-950 via-slate-900 to-indigo-950 opacity-90" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Ro'yxatdan o'tish
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Yagona Buxgalteriya SaaS Platformasiga a'zo bo'ling
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  F.I.Sh. (Ism va Familiyangiz)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-sky-500"
                    placeholder="Aliyev Vali"
                  />
                </div>
              </div>

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
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-sky-500"
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Parol yarating
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-sky-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 transition duration-200"
              >
                {loading ? 'Yuborilmoqda...' : 'SMS Kod olish'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRegister} className="space-y-4">
              <div className="p-3 bg-sky-950/40 border border-sky-800/40 rounded-xl text-xs text-slate-300">
                <span className="font-bold text-sky-400">{phone}</span> raqamiga yuborilgan tasdiqlash kodini kiriting:
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SMS Tasdiqlash Kodi
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="block w-full px-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-center text-lg font-mono tracking-widest outline-none focus:border-sky-500"
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition duration-200"
              >
                <ShieldCheck className="w-5 h-5" />
                {loading ? 'Tasdiqlanmoqda...' : 'Ro\'yxatdan o\'tishni yakunlash'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Akkauntingiz bormi?{' '}
            <Link href="/" className="text-sky-400 hover:underline font-semibold">
              Kirish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
