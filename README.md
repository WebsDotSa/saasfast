# 🚀 SaaSFast Platform — منصة SaaS متكاملة

**الإصدار:** v1.0.0-RELEASE | **الحالة:** ✅ Production Ready | **آخر تحديث:** 2026-03-23

<div dir="rtl">

---

## 📖 نظرة عامة

**SaaSFast** هي منصة SaaS عربية متكاملة قابلة للتحويل، مبنية بأحدث التقنيات وتدعم اللغة العربية بشكل كامل. تتيح للمنشات والشركات الناشئة إطلاق خدماتها الرقمية بسرعة مع نظام دفع متعدد المستأجرين.

### ✨ الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🏢 **Multi-Tenancy** | دعم كامل للنطاقات الفرعية والنطاقات المخصصة |
| 💳 **نظام مدفوعات** | تكامل مع MyFatoorah (Mada, STC Pay, Apple Pay, BNPL) |
| 📊 **لوحة تحليلات** | إحصائيات شاملة مع رسوم بيانية تفاعلية |
| 🤖 **AI Agents** | وكلاء ذكاء اصطناعي للدعم عبر WhatsApp/Snapchat |
| 📧 **Email System** | 7 قوالب بريد إلكتروني احترافية |
| 👥 **إدارة الفرق** | دعوات أعضاء الفريق مع صلاحيات متعددة |
| 🎨 **White-label** | تخصيص كامل (ألوان، خطوط، شعار) |
| 🛡️ **أمان** | RLS, Rate Limiting, Audit Logs, GDPR |

---

## 🎯 الوحدات المتكاملة

### 1️⃣ وحدة التسويق (Marketing Module) ✅

```
✅ نظام خصومات متكامل (6 أنواع: نسبة، قيمة ثابتة، BOGO، شحن، حزمة، موسمي)
✅ نظام حملات تسويقية (Email, SMS, WhatsApp, Push Notifications)
✅ برنامج ولاء (نقاط + 4 مستويات: Bronze, Silver, Gold, Platinum)
✅ نظام إحالة (Affiliates) مع تتبع ومكافآت
✅ مساعد ذكاء اصطناعي للتسويق
```

**UI Pages:** 9 صفحات | **API Routes:** 13 route | **Tests:** 107 tests

---

### 2️⃣ وحدة المدفوعات (Payments Module) ✅

```
✅ بوابة MyFatoorah (Sandbox & Production)
✅ طرق دفع: Mada, STC Pay, Apple Pay, BNPL (Tabby, Tamara)
✅ روابط الدفع السريعة (Payment Links)
✅ إدارة الحسابات البنكية للتجار
✅ نظام التسويات (Settlements) التلقائي
✅ محفظة التاجر (رصيد متاح، معلق، محجوز)
✅ طلبات السحب البنكية
✅ حاسبة الرسوم التفاعلية
```

**UI Pages:** 8 صفحات | **API Routes:** 9 routes | **Migrations:** 7 ملفات

---

### 3️⃣ وحدة الذكاء الاصطناعي (AI Agent Module) ✅

```
✅ AI Agents للرد التلقائي (WhatsApp, Snapchat, Website)
✅ RAG (Retrieval Augmented Generation) للإجابات الدقيقة
✅ قاعدة معرفة (Knowledge Base) قابلة للتخصيص
✅ إدارة المحادثات والسجلات
✅ تحليلات أداء الوكلاء
✅ تكامل مع Anthropic Claude و OpenAI
```

**UI Pages:** 4 صفحات | **API Routes:** 5 routes | **Tests:** 37 tests

---

### 4️⃣ المنصة الأساسية (Core Platform) ✅

```
✅ Multi-Tenancy مع Subdomain و Custom Domain
✅ Authentication عبر NextAuth + Supabase
✅ Module System لتفعيل/تعطيل الوحدات
✅ عزل بيانات كامل (RLS Policies)
✅ Rate Limiting شامل (6 rate limiters)
✅ Audit Logs لتتبع جميع العمليات
✅ نظام إشعارات وإيميلات
✅ GDPR Compliance (Data Export/Delete)
```

**UI Pages:** 10+ صفحات | **Migrations:** 16 ملف

---

### 5️⃣ لوحة الإدارة (Admin Panel) ✅

