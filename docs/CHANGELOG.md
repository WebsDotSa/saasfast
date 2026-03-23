# 📋 CHANGELOG — SaaS Core Platform

جميع التغييرات المهمة في هذا المشروع.

---

## [0.9.0-beta] — 2026-03-20

### ✨ جديد

#### المرحلة 8: الميزات الأساسية (100%)

**📧 Email System**
- 7 Email Templates (React Email)
  - Payment Success
  - Payment Failed
  - Trial Ending
  - Subscription Expired
  - Subscription Cancelled
  - Welcome
  - Invitation
- SMTP Integration (Resend + Custom)
- Integration مع Webhook و Registration
- ملفات: `src/lib/emails/*`

**⏰ Cron Jobs**
- API Route: `/api/cron/subscriptions`
- 4 مهام تلقائية يومية:
  1. تحويل التجارب المنتهية → expired
  2. تنبيه قبل 7 أيام من انتهاء الاشتراك
  3. تعليق الحسابات المتأخرة > 7 أيام
  4. تنظيف سلات التسوق القديمة
- Vercel Cron Configuration
- ملفات: `src/app/api/cron/subscriptions/route.ts`, `vercel.json`

**🛡️ Rate Limiting**
- Upstash Redis Integration
- 6 Rate Limiters:
  - auth (5/دقيقة)
  - api (100/دقيقة)
  - payments (10/ساعة)
  - tenant-create (3/ساعة)
  - webhooks (20/دقيقة)
  - password-reset (10/ساعة)
- Integration في APIs
- ملفات: `src/lib/rate-limit.ts`

**📊 Analytics Dashboard**
- لوحة تحليلات كاملة
- Stats Cards (Revenue, Orders, Products, Customers)
- Recent Orders
- Top Products
- Revenue Charts
- ملفات: `src/app/(tenant)/dashboard/analytics/*`

**📄 PDF Invoices**
- React PDF Renderer
- Invoice Template احترافي
- Arabic Font (Tajawal)
- Download/Print Support
- ملفات: `src/components/invoice-pdf-template.tsx`, `src/app/api/invoices/[id]/pdf/route.tsx`

#### المرحلة 9: الامتثال والإدارة (100%)

**🔐 GDPR & Data Protection**
- Data Export API
- Data Deletion API
- Consent Management API
- Consent Records Table
- ملفات: `src/app/api/gdpr/*`, `supabase/migrations/011_gdpr_tables.sql`

**👨‍💼 Admin Dashboard**
- Admin Layout مع Sidebar
- Auth Guard (super_admin فقط)
- Dashboard إحصاءات عامة
- إدارة المستأجرين
- إدارة الاشتراكات
- إدارة خطط الأسعار
- ملفات: `src/app/admin/*`

**📝 Audit Logs**
- Audit Logs Table
- Helper Functions (`src/lib/audit.ts`)
- Auto-triggers على الجداول
- ملفات: `src/lib/audit.ts`, `supabase/migrations/012_audit_logs.sql`

### 🔧 تحسينات

- Security Headers محسّنة (CSP, HSTS, etc.)
- تحديث `next.config.js` بـ Security Headers كاملة
- تحديث `.env.example` بالمتغيرات الجديدة
- تحديث `DEVELOPMENT_PLAN.md` بالمهام المكتملة

### 📦 مكتبات جديدة

```json
{
  "@react-email/components": "latest",
  "@react-email/render": "latest",
  "nodemailer": "latest",
  "@upstash/ratelimit": "latest",
  "@react-pdf/renderer": "latest",
  "@types/nodemailer": "latest"
}
```

### 🗄️ Migrations جديدة

```
supabase/migrations/
├── 010_subscription_notifications.sql
├── 011_gdpr_tables.sql
└── 012_audit_logs.sql
```

### 📝 توثيق

- تحديث `README.md` بشكل شامل
- تحديث `PROJECT_STATUS.md` بالتفاصيل الكاملة
- تحديث `DEVELOPMENT_PLAN.md` بالمراحل 8-9
- إنشاء `CHANGELOG.md` (هذا الملف)

### 🧹 تنظيف

- حذف 20+ ملف redundant (.md reports)
- توحيد التوثيق في 3 ملفات رئيسية

---

## [0.8.0-beta] — 2026-03-19

### ✨ جديد

- MyFatoorah Payment Integration
- Webhook Handler
- Payment Initiate API
- Invoice System

### 🔧 تحسينات

- تحديث مigrations
- تحسين RLS Policies

---

## [0.7.0-beta] — 2026-03-18

### ✨ جديد

- Multi-Tenancy System
- Tenant Resolution Middleware
- Custom Domains Support

---

## [0.6.0-beta] — 2026-03-17

### ✨ جديد

- NextAuth.js Integration
- Supabase Auth Connection
- User Registration/Login

---

## [0.5.0-beta] — 2026-03-16

### ✨ جديد

- Database Schema (18 جدول)
- RLS Policies
- Module Registry System

---

## [0.4.0-beta] — 2026-03-15

### ✨ جديد

- Next.js 14 App Router
- TypeScript Configuration
- Tailwind CSS RTL Support

---

## [0.3.0-beta] — 2026-03-14

### ✨ جديد

- Project Structure
- Core Dependencies
- Configuration Files

---

## [0.2.0-alpha] — 2026-03-13

### ✨ جديد

- Technical Analysis
- Architecture Design
- Competitor Research (Salla, Zid)

---

## [0.1.0-alpha] — 2026-03-12

### ✨ جديد

- Project Inception
- Initial Planning
- Repository Setup

---

## 📊 إحصائيات الإصدار 0.9.0

| المقياس | القيمة | التغيير |
|---------|--------|----------|
| **الملفات** | ~65 | +25 |
| **أسطر الكود** | ~9,500 | +4,000 |
| **APIs** | 15+ | +6 |
| **Migrations** | 6 | +3 |
| **Email Templates** | 7 | +7 |
| **Pages** | 20+ | +10 |

---

## 🎯 الخطة القادمة (v1.0.0)

### المتبقي للإطلاق

- [ ] اختبار شامل (Unit + E2E)
- [ ] تحسينات الأداء النهائية
- [ ] توثيق API كامل
- [ ] دليل المستخدم
- [ ] Deployment Production

### Phase 10: Modules

- [ ] E-commerce Module (Products, Orders, Cart)
- [ ] Page Builder Module (Drag & Drop)
- [ ] Accounting Module (ZATCA-ready)

---

## 📝 ملاحظات

### Breaking Changes

لا توجد تغييرات كاسرة في هذا الإصدار.

### Migration Guide

إذا كنت تنتقل من إصدار سابق:

1. شغّل Migrations الجديدة:
```sql
-- في Supabase Dashboard
-- شغّل بالترتيب:
010_subscription_notifications.sql
011_gdpr_tables.sql
012_audit_logs.sql
```

2. أضف المتغيرات البيئية الجديدة في `.env.local`:
```bash
# Email
RESEND_API_KEY=...
EMAIL_FROM=...

# Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Cron
CRON_SECRET=...
```

3. ثبّت التبعيات الجديدة:
```bash
npm install
```

---

**SaaS Core Platform** — بُني بـ ❤️
