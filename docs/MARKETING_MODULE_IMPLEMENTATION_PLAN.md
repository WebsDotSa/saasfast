# 🎯 Marketing Module Implementation Plan
## خطة شاملة لإضافة ميزات تسويقية لمنصة SaaSFast

**الإصدار:** 1.0  
**التاريخ:** 23 مارس 2026  
**الحالة:** مقترح استراتيجي

---

## 📋 المحتويات

1. [ملخص تنفيذي](#1-ملخص-تنفيذي)
2. [تحليل التقرير](#2-تحليل-التقرير)
3. [المعمارية التقنية](#3-المعمارية-التقنية)
4. [الميزات التسويقية المقترحة](#4-الميزات-التسويقية-المقترحة)
5. [خطة التنفيذ](#5-خطة-التنفيذ)
6. [التكامل مع المشاريع الأخرى](#6-التكامل-مع-المشاريع-الأخرى)
7. [تجربة المستخدم والواجهات](#7-تجربة-المستخدم-والواجهات)
8. [آليات القياس والتحليل](#8-آليات-القياس-والتحليل)
9. [المخاطر والتحديات](#9-المخاطر-والتحديات)
10. [الخلاصة والتوصيات](#10-الخلاصة-والتوصيات)

---

## 1. ملخص تنفيذي

### الرؤية الاستراتيجية

تحويل منصة **SaaSFast** من منصة SaaS أساسية إلى نظام تسويق متكامل يُمكّن العملاء من:
- جذب عملاء جدد عبر أدوات تسويقية متقدمة
- زيادة معدل الاحتفاظ بالعملاء (Retention)
- رفع متوسط قيمة الطلب (AOV)
- أتمتة العمليات التسويقية بالذكاء الاصطناعي

### القيمة المقترحة

| البعد | قبل | بعد |
|-------|-----|-----|
| **الخصومات** | كوبونات أساسية | محرك خصومات ذكي بـ 6 أنواع |
| **الحملات** | غير متوفر | SMS + WhatsApp + Email |
| **الولاء** | غير متوفر | نظام نقاط + مستويات |
| **الإحالة** | غير متوفر | تسويق بالعمولة متكامل |
| **التحليلات** | أساسية | تحليلات تسويقية متقدمة |
| **AI** | دعم فني | كتابة حملات + اقتراحات |

### الجدول الزمني

```
الأسبوع 1-2:  [████████████████████░░░░░░░░] الخصومات + الولاء
الأسبوع 3-4:  [░░░░░░░░████████████████████] الحملات + الإحالة
الأسبوع 5-6:  [░░░░░░░░░░░░░░░░████████████] AI + التحليلات
الإطلاق:      الأسبوع 7
```

### العائد المتوقع

| المقياس | التحسين المتوقع |
|---------|-----------------|
| معدل التحويل | +25-40% |
| متوسط قيمة الطلب | +15-30% |
| معدل الاحتفاظ | +35-50% |
| الإيرادات من الإحالات | 10-20% من الإجمالي |

---

## 2. تحليل التقرير

### 2.1 النظرة العامة على التقرير

تقرير `saasfast-marketing-guide.html` يقدم مرجعاً شاملاً مستوحى من منصة **زد**، ويتكون من:

| القسم | المحتوى | الأهمية |
|-------|---------|---------|
| **الميزات الأساسية** | 7 أقسام تسويقية | ⭐⭐⭐⭐⭐ |
| **قاعدة البيانات** | 6 Migrations جديدة | ⭐⭐⭐⭐⭐ |
| **الخصومات** | 6 أنواع مفصلة | ⭐⭐⭐⭐⭐ |
| **الحملات** | SMS/WhatsApp/Email | ⭐⭐⭐⭐ |
| **الولاء** | نظام النقاط | ⭐⭐⭐⭐ |
| **الإحالة** | التسويق بالعمولة | ⭐⭐⭐⭐ |
| **الذكاء الاصطناعي** | 3 استخدامات | ⭐⭐⭐⭐⭐ |
| **خطة التنفيذ** | 4 أسابيع | ⭐⭐⭐⭐ |

### 2.2 الأفكار والتقنيات المستخلصة

#### أ) نظام الخصومات المتقدم

```
┌─────────────────────────────────────────────────────────┐
│ أنواع الخصومات الستة:                                   │
├─────────────────────────────────────────────────────────┤
│ 1. خصم مخصص (نسبة/قيمة ثابتة)                         │
│ 2. الشحن المجاني (عند حد أدنى)                         │
│ 3. خصم لمجموعة عملاء (VIP)                             │
│ 4. خصم لتصنيفات محددة                                  │
│ 5. خصم لمنطقة جغرافية                                  │
│ 6. خصم لوسائل دفع محددة                                │
└─────────────────────────────────────────────────────────┘
```

**التطبيق في SaaSFast:**
- استخدام الجدول الحالي `coupons` من Module E-commerce
- إضافة حقول جديدة: `discount_type`, `applying_method`, `customer_segment_ids`
- بناء محرك تحقق (Validation Engine) متقدم

#### ب) الحملات التسويقية متعددة القنوات

```
┌─────────────────────────────────────────────────────────┐
│ هيكل الحملة التسويقية:                                  │
│                                                         │
│ Campaign → Audience Filter → Message → Channel → Send  │
│                       ↓                                  │
│                 Analytics (Open/Click/Convert)          │
└─────────────────────────────────────────────────────────┘
```

**التكاملات المطلوبة:**
| القناة | المزود المقترح | التكلفة |
|--------|----------------|---------|
| SMS | Unifonic / Twilio | 0.05-0.15 SAR/رسالة |
| WhatsApp | Meta Business API | 0.03-0.10 SAR/رسالة |
| Email | Resend (موجود) | مجاني حتى 3000/شهر |

#### ج) برنامج الولاء

```
┌─────────────────────────────────────────────────────────┐
│ دورة حياة النقاط:                                       │
│                                                         │
│ شراء → كسب نقاط → تراكم → استرداد → تكرار              │
│   ↓        ↓         ↓        ↓         ↓               │
│ 100 SAR  10 نقاط   50 نقطة  25 نقطة   شراء جديد        │
│          (10%)     (استرداد) (خصم 5 SAR)               │
└─────────────────────────────────────────────────────────┘
```

**المستويات المقترحة:**
| المستوى | الشرط | الميزة |
|---------|-------|--------|
| برونز | 0-500 SAR | 1 نقطة/ريال |
| فضة | 500-2000 SAR | 1.25 نقطة/ريال + خصم 5% |
| ذهب | 2000+ SAR | 1.5 نقطة/ريال + خصم 10% + شحن مجاني |

#### د) التسويق بالعمولة

```
┌─────────────────────────────────────────────────────────┐
│ تدفق الإحالة:                                           │
│                                                         │
│ مسوِّق → رابط إحالة → زائر → عميل → شراء → عمولة       │
│   ↓          ↓          ↓       ↓       ↓       ↓       │
│ Ahmed   ?ref=AHMED  Landing  Signup  500 SAR  50 SAR   │
│                                 (10%)                   │
└─────────────────────────────────────────────────────────┘
```

### 2.3 الدروس من زد (Zid)

| الدرس | التطبيق في SaaSFast |
|-------|---------------------|
| **Freemium Model** | الميزات التسويقية في الخطط المدفوعة فقط |
| **Feature Gating** | استخدام `canAccessFeature('marketing')` |
| **UI/UX** | واجهات بسيطة مع إحصائيات واضحة |
| **Analytics** | تقارير ROI لكل حملة |

---

## 3. المعمارية التقنية

### 3.1 التكامل مع البنية الحالية

```
┌─────────────────────────────────────────────────────────────────┐
│ البنية المعمارية لوحد التسويق:                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Module     │────▶│  Database    │────▶│   External   │   │
│  │   Registry   │     │  Schema      │     │   Services   │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Middleware  │     │  API Routes  │     │  AI Services │   │
│  │  (Tenant)    │     │  (CRUD)      │     │  (Vercel AI) │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 تحديث Module Registry

```typescript
// src/lib/module-registry.ts

marketing: {
  id: 'marketing',
  label: 'التسويق',
  labelEn: 'Marketing',
  description: 'أدوات تسويقية متكاملة: خصومات، حملات، ولاء، إحالة',
  icon: '📢',
  color: '#f5a623',
  tables: [
    'discounts',
    'marketing_campaigns',
    'loyalty_programs',
    'loyalty_transactions',
    'affiliates',
    'affiliate_conversions',
  ],
  routes: [
    '/dashboard/marketing',
    '/dashboard/discounts',
    '/dashboard/campaigns',
    '/dashboard/loyalty',
    '/dashboard/affiliates',
  ],
  permissions: [
    'discounts.view',
    'discounts.manage',
    'campaigns.view',
    'campaigns.manage',
    'loyalty.view',
    'loyalty.manage',
    'affiliates.view',
    'affiliates.manage',
  ],
  availableInPlans: ['professional', 'enterprise'],
  dependencies: ['ecommerce'],
} as ModuleDefinition,
```

### 3.3 Database Migrations

#### Migration 030: Discounts

```sql
-- supabase/migrations/030_discounts.sql

CREATE TABLE discounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- نوع الخصم
  discount_type   VARCHAR(30) NOT NULL,
  -- percentage | fixed_amount | free_shipping | buy_x_get_y | bundle
  
  -- طريقة التطبيق
  applying_method VARCHAR(20) DEFAULT 'automatic',
  -- automatic | coupon_code
  
  -- التفاصيل
  name_ar         VARCHAR(200) NOT NULL,
  name_en         VARCHAR(200),
  code            VARCHAR(50),
  value           NUMERIC(10,2) NOT NULL,
  max_uses        INTEGER,
  used_count      INTEGER DEFAULT 0,
  
  -- الشروط
  min_order_amount NUMERIC(10,2),
  applies_to      VARCHAR(20) DEFAULT 'all',
  -- all | specific_products | specific_categories | specific_customers
  
  product_ids     UUID[] DEFAULT '{}',
  category_ids    UUID[] DEFAULT '{}',
  customer_ids    UUID[] DEFAULT '{}',
  region_ids      UUID[] DEFAULT '{}',
  payment_method  VARCHAR(50),
  
  -- الوقت
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  
  -- RLS
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_discounts_tenant ON discounts(tenant_id, is_active);
CREATE INDEX idx_discounts_code ON discounts(code) WHERE code IS NOT NULL;
CREATE INDEX idx_discounts_dates ON discounts(starts_at, ends_at);

-- RLS Policy
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY discounts_isolation ON discounts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

#### Migration 031: Campaigns

```sql
-- supabase/migrations/031_campaigns.sql

CREATE TABLE marketing_campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title           VARCHAR(200) NOT NULL,
  channel         VARCHAR(20) NOT NULL,
  -- sms | whatsapp | email | all
  
  goal            VARCHAR(50),
  -- promotion | retention | re_engagement | welcome
  
  status          VARCHAR(20) DEFAULT 'draft',
  -- draft | scheduled | running | completed | failed
  
  audience_filter JSONB DEFAULT '{}',
  /*
   {
     "last_purchase_days": 90,
     "min_orders": 2,
     "min_spent": 500,
     "customer_segment": "vip",
     "region": "riyadh"
   }
  */
  
  message_ar      TEXT NOT NULL,
  message_en      TEXT,
  
  scheduled_at    TIMESTAMPTZ,
  sent_count      INTEGER DEFAULT 0,
  opened_count    INTEGER DEFAULT 0,
  clicked_count   INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Recipients (للتتبع)
CREATE TABLE campaign_recipients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id     UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  -- pending | sent | delivered | opened | clicked | converted
  
  sent_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_tenant ON marketing_campaigns(tenant_id, status);
CREATE INDEX idx_recipients_campaign ON campaign_recipients(campaign_id, status);
```

#### Migration 032: Loyalty

```sql
-- supabase/migrations/032_loyalty.sql

CREATE TABLE loyalty_programs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name_ar          VARCHAR(200) NOT NULL,
  name_en          VARCHAR(200),
  
  points_per_sar   NUMERIC(10,4) DEFAULT 1,
  sar_per_point    NUMERIC(10,4) DEFAULT 0.05,
  
  -- المستويات
  tiers            JSONB DEFAULT '[]',
  /*
   [
     {"name": "bronze", "min_spent": 0, "multiplier": 1, "benefits": []},
     {"name": "silver", "min_spent": 500, "multiplier": 1.25, "benefits": ["5% discount"]},
     {"name": "gold", "min_spent": 2000, "multiplier": 1.5, "benefits": ["10% discount", "free shipping"]}
   ]
  */
  
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL,
  customer_email   VARCHAR(255),
  
  current_balance  INTEGER DEFAULT 0,
  lifetime_points  INTEGER DEFAULT 0,
  redeemed_points  INTEGER DEFAULT 0,
  expired_points   INTEGER DEFAULT 0,
  
  current_tier     VARCHAR(50) DEFAULT 'bronze',
  tier_updated_at  TIMESTAMPTZ,
  
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_id)
);

CREATE TABLE loyalty_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  
  type          VARCHAR(20) NOT NULL,
  -- earn | redeem | expire | adjust | refund
  
  points        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  reference_type VARCHAR(50),
  -- order | manual | promotion
  
  reference_id  UUID,
  notes         TEXT,
  expires_at    TIMESTAMPTZ,
  
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_accounts ON loyalty_accounts(tenant_id, customer_id);
CREATE INDEX idx_loyalty_transactions ON loyalty_transactions(account_id, created_at);
```

#### Migration 033: Affiliates

```sql
-- supabase/migrations/033_affiliates.sql

CREATE TABLE affiliates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  
  referral_code   VARCHAR(20) UNIQUE NOT NULL,
  referral_link   TEXT,
  
  commission_rate NUMERIC(5,2) DEFAULT 10,
  -- نسبة العمولة %
  
  commission_type VARCHAR(20) DEFAULT 'percentage',
  -- percentage | fixed
  
  status          VARCHAR(20) DEFAULT 'active',
  -- active | pending | suspended | rejected
  
  total_earned    NUMERIC(10,2) DEFAULT 0,
  pending_payout  NUMERIC(10,2) DEFAULT 0,
  paid_payout     NUMERIC(10,2) DEFAULT 0,
  
  total_clicks    INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  
  payout_method    VARCHAR(50),
  -- bank_transfer | paypal | credit
  
  payout_details   JSONB,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_conversions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id  UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  order_id      UUID NOT NULL,
  order_amount  NUMERIC(10,2) NOT NULL,
  
  commission    NUMERIC(10,2) NOT NULL,
  status        VARCHAR(20) DEFAULT 'pending',
  -- pending | approved | paid | rejected | refunded
  
  clicked_at    TIMESTAMPTZ,
  converted_at  TIMESTAMPTZ DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE affiliate_clicks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id  UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  visitor_id    VARCHAR(100),
  ip_address    INET,
  user_agent    TEXT,
  landing_url   TEXT,
  
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_tenant ON affiliates(tenant_id, status);
CREATE INDEX idx_affiliate_conversions ON affiliate_conversions(affiliate_id, status);
CREATE INDEX idx_affiliate_clicks ON affiliate_clicks(affiliate_id, created_at);
```

### 3.4 هيكل الملفات

```
src/
├── app/
│   ├── (tenant)/
│   │   └── dashboard/
│   │       └── marketing/
│   │           ├── page.tsx                 # نظرة عامة
│   │           ├── discounts/
│   │           │   ├── page.tsx             # قائمة الخصومات
│   │           │   ├── new/page.tsx         # إنشاء خصم
│   │           │   └── [id]/page.tsx        # تعديل خصم
│   │           ├── campaigns/
│   │           │   ├── page.tsx             # قائمة الحملات
│   │           │   ├── new/page.tsx         # إنشاء حملة
│   │           │   └── [id]/page.tsx        # تفاصيل حملة
│   │           ├── loyalty/
│   │           │   ├── page.tsx             # إعدادات الولاء
│   │           │   ├── members/page.tsx     # أعضاء الولاء
│   │           │   └── transactions/page.tsx# المعاملات
│   │           └── affiliates/
│   │               ├── page.tsx             # قائمة المسوقين
│   │               ├── new/page.tsx         # إضافة مسوق
│   │               └── [id]/page.tsx        # تفاصيل مسوق
│   │
│   └── api/
│       └── marketing/
│           ├── discounts/
│           │   ├── route.ts                 # GET list, POST create
│           │   ├── [id]/route.ts            # GET, PATCH, DELETE
│           │   └── validate/route.ts        # POST validate coupon
│           ├── campaigns/
│           │   ├── route.ts
│           │   ├── [id]/route.ts
│           │   └── send/route.ts            # POST send campaign
│           ├── loyalty/
│           │   ├── program/route.ts
│           │   ├── account/route.ts
│           │   ├── earn/route.ts
│           │   └── redeem/route.ts
│           └── affiliates/
│               ├── route.ts
│               ├── [id]/route.ts
│               └── conversions/route.ts
│
├── lib/
│   └── marketing/
│       ├── discounts.ts                     # منطق الخصومات
│       ├── campaigns.ts                     # إدارة الحملات
│       ├── loyalty.ts                       # نظام الولاء
│       ├── affiliates.ts                    # التسويق بالعمولة
│       └── analytics.ts                     # التحليلات
│
└── components/
    └── marketing/
        ├── discount-form.tsx
        ├── campaign-builder.tsx
        ├── loyalty-settings.tsx
        └── affiliate-dashboard.tsx
```

---

## 4. الميزات التسويقية المقترحة

### 4.1 محرك الخصومات الذكي

#### الميزات الأساسية

```typescript
// src/lib/marketing/discounts.ts

interface DiscountEngine {
  // إنشاء خصم جديد
  createDiscount(data: CreateDiscountInput): Promise<Discount>;
  
  // التحقق من صلاحية الكوبون
  validateCoupon(code: string, context: OrderContext): Promise<ValidationResult>;
  
  // تطبيق الخصم على الطلب
  applyDiscount(discount: Discount, order: Order): Promise<AppliedDiscount>;
  
  // حساب التوفير
  calculateSavings(discount: Discount, order: Order): number;
  
  // اقتراح خصم بالـ AI
  suggestDiscount(product: Product, salesData: SalesData): Promise<DiscountSuggestion>;
}
```

#### أنواع الخصومات

| النوع | الوصف | مثال |
|-------|-------|------|
| **Percentage** | نسبة مئوية | 20% خصم |
| **Fixed Amount** | قيمة ثابتة | 50 SAR خصم |
| **Free Shipping** | شحن مجاني | عند طلب 200 SAR |
| **Buy X Get Y** | اشترِ X واحصل على Y | اشترِ 2 واحصل على 1 مجاني |
| **Bundle** | حزمة منتجات | 3 منتجات بـ 100 SAR |
| **Tiered** | خصم متدرج | 10% للطلب الأول، 15% للثاني |

#### خوارزمية التحقق

```typescript
// src/lib/marketing/discounts/validate.ts

export async function validateCoupon(
  code: string,
  tenantId: string,
  orderContext: OrderContext
): Promise<ValidationResult> {
  const errors: string[] = [];
  let warnings: string[] = [];
  
  // 1. البحث عن الخصم
  const discount = await db.query.discounts.findFirst({
    where: and(
      eq(discounts.code, code.toUpperCase()),
      eq(discounts.tenant_id, tenantId),
      eq(discounts.is_active, true)
    ),
  });
  
  if (!discount) {
    return { valid: false, errors: ['كود الخصم غير موجود'] };
  }
  
  // 2. التحقق من الوقت
  const now = new Date();
  if (discount.starts_at && now < discount.starts_at) {
    errors.push('الخصم لم يبدأ بعد');
  }
  if (discount.ends_at && now > discount.ends_at) {
    errors.push('انتهت صلاحية الخصم');
  }
  
  // 3. التحقق من عدد الاستخدامات
  if (discount.max_uses && discount.used_count >= discount.max_uses) {
    errors.push('تجاوز الخصم الحد الأقصى للاستخدام');
  }
  
  // 4. التحقق من الحد الأدنى للطلب
  if (discount.min_order_amount && orderContext.subtotal < discount.min_order_amount) {
    errors.push(`الحد الأدنى للطلب ${discount.min_order_amount} ريال`);
  }
  
  // 5. التحقق من المنتجات
  if (discount.applies_to === 'specific_products') {
    const hasProduct = orderContext.products.some(p => 
      discount.product_ids?.includes(p.id)
    );
    if (!hasProduct) {
      errors.push('الخصم لا ينطبق على المنتجات في السلة');
    }
  }
  
  // 6. التحقق من التصنيفات
  if (discount.applies_to === 'specific_categories') {
    const hasCategory = orderContext.products.some(p =>
      discount.category_ids?.includes(p.category_id)
    );
    if (!hasCategory) {
      errors.push('الخصم لا ينطبق على تصنيفات المنتجات');
    }
  }
  
  // 7. التحقق من العميل
  if (discount.applies_to === 'specific_customers') {
    if (!discount.customer_ids?.includes(orderContext.customerId)) {
      errors.push('الخصم غير متاح لهذا العميل');
    }
  }
  
  // 8. التحقق من المنطقة
  if (discount.region_ids?.length) {
    if (!discount.region_ids.includes(orderContext.regionId)) {
      errors.push('الخصم غير متاح في منطقتك');
    }
  }
  
  // 9. التحقق من وسيلة الدفع
  if (discount.payment_method && discount.payment_method !== orderContext.paymentMethod) {
    errors.push(`الخصم متاح فقط لـ ${discount.payment_method}`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // حساب قيمة الخصم
  const savings = calculateSavings(discount, orderContext);
  
  return {
    valid: true,
    discount,
    savings,
    warnings,
  };
}
```

### 4.2 نظام الحملات التسويقية

#### الميزات الأساسية

```typescript
// src/lib/marketing/campaigns.ts

interface CampaignManager {
  // إنشاء حملة
  createCampaign(data: CreateCampaignInput): Promise<Campaign>;
  
  // جدولة حملة
  scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<void>;
  
  // إرسال حملة
  sendCampaign(campaignId: string): Promise<SendResult>;
  
  // تتبع الأداء
  trackCampaignPerformance(campaignId: string): Promise<CampaignAnalytics>;
  
  // كتابة رسالة بالـ AI
  generateMessageWithAI(topic: string, audience: string): Promise<string>;
}
```

#### تدفق إرسال الحملة

```typescript
// src/lib/marketing/campaigns/send.ts

export async function executeCampaign(campaignId: string) {
  // 1. جلب الحملة
  const campaign = await db.query.marketing_campaigns.findFirst({
    where: eq(marketing_campaigns.id, campaignId),
  });
  
  if (!campaign || campaign.status !== 'scheduled') {
    throw new Error('Campaign not ready');
  }
  
  // 2. تحديث الحالة
  await db.update(marketing_campaigns)
    .set({ status: 'running' })
    .where(eq(marketing_campaigns.id, campaignId));
  
  // 3. الحصول على الجمهور
  const customers = await getFilteredCustomers(campaign.audience_filter);
  
  // 4. إرسال دفعة (Batch)
  const BATCH_SIZE = 100;
  const results: SendResult[] = [];
  
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.allSettled(
      batch.map(customer => sendMessage(campaign, customer))
    );
    
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null));
    
    // تأخير لتجنب Rate Limiting
    await sleep(1000);
  }
  
  // 5. تحديث الإحصائيات
  const sentCount = results.filter(r => r !== null).length;
  
  await db.update(marketing_campaigns)
    .set({
      status: 'completed',
      sent_count: sentCount,
    })
    .where(eq(marketing_campaigns.id, campaignId));
  
  return { sentCount, totalCustomers: customers.length };
}
```

#### التكامل مع مزودي الخدمة

```typescript
// src/lib/marketing/providers/whatsapp.ts

import { whatsappClient } from '@/lib/whatsapp';

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  templateName?: string
): Promise<SendResult> {
  if (templateName) {
    // استخدام قالب معتمد
    return whatsappClient.sendTemplate({
      to,
      template: {
        name: templateName,
        language: { code: 'ar' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: message }] }],
      },
    });
  } else {
    // رسالة عادية (Session Message)
    return whatsappClient.sendMessage({
      to,
      text: { body: message },
    });
  }
}

// src/lib/marketing/providers/sms.ts

import { UnifonicClient } from '@unifonic/sdk';

export async function sendSMSMessage(
  to: string,
  message: string
): Promise<SendResult> {
  const client = new UnifonicClient({
    apiKey: process.env.UNIFONIC_API_KEY!,
    senderID: process.env.SMS_SENDER_ID || 'SaaSFast',
  });
  
  return client.send({
    to,
    body: message,
  });
}

// src/lib/marketing/providers/email.ts

import { Resend } from 'resend';

export async function sendEmailMessage(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  
  return resend.emails.send({
    from: 'noreply@saasfast.com',
    to,
    subject,
    html,
  });
}
```

### 4.3 برنامج الولاء

#### الميزات الأساسية

```typescript
// src/lib/marketing/loyalty.ts

interface LoyaltyProgram {
  // كسب نقاط
  awardPoints(customerId: string, orderAmount: number): Promise<AwardResult>;
  
  // استرداد نقاط
  redeemPoints(customerId: string, pointsToRedeem: number): Promise<RedeemResult>;
  
  // التحقق من الرصيد
  getBalance(customerId: string): Promise<number>;
  
  // تحديث المستوى
  updateTier(customerId: string): Promise<TierUpdate>;
  
  // انتهاء الصلاحية
  expirePoints(): Promise<void>;
}
```

#### التكامل مع Webhook الدفع

```typescript
// src/app/api/payments/webhook/route.ts

import { awardPoints } from '@/lib/marketing/loyalty';

export async function POST(request: Request) {
  const payload = await request.json();
  
  // ... معالجة الدفع ...
  
  if (payload.status === 'completed') {
    // مكافأة النقاط
    await awardPoints({
      tenantId: payload.tenant_id,
      customerId: payload.customer_id,
      orderAmount: payload.amount,
      orderId: payload.order_id,
    });
  }
  
  return Response.json({ success: true });
}
```

#### حساب النقاط

```typescript
// src/lib/marketing/loyalty/earn.ts

export async function awardPoints(data: AwardPointsInput) {
  const program = await db.query.loyalty_programs.findFirst({
    where: eq(loyalty_programs.tenant_id, data.tenantId),
  });
  
  if (!program?.is_active) {
    return { awarded: false, reason: 'Program inactive' };
  }
  
  // حساب النقاط
  const basePoints = Math.floor(data.orderAmount * program.points_per_sar);
  
  // الحصول على مستوى العميل
  const account = await getOrCreateLoyaltyAccount(data.tenantId, data.customerId);
  const tierMultiplier = getTierMultiplier(account.current_tier, program.tiers);
  
  const totalPoints = Math.floor(basePoints * tierMultiplier);
  const newBalance = account.current_balance + totalPoints;
  
  // تسجيل المعاملة
  await db.insert(loyalty_transactions).values({
    tenant_id: data.tenantId,
    account_id: account.id,
    type: 'earn',
    points: totalPoints,
    balance_after: newBalance,
    reference_type: 'order',
    reference_id: data.orderId,
    notes: `Points for order ${data.orderId}`,
  });
  
  // تحديث الرصيد
  await db.update(loyalty_accounts)
    .set({
      current_balance: newBalance,
      lifetime_points: account.lifetime_points + totalPoints,
    })
    .where(eq(loyalty_accounts.id, account.id));
  
  // التحقق من تغيير المستوى
  const newTier = calculateTier(newBalance, program.tiers);
  if (newTier !== account.current_tier) {
    await updateTier(data.customerId, newTier);
  }
  
  return {
    awarded: true,
    points: totalPoints,
    newBalance,
    newTier,
  };
}
```

### 4.4 التسويق بالعمولة

#### الميزات الأساسية

```typescript
// src/lib/marketing/affiliates.ts

interface AffiliateManager {
  // إنشاء مسوق
  createAffiliate(data: CreateAffiliateInput): Promise<Affiliate>;
  
  // توليد رابط إحالة
  generateReferralLink(affiliateId: string): Promise<string>;
  
  // تتبع نقرة
  trackClick(affiliateCode: string, visitorData: VisitorData): Promise<void>;
  
  // تسجيل تحويل
  recordConversion(affiliateCode: string, orderData: OrderData): Promise<Conversion>;
  
  // معالجة العمولة
  processCommission(conversionId: string): Promise<void>;
}
```

#### Middleware للتتبع

```typescript
// middleware.ts (تعديل)

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // التقاط رابط الإحالة
  const refCode = searchParams.get('ref');
  
  if (refCode) {
    const response = NextResponse.next();
    
    // حفظ في cookie لمدة 30 يوم
    response.cookies.set('affiliate_ref', refCode, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });
    
    // تسجيل النقرة (خلفية)
    trackAffiliateClick(refCode, request).catch(console.error);
    
    return response;
  }
  
  // ... باقي المنطق ...
}
```

#### تسجيل التحويل

```typescript
// src/lib/marketing/affiliates/conversions.ts

export async function recordConversion(affiliateCode: string, orderData: OrderData) {
  // البحث عن المسوق
  const affiliate = await db.query.affiliates.findFirst({
    where: and(
      eq(affiliates.referral_code, affiliateCode),
      eq(affiliates.status, 'active')
    ),
  });
  
  if (!affiliate) {
    return { recorded: false, reason: 'Affiliate not found' };
  }
  
  // حساب العمولة
  const commission = affiliate.commission_type === 'percentage'
    ? orderData.amount * (affiliate.commission_rate / 100)
    : affiliate.commission_rate;
  
  // تسجيل التحويل
  const conversion = await db.insert(affiliate_conversions).values({
    affiliate_id: affiliate.id,
    tenant_id: orderData.tenantId,
    order_id: orderData.orderId,
    order_amount: orderData.amount,
    commission,
    status: 'pending',
    clicked_at: null, // سيتم تحديثه لاحقاً
    converted_at: new Date(),
  }).returning();
  
  // تحديث إحصائيات المسوق
  await db.update(affiliates)
    .set({
      total_conversions: affiliate.total_conversions + 1,
      pending_payout: affiliate.pending_payout + commission,
    })
    .where(eq(affiliates.id, affiliate.id));
  
  return {
    recorded: true,
    conversion: conversion[0],
    commission,
  };
}
```

### 4.5 الذكاء الاصطناعي التسويقي

#### الميزات

```typescript
// src/lib/ai/marketing.ts

import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 1. كتابة رسالة الحملة
export async function generateCampaignMessage(params: {
  topic: string;
  audience: string;
  channel: 'sms' | 'whatsapp' | 'email';
  tone: 'friendly' | 'professional' | 'urgent';
}): Promise<string> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      message_ar: z.string(),
      message_en: z.string().optional(),
      subject_line: z.string().optional(),
      call_to_action: z.string(),
    }),
    prompt: `
      اكتب رسالة تسويقية مقنعة لـ ${params.channel}.
      
      الموضوع: ${params.topic}
      الجمهور المستهدف: ${params.audience}
      النبرة: ${params.tone}
      
      المتطلبات:
      - باللغة العربية الفصحى
      - قصيرة ومباشرة (${params.channel === 'sms' ? '160 حرف كحد أقصى' : '500 حرف'})
      - تحتوي على call-to-action واضح
      - تستخدم أسلوب الإقناع المناسب
    `,
  });
  
  return object.message_ar;
}

// 2. اقتراح نسبة الخصم
export async function suggestDiscountRate(params: {
  productId: string;
  salesData: SalesData;
  competitorPrices: number[];
}): Promise<DiscountSuggestion> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      suggested_rate: z.number(),
      reasoning: z.string(),
      expected_impact: z.object({
        conversion_lift: z.number(),
        revenue_impact: z.number(),
        margin_impact: z.number(),
      }),
      alternative_rates: z.array(z.number()),
    }),
    prompt: `
      اقترح نسبة خصم مثالية لمنتج بناءً على:
      
      بيانات المبيعات: ${JSON.stringify(params.salesData)}
      أسعار المنافسين: ${params.competitorPrices.join(', ')}
      
      خذ في الاعتبار:
      - مرونة السعر
      - هوامش الربح
      - الموسمية
      - سلوك العملاء
    `,
  });
  
  return object;
}

// 3. تقسيم الجمهور الذكي
export async function suggestAudience(params: {
  campaignGoal: string;
  customerData: CustomerData[];
}): Promise<AudienceSegment> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      segment_name: z.string(),
      criteria: z.object({
        last_purchase_days: z.number().optional(),
        min_orders: z.number().optional(),
        min_spent: z.number().optional(),
        categories: z.array(z.string()).optional(),
      }),
      estimated_size: z.number(),
      expected_conversion_rate: z.number(),
      messaging_recommendations: z.string(),
    }),
    prompt: `
      حدد أفضل شريحة عملاء لحملة تسويقية:
      
      الهدف: ${params.campaignGoal}
      
      اقترح شريحة بناءً على:
      - سلوك الشراء
      - قيمة العميل
      - احتمالية الاستجابة
      
      قدم توصيات للرسالة المناسبة.
    `,
  });
  
  return object;
}
```

---

## 5. خطة التنفيذ

### 5.1 الجدول الزمني التفصيلي

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Gantt Chart - 7 أسابيع                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ الأسبوع 1: [████████] Migrations + API الخصومات                       │
│ الأسبوع 2: [████████] UI الخصومات + اختبار                            │
│ الأسبوع 3: [████████] الحملات + التكاملات                             │
│ الأسبوع 4: [████████] الولاء + Webhook                                 │
│ الأسبوع 5: [████████] الإحالة + Middleware                            │
│ الأسبوع 6: [████████] AI + التحليلات                                   │
│ الأسبوع 7: [████████] اختبار شامل + إطلاق                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 الأسبوع 1: الأساس

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 1.1 | إنشاء Migration 030_discounts | DB | 2 ساعة | ⬜ |
| 1.2 | إنشاء Migration 031_campaigns | DB | 2 ساعة | ⬜ |
| 1.3 | API: POST /api/marketing/discounts | API | 3 ساعة | ⬜ |
| 1.4 | API: GET /api/marketing/discounts | API | 2 ساعة | ⬜ |
| 1.5 | API: GET/PATCH/DELETE /api/marketing/discounts/[id] | API | 3 ساعة | ⬜ |
| 1.6 | API: POST /api/marketing/discounts/validate | API | 4 ساعة | ⬜ |
| 1.7 | Library: src/lib/marketing/discounts.ts | Lib | 4 ساعة | ⬜ |
| 1.8 | اختبار Unit للخصومات | Test | 3 ساعة | ⬜ |

#### الملفات المطلوبة

```
supabase/migrations/
└── 030_discounts.sql

src/
├── app/
│   └── api/
│       └── marketing/
│           └── discounts/
│               ├── route.ts
│               └── [id]/
│                   └── route.ts
│
└── lib/
    └── marketing/
        └── discounts.ts
```

### 5.3 الأسبوع 2: واجهة الخصومات

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 2.1 | صفحة: /dashboard/marketing/discounts | UI | 4 ساعة | ⬜ |
| 2.2 | صفحة: /dashboard/marketing/discounts/new | UI | 6 ساعة | ⬜ |
| 2.3 | صفحة: /dashboard/marketing/discounts/[id] | UI | 4 ساعة | ⬜ |
| 2.4 | Component: DiscountForm | Comp | 4 ساعة | ⬜ |
| 2.5 | Component: DiscountCard | Comp | 2 ساعة | ⬜ |
| 2.6 | Component: DiscountTypeSelector | Comp | 3 ساعة | ⬜ |
| 2.7 | تكامل مع Module Registry | Integration | 2 ساعة | ⬜ |
| 2.8 | اختبار E2E | Test | 4 ساعة | ⬜ |

#### تصميم الواجهة

```tsx
// app/(tenant)/dashboard/marketing/discounts/new/page.tsx

export default function NewDiscountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إنشاء خصم جديد</h1>
        <p className="text-muted-foreground">
          أضف عرضاً تسويقياً جديداً لزيادة المبيعات
        </p>
      </div>
      
      <DiscountForm />
    </div>
  );
}

// components/marketing/discount-form.tsx

export function DiscountForm() {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  
  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>نوع الخصم</CardTitle>
        </CardHeader>
        <CardContent>
          <DiscountTypeSelector 
            value={discountType}
            onChange={setDiscountType}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الخصم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            name="name_ar"
            label="الاسم"
            placeholder="خصم رمضان الكريم"
          />
          
          {discountType !== 'free_shipping' && (
            <FormField
              name="value"
              label="القيمة"
              type="number"
              suffix={discountType === 'percentage' ? '%' : 'ر.س'}
            />
          )}
          
          <FormField
            name="code"
            label="كود الكوبون (اختياري)"
            placeholder="RAMADAN20"
          />
        </CardContent>
      </Card>
      
      {/* شروط الخصم */}
      <Card>
        <CardHeader>
          <CardTitle>الشروط</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            name="min_order_amount"
            label="الحد الأدنى للطلب"
            type="number"
            suffix="ر.س"
          />
          
          <FormField
            name="starts_at"
            label="تاريخ البدء"
            type="datetime"
          />
          
          <FormField
            name="ends_at"
            label="تاريخ الانتهاء"
            type="datetime"
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-3">
        <Button variant="outline">إلغاء</Button>
        <Button type="submit">إنشاء الخصم</Button>
      </div>
    </form>
  );
}
```

### 5.4 الأسبوع 3: الحملات التسويقية

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 3.1 | إنشاء Migration 031_campaigns | DB | 2 ساعة | ⬜ |
| 3.2 | API: CRUD للحملات | API | 4 ساعة | ⬜ |
| 3.3 | تكامل WhatsApp API | Integration | 6 ساعة | ⬜ |
| 3.4 | تكامل SMS API | Integration | 4 ساعة | ⬜ |
| 3.5 | صفحة: /dashboard/marketing/campaigns | UI | 4 ساعة | ⬜ |
| 3.6 | صفحة: /dashboard/marketing/campaigns/new | UI | 6 ساعة | ⬜ |
| 3.7 | Component: CampaignBuilder | Comp | 6 ساعة | ⬜ |
| 3.8 | Component: AudienceSelector | Comp | 4 ساعة | ⬜ |

### 5.5 الأسبوع 4: برنامج الولاء

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 4.1 | إنشاء Migration 032_loyalty | DB | 3 ساعة | ⬜ |
| 4.2 | API: إدارة برنامج الولاء | API | 4 ساعة | ⬜ |
| 4.3 | API: كسب النقاط | API | 3 ساعة | ⬜ |
| 4.4 | API: استرداد النقاط | API | 3 ساعة | ⬜ |
| 4.5 | تكامل مع payments/webhook | Integration | 4 ساعة | ⬜ |
| 4.6 | صفحة: /dashboard/marketing/loyalty | UI | 4 ساعة | ⬜ |
| 4.7 | صفحة: /dashboard/marketing/loyalty/members | UI | 4 ساعة | ⬜ |

### 5.6 الأسبوع 5: التسويق بالعمولة

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 5.1 | إنشاء Migration 033_affiliates | DB | 3 ساعة | ⬜ |
| 5.2 | API: إدارة المسوقين | API | 4 ساعة | ⬜ |
| 5.3 | تعديل middleware للتتبع | Middleware | 3 ساعة | ⬜ |
| 5.4 | تكامل مع payments/webhook | Integration | 4 ساعة | ⬜ |
| 5.5 | صفحة: /dashboard/marketing/affiliates | UI | 4 ساعة | ⬜ |
| 5.6 | صفحة: لوحة المسوق (عامة) | UI | 4 ساعة | ⬜ |

### 5.7 الأسبوع 6: الذكاء الاصطناعي

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 6.1 | generateCampaignMessage() | AI | 4 ساعة | ⬜ |
| 6.2 | suggestDiscountRate() | AI | 4 ساعة | ⬜ |
| 6.3 | suggestAudience() | AI | 4 ساعة | ⬜ |
| 6.4 | تكامل في واجهة الحملات | UI | 3 ساعة | ⬜ |
| 6.5 | صفحة: /dashboard/marketing/analytics | UI | 6 ساعة | ⬜ |

### 5.8 الأسبوع 7: الاختبار والإطلاق

#### المهام

| # | المهمة | النوع | التقدير | الحالة |
|---|--------|-------|---------|--------|
| 7.1 | اختبار شامل للخصومات | Test | 4 ساعة | ⬜ |
| 7.2 | اختبار شامل للحملات | Test | 4 ساعة | ⬜ |
| 7.3 | اختبار شامل للولاء | Test | 4 ساعة | ⬜ |
| 7.4 | اختبار شامل للإحالة | Test | 4 ساعة | ⬜ |
| 7.5 | اختبار التحميل | Test | 4 ساعة | ⬜ |
| 7.6 | إصلاح الأخطاء | Fix | 8 ساعة | ⬜ |
| 7.7 | التوثيق | Docs | 4 ساعة | ⬜ |
| 7.8 | الإطلاق | Deploy | 2 ساعة | ⬜ |

---

## 6. التكامل مع المشاريع الأخرى

### 6.1 API Standards

```typescript
// معايير الـ API

interface APIStandard {
  // RESTful conventions
  GET    /api/marketing/discounts      // List
  POST   /api/marketing/discounts      // Create
  GET    /api/marketing/discounts/:id  // Get one
  PATCH  /api/marketing/discounts/:id  // Update
  DELETE /api/marketing/discounts/:id  // Delete
  
  // Response format
  response: {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    meta?: {
      page: number;
      limit: number;
      total: number;
    };
  };
  
  // Authentication
  auth: 'Bearer Token (from NextAuth)';
  
  // Tenant context
  tenant: 'x-tenant-id header';
  
  // Rate limiting
  rateLimit: '100 requests/minute';
}
```

### 6.2 Webhooks

```typescript
// src/lib/marketing/webhooks.ts

interface WebhookEvents {
  // أحداث الخصومات
  'discount.created': { discount: Discount };
  'discount.activated': { discount: Discount };
  'discount.expired': { discount: Discount };
  
  // أحداث الحملات
  'campaign.created': { campaign: Campaign };
  'campaign.sent': { campaign: Campaign; sentCount: number };
  'campaign.completed': { campaign: Campaign; analytics: CampaignAnalytics };
  
  // أحداث الولاء
  'loyalty.points.earned': { accountId: string; points: number };
  'loyalty.points.redeemed': { accountId: string; points: number };
  'loyalty.tier.updated': { accountId: string; newTier: string };
  
  // أحداث الإحالة
  'affiliate.click': { affiliateId: string; visitorId: string };
  'affiliate.conversion': { affiliateId: string; conversion: Conversion };
  'affiliate.payout': { affiliateId: string; amount: number };
}

// تسجيل webhook listener
export function onWebhook<T extends keyof WebhookEvents>(
  event: T,
  handler: (data: WebhookEvents[T]) => Promise<void>
) {
  // تسجيل المعالج
}
```

### 6.3 SDK للتكامل الخارجي

```typescript
// @saasfast/marketing-sdk

import { SaaSFastMarketing } from '@saasfast/marketing-sdk';

const client = new SaaSFastMarketing({
  apiKey: 'sk_...',
  tenantId: '...',
});

// إنشاء خصم
await client.discounts.create({
  name_ar: 'خصم الصيف',
  discount_type: 'percentage',
  value: 20,
  code: 'SUMMER20',
});

// إرسال حملة
await client.campaigns.send({
  channel: 'whatsapp',
  audience: { last_purchase_days: 90 },
  message_ar: 'عرض خاص...',
});

// كسب نقاط
await client.loyalty.earn({
  customerId: '...',
  orderAmount: 500,
});
```

### 6.4 التكامل مع منصات خارجية

| المنصة | نوع التكامل | الحالة |
|--------|-------------|--------|
| **Zapier** | Webhooks | ⬜ مستقبلاً |
| **Make.com** | API | ⬜ مستقبلاً |
| **Google Analytics** | Tracking | ⬜ مستقبلاً |
| **Facebook Pixel** | Tracking | ⬜ مستقبلاً |
| **Mailchimp** | Email Sync | ⬜ مستقبلاً |

---

## 7. تجربة المستخدم والواجهات

### 7.1 مبادئ التصميم

```
┌─────────────────────────────────────────────────────────┐
│ مبادئ تصميم واجهات التسويق:                             │
├─────────────────────────────────────────────────────────┤
│ 1. البساطة: واجهات نظيفة بدون تعقيد                    │
│ 2. الوضوح: رسائل وأزرار واضحة                          │
│ 3. السرعة: تحميل سريع واستجابة فورية                   │
│ 4. الاتساق: نفس النمط في كل الصفحات                    │
│ 5. الوصولية: دعم كامل لـ RTL والعربية                  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 الصفحة الرئيسية للتسويق

```tsx
// app/(tenant)/dashboard/marketing/page.tsx

export default function MarketingDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">التسويق</h1>
        <p className="text-muted-foreground">
          أدوات تسويقية متكاملة لنمو عملك
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إيرادات من الخصومات"
          value="12,450 ر.س"
          change="+25%"
          trend="up"
          icon="🏷️"
        />
        <StatCard
          title="الحملات النشطة"
          value="3"
          change="+1"
          trend="up"
          icon="📧"
        />
        <StatCard
          title="أعضاء الولاء"
          value="1,234"
          change="+12%"
          trend="up"
          icon="⭐"
        />
        <StatCard
          title="تحويلات الإحالة"
          value="45"
          change="+8"
          trend="up"
          icon="🤝"
        />
      </div>
      
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="إنشاء خصم"
          description="أضف عرضاً تسويقياً جديداً"
          icon="➕"
          href="/dashboard/marketing/discounts/new"
        />
        <QuickActionCard
          title="حملة جديدة"
          description="أرسل رسالة لعملائك"
          icon="📧"
          href="/dashboard/marketing/campaigns/new"
        />
        <QuickActionCard
          title="إعداد الولاء"
          description="كوّن برنامج نقاط"
          icon="⭐"
          href="/dashboard/marketing/loyalty"
        />
        <QuickActionCard
          title="إضافة مسوق"
          description="وسّع فريق التسويق"
          icon="🤝"
          href="/dashboard/marketing/affiliates/new"
        />
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityList />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7.3 مكونات الواجهة

```tsx
// components/marketing/discount-type-selector.tsx

export function DiscountTypeSelector({
  value,
  onChange,
}: {
  value: DiscountType;
  onChange: (type: DiscountType) => void;
}) {
  const types: { id: DiscountType; label: string; icon: string; desc: string }[] = [
    {
      id: 'percentage',
      label: 'نسبة مئوية',
      icon: '📊',
      desc: 'خصم بنسبة % من قيمة الطلب',
    },
    {
      id: 'fixed',
      label: 'قيمة ثابتة',
      icon: '💰',
      desc: 'خصم بقيمة محددة بالريال',
    },
    {
      id: 'free_shipping',
      label: 'شحن مجاني',
      icon: '🚚',
      desc: 'إلغاء رسوم الشحن',
    },
    {
      id: 'buy_x_get_y',
      label: 'اشترِ واحصل',
      icon: '🎁',
      desc: 'عرض اشترِ X واحصل على Y',
    },
  ];
  
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onChange(type.id)}
          className={`
            p-4 rounded-lg border-2 text-right transition-all
            ${value === type.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <div className="text-2xl mb-2">{type.icon}</div>
          <div className="font-semibold">{type.label}</div>
          <div className="text-sm text-muted-foreground">{type.desc}</div>
        </button>
      ))}
    </div>
  );
}
```

---

## 8. آليات القياس والتحليل

### 8.1 مقاييس الأداء الرئيسية (KPIs)

```typescript
// src/lib/marketing/analytics.ts

interface MarketingKPIs {
  // الخصومات
  discounts: {
    totalRedemptions: number;
    totalSavings: number;
    revenueGenerated: number;
    averageOrderValueWithDiscount: number;
    averageOrderValueWithoutDiscount: number;
    redemptionRate: number; // % من الكوبونات المستخدمة
  };
  
  // الحملات
  campaigns: {
    totalSent: number;
    openRate: number; // %
    clickRate: number; // %
    conversionRate: number; // %
    revenuePerCampaign: number;
    roi: number; // Return on Investment
  };
  
  // الولاء
  loyalty: {
    totalMembers: number;
    activeMembers: number; // خلال 30 يوم
    pointsEarned: number;
    pointsRedeemed: number;
    redemptionRate: number; // %
    repeatPurchaseRate: number; // %
  };
  
  // الإحالة
  affiliates: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number; // %
    revenueFromAffiliates: number;
    commissionPaid: number;
  };
}
```

### 8.2 تتبع الأحداث

```typescript
// src/lib/marketing/tracking.ts

import { track } from '@vercel/analytics';

export function trackMarketingEvent(
  event: string,
  data: Record<string, any>
) {
  track(event, {
    ...data,
    tenant_id: data.tenantId,
    timestamp: new Date().toISOString(),
  });
}

// أمثلة على الأحداث
export const MarketingEvents = {
  // الخصومات
  DISCOUNT_CREATED: 'discount_created',
  DISCOUNT_APPLIED: 'discount_applied',
  DISCOUNT_FAILED: 'discount_failed',
  
  // الحملات
  CAMPAIGN_SENT: 'campaign_sent',
  CAMPAIGN_OPENED: 'campaign_opened',
  CAMPAIGN_CLICKED: 'campaign_clicked',
  CAMPAIGN_CONVERTED: 'campaign_converted',
  
  // الولاء
  POINTS_EARNED: 'points_earned',
  POINTS_REDEEMED: 'points_redeemed',
  TIER_UPDATED: 'tier_updated',
  
  // الإحالة
  AFFILIATE_CLICK: 'affiliate_click',
  AFFILIATE_CONVERSION: 'affiliate_conversion',
};

// استخدام
trackMarketingEvent(MarketingEvents.DISCOUNT_APPLIED, {
  discountId: discount.id,
  orderId: order.id,
  savings: appliedDiscount.savings,
});
```

### 8.3 لوحة التحليلات

```tsx
// app/(tenant)/dashboard/marketing/analytics/page.tsx

export default function MarketingAnalyticsPage() {
  const analytics = await getMarketingAnalytics();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">تحليلات التسويق</h1>
        <p className="text-muted-foreground">
          قياس أداء حملاتك التسويقية
        </p>
      </div>
      
      {/* Date Range Picker */}
      <DateRangePicker />
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إيرادات التسويق"
          value={analytics.totalRevenue}
          change={analytics.revenueChange}
        />
        <StatCard
          title="معدل التحويل"
          value={analytics.conversionRate}
          change={analytics.conversionChange}
        />
        <StatCard
          title="ROI"
          value={analytics.roi}
          change={analytics.roiChange}
        />
        <StatCard
          title="العملاء الجدد"
          value={analytics.newCustomers}
          change={analytics.customerChange}
        />
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات عبر الوقت</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={analytics.revenueOverTime} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>قنوات التسويق</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={analytics.channelBreakdown} />
          </CardContent>
        </Card>
      </div>
      
      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>أداء الحملات</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignPerformanceTable data={analytics.campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 8.4 تقارير ROI

```typescript
// src/lib/marketing/roi.ts

export function calculateROI(campaign: Campaign): number {
  const revenue = campaign.revenue_generated;
  const cost = calculateCampaignCost(campaign);
  
  return ((revenue - cost) / cost) * 100;
}

function calculateCampaignCost(campaign: Campaign): number {
  let cost = 0;
  
  // تكلفة الإرسال
  if (campaign.channel === 'sms') {
    cost += campaign.sent_count * 0.10; // 0.10 SAR per SMS
  } else if (campaign.channel === 'whatsapp') {
    cost += campaign.sent_count * 0.05; // 0.05 SAR per WhatsApp
  }
  // Email مجاني ��بر Resend
  
  // تكلفة الخصم
  cost += campaign.revenue_generated * 0.15; // متوسط الخصم 15%
  
  return cost;
}
```

---

## 9. المخاطر والتحديات

### 9.1 المخاطر التقنية

| الخطر | الاحتمال | التأثير | التخفيف |
|-------|----------|---------|---------|
| **Rate Limiting من المزودين** | متوسط | عالي | استخدام Queue + Retry Logic |
| **فشل Webhook الدفع** | منخفض | عالي | Retry Mechanism + Dead Letter Queue |
| **تسرب بيانات العملاء** | منخفض | حرج | تشفير + RLS + Audit Logs |
| **أداء قاعدة البيانات** | متوسط | متوسط | Indexes + Caching + Pagination |

### 9.2 تحديات التكامل

```
┌─────────────────────────────────────────────────────────┐
│ تحديات التكامل والحلول:                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. WhatsApp Business API:                               │
│    التحدي: يحتاج موافقة Meta                            │
│    الحل: استخدام مزود معتمد مثل Unifonic               │
│                                                         │
│ 2. SMS Gateway:                                         │
│    التحدي: تكلفة عالية                                 │
│    الحل: التفاوض على أسعار جملة                        │
│                                                         │
│ 3. Payment Webhook:                                     │
│    التحدي: تزامن البيانات                              │
│    الحل: Idempotency Keys + Event Sourcing             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 9.3 اعتبارات الأمان

```typescript
// src/lib/marketing/security.ts

// 1. التحقق من الصلاحيات
export async function checkMarketingPermission(
  userId: string,
  tenantId: string,
  action: string
): Promise<boolean> {
  const user = await getUserWithPermissions(userId, tenantId);
  
  const requiredPermission = `marketing.${action}`;
  return user.permissions.includes(requiredPermission) || 
         user.role === 'owner' || 
         user.role === 'admin';
}

// 2. Rate Limiting للخصومات
export const discountValidateLimit = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
  min: 10, // 10 requests per minute
});

// 3. تشفير بيانات العملاء
import { encrypt, decrypt } from '@/lib/encryption';

export function encryptCustomerData(data: CustomerData): EncryptedCustomerData {
  return {
    email: encrypt(data.email),
    phone: encrypt(data.phone),
  };
}
```

---

## 10. الخلاصة والتوصيات

### 10.1 الخلاصة

تقدم هذه الخطة خارطة طريق شاملة لإضافة ميزات تسويقية متقدمة لمنصة **SaaSFast**، مستوحاة من أفضل الممارسات في الصناعة (زد، سلة) ومُكيفة مع احتياجات السوق العربي.

### 10.2 التوصيات الرئيسية

#### أ) الأولويات

```
┌─────────────────────────────────────────────────────────┐
│ أولويات التنفيذ:                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔴 أولوية قصوى (الأسبوع 1-2):                          │
│    - محرك الخصومات                                      │
│    - واجهة إدارة الخصومات                              │
│                                                         │
│ 🟠 أولوية عالية (الأسبوع 3-4):                         │
│    - الحملات التسويقية (Email أولاً)                   │
│    - برنامج الولاء                                      │
│                                                         │
│ 🟡 أولوية متوسطة (الأسبوع 5-6):                        │
│    - التسويق بالعمولة                                   │
│    - الذكاء الاصطناعي                                   │
│                                                         │
│ 🟢 أولوية منخفضة (الأسبوع 7+):                         │
│    - تحليلات متقدمة                                     │
│    - تكاملات خارجية                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### ب) قرارات تقنية

| القرار | التوصية | السبب |
|--------|---------|-------|
| **مزود SMS** | Unifonic | دعم عربي + أسعار منافسة |
| **مزود WhatsApp** | Meta via Unifonic | موثوق + معتمد |
| **Email** | Resend (موجود) | مجاني + موثوق |
| **Queue System** | Upstash Redis | موجود + بسيط |
| **Analytics** | Vercel Analytics + Custom | مجاني + مخصص |

#### ج) نموذج التسعير المقترح

```
┌─────────────────────────────────────────────────────────┐
│ إضافة التسويق للخطط:                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ خطة Free:                                               │
│   ❌ لا يشمل التسويق                                    │
│                                                         │
│ خطة Basic (+99 ر.س/شهر):                                │
│   ✅ خصومات (5 خصومات نشطة)                            │
│   ❌ لا يشمل الحملات                                    │
│   ❌ لا يشمل الولاء                                     │
│                                                         │
│ خطة Professional (+199 ر.س/شهر):                        │
│   ✅ خصومات غير محدودة                                  │
│   ✅ حملات Email (1000/شهر)                            │
│   ✅ ولاء (1000 عضو)                                    │
│   ❌ لا يشمل الإحالة                                    │
│                                                         │
│ خطة Enterprise (+399 ر.س/شهر):                          │
│   ✅ كل الميزات                                          │
│   ✅ حملات غير محدودة                                   │
│   ✅ WhatsApp + SMS                                     │
│   ✅ ولاء غير محدود                                     │
│   ✅ إحالة                                               │
│   ✅ AI Writing                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 10.3 الخطوات التالية

1. **موافقة الإدارة** على الخطة والميزانية
2. **تعيين فريق** (2 مطورين + مصمم UI/UX)
3. **شراء اشتراكات** المزودين الخارجيين
4. **بدء الأسبوع 1** حسب الجدول الزمني
5. **مراجعة أسبوعية** للتقدم

### 10.4 النجاح المقاس

| المقياس | الهدف | الجدول |
|---------|-------|--------|
| **تبني الميزة** | 60% من العملاء | 3 أشهر |
| **زيادة الإيرادات** | +25% | 6 أشهر |
| **رضا العملاء** | 4.5/5 | 3 أشهر |
| **Retention Rate** | +35% | 6 أشهر |

---

## الملاحق

### أ) قائمة الملفات الكاملة

```
ملفات جديدة: 45 ملف
ملفات معدلة: 8 ملفات
إجمالي الأسطر: ~5000 سطر
```

### ب) التكلفة المتوقعة

| البند | التكلفة الشهرية |
|-------|-----------------|
| Unifonic SMS | 500-2000 SAR |
| WhatsApp Business | 200-1000 SAR |
| Resend Email | مجاني (3000/شهر) |
| Upstash Redis | مجاني (10MB) |
| Vercel Analytics | مجاني |
| **الإجمالي** | **700-3000 SAR** |

### ج) المراجع

1. [زد - مركز المساعدة](https://help.zid.sa/)
2. [سلة - API Docs](https://docs.salla.dev/)
3. [Vercel AI SDK](https://sdk.vercel.ai/docs)
4. [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
5. [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**تم إعداد هذه الخطة بواسطة:** خبير تطوير منصات SaaS  
**التاريخ:** 23 مارس 2026  
**الإصدار:** 1.0
