# خطة تطوير منصة SaaS Core
**تاريخ الإنشاء:** 2026-03-20
**الإصدار:** 1.0
**الحالة:** قيد التنفيذ

---

## نتائج الفحص التقني الشامل

### ملخص التقييم

| المحور | النتيجة | الجاهزية |
|--------|---------|---------|
| هيكل قاعدة البيانات | ممتاز — مكتمل بالكامل | 95% |
| الوحدات (4 من 7) | جيد — يحتاج إكمال | 60% |
| نظام المصادقة | يعمل لكن يحتوي مخاطر | 70% |
| RLS وعزل البيانات | تصميم صحيح لكن لا يعمل مع NextAuth | 40% |
| Middleware | يعمل لكن يحتوي ثغرات أمنية | 55% |
| بوابة الدفع | مكتملة تقريباً | 80% |
| النطاقات المخصصة | Schema فقط، لا API | 30% |
| الأداء والتخزين المؤقت | Redis موجود لكن غير مستخدم | 25% |
| **الجاهزية الإجمالية** | **يحتاج إصلاحات جوهرية قبل الإطلاق** | **58%** |

---

## الثغرات والمشاكل المكتشفة

### 🔴 حرجة (Critical) — يجب إصلاحها قبل أي شيء

#### C1: `/api/tenants/create` بدون مصادقة — ثغرة أمنية خطيرة
```
الملف: src/app/api/tenants/create/route.ts
السطر: 10-118

المشكلة: endpoint مفتوح بالكامل — أي شخص يمكنه إنشاء tenants بدون تسجيل دخول
الخطر: spam attacks، استهلاك موارد، بيانات مزيفة
```

#### C2: IDOR في `/api/payments/initiate` — مستخدم يدفع لحساب آخر
```
الملف: src/app/api/payments/initiate/route.ts
السطر: 67-78

المشكلة: يتحقق من المصادقة لكن لا يتحقق أن المستخدم ينتمي لـ tenantId المحدد
الخطر: مستخدم A يمكنه بدء دفع باسم مستخدم B
```

#### C3: RLS لا تعمل مع NextAuth — عزل البيانات معطل
```
الملف: supabase/migrations/002_rls_policies.sql
السطر: 19-38

المشكلة: current_tenant_id() تحاول auth.jwt() التي تعمل فقط مع Supabase Auth
لكن المشروع يستخدم NextAuth JWT — لذا auth.uid() = NULL دائماً
والـ fallback app.current_tenant_id لا يُعيَّن في أي مكان في الكود

الخطر: RLS لا تحمي البيانات فعلياً — كل مستخدم يمكنه رؤية بيانات الآخرين!
```

#### C4: فحص admin عبر Cookie — يمكن تزويره بسهولة
```
الملف: middleware.ts
السطر: 131-136

الكود: const userRole = request.cookies.get('user_role')?.value;
المشكلة: أي شخص يمكنه إضافة cookie باسم 'user_role' بقيمة 'super_admin'
الخطر: وصول غير مصرح به لصفحات الأدمن
```

#### C5: Webhook Handler لا يمكنه تحديث قاعدة البيانات
```
الملف: src/app/api/payments/webhook/route.ts
السطر: 78-136

المشكلة: يستخدم createClient() الذي يعتمد على session المستخدم
لكن webhooks لا تملك user session، لذا:
- auth.uid() = NULL
- RLS تحجب جميع UPDATE/INSERT
- الدفعات الناجحة لا تُحدّث الاشتراكات!
```

---

### 🟡 عالية (High)

#### H1: Middleware لا يحمي dashboard routes من المستخدمين غير المسجلين
```
الملف: middleware.ts
المشكلة: يحقق من tenant لكن لا يتحقق من تسجيل الدخول قبل /dashboard
```

#### H2: Redis موجود في المشروع لكن غير مستخدم في Middleware
```
حل tenant resolution يستعلم من قاعدة البيانات في كل طلب
Upstash Redis مثبت لكن غير مستدعى في middleware.ts
```

#### H3: CORS مفتوح للكل (*)
```
الملف: middleware.ts — السطر 144
الكود: response.headers.set('Access-Control-Allow-Origin', '*');
يجب تقييده بـ allowed origins فقط
```

#### H4: رقم الفاتورة غير آمن
```
الملف: src/app/api/payments/initiate/route.ts — السطر 81
الكود: const invoiceNumber = `INV-${Date.now()}`;
مشكلة: طلبان متزامنان قد ينتجان نفس الرقم
يجب: استخدام sequence في قاعدة البيانات
```

#### H5: اشتراك يُنشأ عند البدء لا عند النجاح
```
الملف: src/app/api/payments/initiate/route.ts — السطر 157-167
المشكلة: subscription يُنشأ بحالة 'trialing' قبل اكتمال الدفع
إذا فشل المستخدم في الدفع → subscription معلقة في قاعدة البيانات
```

#### H6: وحدات CRM، Booking، AI Agent — لا جداول في قاعدة البيانات
```
مذكورة في module-registry.ts لكن لا migrations لها
```

#### H7: لا Cron Job لإدارة الاشتراكات المنتهية
```
لا توجد آلية لتحويل:
- trialing → expired بعد انتهاء التجربة
- past_due → suspended بعد grace period
- تنبيه قبل انتهاء الاشتراك
```

