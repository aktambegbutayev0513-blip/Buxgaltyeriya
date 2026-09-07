# YAGONA BUXGALTERIYA PLATFORMASI
## Dasturchilar uchun Texnik Hujjat (Developer Specification v1.0)

---

## 1. TIZIM ARXITEKTURASI VA MULTI-TENANCY MODELI

### 1.1. Umumiy Arxitektura Ko'rinishi
Platforma **Multi-Tenant SaaS** tamoyili asosida ishlaydi. Bitta foydalanuvchi (masalan, autsorsing buxgalter) bitta akkaunt orqali 50+ gacha kompaniyalarni boshqara oladi.

```
                   ┌──────────────────────────────────────┐
                   │        Next.js Frontend (SPA/SSR)    │
                   │  - TailwindCSS + shadcn/ui + Lucide  │
                   │  - E-IMZO Browser Client (Localhost) │
                   └──────────────────┬───────────────────┘
                                      │ REST API / WebSocket (JWT + Company-Context)
                                      ▼
                   ┌──────────────────────────────────────┐
                   │        NestJS API Gateway & Core     │
                   │  - Auth / Tenant Context Interceptor │
                   │  - RBAC Guard / Audit Interceptor    │
                   └──────┬────────────────────────┬──────┘
                          │                        │
            Direct Read/Write                Queue Events (BullMQ / RabbitMQ)
                          ▼                        ▼
     ┌────────────────────────────┐       ┌────────────────────────────────┐
     │  PostgreSQL (Multi-Tenant) │       │   Integration Worker Service   │
     │  - Row-Level Security (RLS)│       │  - Didox Adapter (API v2)      │
     │  - Partitioned Logs/Events │       │  - Soliq Adapter (Rasmiy API)  │
     └────────────────────────────┘       │  - Bank / SMS / Telegram Bot   │
                                          └────────────────────────────────┘
```

### 1.2. Multi-Tenant Xavfsizlik Qoidalari (Tenant Isolation)
1. **Har bir ma'lumotlar jadvalida `company_id (UUID)` mavjudligi shart.**
2. Backendda har bir so'rov uchun `X-Company-Id` headeri yoki JWT payload ichidagi faol `active_company_id` tekshiriladi.
3. **TenantContextInterceptor / TenantGuard:**
   - Foydalanuvchi joriy `company_id`ga tegishli yoki yo'qligini `company_users` jadvalidan tekshiradi.
   - Database darajasida har bir SELECT / UPDATE / DELETE so'roviga avtomatik `WHERE company_id = :activeCompanyId` qo'shiladi (yoki PostgreSQL Row-Level Security `current_setting('app.current_company_id')` orqali filtrlanadi).
4. Super Admin boshqaruvidan tashqari hech qanday so'rov `company_id`siz ma'lumot qaytarmaydi.

---

## 2. DATABASE SXEMASI (POSTGRESQL DDL)

Quyida tizimning to'liq relyatsion jadval sxemalari keltirilgan:

