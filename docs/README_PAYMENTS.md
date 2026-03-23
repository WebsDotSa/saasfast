# 🚀 SaaS Fast - نظام المدفوعات المتكامل

## نظرة عامة

منصة SaaS متكاملة مع نظام مدفوعات متطور مستوحى من **Zid Pay**، يتيح لكل تاجر في المنصة قبول المدفوعات من عملائه وإدارة أرباحه وتحويلاتها البنكية.

---

## 🎯 الميزات الرئيسية

### نظام المدفوعات ✅

- ✅ **متجر التاجر:** لوحة تحكم شاملة للمدفوعات
- ✅ **روابط الدفع:** إنشاء روابط دفع سريعة ومشاركتها
- ✅ **الحسابات البنكية:** إدارة متعددة للحسابات البنكية
- ✅ **التسويات:** نظام تحويل أرباح تلقائي
- ✅ **MyFatoorah:** تكامل كامل مع بوابة MyFatoorah

### لوحة الإدارة ✅

- ✅ **نظرة عامة:** إحصائيات شاملة للمنصة
- ✅ **إدارة التجار:** متابعة أرباح كل تاجر
- ✅ **الموافقات:** نظام موافقة على التحويلات
- ✅ **التسويات:** إدارة كاملة للتسويات والتحويلات

---

## 📁 هيكل المشروع

```
saasfast/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── payments/          # Tenant Payment APIs
│   │   │   └── admin/payments/    # Admin Payment APIs
│   │   ├── (tenant)/dashboard/
│   │   │   └── payments/          # Tenant Payment Pages
│   │   └── admin/
│   │       └── payments/          # Admin Payment Pages
│   ├── components/
│   │   ├── dashboard/sidebar.tsx  # Tenant Sidebar
│   │   └── admin/admin-sidebar.tsx # Admin Sidebar
│   └── lib/
│       ├── db/schema.ts           # Database Schema
│       ├── emails/                # Email Templates
│       └── supabase/              # Supabase Client
├── supabase/
│   └── migrations/                # Database Migrations
│       ├── 040_store_transactions.sql
│       ├── 041_merchant_balances.sql
│       ├── 042_payment_links_bank_accounts.sql
│       ├── 043_settlements.sql
│       └── 044_add_fee_rates_to_plans.sql
└── docs/
    ├── PAYMENTS_IMPLEMENTATION_PLAN.md
    ├── PAYMENTS_README.md
    └── PAYMENTS_FINAL_COMPLETE.md
```

---

## 🗄️ قاعدة البيانات

### الجداول الرئيسية

| الجدول | الوصف |
|--------|-------|
| `store_transactions` | كل عملية دفع في المنصة |
| `merchant_balances` | رصيد كل تاجر (يتحدث تلقائياً) |
| `payment_links` | روابط الدفع السريعة |
| `merchant_bank_accounts` | الحسابات البنكية للتجار |
| `settlements` | التسويات والتحويلات البنكية |

### المعادلة التلقائية

```sql
-- حساب الرسوم تلقائياً
gateway_fee = gross_amount × 1.5%
platform_fee = gross_amount × 1%
net_amount = gross_amount - gateway_fee - platform_fee
```

---

## 🔧 التثبيت والتطبيق

### 1. المتطلبات

- Node.js 18+
- PostgreSQL / Supabase
- MyFatoorah Account (Sandbox أو Production)

### 2. متغيرات البيئة

```bash
# .env.local

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...

# MyFatoorah
MYFATOORAH_API_KEY=your_api_key
MYFATOORAH_SECRET=your_webhook_secret
MYFATOORAH_BASE_URL=https://apitest.myfatoorah.com

# Email (اختياري)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
SMTP_FROM_EMAIL=noreply@saasfast.com
```

### 3. تطبيق Migrations

```bash
# تطبيق جميع Migrations الخاصة بالمدفوعات
psql $DATABASE_URL -f supabase/migrations/040_store_transactions.sql
psql $DATABASE_URL -f supabase/migrations/041_merchant_balances.sql
psql $DATABASE_URL -f supabase/migrations/042_payment_links_bank_accounts.sql
psql $DATABASE_URL -f supabase/migrations/043_settlements.sql
psql $DATABASE_URL -f supabase/migrations/044_add_fee_rates_to_plans.sql
```

أو باستخدام Supabase CLI:

```bash
supabase db push
```

### 4. تثبيت التبعيات

```bash
npm install
# أو
pnpm install
```

### 5. تشغيل التطوير

```bash
npm run dev
```

---

## 📡 API Reference

### Tenant APIs

#### GET /api/payments/balance

جلب رصيد التاجر الحالي.

```typescript
// Response
{
  available_balance: "15000.00",
  pending_balance: "5000.00",
  reserved_balance: "1000.00",
  total_earned: "85000.00",
  total_withdrawn: "65000.00",
  currency: "SAR"
}
```

#### GET /api/payments/transactions

جلب قائمة العمليات.

```typescript
// Query Parameters
page?: number
limit?: number
status?: 'success' | 'pending' | 'failed' | 'refunded'
payment_method?: 'mada' | 'visa' | 'mastercard' | 'apple_pay'
start_date?: string
end_date?: string

// Response
{
  transactions: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

#### POST /api/payments/links

إنشاء رابط دفع جديد.

```typescript
// Request Body
{
  title: "منتج مميز",
  amount: 100.00,
  currency: "SAR",
  description?: string,
  customer_name?: string,
  customer_email?: string,
  customer_phone?: string
}