---

### 🟢 متوسطة (Medium)

| # | المشكلة | الملف |
|---|---------|-------|
| M1 | لا API لإدارة النطاقات المخصصة (Cloudflare) | مفقود |
| M2 | لا توليد PDF للفواتير | مفقود |
| M3 | لا Pagination في API responses | جميع API routes |
| M4 | لا Email عند نجاح/فشل الدفع | webhook/route.ts |
| M5 | لا API لإدارة الوحدات (تفعيل/تعطيل) | مفقود |
| M6 | لا لوحة تحكم للأدمن (Admin Dashboard) | مفقود |
| M7 | Supabase server client يحتاج مراجعة للـ webhook | server.ts |
| M8 | لا منطق Proration عند ترقية الخطة | مفقود |

---

## خطة التطوير المفصلة

---

## المرحلة 1: إصلاح المشاكل الحرجة
**المدة المقدرة: أسبوع**
**الأولوية: يجب إتمامها قبل أي شيء آخر**

---

### المهمة 1.1: إصلاح RLS + NextAuth
**الأثر: منع تسريب بيانات بين المستأجرين**

**الحل المختار:** تعيين `app.current_tenant_id` في Server Client + استخدام service_role في webhooks

**خطوات التنفيذ:**

**أ. إنشاء server client مع tenant context:**
```typescript
// src/lib/supabase/server-with-tenant.ts
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function createTenantClient() {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role يتجاوز RLS
  );

  // تعيين tenant context للـ RLS
  if (tenantId) {
    await supabase.rpc('set_tenant_context', { p_tenant_id: tenantId });
  }

  return supabase;
}
```

**ب. إضافة دالة set_tenant_context في migration:**
```sql
-- supabase/migrations/005_tenant_context.sql
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**ج. إنشاء service client للـ webhooks وعمليات النظام:**
```typescript
// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

---

### المهمة 1.2: حماية `/api/tenants/create`
**الملف: src/app/api/tenants/create/route.ts**

**خطوات التنفيذ:**
- إضافة `getServerSession` check
- إضافة Zod validation schema
- إضافة التحقق من وجود userId في session
- معالجة تعارض الـ slug (إضافة suffix عشوائي)

---

### المهمة 1.3: إصلاح IDOR في Payment Initiate
**الملف: src/app/api/payments/initiate/route.ts**

**خطوات التنفيذ:**
```typescript
// إضافة فحص: هل المستخدم ينتمي للـ tenant؟
const { data: membership } = await supabase
  .from('tenant_users')
  .select('id, role')
  .eq('tenant_id', tenantId)
  .eq('user_id', session.user.id)
  .single();

if (!membership) {
  return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
}
```

---

### المهمة 1.4: إصلاح Admin Check في Middleware
**الملف: middleware.ts**

**خطوات التنفيذ:**
- حذف cookie-based check
- استخدام `getToken` من `next-auth/jwt`
- فحص `token.role` بدلاً من cookie

---

### المهمة 1.5: إصلاح Webhook Handler
**الملف: src/app/api/payments/webhook/route.ts**

**خطوات التنفيذ:**
- استبدال `createClient()` بـ `createServiceClient()`
- إضافة idempotency check (منع معالجة نفس الدفع مرتين)
- إصلاح `enablePlanModules` لاستخدام service client

---

### المهمة 1.6: إضافة Auth Guard في Middleware
**الملف: middleware.ts**

**خطوات التنفيذ:**
```typescript
import { getToken } from 'next-auth/jwt';

// في بداية middleware function:
const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

// للمسارات المحمية:
if (isTenantPath(pathname) && !token) {
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
```

---

## المرحلة 2: إصلاح مشاكل الأداء والموثوقية
**المدة المقدرة: أسبوع**

---

### المهمة 2.1: تخزين Tenant مؤقتاً في Redis
**الملف: middleware.ts**

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function resolveTenant(hostname: string) {
  const cacheKey = `tenant:${hostname}`;

  // محاولة من Cache أولاً
  const cached = await redis.get(cacheKey);
  if (cached) return cached as TenantData;

  // استعلام قاعدة البيانات
  const tenant = await fetchTenantFromDB(hostname);

  if (tenant) {
    // تخزين مؤقت 5 دقائق
    await redis.setex(cacheKey, 300, JSON.stringify(tenant));
  }

  return tenant;
}
```

**إضافة cache invalidation عند تحديث tenant:**
```typescript
// src/app/api/tenants/[id]/route.ts (PATCH)
// بعد تحديث tenant:
await redis.del(`tenant:${oldSlug}.${PLATFORM_DOMAIN}`);
await redis.del(`tenant:${customDomain}`);
```

---

### المهمة 2.2: إصلاح رقم الفاتورة
**migration جديد:**
```sql
-- supabase/migrations/005_invoice_sequence.sql
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT generate_invoice_number();
```

---

### المهمة 2.3: نظام Cron لإدارة الاشتراكات
**ملف جديد: src/app/api/cron/subscriptions/route.ts**

**المهام:**
1. تحديث التجارب المنتهية → expired
2. إرسال تنبيه قبل 7 أيام من انتهاء الاشتراك
3. تعليق الحسابات المتأخرة عن الدفع > 7 أيام
4. تنظيف سلات التسوق المنتهية

**Vercel Cron Config (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/subscriptions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

### المهمة 2.4: إصلاح CORS
**الملف: middleware.ts**

```typescript
const ALLOWED_ORIGINS = [
  process.env.APP_URL!,
  `https://${process.env.PLATFORM_DOMAIN}`,
  'http://localhost:3000',
];

