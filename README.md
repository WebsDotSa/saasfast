# 🚀 SaaS Core Platform

**منصة SaaS متعددة المستأجرين جاهزة للإنتاج** — مستوحاة من سلة وزد، مبنية بتقنيات 2025

[![Status](https://img.shields.io/badge/status-85%25%20complete-brightgreen)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 📋 المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [الميزات](#-الميزات)
- [التقنيات](#-التقنيات)
- [البدء السريع](#-البدء-السريع)
- [البنية المعمارية](#-البنية-المعمارية)
- [حالة المشروع](#-حالة-المشروع)
- [التوثيق](#-التوثيق)
- [المساهمة](#-المساهمة)

---

## 🎯 نظرة عامة

### الرؤية

بناء **SaaS OS** — نظام تشغيل قابل للتحويل لأي نوع SaaS:

| نوع SaaS | مثال | الحالة |
|----------|------|--------|
| 🛒 E-commerce | سلة، زد | ⬜ قيد التطوير |
| 🌐 Page Builder | Wix، Squarespace | ⬜ قيد التطوير |
| 📊 Accounting | قيود، دفترة | ⬜ مستقبلاً |
| 👥 HRMS | جدار، موارد | ⬜ مستقبلاً |
| 🤝 CRM | Salesforce | ⬜ مستقبلاً |
| 🤖 AI Agent | Msaed.ai | ⬜ مستقبلاً |

### لماذا SaaS Core؟

| الميزة | SaaS Core | البدائل التقليدية |
|--------|-----------|-------------------|
| **Time to Market** | أسابيع | أشهر |
| **Type Safety** | End-to-End TypeScript | جزئي أو معدوم |
| **AI-Ready** | Vercel AI SDK Native | يتطلب تكامل معقد |
| **Real-time** | Supabase Realtime مدمج | يحتاج إعداد منفصل |
| **Multi-Tenant** | معمار من اليوم الأول | يُضاف لاحقاً |
| **Arabic RTL** | دعم كامل من الأساس | إضافة لاحقة |

---

## ✨ الميزات

### الأساسية

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| **Multi-Tenancy** | عزل بيانات كامل مع RLS | ✅ مكتمل |
| **Custom Domains** | ربط نطاقات مع SSL تلقائي | ✅ مكتمل |
| **Module System** | وحدات قابلة للتفعيل/التعطيل | ✅ مكتمل |
| **Billing** | MyFatoorah (Mada, STC, Apple Pay) | ✅ مكتمل |
| **Arabic RTL** | دعم كامل للعربية | ✅ مكتمل |

### الجديدة (2026-03-20)

| الميزة | الوصف | الحالة |
|--------|-------|--------|
| **📧 Email System** | 7 قوالب + SMTP Integration | ✅ جديد |
| **⏰ Cron Jobs** | إدارة تلقائية للاشتراكات | ✅ جديد |
| **🛡️ Rate Limiting** | حماية API من Abuse | ✅ جديد |
| **📊 Analytics** | لوحة تحليلات كاملة | ✅ جديد |
| **📄 PDF Invoices** | توليد PDF احترافي | ✅ جديد |
| **🔐 GDPR** | تصدير/حذف البيانات | ✅ جديد |
| **👨‍💼 Admin Panel** | لوحة إدارة كاملة | ✅ جديد |
| **📝 Audit Logs** | تسجيل جميع العمليات | ✅ جديد |

---

## 🛠️ التقنيات

### Core Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Framework       │  Next.js 14 App Router  │  SSR + RSC    │
│  Language        │  TypeScript 5.x         │  Type Safety  │
│  Database        │  Supabase (PostgreSQL)  │  RLS + Realtime│
│  ORM             │  Drizzle ORM            │  SQL-first    │
│  UI Library      │  shadcn/ui + Radix      │  Accessible   │
│  Styling         │  Tailwind CSS v3        │  RTL Support  │
│  Auth            │  NextAuth.js + Supabase │  Multi-provider│
│  Deployment      │  Vercel / Coolify       │  Zero-config  │
└─────────────────────────────────────────────────────────────┘
```

### External Services

| الخدمة | الاستخدام | الحالة |
|--------|-----------|--------|
| **MyFatoorah** | بوابة الدفع | ✅ متكامل |
| **Cloudflare** | DNS + Custom Domains | ✅ متكامل |
| **Resend** | Email Transactional | ✅ متكامل |
| **Upstash Redis** | Cache + Rate Limiting | ✅ متكامل |

### المكتبات

```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "@supabase/supabase-js": "latest",
  "drizzle-orm": "latest",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "3.x",
  "zod": "latest",
  "next-auth": "5.0.0-beta",
  "@react-email/components": "latest",
  "@upstash/ratelimit": "latest",
  "@react-pdf/renderer": "latest"
}
```

---

## 🚀 البدء السريع

### المتطلبات

```bash
- Node.js 18.17+
- npm/pnpm
- حساب Supabase
- حساب MyFatoorah (sandbox)
- حساب Resend (للإيميلات)
- حساب Upstash (للـ Redis)
```

### 1. التثبيت

```bash
# استنساخ المشروع
git clone <repository-url>
cd saasfast

# تثبيت التبعيات
npm install
```

### 2. إعداد البيئة

```bash
# نسخ ملف المثال
cp .env.example .env.local

# تحرير .env.local وإضافة القيم:
# - Supabase URL & Keys
# - NextAuth Secret
# - MyFatoorah Keys
# - Resend API Key
# - Upstash Redis URL & Token
# - Cron Secret
```

### 3. قاعدة البيانات

```bash
# في Supabase Dashboard → SQL Editor
# شغّل الملفات بالترتيب:

supabase/migrations/001_core_tables.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_module_tables.sql
supabase/migrations/010_subscription_notifications.sql
supabase/migrations/011_gdpr_tables.sql
supabase/migrations/012_audit_logs.sql
```

### 4. التشغيل

```bash
# تطوير
npm run dev

# إنتاج
npm run build
npm start
```

افتح [http://localhost:3000](http://localhost:3000)

---

## 🏗️ البنية المعمارية

### طبقات النظام

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 0: Cloudflare Edge                                   │
│  DNS + SSL + DDoS Protection + CDN                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Next.js Middleware                                │
│  Tenant Resolution + Auth Guard + Rate Limiting             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: App Router (Next.js 14)                           │
│  Server Components + API Routes                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Supabase Data Layer                               │
│  PostgreSQL + RLS + Auth + Storage + Realtime               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: External Services                                 │
│  MyFatoorah │ Resend │ Upstash │ Cloudflare API            │
└─────────────────────────────────────────────────────────────┘
```

### تدفق الطلب

```
User Request
    ↓
Cloudflare (DNS + SSL)
    ↓
Middleware (Tenant + Auth + Rate Limit)
    ↓
App Router (Module Loader)
    ↓
Supabase RLS (Data Isolation)
    ↓
Response
```

---

## 📊 حالة المشروع

### الإنجاز الكلي: **85%**

```
Phase 1-7:  [████████████████████████████████████████] 100%
Phase 8:    [████████████████████████████████████████] 100%
Phase 9:    [████████████████████████████████████████] 100%
Phase 10:   [████████████████░░░░░░░░░░░░░░░░░░░░░░░░]  40%
```

### ما تم إنجازه

| المرحلة | الميزات | الحالة |
|---------|---------|--------|
| **1-7** | Core + Multi-Tenancy + Auth + Billing | ✅ 100% |
| **8** | Email + Cron + Rate Limit + Analytics + PDF | ✅ 100% |
| **9** | GDPR + Admin + Audit Logs | ✅ 100% |
| **10** | E-commerce + Page Builder | ⬜ قيد التطوير |

### المتبقي

| المهمة | الأولوية | التقدير |
|--------|----------|---------|
| اختبار شامل (Unit + E2E) | 🔴 عالية | 3 أيام |
| تحسينات الأداء | 🟡 متوسطة | 2 أيام |
| توثيق API | 🟢 منخفضة | 2 أيام |
| E-commerce Module | 🔴 عالية | 2 أسبوع |
| Page Builder | 🔴 عالية | 2 أسبوع |

---

## 📁 هيكل المشروع

```
saasfast/
├── src/
│   ├── app/
│   │   ├── (tenant)/dashboard/     # Tenant Dashboard
│   │   │   ├── analytics/          # ✅ جديد
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── cron/               # ✅ جديد
│   │   │   ├── gdpr/               # ✅ جديد
│   │   │   ├── invoices/[id]/pdf/  # ✅ جديد
│   │   │   └── payments/
│   │   └── admin/                  # ✅ جديد
│   │       ├── tenants/
│   │       ├── subscriptions/
│   │       └── plans/
│   │
│   ├── lib/
│   │   ├── emails/                 # ✅ جديد
│   │   ├── rate-limit.ts           # ✅ جديد
│   │   ├── audit.ts                # ✅ جديد
│   │   └── supabase/
│   │
│   └── components/
│       ├── ui/                     # shadcn/ui
│       └── invoice-pdf-template.tsx # ✅ جديد
│
├── supabase/migrations/
│   ├── 001-003_core.sql            # الأساسيات
│   ├── 010_notifications.sql       # ✅ جديد
│   ├── 011_gdpr.sql                # ✅ جديد
│   └── 012_audit.sql               # ✅ جديد
│
├── .env.example
├── DEVELOPMENT_PLAN.md             # خطة التطوير الكاملة
├── PROJECT_STATUS.md               # حالة المشروع التفصيلية
└── README.md                       # هذا الملف
```

---

## 📚 التوثيق

| الملف | الوصف |
|-------|-------|
| [`README.md`](README.md) | دليل المشروع الرئيسي |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | حالة المشروع التفصيلية |
| [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) | خطة التطوير الكاملة |
| [`.env.example`](.env.example) | المتغيرات البيئية |
| `/docs` | وثائق إضافية |

---

## 🔐 الأمان

### المُطبّق

- ✅ Row Level Security (RLS) على كل الجداول
- ✅ Tenant Isolation كامل
- ✅ Rate Limiting للـ APIs
- ✅ Security Headers (CSP, HSTS, etc.)
- ✅ Audit Logs لجميع العمليات
- ✅ GDPR Compliance (Export/Delete)

### قيد التطبيق

- ⬜ Penetration Testing
- ⬜ Security Audit خارجي
- ⬜ SOC 2 Compliance

---

## 📈 الأداء

### المُطبّق

- ✅ Redis Caching (Upstash)
- ✅ Database Indexes
- ✅ Next.js SSR/SSG
- ✅ Image Optimization
- ✅ Pagination

### المستهدف

- ⬜ First Contentful Paint < 1s
- ⬜ Time to Interactive < 3s
- ⬜ Lighthouse Score > 95

---

## 🧪 الاختبارات

### المخطط

- ⬜ Unit Tests (Vitest)
- ⬜ Integration Tests
- ⬜ E2E Tests (Playwright)
- ⬜ Load Testing (k6)

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات:

1. Fork المشروع
2. إنشاء فرع: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. فتح Pull Request

### معايير الكود

- TypeScript صارم
- ESLint + Prettier
- Commit Messages واضحة
- اختبارات للميزات الجديدة

---

## 📄 الترخيص

MIT License — حر للاستخدام التجاري والشخصي

---

## 📞 التواصل

- **الموقع:** [labs.sa](https://labs.sa)
- **البريد:** hello@labs.sa
- **GitHub:** [قريباً]

---

## 🙏 شكر وتقدير

مستوحى من:
- [سلة](https://salla.com) — الرائدة في المنطقة
- [زد](https://zid.sa) — التميز التقني

مبني على أكتاف عمالقة:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

**SaaS Core Platform** — بُني بـ ❤️ للـ community العربي

---

## 📊 إحصائيات سريعة

| المقياس | القيمة |
|---------|--------|
| **الجاهزية** | 85% |
| **الملفات** | ~65 |
| **أسطر الكود** | ~9,500 |
| **المكتبات** | 40+ |
| **APIs** | 15+ |
| **Migrations** | 6 |
| **Email Templates** | 7 |

---

*آخر تحديث: 2026-03-20*  
*الإصدار: v0.9.0-beta*
# saasfast