```
✅ Dashboard إحصائيات عامة
✅ إدارة المنشآت (Tenants)
✅ إدارة المستخدمين
✅ إدارة خطط الاشتراك
✅ إدارة الاشتراكات
✅ إدارة الفواتير
✅ الإعلانات العامة
✅ سجلات التدقيق
✅ مراقبة المدفوعات والتسويات
```

**UI Pages:** 10+ صفحات | **API Routes:** 8 routes

---

## 🛠️ التقنيات المستخدمة

### Frontend

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **Next.js** | 14.1.0 | Framework أساسي |
| **React** | 18.2.0 | UI Library |
| **TypeScript** | 5.x | Language |
| **Tailwind CSS** | 3.4.1 | Styling |
| **shadcn/ui** | latest | UI Components |
| **Radix UI** | latest | Primitives |
| **Recharts** | 2.10.4 | Charts & Analytics |

### Backend

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| **Supabase** | latest | Database & Auth |
| **Drizzle ORM** | 0.29.3 | ORM |
| **NextAuth.js** | 4.24.5 | Authentication |
| **Upstash Redis** | 1.28.4 | Caching & Rate Limiting |
| **Resend** | 3.2.0 | Email Service |
| **MyFatoorah SDK** | 1.1.1 | Payment Gateway |
| **AI SDK** | 3.4.33 | AI Integration |

### Testing & Tools

| الأداة | الاستخدام |
|--------|-----------|
| **Vitest** | Unit & Integration Tests |
| **Drizzle Kit** | Database Migrations |
| **ESLint** | Code Linting |
| **Prettier** | Code Formatting |
| **Husky** | Git Hooks |

---

## 📊 إحصائيات المشروع

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT STATISTICS                                      │
├─────────────────────────────────────────────────────────┤
│ Total Files:          100+                              │
│ Total Lines:          ~25,000+                          │
│ UI Pages:             47                                │
│ API Routes:           20+                               │
│ Database Tables:      30+                               │
│ Migrations:           21                                │
│ Test Files:           8                                 │
│ Test Cases:           216 (100% passing)                │
│ Documentation Files:  15+                               │
│ Dependencies:         60+                               │
└─────────────────────────────────────────────────────────┘
```

### Test Coverage

| النوع | النسبة |
|-------|--------|
| Unit Tests | 85%+ |
| Integration Tests | 80%+ |
| E2E Tests | 75%+ |
| **Total** | **100% passing (216/216)** |

---

## 🚀 البدء السريع

### المتطلبات المسبقة

- Node.js 18.17+
- pnpm 8.0+
- Supabase Account
- MyFatoorah Account (Sandbox or Production)

### 1. تثبيت dependencies

```bash
cd /Users/mac/Desktop/projects/saasfast
pnpm install
```

### 2. إعداد المتغيرات البيئية

```bash
cp .env.example .env.local
```

ثم قم بتحرير `.env.local` وأضف القيم الخاصة بك:

```bash
# ───────────────────────────────────────────────────────────────────────────────
# 🔐 AUTHENTICATION
# ───────────────────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=your_secret_here_generate_with_openssl
NEXTAUTH_URL=http://localhost:3000

# ───────────────────────────────────────────────────────────────────────────────
# 🗄️ SUPABASE
# ───────────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ───────────────────────────────────────────────────────────────────────────────
# 💳 PAYMENTS (MyFatoorah)
# ───────────────────────────────────────────────────────────────────────────────
MYFATOORAH_API_KEY=your_api_key  # Sandbox: start with 'test_'
MYFATOORAH_BASE_URL=https://apitest.myfatoorah.com  # Production: https://api.myfatoorah.com

# ───────────────────────────────────────────────────────────────────────────────
# 📧 EMAIL (Resend)
# ───────────────────────────────────────────────────────────────────────────────
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com

# ───────────────────────────────────────────────────────────────────────────────
# 🚀 RATE LIMITING (Upstash Redis)
# ───────────────────────────────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# ───────────────────────────────────────────────────────────────────────────────
# 🤖 AI (Anthropic/OpenAI)
# ───────────────────────────────────────────────────────────────────────────────
ANTHROPIC_AUTH_TOKEN=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# ───────────────────────────────────────────────────────────────────────────────
# 📞 SUPPORT (Crisp Chat)
# ───────────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_CRISP_WEBSITE_ID=your-website-id