const origin = request.headers.get('origin');
const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];

response.headers.set('Access-Control-Allow-Origin', allowedOrigin || '');
response.headers.set('Access-Control-Allow-Credentials', 'true');
```

---

## المرحلة 3: إكمال الوحدات المفقودة
**المدة المقدرة: أسبوعان**

---

### المهمة 3.1: قاعدة بيانات وحدة CRM

**migration: supabase/migrations/006_crm_module.sql**

```sql
-- جدول جهات الاتصال
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(200),
  job_title VARCHAR(100),
  source VARCHAR(50), -- website | referral | social | direct
  status VARCHAR(30) DEFAULT 'lead', -- lead | prospect | customer | churned
  assigned_to UUID, -- user_id
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الصفقات
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  pipeline_id UUID,
  stage VARCHAR(50) NOT NULL, -- lead | qualified | proposal | negotiation | closed_won | closed_lost
  value NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'SAR',
  probability INTEGER DEFAULT 0, -- 0-100%
  expected_close_date DATE,
  assigned_to UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الأنشطة
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  activity_type VARCHAR(50) NOT NULL, -- call | email | meeting | note | task
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- pending | completed | cancelled
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_isolation ON contacts FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_isolation ON deals FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY activities_isolation ON activities FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));
```

---

### المهمة 3.2: قاعدة بيانات وحدة Booking

**migration: supabase/migrations/007_booking_module.sql**

```sql
-- جدول الخدمات
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  category VARCHAR(100),
  max_bookings_per_slot INTEGER DEFAULT 1,
  buffer_time_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المواعيد المتاحة
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الحجوزات
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  booking_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- pending | confirmed | cancelled | completed | no_show
  notes TEXT,
  price NUMERIC(10, 2),
  payment_status VARCHAR(30) DEFAULT 'unpaid',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_isolation ON services FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_isolation ON bookings FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));
```

---

### المهمة 3.3: قاعدة بيانات وحدة AI Agent

**migration: supabase/migrations/008_ai_agent_module.sql**

```sql
-- جدول الوكلاء الذكيين
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  agent_type VARCHAR(50) DEFAULT 'chatbot', -- chatbot | support | sales
  model VARCHAR(100) DEFAULT 'claude-sonnet-4-6',
  system_prompt TEXT,
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  channels TEXT[] DEFAULT '{}', -- ['whatsapp', 'website', 'snap']
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id),
  session_id VARCHAR(100) NOT NULL,
  channel VARCHAR(50), -- whatsapp | website | snap
  customer_id VARCHAR(200),
  customer_name VARCHAR(200),
  status VARCHAR(30) DEFAULT 'active', -- active | closed | escalated
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_agents_isolation ON ai_agents FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_isolation ON conversations FOR ALL USING (check_tenant_access(tenant_id)) WITH CHECK (check_tenant_access(tenant_id));
```

---

## المرحلة 4: إكمال APIs المفقودة
**المدة المقدرة: أسبوعان**

---

### المهمة 4.1: API إدارة النطاقات المخصصة

**الملفات الجديدة:**

```
src/app/api/domains/
├── add/route.ts        — إضافة نطاق جديد + Cloudflare
├── verify/route.ts     — التحقق من ملكية النطاق
├── list/route.ts       — عرض نطاقات المستأجر
├── delete/route.ts     — حذف نطاق
└── cf-webhook/route.ts — استقبال تحديثات Cloudflare SSL
```

**مراحل إضافة النطاق:**
1. المستخدم يضيف النطاق
2. API تستدعي Cloudflare Custom Hostnames
3. Cloudflare يعيد TXT record للتحقق
4. المستخدم يضيف TXT لـ DNS الخاص به
5. Webhook من Cloudflare عند تفعيل SSL
6. تحديث حالة النطاق → active

---

### المهمة 4.2: API إدارة الوحدات

**الملف: src/app/api/tenants/modules/route.ts**

```typescript
// GET  — عرض الوحدات المفعّلة والمتاحة
// POST — تفعيل/تعطيل وحدة
// يتحقق من: الخطة الحالية، التبعيات، صلاحيات المستخدم
```

---

### المهمة 4.3: API إدارة الاشتراكات

**الملفات:**
```
src/app/api/subscriptions/
├── current/route.ts    — الاشتراك الحالي
├── upgrade/route.ts    — ترقية الخطة مع Proration
├── downgrade/route.ts  — تخفيض الخطة
├── cancel/route.ts     — إلغاء الاشتراك
└── history/route.ts    — تاريخ الاشتراكات
```

---

### المهمة 4.4: توليد PDF الفواتير

**الحزم المطلوبة:**
```bash
pnpm add @react-pdf/renderer
```

**الملفات:**
```
src/app/api/invoices/[id]/pdf/route.ts
src/components/invoice-pdf-template.tsx
```

---

### المهمة 4.5: نظام Emails التشغيلية

**الملفات:**
```
src/lib/emails/
├── templates/
│   ├── payment-success.tsx       — نجاح الدفع
│   ├── payment-failed.tsx        — فشل الدفع
│   ├── trial-ending.tsx          — تنبيه انتهاء التجربة
│   ├── subscription-cancelled.tsx — إلغاء الاشتراك
│   ├── invitation.tsx            — دعوة عضو جديد
│   └── welcome.tsx               — ترحيب بالمستخدم الجديد
└── send.ts                       — دالة إرسال موحدة
```

---

## المرحلة 5: لوحة الأدمن
**المدة المقدرة: أسبوعان**

---

### الملفات المطلوبة:
```
src/app/admin/
├── layout.tsx              — Layout مع sidebar أدمن
├── page.tsx                — لوحة إحصاءات عامة
├── tenants/
│   ├── page.tsx            — قائمة المستأجرين
│   └── [id]/page.tsx       — تفاصيل مستأجر + إجراءات
├── subscriptions/
│   └── page.tsx            — إدارة الاشتراكات
├── plans/
│   ├── page.tsx            — إدارة خطط الاشتراك
│   └── new/page.tsx        — خطة جديدة
├── invoices/
│   └── page.tsx            — كل الفواتير
└── settings/
    └── page.tsx            — إعدادات المنصة
