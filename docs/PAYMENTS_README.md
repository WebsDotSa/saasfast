# 📚 توثيق نظام المدفوعات - Saasfast Payments

## نظرة عامة

نظام مدفوعات متكامل مستوحى من **Zid Pay** يسمح لكل تاجر في منصة SaaSFast بقبول المدفوعات من عملائه وإدارة أرباحه وتحويلاتها.

---

## 🏗️ المعمارية

### 3 طبقات رئيسية

```
┌─────────────────────────────────────────────────────────────┐
│  الطبقة 1: العميل النهائي                                   │
│  - يدفع في متجر التاجر عبر MyFatoorah                      │
│  - Mada / Visa / Apple Pay / STC Pay                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  الطبقة 2: لوحة تحكم التاجر                                │
│  - dashboard/payments/                                      │
│  - يرى عملياته فقط (RLS)                                   │
│  - الرصيد + المستحقات + روابط الدفع                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  الطبقة 3: لوحة إدارة المنصة                               │
│  - admin/payments/                                          │
│  - يرى كل المدفوعات (service_role)                         │
│  - إدارة التسويات والتحويلات                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ قاعدة البيانات

### الجداول الجديدة (Migrations 040-044)

| Migration | الجدول | الوصف |
|-----------|--------|-------|
| 040 | `store_transactions` | كل عملية دفع في المنصة |
| 041 | `merchant_balances` | رصيد كل تاجر (يتحدث تلقائياً) |
| 042 | `payment_links` | روابط الدفع السريعة |
| 042 | `merchant_bank_accounts` | الحسابات البنكية للتجار |
| 043 | `settlements` | التسويات والتحويلات البنكية |
| 044 | `plans` (تعديل) | إضافة رسوم البوابة والعمولة |

### هيكل store_transactions

```sql
CREATE TABLE store_transactions (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL,
  
  -- المعرفات
  myfatoorah_invoice_id   VARCHAR(100),
  myfatoorah_payment_id   VARCHAR(100),
  store_order_id          UUID,
  
  -- المبالغ
  gross_amount        NUMERIC(12,2),  -- الإجمالي
  gateway_fee_amount  NUMERIC(12,2),  -- رسوم البوابة (تلقائي)
  platform_fee_amount NUMERIC(12,2),  -- عمولة المنصة (تلقائي)
  net_amount          NUMERIC(12,2),  -- صافي التاجر (تلقائي)
  
  -- طريقة الدفع
  payment_method      VARCHAR(50),
  payment_network     VARCHAR(50),
  card_last4          VARCHAR(4),
  card_brand          VARCHAR(20),
  
  -- العميل
  customer_name       VARCHAR(200),
  customer_email      VARCHAR(255),
  customer_phone      VARCHAR(20),
  
  -- الحالة
  status              VARCHAR(30),  -- pending|success|refunded...
  
  -- التسوية
  settlement_id       UUID,
  settled_at          TIMESTAMPTZ,
  
  -- البيانات الخام
  raw_payload         JSONB,
  
  created_at          TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ
);
```

### Generated Columns (حساب تلقائي)

```sql
-- رسوم البوابة = الإجمالي × النسبة
gateway_fee_amount GENERATED ALWAYS AS (
  ROUND(gross_amount * gateway_fee_rate, 2)
) STORED

-- عمولة المنصة = الإجمالي × النسبة
platform_fee_amount GENERATED ALWAYS AS (
  ROUND(gross_amount * platform_fee_rate, 2)
) STORED

-- صافي التاجر = الإجمالي - الرسوم
net_amount GENERATED ALWAYS AS (
  gross_amount 
  - ROUND(gross_amount * gateway_fee_rate, 2)
  - ROUND(gross_amount * platform_fee_rate, 2)
) STORED
```

---

## 🔄 مسار الدفع

### من البداية للنهاية

```
1. العميل يدفع في متجر التاجر
         ↓
2. MyFatoorah يعالج الدفع (Mada/Visa/ApplePay)
         ↓
3. Webhook من MyFatoorah
         ↓
4. /api/payments/webhook يستقبل
         ↓
5. يُحفَظ في store_transactions
         ↓
6. Trigger يحدّث merchant_balances تلقائياً
         ↓
7. التاجر يرى الرصيد في dashboard
         ↓
8. التاجر يطلب تحويل (IBAN)
         ↓
9. الإدارة توافق وتحوّل
         ↓
10. إشعار بالتحويل + تحديث الأرصدة
```

---

## 🧮 حساب الأرباح

### المعادلة

```
gross_amount        = 500.00 ر.س  ← المبلغ الإجمالي
gateway_fee         =   7.50 ر.س  ← رسوم MyFatoorah (1.5%)
platform_commission =   5.00 ر.س  ← عمولة المنصة (1%)
─────────────────────────────────────────────────────
net_to_merchant     = 487.50 ر.س  ← صافي التاجر
```

### الرسوم حسب الخطة

| الخطة | رسوم البوابة | عمولة المنصة |
|-------|-------------|-------------|
| Basic | 1.5% | 1.5% |
| Professional | 1.5% | 1.0% |
| Enterprise | 1.5% | 0.5% |

---

## 📡 API Routes

### Tenant APIs

| Route | Method | وصف |
|-------|--------|-----|
| `/api/payments/balance` | GET | جلب رصيد التاجر |
| `/api/payments/transactions` | GET | قائمة العمليات (مع فلترة) |
| `/api/payments/links` | GET, POST | روابط الدفع |
| `/api/payments/bank-accounts` | GET, POST, PUT, DELETE | الحسابات البنكية |
| `/api/payments/withdrawal-request` | POST, GET | طلب تحويل |

### Admin APIs (قيد الإنشاء)

| Route | Method | وصف |
|-------|--------|-----|
| `/api/admin/payments/overview` | GET | إحصائيات المنصة |
| `/api/admin/payments/merchants` | GET | أرباح كل متجر |
| `/api/admin/payments/settle` | POST | تنفيذ تحويل |

---

## 🔐 الأمان

### Row Level Security (RLS)

```sql
-- كل تاجر يرى عملياته فقط
CREATE POLICY tx_tenant_isolation 
  ON store_transactions 
  FOR ALL 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR 
    current_setting('app.bypass_rls', true)::boolean = true
  );
