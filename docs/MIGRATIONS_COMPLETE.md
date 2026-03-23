# 📦 جميع Migrations - Saasfast

## نظرة عامة

هذا الملف يوثق جميع ملفات migration في النظام مرتبة حسب التسلسل.

---

## 📊 الإحصائيات

| المقياس | العدد |
|---------|-------|
| إجمالي Migrations | 32 |
| Migrations الأساسية | 12 |
| Migrations الميزات | 10 |
| Migrations الإصلاحات | 5 |
| Migrations المدفوعات | 5 |

---

## 🔢 القائمة الكاملة

### المرحلة 1: الأساس (001-004)

| # | الملف | الوصف | الحالة |
|---|-------|-------|--------|
| 001 | `core_tables.sql` | الجداول الأساسية (tenants, plans, subscriptions...) | ✅ مكتمل |
| 002 | `rls_policies.sql` | سياسات الأمان (RLS) | ✅ مكتمل |
| 003 | `module_tables.sql` | جداول الوحدات | ✅ مكتمل |
| 004 | `fix_tenant_trigger.sql` | إصلاح Trigger المنشآت | ✅ مكتمل |

### المرحلة 2: الميزات الأساسية (010-018)

| # | الملف | الوصف | الحالة |
|---|-------|-------|--------|
| 010 | `subscription_notifications.sql` | إشعارات الاشتراكات | ✅ مكتمل |
| 011 | `gdpr_tables.sql` | جداول GDPR | ✅ مكتمل |
| 012 | `audit_logs.sql` | سجل التدقيق | ✅ مكتمل |
| 014 | `team_management.sql` | إدارة الفريق | ✅ مكتمل |
| 015 | `announcements.sql` | نظام الإعلانات | ✅ مكتمل |
| 016 | `referral_program.sql` | برنامج الإحالات | ✅ مكتمل |
| 017 | `fix_plans_schema.sql` | إصلاح جدول الخطط | ✅ مكتمل |
| 018 | `user_profiles.sql` | ملفات المستخدمين | ✅ مكتمل |

### المرحلة 3: الإصلاحات (019-020)

| # | الملف | الوصف | الحالة |
|---|-------|-------|--------|
| 019 | `fix_audit_logs.sql` | إصلاح audit_logs | ✅ مكتمل |
| 020 | `fix_announcements.sql` | إصلاح الإعلانات | ✅ مكتمل |

### المرحلة 4: الذكاء الاصطناعي (025-027)

| # | الملف | الوصف | الحالة |
|---|-------|-------|--------|
| 025 | `ai_vector_store.sql` | تخزين المتجهات (Vector Store) | ✅ مكتمل |
| 026 | `ai_agent_module.sql` | وحدة وكلاء الذكاء الاصطناعي | ✅ مكتمل |
| 027 | `create_admin_user.sql` | إنشاء مستخدم مدير | ✅ مكتمل |

### المرحلة 5: الإصلاحات المفقودة (028)

| # | الملف | الوصف | الحالة |
|---|-------|-------|--------|
| 028 | `fix_missing_migrations.sql` | تجميع الجداول المفقودة | ✅ مكتمل |

### المرحلة 6: نظام المدفوعات (040-044)

| # | الملف | الوصف | الحالة |
|---|-------|-------|--------|
| 040 | `store_transactions.sql` | جدول كل عملية دفع | ✅ مكتمل |
| 041 | `merchant_balances.sql` | أرصدة التجار + Trigger | ✅ مكتمل |
| 042 | `payment_links_bank_accounts.sql` | روابط الدفع + الحسابات | ✅ مكتمل |
| 043 | `settlements.sql` | نظام التسويات | ✅ مكتمل |
| 044 | `add_fee_rates_to_plans.sql` | رسوم البوابة والعمولة | ✅ مكتمل |

---

## 📋 تفاصيل كل Migration

### 001 - Core Tables

