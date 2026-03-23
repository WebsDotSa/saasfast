# 🚀 SaaS Core Platform — Phase 4 Development Plan

**تاريخ الإنشاء:** 2026-03-20  
**الإصدار:** 1.0  
**الحالة الحالية:** 85% مكتمل — Phase 1-3 ✓  
**الهدف:** إكمال الميزات المتبقية للإطلاق التجاري

---

## 📊 ملخص الوضع الحالي

### ما تم إنجازه (Phase 1-3)
| المرحلة | الميزات | الحالة |
|---------|---------|--------|
| **Phase 1** | Foundation (Auth, DB, Multi-tenancy, Payments) | ✅ 100% |
| **Phase 2** | UI Components + Dashboard | ✅ 100% |
| **Phase 3** | Admin Panel + Email System + GDPR + Cron Jobs | ✅ 100% |

### ما تبقى (Phase 4+)
| الطبقة | الميزات المتبقية | الأولوية |
|--------|------------------|----------|
| **Tier 1** | Team Management | 🔴 حرجة |
| **Tier 2** | Settings Page, White-label, Customer Support | 🟡 عالية |
| **Tier 3** | Referral Program, Announcements, Impersonation | 🟢 متوسطة |
| **Tier 4** | MFA, SSO, API Marketplace, Usage-based Billing | 🟣 منخفضة |

---

## 🎯 Phase 4: الميزات الأساسية المفقودة

### 4.1 Team Management — أولوية حرجة 🔴
**المدة:** 3 أيام  
**الأثر:** ضروري للتعاون بين الفرق

#### المتطلبات
- [ ] صفحة `/dashboard/team` لعرض الأعضاء
- [ ] API `/api/team/invite` لإرسال دعوات
- [ ] API `/api/team/remove` لإزالة عضو
- [ ] API `/api/team/update-role` لتغيير الصلاحيات
- [ ] صفحة قبول الدعوة عبر البريد الإلكتروني

#### جداول قاعدة البيانات (موجودة)
```sql
-- tenant_users table موجودة مسبقاً
-- roles table موجودة مسبقاً
-- يحتاج: team_invitations table جديد
```

#### Migration جديد
```sql
-- supabase/migrations/013_team_invitations.sql
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  status VARCHAR(30) DEFAULT 'pending', -- pending | accepted | declined | expired
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, tenant_id, status)
);

CREATE INDEX idx_invitations_token ON team_invitations(token);
CREATE INDEX idx_invitations_email ON team_invitations(email, status);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_tenant_access ON team_invitations
  FOR ALL USING (check_tenant_access(tenant_id));
```

#### الملفات المطلوبة
```
src/app/(tenant)/dashboard/team/
├── page.tsx              — قائمة الأعضاء + زر دعوة
├── invite-modal.tsx      — نافذة الدعوة
└── member-row.tsx        — صف العضو

src/app/api/team/
├── invite/route.ts       — POST: إرسال دعوة
├── accept/route.ts       — POST: قبول الدعوة (من البريد)
├── decline/route.ts      — POST: رفض الدعوة
├── remove/[id]/route.ts  — DELETE: إزالة عضو
└── update-role/route.ts  — PATCH: تحديث الدور

src/lib/emails/templates/
└── team-invitation.tsx   — قالب دعوة الفريق
```

#### كود مقترح — API الدعوة
```typescript
// src/app/api/team/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/emails';
import { TeamInvitationTemplate } from '@/lib/emails/templates/team-invitation';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, role } = body;

  const supabase = await createClient();
  
  // التحقق من أن المستخدم الحالي هو admin أو owner
  const { data: currentUser } = await supabase
    .from('tenant_users')
    .select('role_id, tenants(id, slug)')
    .eq('user_id', session.user.id)
    .single();

  if (currentUser.role_id !== 'admin' && currentUser.role_id !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // إنشاء الدعوة
  const { data: invitation, error } = await supabase
    .from('team_invitations')
    .insert({
      tenant_id: currentUser.tenants.id,
      email,
      role_id: role,
      invited_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // إرسال البريد الإلكتروني
  const acceptUrl = `${process.env.APP_URL}/team/accept?token=${invitation.token}`;
  
  await sendEmail({
    to: email,
    subject: 'دعوة للانضمام إلى الفريق',
    react: TeamInvitationTemplate({
      inviteeName: session.user.name || 'أحد الأعضاء',
      tenantName: currentUser.tenants.slug,
      acceptUrl,
    }),
  });

  return NextResponse.json({ success: true, invitation });
}
```

