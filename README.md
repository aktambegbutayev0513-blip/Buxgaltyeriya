# YAGONA BUXGALTERIYA PLATFORMASI
### O'zbekiston korxonalari uchun Multi-Tenant SaaS Buxgalteriya va Elektron Hujjat Boshqaruv Tizimi

Ushbu platforma O'zbekiston hisob standartlari (BHMS), E-IMZO elektron raqamli imzo, Didox elektron fakturalar va Soliq integratsiyalari asosida to'liq Multi-Tenant arxitekturada ishlab chiqilgan.

---

## 🛠 Texnologik Stek

- **Frontend:** Next.js 14 (App Router), React, TypeScript, TailwindCSS, Lucide Icons
- **Backend:** NestJS, TypeScript, REST API, BullMQ, PDFKit & QRCode Generator
- **Ma'lumotlar Bazasi:** PostgreSQL (Multi-Tenant company_id row isolation), Redis
- **Integratsiyalar:**
  - **E-IMZO Mahalliy Agent:** `http://127.0.0.1:64443` (Private Key kalitlari faqat mijoz kompyuterida ishlanadi, serverga yuborilmaydi).
  - **Didox Adapter:** Elektron hisob-faktura, dalolatnoma va ishonchnomalar almashinuvi.
  - **Soliq Adapter:** Soliq majburiyatlari va holatini tekshirish rasmiy servislari.

---

## 🚀 Loyihani Ishga Tushirish (Quickstart)

### 1. Database & Redis (Docker orqali)
```bash
docker-compose up -d
```

### 2. Backend Serverni Ishga Tushirish
```bash
cd backend
npm install
npx prisma db push # yoki npx prisma migrate dev
npm run start:dev
```
Backend API: `http://localhost:4000`

### 3. Frontend Ilovani Ishga Tushirish
```bash
cd frontend
npm install
npm run dev
```
Frontend Portal: `http://localhost:3000`

---

## 📁 Loyiha Strukturasi

```
Buxgalteriya/
├── DEVELOPER_SPECIFICATION_v1.0.md   # To'liq texnik spetsifikatsiya va DDL
├── docker-compose.yml                # PostgreSQL va Redis konteynerlari
│
├── backend/                          # NestJS REST API & Integratsiya xizmatlari
│   ├── prisma/
│   │   └── schema.prisma             # PostgreSQL relying ma'lumotlar modeli
│   └── src/
│       ├── common/                   # Guards (TenantGuard, RolesGuard), Interceptors (AuditLog)
│       └── modules/
│           ├── auth/                 # Telefon, SMS OTP va E-IMZO avtorizatsiya
│           ├── companies/            # Multi-company boshqaruvi va a'zolar
│           ├── eri/                  # E-IMZO challenge va PKCS#7 tekshirish
│           ├── counterparties/       # STIR bo'yicha mijozlar va yetkazib beruvchilar
│           ├── products/             # MXIK (IKPU) nomenklatura va narxlar
│           ├── documents/            # Hisob-fakturalar, imzolash va PDF generator
│           ├── accounting/           # BHMS hisoblar rejasi, provodkalar va OSV
│           ├── integrations/         # Didox va Soliq API adapterlari
│           └── admin/                # Super Admin monitoring
│
└── frontend/                         # Next.js 14 Dashboard & Multi-Company Portal
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts                # Avtorizatsiyalangan API Client
    │   │   └── e-imzo.ts             # Mahalliy E-IMZO agenti bilan aloqa wrapperi
    │   └── app/
    │       ├── page.tsx              # Kirish (Parol va E-IMZO orqali)
    │       ├── register/             # Ro'yxatdan o'tish (SMS OTP)
    │       ├── companies/            # 50+ Kompaniyalarni tanlash portali
    │       └── dashboard/            # Korxona ichki boshqaruv moduli
    │           ├── page.tsx          # Moliyaviy KPI va xulosalar
    │           ├── documents/        # Elektron hisob-fakturalar & E-IMZO imzolash
    │           ├── accounting/       # Aylanma-qoldiq vedomosti (OSV) & Provodkalar
    │           ├── counterparties/   # Kontragentlar katalogi
    │           ├── products/         # MXIK tovarlar va xizmatlar
    │           └── settings/         # Integratsiya va E-IMZO sozlamalari
```

---

## 🔐 Xavfsizlik Qoidalari (E-IMZO & Tenant Isolation)

1. **Private Key Serverga Yuborilmaydi:** ERI private key va paroli mijoz brauzeri va kompyuteridagi `127.0.0.1:64443` agentida qoladi. Serverga faqat detached `PKCS#7` imzo va ochiq sertifikat metadatasi yuboriladi.
2. **Tenant Isolation:** Har bir so'rovda `X-Company-Id` headeri va `TenantGuard` tekshiriladi. Bitta foydalanuvchi faqat o'zi a'zo bo'lgan kompaniya ma'lumotlariga ruxsat oladi.