**الجداول:**
- `tenants` - المنشآت
- `plans` - خطط الاشتراك
- `subscriptions` - الاشتراكات
- `invoices` - الفواتير
- `domains` - النطاقات
- `tenant_users` - مستخدمي المنشأة

**Enums:**
- `tenant_status`
- `subscription_status`
- `invoice_status`
- `domain_status`
- `member_role`

---

### 002 - RLS Policies

**السياسات:**
- عزل المنشآت (Tenant Isolation)
- صلاحيات القراءة/الكتابة
- سياسات super_admin

---

### 003 - Module Tables

**الجداول:**
- `modules` - الوحدات
- `tenant_modules` - وحدات المنشأة
- `module_permissions` - صلاحيات الوحدات

---

### 010 - Subscription Notifications

**الجداول:**
- `subscription_notifications` - إشعارات الاشتراكات

---

### 011 - GDPR Tables

**الجداول:**
- `gdpr_requests` - طلبات GDPR
- `gdpr_data_export` - تصدير البيانات
- `gdpr_consent_logs` - سجلات الموافقة

---

### 012 - Audit Logs

**الجداول:**
- `audit_logs` - سجل التدقيق

**الحقول:**
- tenant_id
- user_id
- action
- resource_type
- resource_id
- metadata

---

### 014 - Team Management

**الجداول:**
- `team_members` - أعضاء الفريق
- `team_invitations` - دعوات الفريق

---

### 015 - Announcements

**الجداول:**
- `announcements` - الإعلانات
- `user_announcements` - متابعة القراءة

**التعديلات (020):**
- tenant_id اختياري
- إضافة is_global

---

### 016 - Referral Program

**الجداول:**
- `referrals` - الإحالات
- `referral_rewards` - المكافآت

---

### 017 - Fix Plans Schema

**الإصلاحات:**
- إضافة أعمدة التسعير
- إصلاح القيود

---

### 018 - User Profiles

**الجداول:**
- `user_profiles` - الملفات الشخصية

**الحقول:**
- first_name, last_name
- avatar_url
- language, timezone
- notification preferences

---

### 019 - Fix Audit Logs

**الإصلاحات:**
- إضافة tenant_id
- تحسين indexes

---

### 020 - Fix Announcements

**الإصلاحات:**
- tenant_id اختياري
- إضافة is_global
- تحديث RLS policies

---

### 025 - AI Vector Store

**الجداول:**
- `ai_knowledge_base` - قاعدة المعرفة
- `ai_embeddings` - المتجهات

**Extensions:**
- `vector` (pgvector)

---

### 026 - AI Agent Module

**الجداول:**
- `ai_agents` - وكلاء الذكاء الاصطناعي
- `ai_conversations` - المحادثات
- `ai_messages` - الرسائل
- `ai_analytics` - التحليلات
- `ai_channel_configs` - إعدادات القنوات

---

### 027 - Create Admin User

**البيانات:**
- إنشاء مستخدم super_admin
- تعيين الصلاحيات

---

### 028 - Fix Missing Migrations

**التجميع:**
- `user_profiles` (تأكيد)
- `referrals` (تأكيد)
- `team_members` (تأكيد)
- دوال مساعدة

---

### 040 - Store Transactions

**الجداول:**
- `store_transactions` - كل عملية دفع

**المميزات:**
- Generated Columns (الرسوم التلقائية)
- RLS policies
- Indexes متعددة

**الحقول الرئيسية:**
```sql
gross_amount        NUMERIC(12,2)
gateway_fee_amount  NUMERIC(12,2) -- تلقائي
platform_fee_amount NUMERIC(12,2) -- تلقائي
net_amount          NUMERIC(12,2) -- تلقائي
```

---

### 041 - Merchant Balances

**الجداول:**
- `merchant_balances` - أرصدة التجار

**Triggers:**
```sql
trg_update_merchant_balance_on_transaction
  AFTER INSERT OR UPDATE ON store_transactions
```

