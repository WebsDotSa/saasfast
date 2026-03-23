# 📋 خطة تنفيذ نظام المدفوعات المتكامل - Saasfast

## نظرة عامة

نظام مدفوعات متكامل مستوحى من Zid Pay يسمح لكل تاجر في المنصة بـ:
- قبول مدفوعات من عملائه عبر MyFatoorah
- تتبع جميع العمليات المالية
- إدارة الأرصدة والتحويلات البنكية
- إنشاء روابط دفع سريعة

وتسمح للإدارة بـ:
- مراقبة جميع مدفوعات المنصة
- حساب الأرباح والرسوم
- إدارة التسويات والتحويلات البنكية

---

## 📊 المعمارية العامة

### 3 طبقات رئيسية:

```
┌─────────────────────────────────────────────────────────────────┐
│  الطبقة 1: العميل النهائي                                       │
│  - يدفع في متجر التاجر عبر MyFatoorah                          │
│  - Mada / Visa / Apple Pay / STC Pay                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  الطبقة 2: لوحة تحكم التاجر (dashboard/payments)               │
│  - يرى عملياته فقط (RLS)                                       │
│  - الرصيد + المستحقات + روابط الدفع                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  الطبقة 3: لوحة إدارة المنصة (admin/payments)                   │
│  - يرى كل المدفوعات (service_role)                             │
│  - إدارة التسويات والتحويلات                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ قاعدة البيانات - 5 Migrations جديدة

### Migration 040: store_transactions
**الملف:** `supabase/migrations/040_store_transactions.sql`

جدول كل عملية دفع - القلب الأساسي للنظام

**الحقول الرئيسية:**
- `gross_amount`: المبلغ الإجمالي
- `gateway_fee_amount`: رسوم البوابة (1.5% افتراضي)
- `platform_fee_amount`: عمولة المنصة (1% افتراضي)
- `net_amount`: صافي التاجر (محسوب تلقائياً)
- `payment_method`: mada | visa | mastercard | apple_pay | stcpay
- `status`: pending | success | failed | refunded | chargeback

**المميزات:**
- Generated Columns لحساب الرسوم تلقائياً
- RLS Policy لعزل بيانات كل تاجر
- Indexes للأداء

---

### Migration 041: merchant_balances
**الملف:** `supabase/migrations/041_merchant_balances.sql`

رصيد كل متجر - يتحدث تلقائياً مع كل عملية

**الحقول:**
- `available_balance`: جاهز للتحويل
- `pending_balance`: قيد المعالجة (T+1)
- `reserved_balance`: محجوز للردود/النزاعات
- `total_earned`: إجمالي ما كسبه
- `total_withdrawn`: إجمالي ما حوّله

**Trigger تلقائي:**
```sql
CREATE TRIGGER trg_update_balance
  AFTER INSERT OR UPDATE ON store_transactions
  FOR EACH ROW EXECUTE FUNCTION update_merchant_balance_on_transaction();
```

**⚡ النقطة الذهبية:** بمجرد حفظ عملية في `store_transactions`، الرصيد يتحدث تلقائياً عبر الـ Trigger - لا حاجة لكود إضافي!

---

### Migration 042: payment_links + bank_accounts
**الملف:** `supabase/migrations/042_payment_links_bank_accounts.sql`

#### جدول payment_links
روابط الدفع السريعة (مثل زد "روابط الدفع")
- `link_number`: PLK-000001
- `amount`, `title`, `description`
- `myfatoorah_url`, `short_url`
- `status`: active | paid | expired | cancelled

#### جدول merchant_bank_accounts
الحسابات البنكية للتاجر
- `iban`: SA + 22 رقم
- `is_primary`, `is_verified`

---

### Migration 043: settlements
**الملف:** `supabase/migrations/043_settlements.sql`

التسويات والتحويلات البنكية - للإدارة فقط

**الحقول:**
- `settlement_number`: STL-202603-0001
- `gross_amount`, `gateway_fees`, `platform_fees`, `net_amount`
- `period_start`, `period_end`
- `status`: pending | processing | transferred | failed | on_hold
- `bank_reference`, `transferred_at`, `approved_by` (admin user)

---

## 📡 مسار الدفع - من البداية للنهاية

```
1. العميل يدفع في متجر التاجر
         ↓
2. MyFatoorah يعالج الدفع
         ↓
3. Webhook يُطلَق من MyFatoorah
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

## 🧮 معادلة حساب الأرباح

**مثال: طلب بقيمة 500 ر.س**