```sql
-- 1. UUID va Kengaytmalar
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Foydalanuvchilar (Global Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Kompaniyalar (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tin VARCHAR(9) UNIQUE NOT NULL, -- STIR (9 xonali)
    pinfl VARCHAR(14), -- JShShIR (agar YaTT bo'lsa)
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(150),
    director_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    bank_account VARCHAR(20), -- 20 xonali hisob raqami
    bank_mfo VARCHAR(5), -- 5 xonali MFO
    bank_name VARCHAR(255),
    vat_payer BOOLEAN DEFAULT FALSE, -- QQS to'lovchisi
    vat_number VARCHAR(30), -- QQS ro'yxat raqami
    business_type VARCHAR(100), -- MChJ, YaTT, XK, AJ
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, BLOCKED, PENDING
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Kompaniya Foydalanuvchilari va Rollar (RBAC)
CREATE TYPE user_role_enum AS ENUM (
    'COMPANY_ADMIN', 
    'DIRECTOR', 
    'CHIEF_ACCOUNTANT', 
    'ACCOUNTANT', 
    'OPERATOR', 
    'AUDITOR'
);

CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'ACCOUNTANT',
    permissions JSONB DEFAULT '[]'::jsonb, -- Qo'shimcha granular huquqlar
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- 5. ERI Sertifikatlari (Metadata Only - NO PRIVATE KEYS)
CREATE TABLE eri_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tin VARCHAR(9) NOT NULL,
    pinfl VARCHAR(14),
    serial_number VARCHAR(100) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    public_key_fingerprint TEXT,
    status VARCHAR(30) DEFAULT 'VALID', -- VALID, EXPIRED, REVOKED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Kontragentlar (Mijozlar va Yetkazib beruvchilar)
CREATE TABLE counterparties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tin VARCHAR(9) NOT NULL,
    pinfl VARCHAR(14),
    name VARCHAR(255) NOT NULL,
    director_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    bank_account VARCHAR(20),
    bank_mfo VARCHAR(5),
    bank_name VARCHAR(255),
    vat_payer BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'BOTH', -- CUSTOMER, SUPPLIER, BOTH
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, tin)
);

-- 7. Shartnomalar (Contracts)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    counterparty_id UUID NOT NULL REFERENCES counterparties(id),
    contract_number VARCHAR(100) NOT NULL,
    contract_date DATE NOT NULL,
    expiry_date DATE,
    amount NUMERIC(18, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'UZS',
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Mahsulot va Xizmatlar (Nomenklatura)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ikpu_code VARCHAR(20) NOT NULL, -- MXIK (IKPU) kodi (17 xonali)
    package_code VARCHAR(50), -- Paket kodi
    name VARCHAR(255) NOT NULL,
    unit_code VARCHAR(20) NOT NULL, -- O'lchov birligi (dona, kg, xizmat va h.k.)
    unit_name VARCHAR(50),
    barcode VARCHAR(100),
    vat_rate NUMERIC(5, 2) DEFAULT 12.00, -- QQS stavkasi (foizda)
    cost_price NUMERIC(18, 2) DEFAULT 0.00, -- Tannarx / Xarid narxi
    selling_price NUMERIC(18, 2) DEFAULT 0.00, -- Sotuv narxi
    stock_quantity NUMERIC(15, 3) DEFAULT 0.000, -- Ombor qoldig'i
    is_service BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Hujjatlar / Hisob-fakturalar (Invoices & Documents)
CREATE TYPE document_type_enum AS ENUM (
    'FACTURA', 
    'ACT', 
    'WAYBILL', 
    'CONTRACT', 
    'POWER_OF_ATTORNEY'
);

CREATE TYPE document_status_enum AS ENUM (
    'DRAFT', 
    'CHECKED', 
    'SIGN_PENDING', 
    'SIGNED_LOCAL', 
    'SENDING', 
    'SENT', 
    'ACCEPTED', 
    'REJECTED', 
    'CANCELLED'
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    doc_type document_type_enum NOT NULL DEFAULT 'FACTURA',
    doc_number VARCHAR(100) NOT NULL,
    doc_date DATE NOT NULL,
    contract_id UUID REFERENCES contracts(id),
    counterparty_id UUID NOT NULL REFERENCES counterparties(id),
    total_without_vat NUMERIC(18, 2) DEFAULT 0.00,
    total_vat NUMERIC(18, 2) DEFAULT 0.00,
    total_amount NUMERIC(18, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'UZS',
    direction VARCHAR(10) DEFAULT 'OUTGOING', -- OUTGOING (yuborilayotgan), INCOMING (kelgan)
    status document_status_enum NOT NULL DEFAULT 'DRAFT',
    external_didox_id VARCHAR(150),
    external_soliq_id VARCHAR(150),
    raw_payload JSONB DEFAULT '{}'::jsonb, -- Didox/Soliq JSON format
    reject_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Hujjat Qatorlari (Document Items)
CREATE TABLE document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    ikpu_code VARCHAR(20) NOT NULL,
    package_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 1.000,
    unit_code VARCHAR(20) NOT NULL,
    price NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    vat_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00
);

-- 11. Elektron Imzolar (Signatures / PKCS#7 Detached)
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    certificate_serial VARCHAR(100) NOT NULL,
    signer_tin VARCHAR(9) NOT NULL,
    signer_name VARCHAR(255) NOT NULL,
    signer_role VARCHAR(50),
    pkcs7_signature TEXT NOT NULL, -- Base64 detached signature
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(50),
    verification_status VARCHAR(30) DEFAULT 'VERIFIED'
);

-- 12. Buxgalteriya Rejasi (Chart of Accounts - O'zbekiston BHMS/IFRS)
CREATE TABLE accounting_chart_of_accounts (
    code VARCHAR(10) PRIMARY KEY, -- Masalan: '5110', '6010', '4010', '2910'
    name VARCHAR(255) NOT NULL,
    type VARCHAR(30) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    is_active BOOLEAN DEFAULT TRUE
);

-- 13. Provodkalar (General Ledger / Journal Entries)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    debit_account VARCHAR(10) NOT NULL REFERENCES accounting_chart_of_accounts(code),
    credit_account VARCHAR(10) NOT NULL REFERENCES accounting_chart_of_accounts(code),
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS',
    counterparty_id UUID REFERENCES counterparties(id),
    product_id UUID REFERENCES products(id),
    comment VARCHAR(255)
);

-- 14. Integratsiya Ulanishlari (Didox, Soliq va h.k.)
CREATE TABLE integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- DIDOX, SOLIQ, HAMKORBANK, KAPITALBANK
    api_key TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, ERROR
    last_synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    UNIQUE(company_id, provider)
);

-- 15. Audit Log (Xavfsizlik va Amallar Jurnali)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, SIGN, SEND, EXPORT
    entity_name VARCHAR(100) NOT NULL, -- Document, Invoice, User, Company, Certificate
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Indekslar (Tezkor Qidiruv va Filtrlash)
CREATE INDEX idx_company_users_comp_usr ON company_users(company_id, user_id);
CREATE INDEX idx_documents_comp_date ON documents(company_id, doc_date DESC);
CREATE INDEX idx_documents_status ON documents(company_id, status);
CREATE INDEX idx_documents_counterparty ON documents(company_id, counterparty_id);
CREATE INDEX idx_journal_entries_comp_date ON journal_entries(company_id, entry_date);
CREATE INDEX idx_audit_logs_comp_date ON audit_logs(company_id, created_at DESC);
```