```

### الصلاحيات

| المستخدم | الصلاحية |
|----------|----------|
| Tenant User | يرى بياناته فقط (RLS) |
| Super Admin | يرى كل شيء (service_role) |
| Webhook | يمكنه الإدخال/التحديث |

---

## 🎯 الميزات

### للتاجر

- ✅ عرض الرصيد الحالي (متاح + معلق + محجوز)
- ✅ قائمة بجميع عمليات الدفع
- ✅ فلترة حسب الحالة وطريقة الدفع
- ✅ إنشاء روابط دفع سريعة
- ✅ إدارة الحسابات البنكية
- ✅ طلب تحويل الرصيد

### للإدارة

- ✅ مراقبة جميع مدفوعات المنصة
- ✅ إحصائيات شاملة
- ✅ أرباح كل متجر مفصلة
- ✅ إدارة التسويات والتحويلات
- ✅ الموافقة على طلبات التحويل

---

## 📊 Trigger التلقائي

### كيف يعمل؟

```sql
-- Trigger يحدث الرصيد تلقائياً
CREATE TRIGGER trg_update_merchant_balance_on_transaction
  AFTER INSERT OR UPDATE ON store_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_balance_on_transaction();
```

### السيناريوهات

| الحدث | التأثير على الرصيد |
|-------|-------------------|
| عملية ناجحة جديدة | +pending_balance |
| عملية فشلت | -pending_balance |
| استرداد كامل | -pending_balance |
| نزاع بنكي | -available +reserved |
| تحويل | -reserved -total_withdrawn |

---

## 🧪 الاختبار

### 1. اختبار Webhook

```bash
curl -X POST https://your-domain.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "MyFatoorah-Signature: test_signature" \
  -d '{
    "Key": "INV-123456",
    "Status": "success"
  }'
```

### 2. اختبار API

```bash
# جلب الرصيد
curl https://your-domain.com/api/payments/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# جلب العمليات
curl "https://your-domain.com/api/payments/transactions?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# إنشاء رابط دفع
curl -X POST https://your-domain.com/api/payments/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "منتج تجريبي",
    "amount": 100.00,
    "currency": "SAR",
    "customer_email": "customer@example.com"
  }'
```

---

## 📁 هيكل الملفات

```
src/
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   ├── webhook/route.ts
│   │   │   ├── balance/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   ├── links/route.ts
│   │   │   ├── bank-accounts/route.ts
│   │   │   └── withdrawal-request/route.ts
│   │   └── admin/
│   │       └── payments/
│   │           ├── overview/route.ts
│   │           ├── merchants/route.ts
│   │           └── settle/route.ts
│   └── (tenant)/
│       └── dashboard/
│           └── payments/
│               ├── page.tsx
│               ├── transactions/
│               ├── links/
│               └── bank-accounts/
├── lib/
│   ├── db/
│   │   └── schema.ts (5 جداول جديدة)
│   └── emails/
│       └── templates/
│           └── settlement.tsx
supabase/
└── migrations/
    ├── 040_store_transactions.sql
    ├── 041_merchant_balances.sql
    ├── 042_payment_links_bank_accounts.sql
    ├── 043_settlements.sql
    └── 044_add_fee_rates_to_plans.sql
```

---

## 🔧 التكوين

### متغيرات البيئة

```bash
# MyFatoorah
MYFATOORAH_API_KEY=your_api_key
MYFATOORAH_SECRET=your_webhook_secret
MYFATOORAH_BASE_URL=https://api.myfatoorah.com

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://...
```

### تحديث جدول plans

```sql
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS gateway_fee_rate NUMERIC(5,4) DEFAULT 0.015;

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS platform_fee_rate NUMERIC(5,4) DEFAULT 0.01;
```

---

## 📈 المراقبة

### مؤشرات الأداء

| المقياس | الهدف |
|---------|-------|
| حفظ عملية | < 200ms |
| جلب رصيد | < 100ms |
| قائمة العمليات | < 500ms |
| إنشاء تسوية | < 1s |

### المراقبة

- عدد العمليات الناجحة/الفاشلة
- متوسط وقت الاستجابة
- أخطاء Webhook
- رصيد كل متجر

---

## 📚 المراجع

- **الدليل الكامل:** `saasfast-payments-guide.html`
- **Zid Pay Reference:** `docs/zidpay-reference/`
- **MyFatoorah Docs:** https://docs.myfatoorah.com/
- **خطة التنفيذ:** `PAYMENTS_IMPLEMENTATION_PLAN.md`
- **حالة التنفيذ:** `PAYMENTS_STATUS.md`

---

## ✅ Checklist النشر

- [ ] تطبيق جميع migrations
- [ ] اختبار Webhook مع MyFatoorah
- [ ] اختبار جميع API routes
- [ ] مراجعة RLS policies
- [ ] اختبار الأمان
- [ ] إعداد Rate Limiting
- [ ] إعداد Monitoring
- [ ] توثيق API

---

**الحالة:** ✅ الأسبوع 1 و 2 مكتملان  
**التاريخ:** 2026-03-21  
**الإصدار:** 1.0.0