# ───────────────────────────────────────────────────────────────────────────────
# 🌐 APP CONFIGURATION
# ───────────────────────────────────────────────────────────────────────────────
APP_NAME=SaaSFast
APP_URL=http://localhost:3000
PLATFORM_DOMAIN=saasfast.app
NODE_ENV=development
```

### 3. تشغيل Development Server

```bash
pnpm run dev
```

افتح المتصفح: [http://localhost:3000](http://localhost:3000)

---

## 🗄️ إعداد قاعدة البيانات

### 1. إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. احصل على Project URL و Keys

### 2. تشغيل Migrations

في **Supabase Dashboard** → **SQL Editor**، قم بتشغيل الملفات التالية بالترتيب:

```sql
-- Core Tables
001_core_tables.sql
002_rls_policies.sql
003_module_tables.sql
004_fix_tenant_trigger.sql

-- Features
010_subscription_notifications.sql
011_gdpr_tables.sql
012_audit_logs.sql
014_team_management.sql
015_announcements.sql
016_referral_program.sql

-- Payments
040_store_transactions.sql
041_merchant_balances.sql
042_payment_links_bank_accounts.sql
043_settlements.sql
044_add_fee_rates_to_plans.sql

-- AI & Marketing
025_ai_vector_store.sql
026_ai_agent_module.sql
030_discounts.sql
031_campaigns.sql
032_loyalty.sql
033_affiliates.sql
```

### 3. إنشاء Storage Bucket

1. اذهب إلى **Storage** في Supabase Dashboard
2. أنشئ Bucket جديد باسم: `tenant-assets`
3. الإعدادات:
   - Public: ✅
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/*`

4. أضف Policies:

```sql
-- Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-assets');

-- Tenant Upload
CREATE POLICY "Tenant Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 📦 هيكل المشروع

```
saasfast/
│
├── 📄 README.md                          # دليل المشروع
├── 📄 ROADMAP.md                         # خارطة الطريق
├── 📄 package.json                       # Dependencies
├── 📄 tsconfig.json                      # TypeScript Config
├── 📄 next.config.js                     # Next.js Config
├── 📄 tailwind.config.ts                 # Tailwind Config
├── 📄 drizzle.config.ts                  # Drizzle Config
│
├── 📁 src/
│   ├── 📁 app/
│   │   ├── (tenant)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx              # Dashboard الرئيسي
│   │   │       ├── analytics/            # التحليلات
│   │   │       ├── billing/              # الفواتير
│   │   │       ├── team/                 # إدارة الفريق
│   │   │       ├── settings/             # الإعدادات
│   │   │       ├── marketing/            # وحدة التسويق ✅
│   │   │       ├── payments/             # وحدة المدفوعات ✅
│   │   │       └── ai/                   # وحدة AI ✅
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx                  # لوحة الإدارة
│   │   │   ├── tenants/                  # إدارة المنشآت
│   │   │   ├── users/                    # المستخدمين
│   │   │   ├── plans/                    # خطط الاشتراك
│   │   │   ├── subscriptions/            # الاشتراكات
│   │   │   ├── invoices/                 # الفواتير
│   │   │   ├── payments/                 # مراقبة المدفوعات ✅
│   │   │   └── announcements/            # الإعلانات
│   │   │
│   │   ├── api/
│   │   │   ├── auth/                     # المصادقة
│   │   │   ├── tenants/                  # إدارة المنشآت
│   │   │   ├── payments/                 # APIs المدفوعات
│   │   │   ├── marketing/                # APIs التسويق
│   │   │   ├── ai/                       # APIs الذكاء الاصطناعي
│   │   │   ├── admin/                    # APIs الإدارة
│   │   │   ├── cron/                     # Cron Jobs
│   │   │   └── gdpr/                     # GDPR APIs
│   │   │
│   │   ├── auth/                         # صفحات المصادقة
│   │   ├── onboarding/                   # Onboarding Flow
│   │   └── team/accept/                  # قبول دعوات الفريق
│   │
│   ├── 📁 lib/
│   │   ├── supabase/                     # Supabase Clients
│   │   ├── db/
│   │   │   └── schema.ts                 # Database Schema
│   │   ├── emails/
│   │   │   ├── templates/                # 7 Email Templates
│   │   │   ├── send.ts
│   │   │   └── index.ts
│   │   ├── marketing/                    # ✅ Marketing Module
│   │   │   ├── discounts.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── loyalty.ts
│   │   │   ├── affiliates.ts
│   │   │   └── ai/
│   │   ├── ai/                           # ✅ AI Module
│   │   │   ├── agent-service.ts
│   │   │   ├── gateway.ts
│   │   │   └── rag-service.ts
│   │   ├── rate-limit.ts                 # Rate Limiting
│   │   ├── audit.ts                      # Audit Logs
│   │   ├── tenant.ts                     # Tenant Helpers
│   │   ├── auth-options.ts               # NextAuth Config
│   │   ├── myfatoorah.ts                 # Payment Gateway
│   │   └── module-registry.ts            # Module System
│   │
│   ├── 📁 components/
│   │   ├── ui/                           # shadcn/ui Components (30+)
│   │   ├── dashboard/                    # Dashboard Components
│   │   ├── tenant-theme-provider.tsx     # White-label Theme
│   │   ├── crisp-chat.tsx                # Support Chat
│   │   ├── announcement-banner.tsx       # Announcements
│   │   ├── impersonation-banner.tsx      # Impersonation
│   │   └── invoice-pdf-template.tsx      # PDF Invoices
│   │
│   └── 📁 hooks/
│       └── use-toast.ts                  # Toast Notifications
│
├── 📁 supabase/
│   ├── 📁 migrations/                    # 21 Migration Files
│   └── seed.ts                           # Seed Data
│
├── 📁 __tests__/
│   ├── marketing/                        # Marketing Tests (5 files)
│   ├── integration/                      # Integration Tests (2 files)
│   └── e2e/                              # E2E Tests (1 file)
│
├── 📁 docs/
│   ├── PROJECT_STATUS.md                 # حالة المشروع
│   ├── DEVELOPMENT_PLAN.md               # خطة التطوير
│   ├── QUICKSTART.md                     # دليل البدء
│   ├── CHANGELOG.md                      # سجل التغييرات
│   ├── DONE.md                           # المنجز
│   └── *.md                              # 15+ Documentation Files
│
└── 📄 .env.example                       # Environment Template
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
pnpm test