// Response
{
  success: true,
  data: { ... },
  myfatoorah_url: "https://...",
  short_url: "https://..."
}
```

#### POST /api/payments/withdrawal-request

طلب تحويل رصيد.

```typescript
// Request Body
{
  bank_account_id: "uuid",
  amount: 10000.00,
  notes?: string
}
```

### Admin APIs

#### GET /api/admin/payments/overview

إحصائيات المنصة الشاملة.

```typescript
// Query Parameters
period?: '7' | '30' | '90' | '365'

// Response
{
  summary: {
    total_gross: 150000,
    total_gateway_fees: 2250,
    total_platform_fees: 1500,
    total_net: 146250,
    total_transactions: 342
  },
  settlements: {
    total_settled: 120000,
    pending_amount: 15000,
    by_status: { ... }
  },
  top_merchants: [...],
  merchant_count: 24
}
```

#### POST /api/admin/payments/settle

الموافقة على تسوية.

```typescript
// Request Body
{
  settlement_id: "uuid",
  action: "approve" | "reject" | "hold",
  bank_reference?: string,    // مطلوب للموافقة
  transfer_note?: string,
  rejection_reason?: string   // مطلوب للرفض
}
```

---

## 🎨 صفحات UI

### للتاجر

| الصفحة | الوصف |
|--------|-------|
| `/dashboard/payments` | الرئيسية - الإحصائيات والرصيد |
| `/dashboard/payments/transactions` | قائمة العمليات مع الفلترة |
| `/dashboard/payments/links` | إنشاء وإدارة روابط الدفع |
| `/dashboard/payments/bank-accounts` | إدارة الحسابات البنكية |
| `/dashboard/payments/withdrawal-request` | طلب تحويل الرصيد |

### للإدارة

| الصفحة | الوصف |
|--------|-------|
| `/admin/payments/overview` | نظرة عامة على المنصة |
| `/admin/payments/merchants` | قائمة التجار والموافقات |
| `/admin/payments/settlements` | إدارة التسويات |

---

## 🔄 مسار الدفع

```
1. العميل يدفع في متجر التاجر
         ↓
2. MyFatoorah يعالج الدفع
         ↓
3. Webhook → /api/payments/webhook
         ↓
4. حفظ في store_transactions
         ↓
5. Trigger → merchant_balances (تحديث تلقائي)
         ↓
6. التاجر يرى الرصيد في Dashboard
         ↓
7. التاجر يطلب تحويل
         ↓
8. الإدارة توافق وتحول
         ↓
9. تحديث الأرصدة + إشعار
```

---

## 🔐 الأمان

### RLS Policies

```sql
-- كل تاجر يرى بياناته فقط
CREATE POLICY tx_tenant_isolation ON store_transactions
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls')::boolean = true
  );
```

### الصلاحيات

| المستخدم | الصلاحية |
|----------|----------|
| Tenant User | يرى بياناته فقط (RLS) |
| Super Admin | يرى كل شيء (service_role) |
| Webhook | INSERT/UPDATE على store_transactions |

---

## 📊 الأداء

| المقياس | الهدف |
|---------|-------|
| حفظ عملية | < 200ms |
| جلب رصيد | < 100ms |
| قائمة العمليات | < 500ms |
| إنشاء تسوية | < 1s |

---

## 🧪 الاختبار

### Checklist

- [ ] تطبيق جميع Migrations
- [ ] اختبار Webhook (MyFatoorah Sandbox)
- [ ] إنشاء رابط دفع
- [ ] محاكاة دفع ناجح
- [ ] التحقق من تحديث الرصيد
- [ ] طلب تحويل
- [ ] الموافقة من الإدارة
- [ ] التحقق من Email

---

## 📚 التوثيق

| الملف | الوصف |
|-------|-------|
| `PAYMENTS_IMPLEMENTATION_PLAN.md` | خطة التنفيذ الكاملة |
| `PAYMENTS_README.md` | توثيق نظام المدفوعات |
| `PAYMENTS_FINAL_COMPLETE.md` | ملخص الإنجاز الشامل |
| `MIGRATIONS_COMPLETE.md` | توثيق جميع Migrations |
| `saasfast-payments-guide.html` | الدليل المرئي |

---

## 🚀 النشر

### قبل النشر

- [ ] تطبيق Migrations على الإنتاج
- [ ] اختبار Webhook مع MyFatoorah Production
- [ ] مراجعة RLS Policies
- [ ] اختبار الأمان
- [ ] إعداد Rate Limiting
- [ ] إعداد Monitoring & Alerts

### النشر

```bash
# Build
npm run build

# Start
npm start
```

---

## 🛠️ التقنيات المستخدمة

- **Framework:** Next.js 14
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **Payment Gateway:** MyFatoorah
- **Email:** Nodemailer
- **UI:** shadcn/ui
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js

---

## 📞 الدعم

للدعم الفني أو الاستفسارات:

- 📧 Email: support@saasfast.com
- 📚 Docs: `/docs` folder
- 🐛 Issues: GitHub Issues

---

## 📝 الترخيص

جميع الحقوق محفوظة © 2026 SaaS Fast

---

**تم الإنشاء:** 2026-03-21  
**الإصدار:** 1.0.0  
**الحالة:** ✅ مكتمل