---

## 3. REST API ENDPOINTS (50+ TO'LIQ RO'YXAT)

### 3.1. Autentifikatsiya & Foydalanuvchi (`/api/v1/auth`, `/api/v1/users`)
1. `POST /api/v1/auth/send-otp` - Ro'yxatdan o'tish yoki kirish uchun telefon raqamga SMS kod yuborish.
2. `POST /api/v1/auth/verify-otp` - SMS OTP kodini tasdiqlash.
3. `POST /api/v1/auth/register` - Ism, telefon, parol bilan ro'yxatdan o'tishni yakunlash.
4. `POST /api/v1/auth/login` - Telefon va parol bilan kirish (JWT token + Refresh token).
5. `POST /api/v1/auth/refresh` - Yangi Access Token olish.
6. `POST /api/v1/auth/logout` - Seansni tugatish va tokenni bekor qilish.
7. `GET  /api/v1/users/me` - Joriy foydalanuvchi profil ma'lumotlari.
8. `PUT  /api/v1/users/me` - Profilni tahrirlash (ism, email, parol almashtirish).
9. `POST /api/v1/users/me/2fa/enable` - Ikki bosqichli autentifikatsiyani ulash (OTP/SMS).

### 3.2. Kompaniyalar Boshqaruvi (`/api/v1/companies`, `/api/v1/company-users`)
10. `GET  /api/v1/companies` - Foydalanuvchiga biriktirilgan kompaniyalar ro'yxati (Dashboard kartochkalari).
11. `POST /api/v1/companies` - Yangi kompaniya qo'shish (STIR orqali ma'lumotlarni Soliq/Didoxdan tortib olish bilan).
12. `GET  /api/v1/companies/:id` - Kompaniya to'liq profili va rekvizitlari.
13. `PUT  /api/v1/companies/:id` - Kompaniya ma'lumotlarini yangilash.
14. `POST /api/v1/companies/:id/switch` - Faol ishchi kompaniya kontekstini almashtirish.
15. `GET  /api/v1/companies/:id/users` - Kompaniya xodimlari ro'yxati va ularning rollari.
16. `POST /api/v1/companies/:id/users/invite` - Kompaniyaga yangi buxgalter/xodim taklif qilish (telefon orqali).
17. `PUT  /api/v1/companies/:id/users/:userId/role` - Xodimning rolini o'zgartirish (Director, Accountant, Operator).
18. `DELETE /api/v1/companies/:id/users/:userId` - Xodimni kompaniyadan uzish/o'chirish.