```

**إحصاءات اللوحة:**
- إجمالي المستأجرين (active / trial / suspended)
- إيرادات الشهر الحالي مقابل السابق
- المدفوعات الأخيرة
- المستأجرين الجدد هذا الأسبوع
- الاشتراكات المنتهية قريباً

---

## المرحلة 6: الأمان والامتثال
**المدة المقدرة: أسبوع**

---

### المهمة 6.1: Rate Limiting شامل

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: ..., token: ... });

export const rateLimiters = {
  // 5 محاولات تسجيل دخول كل دقيقة
  auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1m') }),

  // 100 طلب API كل دقيقة
  api: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1m') }),

  // 10 دفعات كل ساعة
  payments: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1h') }),

  // 3 محاولات إنشاء tenant كل ساعة
  tenantCreate: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1h') }),
};
```

---

### المهمة 6.2: Security Headers محسّنة

```javascript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.myfatoorah.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: *.supabase.co *.cloudinary.com github.com",
      "font-src 'self' data:",
      "connect-src 'self' *.supabase.co *.upstash.io api.myfatoorah.com apitest.myfatoorah.com api.cloudflare.com",
      "frame-src *.myfatoorah.com",
    ].join('; ')
  },
];
```

---

### المهمة 6.3: GDPR & Data Protection

**APIs مطلوبة:**
```
src/app/api/gdpr/
├── export/route.ts   — تصدير بيانات المستخدم (JSON)
├── delete/route.ts   — حذف كل بيانات المستخدم
└── consent/route.ts  — إدارة موافقات الخصوصية
```

**migration إضافي:**
```sql
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  consent_type VARCHAR(100) NOT NULL, -- privacy_policy | marketing | analytics
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## المرحلة 7: الأداء والقابلية للتوسع
**المدة المقدرة: أسبوع**

---

### المهمة 7.1: Indexes إضافية في قاعدة البيانات

```sql
-- supabase/migrations/009_performance_indexes.sql

-- للاستعلامات الشائعة في middleware
CREATE INDEX CONCURRENTLY idx_tenant_domains_active
  ON tenant_domains(domain) WHERE status = 'active';

-- للاشتراكات المنتهية (Cron Job)
CREATE INDEX CONCURRENTLY idx_subscriptions_expiry
  ON subscriptions(current_period_end, status) WHERE status IN ('active', 'trialing');

-- للبحث في الطلبات
CREATE INDEX CONCURRENTLY idx_orders_search
  ON orders(tenant_id, status, created_at DESC);

-- للتدقيق
CREATE INDEX CONCURRENTLY idx_audit_recent
  ON audit_logs(tenant_id, created_at DESC);

-- للمنتجات النشطة
CREATE INDEX CONCURRENTLY idx_products_active
  ON products(tenant_id, status, created_at DESC) WHERE status = 'active';

-- لاستعلامات الفوترة
CREATE INDEX CONCURRENTLY idx_invoices_billing
  ON invoices(tenant_id, status, created_at DESC);