```
gross_amount        = 500.00 ر.س  ← المبلغ الإجمالي
gateway_fee         =   7.50 ر.س  ← رسوم MyFatoorah: 1.5%
platform_commission =   5.00 ر.س  ← عمولة المنصة: 1%
─────────────────────────────────────────────────────
net_to_merchant     = 487.50 ر.س  ← صافي التاجر
```

**الرسوم قابلة للتخصيص لكل خطة:**
```sql
-- في جدول plans
gateway_fee_rate   NUMERIC(5,4) DEFAULT 0.015  -- 1.5%
platform_fee_rate  NUMERIC(5,4) DEFAULT 0.01   -- 1.0%

-- Basic:        gateway=1.5%, platform=1.5%
-- Professional: gateway=1.5%, platform=1.0%
-- Enterprise:   gateway=1.5%, platform=0.5%
```

---

## 📁 الملفات المطلوبة

### الأسبوع 1 - الأساس

| الملف | النوع | التعديل | الحالة |
|------|-------|---------|--------|
| `supabase/migrations/040_store_transactions.sql` | DB | جديد | ⏳ pending |
| `supabase/migrations/041_merchant_balances.sql` | DB + Trigger | جديد | ⏳ pending |
| `supabase/migrations/042_payment_links_bank_accounts.sql` | DB | جديد | ⏳ pending |
| `supabase/migrations/043_settlements.sql` | DB | جديد | ⏳ pending |
| `src/app/api/payments/webhook/route.ts` | API | تعديل | ⏳ pending |
| `src/lib/db/schema.ts` | Schema | إضافة 5 جداول | ⏳ pending |

### الأسبوع 2 - واجهة التاجر

| الملف | النوع | التعديل | الحالة |
|------|-------|---------|--------|
| `src/app/api/payments/balance/route.ts` | API | جديد | ⏳ pending |
| `src/app/api/payments/transactions/route.ts` | API | جديد | ⏳ pending |
| `src/app/api/payments/links/route.ts` | API | جديد | ⏳ pending |
| `src/app/api/payments/bank-accounts/route.ts` | API | جديد | ⏳ pending |
| `src/app/api/payments/withdrawal-request/route.ts` | API | جديد | ⏳ pending |
| `src/app/(tenant)/dashboard/payments/page.tsx` | UI | جديد | ⏳ pending |
| `src/app/(tenant)/dashboard/payments/transactions/page.tsx` | UI | جديد | ⏳ pending |
| `src/app/(tenant)/dashboard/payments/links/page.tsx` | UI | جديد | ⏳ pending |
| `src/app/(tenant)/dashboard/payments/bank-accounts/page.tsx` | UI | جديد | ⏳ pending |

### الأسبوع 3 - لوحة الإدارة والتسويات

| الملف | النوع | التعديل | الحالة |
|------|-------|---------|--------|
| `src/app/api/admin/payments/overview/route.ts` | API | جديد | ⏳ pending |
| `src/app/api/admin/payments/merchants/route.ts` | API | جديد | ⏳ pending |
| `src/app/api/admin/payments/settle/route.ts` | API | جديد | ⏳ pending |
| `src/app/admin/payments/overview/page.tsx` | UI | جديد | ⏳ pending |
| `src/app/admin/payments/merchants/page.tsx` | UI | جديد | ⏳ pending |
| `src/app/admin/payments/settlements/page.tsx` | UI | جديد | ⏳ pending |
| `src/lib/emails/templates/settlement.tsx` | Email | جديد | ⏳ pending |

---

## 🔧 التعديلات المطلوبة على النظام الحالي

### 1. تحديث جدول plans

```sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS
  gateway_fee_rate NUMERIC(5,4) DEFAULT 0.015;

ALTER TABLE plans ADD COLUMN IF NOT EXISTS
  platform_fee_rate NUMERIC(5,4) DEFAULT 0.01;
```

### 2. تعديل Webhook الحالي

في `src/app/api/payments/webhook/route.ts`:

بعد السطر 112 (تحديث الفاتورة)، أضف:

```typescript
if (isSuccess) {
  // 1. حفظ في store_transactions
  const paymentData = paymentStatus.data as any
  await supabase.from('store_transactions').upsert({
    tenant_id:              invoice.tenant_id,
    myfatoorah_invoice_id:  invoiceId.toString(),
    myfatoorah_payment_id:  paymentData.PaymentId?.toString(),
    store_order_id:         invoice.order_id,
    gross_amount:           paymentData.InvoiceValue,
    currency:               paymentData.ExtraMerchantCode || 'SAR',
    gateway_fee_rate:       await getGatewayFeeRate(invoice.tenant_id),
    platform_fee_rate:      await getPlatformFeeRate(invoice.tenant_id),
    payment_method:         paymentData.PaymentMethod,
    payment_network:        paymentData.PaymentType,
    card_last4:             paymentData.CardInfo?.CardLastFour,
    card_brand:             paymentData.CardInfo?.Brand,
    customer_name:          paymentData.CustomerName,
    customer_email:         paymentData.CustomerEmail,
    customer_phone:         paymentData.CustomerMobile,
    status:                 'success',
    raw_payload:            paymentData,
  }, { onConflict: 'myfatoorah_invoice_id' })

  // 2. الـ Trigger يحدث merchant_balances تلقائياً
}
```

---

## 🎯 خطة التنفيذ التفصيلية

### الأسبوع 1 - الأساس المالي

#### اليوم 1-2: Database Setup
- [ ] تطبيق Migration 040 (store_transactions)
- [ ] تطبيق Migration 041 (merchant_balances + Trigger)
- [ ] تطبيق Migration 042 (payment_links + bank_accounts)
- [ ] تطبيق Migration 043 (settlements)
- [ ] تحديث جدول plans بإضافة gateway_fee_rate و platform_fee_rate
- [ ] تحديث `src/lib/db/schema.ts` بإضافة الجداول الجديدة

#### اليوم 3-4: Webhook Integration
- [ ] تعديل `/api/payments/webhook/route.ts` لحفظ العمليات
- [ ] إضافة دالة `getGatewayFeeRate()` و `getPlatformFeeRate()`
- [ ] اختبار Webhook مع MyFatoorah Sandbox
- [ ] التحقق من تحديث الأرصدة تلقائياً

#### اليوم 5: Testing
- [ ] اختبار حفظ عملية ناجحة
- [ ] اختبار فشل الدفع
- [ ] اختبار الاسترداد (refund)
- [ ] التحقق من RLS policies

---

### الأسبوع 2 - واجهة التاجر

#### اليوم 1-2: API Routes
- [ ] `GET /api/payments/balance` - جلب رصيد التاجر
- [ ] `GET /api/payments/transactions` - قائمة العمليات
- [ ] `POST /api/payments/links` - إنشاء رابط دفع
- [ ] `GET /api/payments/links` - قائمة الروابط
- [ ] `CRUD /api/payments/bank-accounts` - الحسابات البنكية
- [ ] `POST /api/payments/withdrawal-request` - طلب تحويل

#### اليوم 3-5: UI Pages
- [ ] `dashboard/payments/page.tsx` - الصفحة الرئيسية
  - الرصيد الحالي المتاح
  - المستحقات قيد الإيداع
  - آخر إيداع
  - إجمالي المبيعات (الشهر)

- [ ] `dashboard/payments/transactions/page.tsx` - العمليات
  - فلتر: الكل/ناجح/استرداد
  - رقم العملية + نوعها
  - قيمة المعالجة + العملة
  - نوع الشبكة (Mada/Visa)

- [ ] `dashboard/payments/links/page.tsx` - روابط الدفع
  - إنشاء رابط دفع سريع
  - مشاركة واتساب/SMS
  - حالة الرابط + حالة الدفع

- [ ] `dashboard/payments/bank-accounts/page.tsx` - الحسابات البنكية
  - إضافة حساب IBAN
  - تحديد الحساب الأساسي
  - طلب تحويل الرصيد

#### اليوم 6-7: Testing & Refinement
- [ ] اختبار كل صفحة
- [ ] تحسين الأداء
- [ ] إضافة loading states
- [ ] اختبار RLS (كل تاجر يرى بياناته فقط)

---

### الأسبوع 3 - لوحة الإدارة والتسويات

#### اليوم 1-2: Admin API Routes
- [ ] `GET /api/admin/payments/overview` - إحصائيات المنصة
  - إجمالي مبيعات المنصة
  - إجمالي رسوم البوابة
  - إجمالي عمولات المنصة
  - إجمالي المحوَّل للمتاجر
  - أعلى 10 متاجر مبيعاً

- [ ] `GET /api/admin/payments/merchants` - أرباح كل متجر
  - الرصيد المتاح لكل متجر
  - إجمالي المبيعات vs الصافي
  - إجمالي الرسوم المخصومة
  - تاريخ آخر تحويل

- [ ] `POST /api/admin/payments/settle` - تنفيذ تحويل
  - الموافقة على طلب تحويل
  - إدخال رقم التحويل البنكي
  - تحديث الأرصدة
  - إرسال إشعار