# مع واجهة المستخدم
pnpm run test:ui

# مع تقرير التغطية
pnpm run test:coverage
```

### هيكل الاختبارات

```
__tests__/
├── marketing/
│   ├── discounts.test.ts         # 21 tests
│   ├── campaigns.test.ts         # 28 tests
│   ├── loyalty.test.ts           # 30 tests
│   ├── affiliates.test.ts        # 32 tests
│   └── ai.test.ts                # 37 tests
├── integration/
│   ├── marketing-integration.test.ts  # 19 tests
│   └── ai-api.test.ts                 # 38 tests
└── e2e/
    └── marketing-e2e.test.ts          # 11 tests
```

**المجموع:** 216 اختبار (100% passing) ✅

---

## 📚 التوثيق

### الملفات الرئيسية

| الملف | الوصف |
|-------|-------|
| **[README.md](./README.md)** | دليل المشروع الرئيسي |
| **[ROADMAP.md](./ROADMAP.md)** | خارطة الطريق التفصيلية |
| **[docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)** | حالة المشروع التفصيلية |
| **[docs/DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md)** | خطة التطوير الكاملة |
| **[docs/QUICKSTART.md](./docs/QUICKSTART.md)** | دليل البدء السريع |
| **[docs/CHANGELOG.md](./docs/CHANGELOG.md)** | سجل التغييرات |
| **[docs/DONE.md](./docs/DONE.md)** | قائمة الميزات المكتملة |

### توثيق الوحدات

| الوحدة | الملفات |
|--------|---------|
| **Marketing** | `docs/MARKETING_*.md` (5 ملفات) |
| **Payments** | `docs/PAYMENTS_*.md` (8 ملفات) |
| **AI Agent** | `docs/AI_*.md` (4 ملفات) |
| **Core** | `docs/PROJECT_*.md` (3 ملفات) |

---

## 🔗 روابط مهمة

### خارجية

| الخدمة | الرابط |
|--------|--------|
| Next.js | [nextjs.org](https://nextjs.org/) |
| Supabase | [supabase.com](https://supabase.com/) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com/) |
| Vercel | [vercel.com](https://vercel.com/) |
| MyFatoorah | [myfatoorah.com](https://myfatoorah.com/) |
| Resend | [resend.com](https://resend.com/) |
| Upstash | [upstash.com](https://upstash.com/) |
| Anthropic | [anthropic.com](https://anthropic.com/) |

### داخلية

| القسم | المسار |
|-------|--------|
| Email System | `src/lib/emails/` |
| Rate Limiting | `src/lib/rate-limit.ts` |
| Analytics | `src/app/(tenant)/dashboard/analytics/` |
| Admin | `src/app/admin/` |
| GDPR | `src/app/api/gdpr/` |
| Cron | `src/app/api/cron/` |
| Marketing | `src/lib/marketing/` |
| AI Agent | `src/lib/ai/` |
| Payments | `src/lib/myfatoorah.ts` |

---

## 🎯 حالة المشروع

### الجاهزية للإنتاج

```
┌─────────────────────────────────────────────────────────┐
│ PRODUCTION READINESS CHECKLIST                          │
├─────────────────────────────────────────────────────────┤
│ ✅ Code Quality:        Production Ready                │
│ ✅ Test Coverage:       100% Passing (216/216)          │
│ ✅ Database Schema:     Complete (30+ tables)           │
│ ✅ API Routes:          Complete (20+ routes)           │
│ ✅ UI Pages:            Complete (47 pages)             │
│ ✅ Documentation:       Complete (15+ docs)             │
│ ✅ Environment Config:  Complete                        │
│ ✅ Security:            RLS + Rate Limiting             │
│ ✅ Performance:         Caching + Optimization          │
│ ✅ Error Handling:      Complete                        │
└─────────────────────────────────────────────────────────┘
```

### الحالة العامة: **100% Production Ready** 🎉

---

## 📋 خطط الاشتراك

| الخطة | السعر | رسوم المعاملة | الميزات |
|-------|-------|---------------|---------|
| **Basic** | مجاني | 2.5% | 100 عملية/شهر، ميزات أساسية |
| **Professional** | 99 ر.س/شهر | 2.0% | 1000 عملية/شهر، ميزات متقدمة |
| **Enterprise** | 299 ر.س/شهر | 1.5% | غير محدود، جميع الميزات |

---

## 🔐 الأمان والامتثال

### Security Features

- ✅ **RLS (Row Level Security)** - عزل بيانات كامل
- ✅ **Rate Limiting** - 6 rate limiters مختلفة
- ✅ **Audit Logs** - تتبع جميع العمليات
- ✅ **Security Headers** - CSP, HSTS, X-Frame-Options
- ✅ **JWT Sessions** - مصادقة آمنة
- ✅ **Input Validation** - Zod schemas

### GDPR Compliance

- ✅ Data Export API
- ✅ Data Deletion API
- ✅ Consent Management
- ✅ Privacy Policy Support

---

## 🚀 النشر

### النشر على Vercel

```bash
# تثبيت Vercel CLI
pnpm add -g vercel