---

### 4.2 Settings Page — أولوية عالية 🟡
**المدة:** 2 أيام  
**الأثر:** تحسين تجربة المستخدم

#### المتطلبات
- [ ] صفحة `/dashboard/settings`
- [ ] تبويبات: General, Branding, Security, Billing
- [ ] تحديث اسم المنشأة ووصفها
- [ ] رفع الشعار (Logo)
- [ ] تحديث الألوان (Primary, Secondary)
- [ ] إعدادات الخصوصية

#### الملفات المطلوبة
```
src/app/(tenant)/dashboard/settings/
├── page.tsx              — الصفحة الرئيسية
├── general/
│   └── page.tsx          — الإعدادات العامة
├── branding/
│   └── page.tsx          — الهوية البصرية
├── security/
│   └── page.tsx          — إعدادات الأمان
└── api/
    └── update/route.ts   — API التحديث

src/components/settings/
├── general-form.tsx
├── branding-form.tsx
├── logo-uploader.tsx
└── color-picker.tsx
```

#### Migration للـ settings
```sql
-- settings table موجودة مسبقاً كـ JSONB في tenants table
-- يحتاج: tenant_branding table منفصل

CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4F7AFF',
  secondary_color VARCHAR(7),
  font_family VARCHAR(100) DEFAULT 'IBM Plex Sans Arabic',
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);
```

---

### 4.3 White-label — أولوية عالية 🟡
**المدة:** 2 أيام  
**الأثر:** تمييز كل منشأة بهويتها الخاصة

#### المتطلبات
- [ ] تطبيق الألوان المخصصة عبر CSS Variables
- [ ] عرض الشعار في Header و Sidebar
- [ ] إخفاء علامة SaaS Core
- [ ] Domain مخصص في الـ URLs

#### التنفيذ
```typescript
// src/components/tenant-theme-provider.tsx
'use client';

import { useEffect, useState } from 'react';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  fontFamily: string;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null);

  useEffect(() => {
    // جلب branding من API
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => setBranding(data));
  }, []);

  useEffect(() => {
    if (branding) {
      document.documentElement.style.setProperty('--primary', branding.primaryColor);
      document.documentElement.style.setProperty('--secondary', branding.secondaryColor);
    }
  }, [branding]);

  if (!branding) return null;

  return <>{children}</>;
}
```

---

### 4.4 Customer Support Widget — أولوية متوسطة 🟢
**المدة:** 1 يوم  
**الأثر:** تحسين دعم العملاء

#### الخيار 1: تكامل مع Crisp (الأسرع)
```typescript
// src/components/crisp-chat.tsx
'use client';

import { useEffect } from 'react';

export function CrispChat() {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!;
    
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
```

#### الخيار 2: Help Center داخلي
```
src/app/(tenant)/dashboard/help/
├── page.tsx              — مركز المساعدة
├── articles/
│   └── [slug]/page.tsx   — مقال فردي
└── contact/
    └── page.tsx          — نموذج الاتصال
```

---

## 🎯 Phase 5: ميزات النمو

### 5.1 Analytics Charts — أولوية عالية 🟡
**المدة:** 2 أيام  
**الأثر:** رؤى أفضل للأداء

#### المتطلبات
- [ ] تركيب Recharts (موجود بالفعل في package.json)
- [ ] Revenue Chart (آخر 30 يوم)
- [ ] Orders Chart (آخر 7 أيام)
- [ ] Customer Growth Chart
- [ ] Top Products Table

#### الملفات المطلوبة
```
src/app/(tenant)/dashboard/analytics/
├── page.tsx              — اللوحة الرئيسية
├── components/
│   ├── revenue-chart.tsx
│   ├── orders-chart.tsx
│   ├── customers-chart.tsx
│   └── top-products.tsx
└── api/
    ├── overview/route.ts — (موجود)
    ├── revenue/route.ts
    ├── orders/route.ts
    └── customers/route.ts
```