```

---

### المهمة 7.2: Pagination موحد

**إنشاء Helper:**
```typescript
// src/lib/pagination.ts
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: Math.max(1, Number(searchParams.get('page') ?? 1)),
    limit: Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20))),
    sortBy: searchParams.get('sortBy') ?? 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
  };
}
```

---

## جدول خطة التطوير الزمنية

```
الأسبوع 1-2:   المرحلة 1 — إصلاح المشاكل الحرجة (أمان أساسي)
الأسبوع 3:     المرحلة 2 — أداء وموثوقية
الأسبوع 4-5:   المرحلة 3 — إكمال الوحدات (CRM, Booking, AI)
الأسبوع 6-7:   المرحلة 4 — إكمال APIs (Domains, Subscriptions, PDF, Email)
الأسبوع 8-9:   المرحلة 5 — لوحة الأدمن
الأسبوع 10:    المرحلة 6 — أمان وامتثال
الأسبوع 11:    المرحلة 7 — أداء وقابلية التوسع
الأسبوع 12:    اختبار شامل + إطلاق beta
```

---

## قائمة المهام الكاملة (Checklist)

### المرحلة 1 — حرجة
- [ ] **C1** إصلاح migration: إضافة set_tenant_context function
- [ ] **C1** إنشاء src/lib/supabase/service.ts للـ system operations
- [ ] **C1** تحديث server.ts لدعم tenant context
- [ ] **C2** حماية /api/tenants/create بالمصادقة + Zod validation
- [ ] **C3** إصلاح IDOR في /api/payments/initiate (فحص عضوية المستخدم)
- [ ] **C4** إصلاح admin check في middleware (استخدام getToken من next-auth/jwt)
- [ ] **C5** إصلاح webhook handler (استخدام service client)
- [ ] **C5** إضافة idempotency check في webhook
- [ ] **C6** إضافة auth guard في middleware للـ dashboard routes

### المرحلة 2 — أداء
- [ ] **H2** تفعيل Redis caching في middleware لتحليل tenant
- [ ] **H2** إضافة cache invalidation عند تحديث tenant/domain
- [ ] **H4** إصلاح رقم الفاتورة (sequence في قاعدة البيانات)
- [ ] **H5** إزالة subscription creation من initiate (نقلها للـ webhook)
- [ ] **H7** إنشاء cron job لإدارة الاشتراكات + vercel.json
- [ ] **H3** إصلاح CORS headers

### المرحلة 3 — وحدات
- [ ] **H6** migration 006: CRM tables (contacts, deals, activities)
- [ ] **H6** migration 007: Booking tables (services, availability, bookings)
- [ ] **H6** migration 008: AI Agent tables (ai_agents, conversations)
- [ ] إضافة RLS لجميع الجداول الجديدة
- [ ] تحديث module-registry.ts بالمعلومات الصحيحة

### المرحلة 4 — APIs
- [ ] **M1** API إدارة النطاقات (add, verify, list, delete)
- [ ] **M1** API Cloudflare webhook للـ SSL status
- [ ] **M5** API إدارة الوحدات (enable/disable)
- [ ] Subscriptions API (current, upgrade, downgrade, cancel, history)
- [ ] **M3** إضافة pagination لجميع API routes
- [ ] **M2** توليد PDF للفواتير (@react-pdf/renderer)
- [ ] **M4** Email templates + إرسال تلقائي

### المرحلة 5 — أدمن
- [ ] Admin layout + auth guard (super_admin فقط)
- [ ] صفحة إحصاءات عامة مع charts
- [ ] إدارة المستأجرين (list + details + actions)
- [ ] إدارة الاشتراكات والمدفوعات
- [ ] إدارة خطط الاشتراك
- [ ] إعدادات المنصة

### المرحلة 6 — أمان
- [ ] Rate limiting شامل (auth, api, payments, tenant-create)
- [ ] Security headers محسّنة في next.config.js
- [ ] GDPR APIs (export, delete, consent)
- [ ] consent_records migration

### المرحلة 7 — أداء
- [ ] migration 009: Performance indexes
- [ ] src/lib/pagination.ts helper
- [ ] تطبيق pagination على جميع endpoints

---

## المرحلة 8: الميزات الأساسية المفقودة (Core SaaS Features)
**المدة: أسبوعان**
**الأولوية: حرجة - قبل الإطلاق**

---

### المهمة 8.1: نظام الإشعارات والإيميلات
**الملفات الجديدة:**
```
src/lib/emails/
├── templates/
│   ├── payment-success.tsx       ← نجاح الدفع
│   ├── payment-failed.tsx        ← فشل الدفع
│   ├── trial-ending.tsx          ← تنبيه انتهاء التجربة (قبل 3 أيام)
│   ├── subscription-expired.tsx  ← انتهاء الاشتراك
│   ├── subscription-cancelled.tsx ← إلغاء الاشتراك
│   ├── welcome.tsx               ← ترحيب بالمستخدم الجديد
│   └── invitation.tsx            ← دعوة عضو جديد
└── send.ts                       ← دالة إرسال موحدة
```

**Dependencies:**
```bash
pnpm add @react-email/components @react-email/render nodemailer
```

**التنفيذ:**
- [ ] إنشاء email templates (6 templates)
- [ ] إعداد SMTP في .env.local
- [ ] إنشاء دالة send.ts الموحدة
- [ ] دمج النظام مع webhook عند نجاح/فشل الدفع
- [ ] إرسال welcome email عند التسجيل
- [ ] إرسال invitation email عند دعوة عضو

---

### المهمة 8.2: Cron Jobs لإدارة الاشتراكات
**ملف جديد: src/app/api/cron/subscriptions/route.ts**

**المهام التلقائية:**
1. تحويل التجارب المنتهية → `expired`
2. إرسال تنبيه قبل 7 أيام من انتهاء الاشتراك
3. تعليق الحسابات المتأخرة عن الدفع > 7 أيام
4. تنظيف سلات التسوق المنتهية (> 30 يوم)

**Vercel Cron Config (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/subscriptions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**migration إضافي:**
```sql
-- supabase/migrations/010_subscription_notifications.sql
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  notification_type VARCHAR(100) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'pending'
);
```

**التنفيذ:**
- [ ] إنشاء cron route
- [ ] إضافة منطق إدارة الاشتراكات المنتهية
- [ ] إضافة منطق التنبيهات
- [ ] تحديث vercel.json
- [ ] إنشاء notification_logs table
- [ ] اختبار cron job محلياً

---

### المهمة 8.3: Rate Limiting شامل
**ملف جديد: src/lib/rate-limit.ts**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiters = {
  // 5 محاولات تسجيل دخول كل دقيقة
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'ratelimit:auth'
  }),

  // 100 طلب API كل دقيقة
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api'
  }),

  // 10 دفعات كل ساعة
  payments: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'ratelimit:payments'
  }),

  // 3 محاولات إنشاء tenant كل ساعة
  tenantCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'ratelimit:tenant-create'
  }),
};

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
) {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  return {
    success,
    limit,
    reset,
    remaining,
  };
}
```