### 3.3. ERI & E-IMZO Tizimi (`/api/v1/eri`)
19. `POST /api/v1/eri/challenge` - Imzolash uchun serverdan bir martalik tasodifiy string (challenge/nonce) olish.
20. `POST /api/v1/eri/verify-auth` - E-IMZO orqali tizimga kirish (imzolangan challengeni backendda tekshirish).
21. `POST /api/v1/eri/attach-certificate` - Kompaniyaga yangi ERI sertifikat metadatasini bog'lash.
22. `GET  /api/v1/eri/certificates` - Kompaniyaga biriktirilgan barcha ERI sertifikatlari ro'yxati va ularning muddati.
23. `DELETE /api/v1/eri/certificates/:id` - Muddati o'tgan yoki bekor qilingan ERI sertifikatini o'chirish.

### 3.4. Kontragentlar (`/api/v1/counterparties`)
24. `GET  /api/v1/counterparties` - Kompaniya kontragentlari ro'yxati (filtrlash, qidirish).
25. `POST /api/v1/counterparties` - Yangi kontragent kiritish (STIR orqali avtomatik to'ldirish).
26. `GET  /api/v1/counterparties/:id` - Kontragent kartochkasi, shartnomalari, aylanmasi va qarzdorligi.
27. `PUT  /api/v1/counterparties/:id` - Kontragent rekvizitlarini tahrirlash.
28. `DELETE /api/v1/counterparties/:id` - Kontragentni o'chirish (agar bog'langan operatsiyalar bo'lmasa).
29. `GET  /api/v1/counterparties/lookup-tin/:tin` - STIR bo'yicha davlat reyestridan ma'lumotlarni tortib olish.

### 3.5. Mahsulotlar & Ombor (`/api/v1/products`)
30. `GET  /api/v1/products` - Nomenklatura ro'yxati (MXIK/IKPU, qoldiq, narx).
31. `POST /api/v1/products` - Yangi mahsulot/xizmat qo'shish.
32. `GET  /api/v1/products/:id` - Mahsulot tafsilotlari va harakat tarixi.
33. `PUT  /api/v1/products/:id` - Mahsulot narxi va parametrlarini yangilash.
34. `DELETE /api/v1/products/:id` - Mahsulotni arxivlash/o'chirish.
35. `GET  /api/v1/products/search-ikpu` - MXIK (IKPU) klassifikatoridan qidirish.

### 3.6. Elektron Hujjatlar & Hisob-Fakturalar (`/api/v1/documents`, `/api/v1/invoices`)
36. `GET  /api/v1/documents` - Hujjatlar ro'yxati (Chiquvchi, Kiruvchi, Qoralama, Imzolangan, Rad etilgan).
37. `POST /api/v1/documents` - Yangi hujjat qoralamasini yaratish (Hisob-faktura, Dalolatnoma, Ishonchnoma).
38. `GET  /api/v1/documents/:id` - Hujjatning to'liq ko'rinishi (HTML/PDF preview, imzo statuslari).
39. `PUT  /api/v1/documents/:id` - Hujjat qoralamasini tahrirlash.
40. `DELETE /api/v1/documents/:id` - Hujjatni bekor qilish / o'chirish.
41. `POST /api/v1/documents/:id/sign-hash` - Imzolash uchun hujjatning xeshini (hash) tayyorlab berish.
42. `POST /api/v1/documents/:id/sign` - E-IMZO tomonidan imzolangan PKCS#7 detached imzoni saqlash va tekshirish.
43. `POST /api/v1/documents/:id/send` - Imzolangan hujjatni Didox / Soliq tizimiga asinxron navbat (Queue) orqali yuborish.
44. `POST /api/v1/documents/:id/accept` - Kelgan (kiruvchi) hujjatni qabul qilish va ERI bilan imzolash.
45. `POST /api/v1/documents/:id/reject` - Kelgan hujjatni sababini ko'rsatgan holda rad etish.
46. `GET  /api/v1/documents/:id/pdf` - Hujjatning QR-kodli va shtampli rasmiy PDF nusxasini yuklab olish.

### 3.7. Integratsiyalar (Didox & Soliq) (`/api/v1/integrations`)
47. `GET  /api/v1/integrations/status` - Didox va Soliq xizmatlari bilan aloqa holati (Connected/Disconnected/Token valid).
48. `POST /api/v1/integrations/didox/connect` - Didox API kaliti yoki ERI sertifikati orqali ulanish.
49. `POST /api/v1/integrations/didox/sync` - Didoxdan yangi kiruvchi va chiquvchi hujjatlarni majburiy sinxronlash.
50. `POST /api/v1/integrations/soliq/connect` - Soliq rasmiy API orqali ulanishni tekshirish.
51. `GET  /api/v1/integrations/soliq/debts` - Soliq qarzdorliklari va ortiqcha to'lovlarni olish.

### 3.8. Buxgalteriya & Hisobotlar (`/api/v1/accounting`, `/api/v1/reports`)
52. `GET  /api/v1/accounting/chart-of-accounts` - Hisoblar rejasi (BHMS).
53. `GET  /api/v1/accounting/journal` - Barcha buxgalteriya provodkalari jurnali.
54. `POST /api/v1/accounting/journal` - Qo'lda yangi buxgalteriya provodkasini kiritish.
55. `GET  /api/v1/reports/balance-sheet` - Buxgalteriya balansi (1-shakl).
56. `GET  /api/v1/reports/profit-and-loss` - Moliyaviy natijalar to'g'risida hisobot (2-shakl).
57. `GET  /api/v1/reports/turnover-balance` - Aylanma-qoldiq vedomosti (Оборотно-сальдовая ведомость - OSV).
58. `GET  /api/v1/reports/counterparty-reconciliation` - Kontragent bilan solishtirma dalolatnoma (Акт сверки).

### 3.9. Super Admin & Tizim Audit (`/api/v1/admin`, `/api/v1/audit`)
59. `GET  /api/v1/admin/companies` - Barcha ro'yxatdan o'tgan kompaniyalar statistikasi va holati.
60. `GET  /api/v1/admin/system-health` - Server, Redis, Queue va API holatlari monitoringi.
61. `GET  /api/v1/audit/logs` - Kompaniya bo'yicha barcha harakatlar (kim, qachon, qaysi IP'dan nima qildi).