#### كود مقترح — Revenue Chart
```typescript
// src/app/(tenant)/dashboard/analytics/components/revenue-chart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `ر.س${value}`}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">التاريخ:</span>
                      <span>{payload[0].payload.date}</span>
                      <span className="text-muted-foreground">الإيرادات:</span>
                      <span className="font-bold">
                        ر.س{payload[0].value}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#4F7AFF"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

### 5.2 Announcements System — أولوية متوسطة 🟢
**المدة:** 1 يوم  
**الأثر:** تواصل أفضل مع المستخدمين

#### Migration
```sql
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info', -- info | update | alert | maintenance
  priority INTEGER DEFAULT 0, -- 0-10, الأعلى أهم
  is_active BOOLEAN DEFAULT true,
  show_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- للمستخدمين: جدول لتتبع ما تم قراءته
CREATE TABLE IF NOT EXISTS user_announcements (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  announcement_id UUID NOT NULL REFERENCES announcements(id),
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);
```

#### الملفات المطلوبة
```
src/app/(tenant)/dashboard/announcements/
├── page.tsx              — قائمة الإعلانات
├── components/
│   ├── announcement-banner.tsx  — Banner في أعلى الصفحة
│   └── announcement-modal.tsx   — نافذة منبثقة
└── api/
    ├── list/route.ts
    └── dismiss/route.ts

src/app/admin/announcements/
└── page.tsx              — إدارة الإعلانات (للأدمن)
```

---

### 5.3 Impersonation — أولوية متوسطة 🟢
**المدة:** 1 يوم  
**الأثر:** دعم فني أفضل

#### المتطلبات
- [ ] API `/api/admin/impersonate` لإنشاء session مؤقت
- [ ] زر في Admin Panel "دخول كمستخدم"
- [ ] Audit Log entry عند البدء والانتهاء
- [ ] زر "خروج من وضع المستخدم"

#### كود مقترح
```typescript
// src/app/api/admin/impersonate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createServiceClient } from '@/lib/supabase/service';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, tenantId } = await req.json();

  const supabase = createServiceClient();

  // إنشاء temporary token
  const { data: tempToken } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: (await supabase.from('users').select('email').eq('id', userId).single()).data.email,
    options: {
      redirectTo: `${process.env.APP_URL}/dashboard`,
    },
  });

  // Audit Log
  await logAudit({
    tenantId,
    userId: session.user.id,
    action: 'IMPERSONATE_START',
    details: { targetUserId: userId, targetTenantId: tenantId },
    ipAddress: req.ip,
  });

  return NextResponse.json({ 
    success: true, 
    redirectUrl: tempToken.properties.actionLink 
  });
}
```

---

### 5.4 Referral Program — أولوية منخفضة 🟣
**المدة:** 3 أيام  
**الأثر:** نمو عضوي

#### Migration
```sql
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(30) DEFAULT 'pending', -- pending | converted | rewarded
  reward_amount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_user ON referrals(referrer_user_id, status);
```

#### الملفات المطلوبة
```
src/app/(tenant)/dashboard/referrals/
├── page.tsx              — لوحة الإحالات
└── api/
    ├── generate-code/route.ts
    ├── track/route.ts
    └── rewards/route.ts
```

---

## 🎯 Phase 6: ميزات Enterprise

### 6.1 MFA (Two-Factor Auth) — أولوية متوسطة 🟢
**المدة:** 2 أيام  
**الأثر:** أمان إضافي

#### المتطلبات
- [ ] صفحة `/dashboard/security/2fa`
- [ ] توليد TOTP QR Code
- [ ] التحقق من الكود عند تسجيل الدخول
- [ ] Backup Codes

#### التنفيذ
Supabase تدعم TOTP بالفعل:
```typescript
// src/app/api/auth/2fa/enable/route.ts
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  
  // توليد TOTP
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'SaaS Core',
    friendlyName: 'My Authenticator',
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // عرض QR Code
  return Response.json({
    totpUri: data.totp.uri,
    qrCode: data.totp.qr_code,
  });
}
```

---

### 6.2 SSO/SAML — أولوية منخفضة 🟣
**المدة:** 5 أيام  
**الأثر:** جذب شركات كبيرة

#### المتطلبات
- [ ] تكامل مع Google Workspace
- [ ] تكامل مع Azure AD
- [ ] SAML 2.0 Support
- [ ] Domain Verification

#### ملاحظة
Supabase تدعم SAML في خطة Pro فقط. يمكن تأجيل هذه الميزة لمرحلة لاحقة.

---

### 6.3 API & Webhooks — أولوية متوسطة 🟢
**المدة:** 3 أيام  
**الأثر:** تكاملات خارجية

#### Migration
```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- للعرض الجزئي
  permissions JSONB DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['payment.success', 'subscription.created']
  secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id),
  event_type VARCHAR(100),
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### الملفات المطلوبة
```
src/app/(tenant)/dashboard/developers/
├── page.tsx              — لوحة المطورين
├── api-keys/
│   └── page.tsx          — إدارة مفاتيح API
├── webhooks/
│   └── page.tsx          — إدارة Webhooks
└── api/
    ├── keys/route.ts
    └── webhooks/route.ts

src/app/api/public/
└── v1/
    ├── tenants/[id]/route.ts
    └── ... (REST API)
```