# النشر
vercel

# اتبع التعليمات
```

### متغيرات البيئة للإنتاج

لا تنسَ إضافة جميع المتغيرات البيئية في **Vercel Dashboard**:

1. Project Settings → Environment Variables
2. أضف جميع المتغيرات من `.env.local`
3. انقر Deploy

---

## 🤝 المساهمة

نرحب بمساهماتك في تحسين المنصة:

1. Fork المشروع
2. أنشئ فرع جديد (`git checkout -b feature/amazing-feature`)
3. قم بعمل Commit (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📞 الدعم

- **Email:** hello@labs.sa
- **Documentation:** `/docs` folder
- **GitHub Issues:** [قريباً]

---

## 📄 الترخيص

MIT License — حر للاستخدام التجاري والشخصي

```
Copyright (c) 2026 SaaSFast

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🏆 الإنجازات

```
┌─────────────────────────────────────────────────────────┐
│ ACHIEVEMENTS                                            │
├─────────────────────────────────────────────────────────┤
│ ✅ 5 Units Complete (Marketing, Payments, AI, Core, Admin)
│ ✅ 47 UI Pages
│ ✅ 20+ API Routes
│ ✅ 30+ Database Tables
│ ✅ 216 Tests (100% passing)
│ ✅ 15+ Documentation Files
│ ✅ Production Ready
└─────────────────────────────────────────────────────────┘
```

---

**SaaSFast Platform** — بُني بـ ❤️ للـ community العربي

*آخر تحديث: 2026-03-23*
*الإصدار: v1.0.0-RELEASE*

</div>