---

## 4. E-IMZO / ERI CLIENT-SIDE SIGNING ALGORITMI

> [!IMPORTANT]
> **XAVFSIZLIK QOIDASI:** Foydalanuvchining ERI Private Key kaliti yoki ERI paroli **HECH QACHON** serverga yuborilmaydi va serverda saqlanmaydi! Barcha kriptografik imzolash jarayoni mijozning brauzerida `127.0.0.1:64443` portida ishlovchi E-IMZO moduli orqali amalga oshiriladi.

```
[ FRONTEND (Browser) ]                  [ E-IMZO Local Service ]            [ BACKEND (NestJS) ]
        │                                 (127.0.0.1:64443)                           │
        │                                         │                                   │
 1. "Imzolash" tugmasi bosildi                   │                                   │
        ├─────────────────────────────────────────┼───────────────────► POST /sign-hash
        │                                         │                     (Hujjat JSON payload)
        │                                         │                                   │
        │                                         │                     Hujjat kanonizatsiya
        │                                         │                     va SHA-256 xesh
        │                                         │                                   │
        │◄────────────────────────────────────────┼─────────────────── Base64 Document Hash
        │                                         │                                   │
 2. E-IMZO lokal moduliga so'rov                 │                                   │
        ├────────────────────────────────────────►│                                   │
        │  GET /certificates                      │                                   │
        │◄────────────────────────────────────────┤                                   │
        │  Sertifikatlar ro'yxati qaytadi         │                                   │
        │                                         │                                   │
 3. Foydalanuvchi sertifikatni tanlaydi          │                                   │
    va E-IMZO parolini kiritadi                   │                                   │
        ├────────────────────────────────────────►│                                   │
        │  create_pkcs7(hash, cert_id, pin)       │                                   │
        │◄────────────────────────────────────────┤                                   │
        │  PKCS#7 Detached Signature (Base64)     │                                   │
        │                                         │                                   │
 4. Imzo backendga yuboriladi                    │                                   │
        ├─────────────────────────────────────────┼───────────────────► POST /documents/:id/sign
        │                                         │                     { pkcs7: "...", cert: "..." }
        │                                         │                                   │
        │                                         │                     1. Imzo haqiqiyligini tekshirish
        │                                         │                     2. Sertifikat STIRini tekshirish
        │                                         │                     3. Document status -> SIGNED
        │                                         │                     4. Push to Queue (Didox/Soliq)
        │◄────────────────────────────────────────┼─────────────────── Status: 200 OK
```