**دوال SQL:**
- `update_merchant_balance_on_transaction()`
- `move_pending_to_available()`
- `reserve_merchant_balance()`
- `release_reserved_balance()`
- `deduct_from_reserved()`
- `get_merchant_balance()`

**View:**
- `admin_merchant_balances_summary`

---

### 042 - Payment Links & Bank Accounts

**الجداول:**
- `payment_links` - روابط الدفع
- `merchant_bank_accounts` - الحسابات البنكية

**Triggers:**
- `generate_payment_link_number()` - رقم تسلسلي
- `update_updated_at()`

**دوال:**
- `validate_saudi_iban()`
- `set_primary_bank_account()`
- `verify_bank_account()`

**View:**
- `active_merchant_bank_accounts`

---

### 043 - Settlements

**الجداول:**
- `settlements` - التسويات

**Triggers:**
- `generate_settlement_number()` - رقم تسلسلي

**دوال:**
- `create_settlement()`
- `approve_settlement()`
- `reject_settlement()`
- `hold_settlement()`
- `get_merchant_settlements()`
- `get_merchant_settlement_summary()`

**Views:**
- `admin_settlements_summary`
- `pending_settlements_for_approval`

---

### 044 - Add Fee Rates to Plans

**التعديلات:**
```sql
ALTER TABLE plans 
ADD COLUMN gateway_fee_rate NUMERIC(5,4) DEFAULT 0.015;

ALTER TABLE plans 
ADD COLUMN platform_fee_rate NUMERIC(5,4) DEFAULT 0.01;
```

**التحديثات:**
- Basic: gateway=1.5%, platform=1.5%
- Professional: gateway=1.5%, platform=1.0%
- Enterprise: gateway=1.5%, platform=0.5%

---

## 🔄 تطبيق Migrations

### الطريقة 1: باستخدام psql

```bash
# تطبيق جميع migrations
psql $DATABASE_URL -f supabase/migrations/001_core_tables.sql
psql $DATABASE_URL -f supabase/migrations/002_rls_policies.sql
# ... وهكذا
```

### الطريقة 2: باستخدام Supabase CLI

```bash
# مزامنة جميع migrations
supabase db push

# أو تطبيق migration محدد
supabase db push --db-url $DATABASE_URL
```

### الطريقة 3: باستخدام Drizzle Kit

```bash
# إنشاء migrations جديدة
npm run db:generate

# تطبيق migrations
npm run db:migrate

# Push مباشرة
npm run db:push
```

---

## 📊 التسلسل الزمني

```
2026-03-20  →  001-020 (الأساس والميزات)
2026-03-20  →  025-028 (AI والإصلاحات)
2026-03-21  →  040-044 (نظام المدفوعات)
```

---

## 🎯 الحالة الحالية

| المرحلة | migrations | الحالة |
|---------|-----------|--------|
| الأساس | 001-004 | ✅ مكتمل |
| الميزات | 010-018 | ✅ مكتمل |
| الإصلاحات | 019-020 | ✅ مكتمل |
| AI | 025-028 | ✅ مكتمل |
| المدفوعات | 040-044 | ✅ مكتمل |

---

## 📝 ملاحظات مهمة

1. **ترتيب التطبيق:** يجب تطبيق migrations بالترتيب
2. **Backups:** أخذ نسخة احتياطية قبل التطبيق
3. **Testing:** اختبار في Sandbox أولاً
4. **Rollback:** الاحتفاظ بنسخ للمigrations السابقة

---

## 🔗 روابط ذات صلة

- **PAYMENTS_IMPLEMENTATION_PLAN.md** - خطة تنفيذ المدفوعات
- **PAYMENTS_STATUS.md** - حالة التنفيذ
- **PAYMENTS_README.md** - توثيق نظام المدفوعات
- **saasfast-payments-guide.html** - الدليل المرئي

---

**آخر تحديث:** 2026-03-21  
**إجمالي Migrations:** 32  
**الحالة:** ✅ جميع migrations مكتملة