---

### 6.4 Usage-based Billing — أولوية منخفضة 🟣
**المدة:** 4 أيام  
**الأثر:** مرونة في التسعير

#### Migration
```sql
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  metric_name VARCHAR(100) NOT NULL, -- 'api_calls', 'storage_gb', 'emails_sent'
  metric_value NUMERIC(15, 2) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_period ON usage_metrics(tenant_id, metric_name, period_end);
```

---

## 📅 الجدول الزمني المقترح

### الأسبوع 1-2: الأساسيات المفقودة
| المهمة | المدة | الأولوية |
|--------|-------|----------|
| Team Management | 3 أيام | 🔴 |
| Settings Page | 2 أيام | 🟡 |
| White-label | 2 أيام | 🟡 |
| Analytics Charts | 2 أيام | 🟡 |

### الأسبوع 3: E-commerce Module (لـ shops.sa)
| المهمة | المدة | الأولوية |
|--------|-------|----------|
| Products CRUD | 3 أيام | 🔴 |
| Orders Management | 2 أيام | 🔴 |
| Cart + Checkout | 2 أيام | 🔴 |
| Storefront Page | 2 أيام | 🟡 |

### الأسبوع 4: تحسينات ودعم
| المهمة | المدة | الأولوية |
|--------|-------|----------|
| Customer Support Widget | 1 يوم | 🟢 |
| Announcements | 1 يوم | 🟢 |
| Impersonation | 1 يوم | 🟢 |
| Custom Domain UI | 2 أيام | 🟡 |

### الأسبوع 5-6: ميزات متقدمة
| المهمة | المدة | الأولوية |
|--------|-------|----------|
| MFA | 2 أيام | 🟢 |
| API & Webhooks | 3 أيام | 🟡 |
| Referral Program | 3 أيام | 🟣 |

---

## ✅ Checklist النهائي

### Phase 4 — أساسي
- [ ] Team Management (Invite, Remove, Update Role)
- [ ] Settings Page (General, Branding, Security)
- [ ] White-label (Colors, Logo, Font)
- [ ] Analytics Charts (Revenue, Orders, Customers)

### Phase 5 — نمو
- [ ] Announcements System
- [ ] Impersonation
- [ ] Referral Program
- [ ] Customer Support Widget

### Phase 6 — Enterprise
- [ ] MFA (Two-Factor Auth)
- [ ] API Keys Management
- [ ] Webhooks System
- [ ] Usage-based Billing

### Phase 7 — E-commerce (مشروع shops.sa)
- [ ] Products Module
- [ ] Orders Module
- [ ] Cart & Checkout
- [ ] Storefront Public Page
- [ ] Custom Domain Integration

---

## 🎯 معايير النجاح

### قبل الإطلاق التجاري
- [ ] جميع ميزات Tier 1 مكتملة 100%
- [ ] جميع ميزات Tier 2 مكتملة 100%
- [ ] اختبار E2E شامل
- [ ] Security Audit مكتمل
- [ ] Performance Test (1000+ مستخدم متزامن)

### للإطلاق التجريبي (Beta)
- [ ] 3 عملاء أوائل مسجلين
- [ ] Feedback loop مُنشأ
- [ ] Bug tracking system جاهز
- [ ] Documentation مكتمل

---

## 📞 الخطوات التالية

1. **اليوم:** البدء بـ Team Management
2. **الأسبوع 1:** إكمال Team + Settings
3. **الأسبوع 2:** White-label + Analytics Charts
4. **الأسبوع 3:** البدء في E-commerce Module
5. **الأسبوع 4:** اختبار شامل + إطلاق Beta

---

**الحالة:** 🚧 **Phase 4 قيد التطوير**  
**الإصدار المستهدف:** v1.0.0  
**تاريخ الإطلاق المتوقع:** 2026-04-15

---

*تم التحديث: 2026-03-20*  
*بواسطة: SaaS Core Team* 🚀