### E-IMZO JavaScript Klient Integratsiya Kodi Namunasi:
```typescript
// services/e-imzo.service.ts
export class EImzoService {
  private static BASE_URL = 'http://127.0.0.1:64443';

  // 1. E-IMZO xizmati ishlab turganini tekshirish
  static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.BASE_URL}/status`, { method: 'GET' });
      return res.ok;
    } catch (e) {
      return false; // E-IMZO o'rnatilmagan yoki ishga tushirilmagan
    }
  }

  // 2. Kompyuterdagi sertifikatlar ro'yxatini olish
  static async listCertificates(): Promise<any[]> {
    const res = await fetch(`${this.BASE_URL}/certificates`, { method: 'GET' });
    const data = await res.json();
    return data.certificates || [];
  }

  // 3. Xeshni PKCS#7 formatida imzolash
  static async signHash(dataHashBase64: string, certKeyId: string): Promise<string> {
    const res = await fetch(`${this.BASE_URL}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyId: certKeyId,
        data: dataHashBase64,
        isDetached: true
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Imzolashda xatolik yuz berdi');
    return result.pkcs7_64;
  }
}
```

---

## 5. DIDOX & SOLIQ INTEGRATION ENGINE & NAVBATLAR (QUEUE)

Hujjatlarni Didox va Soliq tizimlariga to'g'ridan-to'g'ri sinxron yuborish serverni qotirib qo'yishi mumkin. Shuning uchun barcha integratsiya so'rovlari **BullMQ / Redis Queue** orqali asinxron amalga oshiriladi.

```
                  ┌─────────────────────────────────────────┐
                  │          API Server (NestJS)            │
                  │   - Imzo qabul qilindi                  │
                  │   - Status: SENDING ga o'zgartirildi    │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼ Job qo'shiladi: { docId, companyId, provider: 'DIDOX' }
                  ┌─────────────────────────────────────────┐
                  │              Redis Queue                │
                  └────────────────────┬────────────────────┘
                                       │ Worker orqali tortib olinadi
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Integration Worker Service        │
                  │  1. Didox API ga POST /v2/documents     │
                  │  2. Muvaffaqiyatli: status -> SENT      │
                  │  3. Xatolik: Exponential Backoff Retry  │
                  │     (1m, 5m, 15m - 3 marta urinish)     │
                  │  4. Agar rad etilsa: status -> ERROR    │
                  │  5. Foydalanuvchiga WebSocket/TG xabar  │
                  └─────────────────────────────────────────┘
```

---

## 6. FRONTEND SAHIFALAR XARITASI VA UI/UX STRUKTURASI

1. **Autentifikatsiya & Onboarding:**
   - `/login` - Telefon raqam + parol yoki "E-IMZO bilan kirish" tugmasi.
   - `/register` - SMS tasdiqlash, parol kiritish.
   - `/onboarding/company-add` - STIR kiritish -> ERI bilan tasdiqlash -> Kompaniya bazasini yaratish.
2. **Kompaniyalar Portali (Multi-Company Selector):**
   - `/companies` - Barcha kompaniyalar ro'yxati (Grid ko'rinishida: ERI holati, Didox integratsiyasi, to'lanmagan soliqlar, "Kompaniyaga kirish" tugmasi).
3. **Kompaniya Ichki Dashboardi:**
   - `/[companyId]/dashboard` - Daromad, Xarajat, Debitorlik/Kreditorlik ko'rsatkichlari, So'nggi operatsiyalar.
4. **Elektron Hujjatlar:**
   - `/[companyId]/documents` - Tablar: *Barchasi*, *Chiquvchi*, *Kiruvchi*, *Imzolash kutilmoqda*, *Rad etilgan*.
   - `/[companyId]/documents/new-invoice` - Hisob-faktura yaratish formasi (MXIK qidiruv, QQS avto-hisob, E-IMZO bilan imzolash tugmasi).
   - `/[companyId]/documents/[id]` - Hujjat ko'rinishi, PDF export, imzo shtamplari va Didox statusi.
5. **Buxgalteriya Moduli:**
   - `/[companyId]/accounting/journal` - Barcha provodkalar jurnali (Debet 5110 / Kredit 6010 va h.k.).
   - `/[companyId]/accounting/chart` - Hisoblar rejasi.
   - `/[companyId]/accounting/osv` - Aylanma-qoldiq vedomosti (OSV).
6. **Kontragentlar & Ombor:**
   - `/[companyId]/counterparties` - Kontragentlar ro'yxati, rekvizitlar, solishtirma dalolatnoma (Акт сверки).
   - `/[companyId]/products` - Ombor qoldiqlari, MXIK kodlar, narxlar.
7. **Sozlamalar & Integratsiyalar:**
   - `/[companyId]/settings/eri` - Ulangan E-IMZO kalitlari va xodimlar ruxsatlari.
   - `/[companyId]/settings/didox` - Didox API ulanishi va sinxronizatsiya.
   - `/[companyId]/settings/soliq` - Soliq kabineti integratsiyasi.
8. **Super Admin Panel:**
   - `/admin/companies` - Barcha mijozlar, tariflar, to'lovlar va server monitoringi.

---

## 7. AMALGA OSHIRISHNING BOSQICHMA-BOSQICH REJASI (ROADMAP)

| Bosqich | Modul nomi | Qamrov va Natija |
|---|---|---|
| **1-bosqich** | **Baza & Autentifikatsiya** | PostgreSQL sxemasi, Multi-tenant middleware, JWT Auth, SMS OTP va RBAC tizimi |
| **2-bosqich** | **Kompaniyalar & ERI Moduli** | STIR orqali kompaniya ochish, E-IMZO lokal agent integratsiyasi, ERI bilan avtorizatsiya |
| **3-bosqich** | **Kontragentlar & Nomenklatura** | Kontragentlar bazasi, MXIK (IKPU) qidiruv tizimi, mahsulot va narxlar katalogi |
| **4-bosqich** | **Hujjatlar & E-IMZO Signing** | Hisob-faktura, dalolatnoma yaratish, mahalliy ERI bilan PKCS#7 imzolash va PDF generator |
| **5-bosqich** | **Didox Integratsiya Engine** | Redis/BullMQ navbat tizimi, Didox API adapteri, hujjatlarni yuborish/qabul qilish va statuslar |
| **6-bosqich** | **Buxgalteriya & Hisobotlar** | Avtomatik provodkalar, Aylanma-qoldiq vedomosti (OSV), Buxgalteriya balansi va akt sverka |
| **7-bosqich** | **Soliq Integratsiyasi & Admin** | Soliq rasmiy API adapteri, Super Admin monitoring paneli, Audit loglar va bildirishnomalar |