#### اليوم 3-4: Admin UI Pages
- [ ] `admin/payments/overview/page.tsx` - لوحة الإحصائيات
- [ ] `admin/payments/merchants/page.tsx` - قائمة المتاجر
- [ ] `admin/payments/settlements/page.tsx` - إدارة التسويات

#### اليوم 5: Email Templates
- [ ] `src/lib/emails/templates/settlement.tsx` - إشعار التحويل
- [ ] دمج مع `sendSettlementEmail()`

#### اليوم 6-7: Final Testing
- [ ] اختبار دورة حياة كاملة
- [ ] اختبار الأحمال (load testing)
- [ ] مراجعة الأمان
- [ ] توثيق API

---

## 🔐 الأمان والصلاحيات

### Tenant Isolation (RLS)
```sql
-- كل تاجر يرى عملياته فقط
CREATE POLICY tx_tenant_isolation ON store_transactions FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Admin Access
- الأدمن يستخدم `service_role` key (يتجاوز RLS)
- جميع عمليات الإدارة تتطلب `super_admin` role

### Rate Limiting
- Webhook: 100 طلب/دقيقة
- API Routes: 30 طلب/دقيقة
- Bank Accounts: 10 طلبات/دقيقة

---

## 📊 مؤشرات الأداء

### الأهداف:
- حفظ عملية: < 200ms
- جلب رصيد: < 100ms
- قائمة العمليات (100): < 500ms
- إنشاء تسوية: < 1s

### المراقبة:
- عدد العمليات الناجحة/الفاشلة
- متوسط وقت الاستجابة
- أخطاء Webhook
- رصيد كل متجر

---

## ✅ Checklist نهائي

### الأسبوع 1
- [ ] 040_store_transactions.sql
- [ ] 041_merchant_balances.sql
- [ ] 042_payment_links_bank_accounts.sql
- [ ] 043_settlements.sql
- [ ] تحديث schema.ts
- [ ] تعديل webhook/route.ts
- [ ] اختبار Webhook

### الأسبوع 2
- [ ] GET /api/payments/balance
- [ ] GET /api/payments/transactions
- [ ] POST /api/payments/links
- [ ] CRUD /api/payments/bank-accounts
- [ ] 4 صفحات UI للتاجر
- [ ] إضافة "المدفوعات" للـ Sidebar

### الأسبوع 3
- [ ] GET /api/admin/payments/overview
- [ ] GET /api/admin/payments/merchants
- [ ] POST /api/admin/payments/settle
- [ ] 3 صفحات UI للإدارة
- [ ] settlement email template
- [ ] اختبار شامل
- [ ] Deployment

---

## 🚀 البدء

### الخطوة 1: تطبيق Migrations
```bash
# تطبيق جميع migrations الجديدة
psql $DATABASE_URL -f supabase/migrations/040_store_transactions.sql
psql $DATABASE_URL -f supabase/migrations/041_merchant_balances.sql
psql $DATABASE_URL -f supabase/migrations/042_payment_links_bank_accounts.sql
psql $DATABASE_URL -f supabase/migrations/043_settlements.sql
```

### الخطوة 2: تحديث Schema
```bash
# تحديث Drizzle schema
# إضافة الجداول الجديدة في src/lib/db/schema.ts
```

### الخطوة 3: تعديل Webhook
```bash
# تعديل src/app/api/payments/webhook/route.ts
# إضافة حفظ في store_transactions
```

### الخطوة 4: اختبار
```bash
# تشغيل MyFatoorah Sandbox
# اختبار دورة دفع كاملة
```

---

## 📚 المراجع

- **Zid Pay Reference:** `docs/zidpay-reference/` (6 ملفات HTML)
- **MyFatoorah Docs:** https://docs.myfatoorah.com/
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/router-handlers

---

## 💡 ملاحظات مهمة

1. **الـ Trigger هو السر:** لا تكتب كود لتحديث الأرصدة - الـ Trigger يفعل ذلك تلقائياً!

2. **RLS مهم جداً:** تأكد أن كل تاجر يرى بياناته فقط

3. **اختبر مع Sandbox:** استخدم MyFatoorah Sandbox قبل الإنتاج

4. **Audit Logs:** سجّل كل عملية مالية في audit_logs

5. **Email Notifications:** أرسل إشعارات لكل حدث مهم

---

**تم إنشاء الخطة:** 2026-03-21  
**المدة المتوقعة:** 3 أسابيع  
**الحالة:** جاهزة للتنفيذ ✅