**التنفيذ:**
- [ ] تثبيت @upstash/ratelimit
- [ ] إنشاء rate-limit.ts
- [ ] دمج rate limiting مع:
  - /api/auth/* routes
  - /api/tenants/create
  - /api/payments/*
  - جميع API routes
- [ ] إضافة Retry-After headers
- [ ] اختبار rate limiting

---

### المهمة 8.4: Security Headers محسّنة
**التعديل: next.config.js**

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.myfatoorah.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: *.supabase.co *.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' *.supabase.co *.upstash.io *.myfatoorah.com",
      "frame-src *.myfatoorah.com",
    ].join('; ')
  },
];

module.exports = {
  ...existingConfig,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

**التنفيذ:**
- [ ] تحديث next.config.js
- [ ] اختبار headers مع security scanner
- [ ] تحديث CSP عند إضافة مصادر جديدة

---

### المهمة 8.5: Analytics Dashboard
**الملفات الجديدة:**
```
src/app/(tenant)/dashboard/analytics/
├── page.tsx                    ← لوحة الإحصاءات الرئيسية
└── api/
    ├── overview/route.ts       ← إحصاءات عامة
    ├── revenue/route.ts        ← إيرادات
    └── activity/route.ts       ← نشاط المستخدمين

src/modules/analytics/
├── components/
│   ├── stats-cards.tsx         ← بطاقات الإحصاءات
│   ├── revenue-chart.tsx       ← رسم الإيرادات
│   ├── activity-feed.tsx       ← سجل النشاط
│   └── user-growth-chart.tsx   ← نمو المستخدمين
└── lib/
    └── analytics.ts            ← دوال التحليلات
```

**الإحصاءات المطلوبة:**
- إجمالي الإيرادات (شهري/سنوي)
- عدد الطلبات
- عدد العملاء الجدد
- معدل التحويل
- النشاط الأخير (آخر 50 عملية)

**التنفيذ:**
- [ ] إنشاء analytics pages
- [ ] إنشاء API routes للإحصاءات
- [ ] إنشاء components للـ charts
- [ ] دمج مع قاعدة البيانات
- [ ] اختبار الأداء

---

### المهمة 8.6: توليد PDF للفواتير
**Dependencies:**
```bash
pnpm add @react-pdf/renderer
```

**الملفات الجديدة:**
```
src/app/api/invoices/[id]/pdf/route.ts
src/components/invoice-pdf-template.tsx
```

**التنفيذ:**
- [ ] إنشاء invoice template
- [ ] إنشاء PDF generation API
- [ ] إضافة زر تحميل PDF في billing page
- [ ] اختبار التوليد والطباعة

---

## المرحلة 9: الامتثال والإدارة (Compliance & Admin)
**المدة: أسبوع**
**الأولوية: عالية - للامتثال القانوني**

---

### المهمة 9.1: GDPR & Data Protection APIs
**الملفات الجديدة:**
```
src/app/api/gdpr/
├── export/route.ts         ← تصدير بيانات المستخدم (JSON)
├── delete/route.ts         ← حذف كل بيانات المستخدم
└── consent/route.ts        ← إدارة موافقات الخصوصية
```

**migration:**
```sql
-- supabase/migrations/011_gdpr_tables.sql
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  consent_type VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  export_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**التنفيذ:**
- [ ] إنشاء consent_records table
- [ ] إنشاء data_export_requests table
- [ ] إنشاء export API (يجمع كل بيانات المستخدم)
- [ ] إنشاء delete API (يحذف بيانات المستخدم)
- [ ] إنشاء consent management API
- [ ] إضافة UI في settings page

---

### المهمة 9.2: Admin Dashboard كامل
**الملفات الجديدة:**
```
src/app/admin/
├── layout.tsx              ← Layout مع sidebar أدمن
├── page.tsx                ← لوحة إحصاءات عامة
├── tenants/
│   ├── page.tsx            ← قائمة المستأجرين
│   └── [id]/page.tsx       ← تفاصيل مستأجر + إجراءات
├── subscriptions/
│   └── page.tsx            ← إدارة الاشتراكات
├── plans/
│   ├── page.tsx            ← إدارة خطط الاشتراك
│   └── new/page.tsx        ← خطة جديدة
├── invoices/
│   └── page.tsx            ← كل الفواتير
├── analytics/
│   └── page.tsx            ← إحصاءات المنصة
└── settings/
    └── page.tsx            ← إعدادات المنصة
```

**إحصاءات اللوحة:**
- إجمالي المستأجرين (active / trial / suspended)
- إيرادات الشهر الحالي مقابل السابق
- المدفوعات الأخيرة
- المستأجرين الجدد هذا الأسبوع
- الاشتراكات المنتهية قريباً

**التنفيذ:**
- [ ] إنشاء admin layout
- [ ] إضافة auth guard (super_admin فقط)
- [ ] صفحة الإحصاءات العامة
- [ ] إدارة المستأجرين
- [ ] إدارة الاشتراكات
- [ ] إدارة خطط الأسعار
- [ ] إدارة الفواتير
- [ ] إعدادات المنصة

---

### المهمة 9.3: Audit Logs System
**migration:**
```sql
-- supabase/migrations/012_audit_logs.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_isolation ON audit_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**التنفيذ:**
- [ ] إنشاء audit_logs table
- [ ] إنشاء دالة logAudit() في src/lib/audit.ts
- [ ] دمج logging في جميع العمليات الحساسة
- [ ] إنشاء audit logs viewer في dashboard

---

## ✅ قائمة التحقق المحدثة (Updated Checklist)

### المرحلة 8 — الميزات الأساسية
- [ ] **8.1** نظام Emails التشغيلية (6 templates)
- [ ] **8.1** دمج emails مع webhook و registration
- [ ] **8.2** Cron job لإدارة الاشتراكات
- [ ] **8.2** notification_logs table
- [ ] **8.2** vercel.json cron config
- [ ] **8.3** Rate limiting شامل (auth, api, payments, tenant-create)
- [ ] **8.3** دمج rate limiting مع جميع الـ APIs
- [ ] **8.4** Security headers في next.config.js
- [ ] **8.4** CSP headers صحيحة
- [ ] **8.5** Analytics dashboard مع charts
- [ ] **8.5** Analytics API routes
- [ ] **8.6** PDF generation للفواتير
- [ ] **8.6** تحميل PDF من billing page

### المرحلة 9 — الامتثال والإدارة
- [ ] **9.1** GDPR export API
- [ ] **9.1** GDPR delete API
- [ ] **9.1** Consent management API
- [ ] **9.1** consent_records table
- [ ] **9.1** UI لإدارة الموافقات في settings
- [ ] **9.2** Admin dashboard كامل
- [ ] **9.2** Admin auth guard (super_admin)
- [ ] **9.2** إدارة المستأجرين
- [ ] **9.2** إدارة الاشتراكات والخطط
- [ ] **9.3** Audit logs system
- [ ] **9.3** دمج audit logging في العمليات الحساسة
- [ ] **9.3** Audit logs viewer في dashboard

---

## 📁 هيكل الملفات النهائي (Final File Structure)

```
src/
├── lib/
│   ├── supabase/
│   │   ├── service.ts              ← نظام
│   │   └── server-with-tenant.ts   ← نظام
│   ├── rate-limit.ts               ← جديد (8.3)
│   ├── pagination.ts               ← نظام
│   ├── audit.ts                    ← جديد (9.3)
│   └── emails/
│       ├── templates/              ← جديد (8.1)
│       │   ├── payment-success.tsx
│       │   ├── payment-failed.tsx
│       │   ├── trial-ending.tsx
│       │   ├── subscription-expired.tsx
│       │   ├── subscription-cancelled.tsx
│       │   ├── welcome.tsx
│       │   └── invitation.tsx
│       └── send.ts                 ← جديد (8.1)
├── app/
│   ├── (tenant)/
│   │   └── dashboard/
│   │       ├── analytics/          ← جديد (8.5)
│   │       │   ├── page.tsx
│   │       │   └── api/
│   │       │       ├── overview/route.ts
│   │       │       ├── revenue/route.ts
│   │       │       └── activity/route.ts
│   │       └── settings/
│   │           └── privacy/        ← GDPR settings
│   ├── api/
│   │   ├── cron/
│   │   │   └── subscriptions/route.ts  ← جديد (8.2)
│   │   ├── domains/                ← نظام
│   │   ├── subscriptions/          ← نظام
│   │   ├── tenants/modules/route.ts ← نظام
│   │   ├── invoices/[id]/pdf/route.ts ← جديد (8.6)
│   │   └── gdpr/                   ← جديد (9.1)
│   │       ├── export/route.ts
│   │       ├── delete/route.ts
│   │       └── consent/route.ts
│   └── admin/                      ← جديد (9.2)
│       ├── layout.tsx
│       ├── page.tsx
│       ├── tenants/
│       ├── subscriptions/
│       ├── plans/
│       ├── invoices/
│       ├── analytics/
│       └── settings/
└── components/
    └── invoice-pdf-template.tsx    ← جديد (8.6)

supabase/migrations/
├── 005_tenant_context.sql          ← نظام
├── 006_crm_module.sql              ← نظام
├── 007_booking_module.sql          ← نظام
├── 008_ai_agent_module.sql         ← نظام
├── 009_performance_indexes.sql     ← نظام
├── 010_subscription_notifications.sql ← جديد (8.2)
├── 011_gdpr_tables.sql             ← جديد (9.1)
└── 012_audit_logs.sql              ← جديد (9.3)

vercel.json                          ← جديد (cron config)
```

---

## 📅 الجدول الزمني المحدث (Updated Timeline)

```
الأسبوع 1-2:   المرحلة 1 — إصلاح المشاكل الحرجة (أمان أساسي)
الأسبوع 3:     المرحلة 2 — أداء وموثوقية
الأسبوع 4-5:   المرحلة 3 — إكمال الوحدات (CRM, Booking, AI)
الأسبوع 6-7:   المرحلة 4 — إكمال APIs (Domains, Subscriptions, PDF, Email)
الأسبوع 8-9:   المرحلة 5 — لوحة الأدمن
الأسبوع 10:    المرحلة 6 — أمان وامتثال
الأسبوع 11:    المرحلة 7 — أداء وقابلية التوسع
الأسبوع 12-13: المرحلة 8 — الميزات الأساسية المفقودة ⭐ جديد
الأسبوع 14:    المرحلة 9 — الامتثال والإدارة ⭐ جديد
الأسبوع 15:    اختبار شامل + إطلاق beta
```

**المدة الإجمالية:** 15 أسبوع (بدلاً من 12)

---

## 🎯 الأولويات القصوى المحدثة (Updated Priorities)

```
1. ✅ إصلاح RLS + NextAuth (C3)
2. ✅ حماية /api/tenants/create (C1)
3. ✅ إصلاح webhook handler (C5)
4. 🔴 Rate Limiting (8.3)
5. 🔴 Cron Jobs للاشتراكات (8.2)
6. 🔴 Security Headers (8.4)
7. 🔴 نظام Emails (8.1)
8. 🟡 Analytics Dashboard (8.5)
9. 🟡 Admin Dashboard (9.2)
10. 🟢 GDPR APIs (9.1)
```

---

## 📊 ملخص الميزات الأساسية لـ SaaS

| الفئة | الميزات | الحالة |
|-------|---------|--------|
| **User Management** | Authentication, RBAC, MFA | ✅ 70% |
| **Subscription** | Plans, Billing, Proration | ✅ 80% |
| **Multi-tenancy** | Isolation, Custom Domains | ✅ 60% |
| **Dashboard** | User + Admin Analytics | ✅ 100% |
| **API** | REST, Rate Limiting, Webhooks | ⚠️ 60% |
| **Security** | Headers, SSL, Audit Logs | ⚠️ 60% |
| **Notifications** | Email, In-app | ❌ 0% → ⭐ جديد |
| **Compliance** | GDPR, Data Export/Delete | ❌ 0% → ⭐ جديد |
| **Performance** | Caching, Pagination | ⚠️ 50% |

---

*نهاية خطة التطوير المحدثة — يُرجى الرجوع إلى هذا المستند عند بدء كل مهمة*

*تم التحديث: 2026-03-20*

```
src/
├── lib/
│   ├── supabase/
│   │   ├── service.ts              ← جديد
│   │   └── server-with-tenant.ts   ← جديد
│   ├── rate-limit.ts               ← جديد
│   ├── pagination.ts               ← جديد
│   └── emails/
│       ├── templates/              ← جديد (6 templates)
│       └── send.ts                 ← جديد
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── subscriptions/route.ts  ← جديد
│   │   ├── domains/
│   │   │   ├── add/route.ts            ← جديد
│   │   │   ├── verify/route.ts         ← جديد
│   │   │   ├── list/route.ts           ← جديد
│   │   │   ├── delete/route.ts         ← جديد
│   │   │   └── cf-webhook/route.ts     ← جديد
│   │   ├── subscriptions/
│   │   │   ├── current/route.ts        ← جديد
│   │   │   ├── upgrade/route.ts        ← جديد
│   │   │   ├── downgrade/route.ts      ← جديد
│   │   │   ├── cancel/route.ts         ← جديد
│   │   │   └── history/route.ts        ← جديد
│   │   ├── tenants/
│   │   │   └── modules/route.ts        ← جديد
│   │   ├── invoices/
│   │   │   └── [id]/pdf/route.ts       ← جديد
│   │   └── gdpr/
│   │       ├── export/route.ts         ← جديد
│   │       ├── delete/route.ts         ← جديد
│   │       └── consent/route.ts        ← جديد
│   └── admin/                          ← جديد (كامل)
│       ├── layout.tsx
│       ├── page.tsx
│       ├── tenants/
│       ├── subscriptions/
│       ├── plans/
│       └── settings/
└── components/
    └── invoice-pdf-template.tsx        ← جديد

supabase/migrations/
├── 005_tenant_context.sql       ← جديد (set_tenant_context + invoice sequence)
├── 006_crm_module.sql           ← جديد
├── 007_booking_module.sql       ← جديد
├── 008_ai_agent_module.sql      ← جديد
├── 009_performance_indexes.sql  ← جديد
└── 010_gdpr_tables.sql          ← جديد

vercel.json                      ← جديد (cron config)
```

---

## الملفات التي ستُعدَّل

```
middleware.ts                             — auth guard + Redis caching + CORS fix + admin check
src/lib/auth-options.ts                   — minor adjustments
src/app/api/tenants/create/route.ts       — auth check + Zod + slug uniqueness
src/app/api/payments/initiate/route.ts    — IDOR fix + subscription logic
src/app/api/payments/webhook/route.ts     — service client + idempotency
next.config.js                            — CSP headers
```

---

*نهاية خطة التطوير — يُرجى الرجوع إلى هذا المستند عند بدء كل مهمة*
