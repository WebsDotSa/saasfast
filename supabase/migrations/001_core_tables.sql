-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 001_core_tables.sql
-- Description: إنشاء الجداول الأساسية للنظام (Core Tables)
-- Created: 2025-03-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ───────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────────
-- Enums
-- ───────────────────────────────────────────────────────────────────────────────

-- حالة المنشأة (Tenant)
CREATE TYPE tenant_status AS ENUM (
  'trial',      -- فترة تجريبية
  'active',     -- نشط
  'suspended',  -- معلق (عدم دفع)
  'cancelled',  -- ملغى
  'archived'    -- مؤرشف
);

-- حالة الاشتراك
CREATE TYPE subscription_status AS ENUM (
  'trialing',   -- تجريبي
  'active',     -- نشط
  'past_due',   -- متأخر الدفع
  'cancelled',  -- ملغى
  'expired'     -- منتهي
);

-- حالة الفاتورة
CREATE TYPE invoice_status AS ENUM (
  'pending',    -- قيد الانتظار
  'paid',       -- مدفوعة
  'failed',     -- فشلت
  'refunded',   -- مستردة
  'cancelled'   -- ملغاة
);

-- حالة النطاق
CREATE TYPE domain_status AS ENUM (
  'pending',        -- قيد الانتظار
  'active',         -- نشط
  'error',          -- خطأ
  'ssl_pending',    -- SSL قيد الانتظار
  'ssl_active',     -- SSL نشط
  'ssl_failed'      -- SSL فشل
);

-- دور العضو في الفريق
CREATE TYPE member_role AS ENUM (
  'owner',    -- المالك
  'admin',    -- مدير
  'editor',   -- محرر
  'viewer',   -- مشاهد
  'developer' -- مطور
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: plans (خطط الاشتراك)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- المعلومات الأساسية
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description_ar TEXT,
  description_en TEXT,
  
  -- التسعير
  price_sar NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- فترة الفوترة
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
  -- monthly | yearly | quarterly | lifetime
  
  -- المدة (بالأشهر للفوترة الدورية)
  interval_count INTEGER DEFAULT 1,
  
  -- فترة التجربة (بالأيام)
  trial_period_days INTEGER DEFAULT 14,
  
  -- الوحدات المضمنة في الخطة
  included_modules TEXT[] DEFAULT '{}',
  
  -- حدود الخطة
  limits JSONB DEFAULT '{}'::jsonb,
  -- مثال: {"max_products": 100, "max_pages": 10, "max_users": 3}
  
  -- الميزات
  features JSONB DEFAULT '{}'::jsonb,
  -- مثال: {"custom_domain": false, "api_access": true, "priority_support": false}
  
  -- الترتيب والظهور
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  
  -- ألوان الخطة (للـ UI)
  color VARCHAR(7) DEFAULT '#6c63ff',
  icon VARCHAR(50),
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_plans_is_active ON plans(is_active);
CREATE INDEX idx_plans_sort_order ON plans(sort_order);

-- Comment
COMMENT ON TABLE plans IS 'خطط الاشتراك المتاحة للمنشآت';
COMMENT ON COLUMN plans.limits IS 'حدود الخطة: max_products, max_pages, max_users, max_storage_gb';
COMMENT ON COLUMN plans.features IS 'ميزات الخطة: custom_domain, api_access, remove_branding, priority_support';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: tenants (المنشآت/العملاء)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- المعرف الفريد (يُستخدم كـ subdomain)
  slug VARCHAR(63) NOT NULL,
  -- يجب أن يكون فريد، أحرف صغيرة، أرقام، وشرطة فقط
  
  -- المعلومات الأساسية
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  
  -- الشعار والهوية
  logo_url TEXT,
  favicon_url TEXT,
  
  -- الخطة الحالية
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  
  -- الحالة
  status tenant_status DEFAULT 'trial',
  
  -- الوحدات المفعلة
  modules TEXT[] DEFAULT '{}',
  
  -- الإعدادات المخصصة
  settings JSONB DEFAULT '{}'::jsonb,
  -- مثال: {"primary_color": "#6c63ff", "font_family": "IBM Plex Sans Arabic", ...}
  
  -- معلومات الاتصال
  email VARCHAR(255),
  phone VARCHAR(20),
  country VARCHAR(2) DEFAULT 'SA',
  city VARCHAR(100),
  address TEXT,
  
  -- الرقم الضريبي (للسعودية)
  tax_number VARCHAR(15),
  vat_number VARCHAR(20),
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- التواريخ الهامة
  trial_ends_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE UNIQUE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan_id ON tenants(plan_id);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- Constraints
ALTER TABLE tenants ADD CONSTRAINT chk_tenant_slug_format 
  CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');

-- Comment
COMMENT ON TABLE tenants IS 'المنشآت/العملاء المشتركون في المنصة';
COMMENT ON COLUMN tenants.slug IS 'يُستخدم كـ subdomain: slug.platform.sa';
COMMENT ON COLUMN tenants.modules IS 'قائمة الوحدات المفعلة: ["ecommerce", "page_builder", ...]';
COMMENT ON COLUMN tenants.settings IS 'إعدادات مخصصة: primary_color, font_family, logo_position, ...';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: subscriptions (الاشتراكات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- معرف الخطة
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  
  -- حالة الاشتراك
  status subscription_status DEFAULT 'trialing',
  
  -- التواريخ
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- معلومات الدفع
  myfatoorah_invoice_id VARCHAR(100),
  payment_method VARCHAR(50),
  last_payment_amount NUMERIC(10, 2),
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  
  -- إلغاء الاشتراك
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_subscriptions_tenant_active ON subscriptions(tenant_id) 
  WHERE status IN ('active', 'trialing');
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Comment
COMMENT ON TABLE subscriptions IS 'اشتراكات المنشآت في الخطط';
COMMENT ON COLUMN subscriptions.current_period_end IS 'تاريخ انتهاء الفترة الحالية';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'إذا كان true، سيتم الإلغاء في نهاية الفترة';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: invoices (الفواتير)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- معرف الاشتراك
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- رقم الفاتورة (للعرض)
  invoice_number VARCHAR(50) NOT NULL,
  -- مثال: INV-2025-000001
  
  -- المبالغ
  amount_sar NUMERIC(10, 2) NOT NULL,
  vat_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- الحالة
  status invoice_status DEFAULT 'pending',
  
  -- معلومات MyFatoorah
  myfatoorah_invoice_id VARCHAR(100),
  myfatoorah_payment_url TEXT,
  
  -- طريقة الدفع
  payment_method VARCHAR(50),
  paid_at TIMESTAMPTZ,
  
  -- ملف PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  
  -- الفترة
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- عناصر الفاتورة
  line_items JSONB DEFAULT '[]'::jsonb,
  -- مثال: [{"description": "خطة احترافية - شهري", "amount": 299, "quantity": 1}]
  
  -- ملاحظات
  notes TEXT,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- Comment
COMMENT ON TABLE invoices IS 'الفواتير الصادرة للمنشآت';
COMMENT ON COLUMN invoices.line_items IS 'عناصر الفاتورة: description, amount, quantity, total';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: tenant_domains (النطاقات المخصصة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE tenant_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- النطاق
  domain VARCHAR(255) NOT NULL,
  -- مثال: www.my-store.sa
  
  -- نوع النطاق
  domain_type VARCHAR(20) DEFAULT 'custom',
  -- custom | subdomain
  
  -- حالة Cloudflare
  cf_hostname_id VARCHAR(100),
  cf_verification_txt TEXT,
  
  -- الحالة
  status domain_status DEFAULT 'pending',
  ssl_status VARCHAR(50) DEFAULT 'pending',
  
  -- التحقق
  verified_at TIMESTAMPTZ,
  ssl_verified_at TIMESTAMPTZ,
  
  -- أخطاء
  error_message TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- النطاق الأساسي (default)
  is_primary BOOLEAN DEFAULT false,
  
  -- إعادة التوجيه
  redirect_to TEXT,
  -- إذا تم تعيينه، سيتم إعادة التوجيه لهذا الرابط
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX idx_tenant_domains_tenant_id ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_status ON tenant_domains(status);

-- Constraints
ALTER TABLE tenant_domains ADD CONSTRAINT chk_domain_format 
  CHECK (domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.[a-z]{2,}$');

-- Comment
COMMENT ON TABLE tenant_domains IS 'النطاقات المخصصة للمنشآت';
COMMENT ON COLUMN tenant_domains.cf_hostname_id IS 'معرف Custom Hostname في Cloudflare';
COMMENT ON COLUMN tenant_domains.cf_verification_txt IS 'سجل TXT للتحقق من الملكية';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: tenant_users (أعضاء فريق المنشأة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- معرف المستخدم (من auth.users)
  user_id UUID NOT NULL,
  -- REFERENCES auth.users(id) ON DELETE CASCADE
  
  -- الدور
  role member_role DEFAULT 'viewer',
  
  -- الصلاحيات المخصصة
  permissions JSONB DEFAULT '[]'::jsonb,
  -- مثال: ["products.create", "orders.view", ...]
  
  -- من أضاف العضو
  invited_by UUID,
  -- REFERENCES auth.users(id)
  
  -- حالة الدعوة
  invitation_status VARCHAR(20) DEFAULT 'accepted',
  -- pending | accepted | rejected | expired
  
  -- تواريخ
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_tenant_users_tenant_user ON tenant_users(tenant_id, user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON tenant_users(role);

-- Comment
COMMENT ON TABLE tenant_users IS 'أعضاء فريق كل منشأة';
COMMENT ON COLUMN tenant_users.permissions IS 'صلاحيات مخصصة إضافية بجانب الدور';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: invitations (دعوات الأعضاء)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- البريد الإلكتروني للمدعو
  email VARCHAR(255) NOT NULL,
  
  -- الدور
  role member_role DEFAULT 'viewer',
  
  -- الصلاحيات
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- من أرسل الدعوة
  invited_by UUID NOT NULL,
  -- REFERENCES auth.users(id)
  
  -- حالة الدعوة
  status VARCHAR(20) DEFAULT 'pending',
  -- pending | accepted | rejected | expired | cancelled
  
  -- رمز الدعوة
  token VARCHAR(100) NOT NULL DEFAULT gen_random_uuid(),
  
  -- تنتهي في
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- قُبلت في
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  -- REFERENCES auth.users(id)
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- Constraints
ALTER TABLE invitations ADD CONSTRAINT chk_invitation_not_expired
  CHECK (expires_at > NOW() OR status != 'pending');

-- Comment
COMMENT ON TABLE invitations IS 'دعوات إضافة أعضاء جدد للمنشأة';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: audit_logs (سجل التدقيق)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المستخدم الذي نفذ الإجراء
  user_id UUID,
  -- REFERENCES auth.users(id)
  
  -- نوع الإجراء
  action VARCHAR(100) NOT NULL,
  -- مثال: "product.created", "subscription.updated"
  
  -- نوع الكائن
  resource_type VARCHAR(100),
  -- مثال: "product", "order", "subscription"
  
  -- معرف الكائن
  resource_id UUID,
  
  -- البيانات القديمة (قبل التعديل)
  old_values JSONB,
  
  -- البيانات الجديدة (بعد التعديل)
  new_values JSONB,
  
  -- معلومات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- عنوان IP
  ip_address INET,
  
  -- User Agent
  user_agent TEXT,
  
  -- timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Comment
COMMENT ON TABLE audit_logs IS 'سجل تدقيق لجميع الإجراءات في النظام';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: api_keys (مفاتيح API العامة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- اسم المفتاح (للعرض)
  name VARCHAR(100) NOT NULL,
  
  -- مفتاح API (hash)
  key_hash VARCHAR(255) NOT NULL,
  -- يُخزن كـ hash للأمان
  
  -- أول 8 أحرف للعرض
  key_prefix VARCHAR(8) NOT NULL,
  -- مثال: sk_live_abc12345
  
  -- نوع المفتاح
  key_type VARCHAR(20) DEFAULT 'secret',
  -- public | secret
  
  -- الصلاحيات
  scopes TEXT[] DEFAULT '{}',
  -- مثال: ["read:products", "write:orders"]
  
  -- آخر استخدام
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  
  -- تنتهي في
  expires_at TIMESTAMPTZ,
  
  -- ملغاة في
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Comment
COMMENT ON TABLE api_keys IS 'مفاتيح API للوصول البرمجي';

-- ───────────────────────────────────────────────────────────────────────────────
-- Updated At Trigger Function
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_domains_updated_at
  BEFORE UPDATE ON tenant_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────
-- Insert Default Plans
-- ───────────────────────────────────────────────────────────────────────────────

INSERT INTO plans (name_ar, name_en, price_sar, billing_interval, trial_period_days, included_modules, limits, features, sort_order, is_popular, color) VALUES
  ('الخطة الأساسية', 'Basic Plan', 0, 'monthly', 14, 
   '{"page_builder"}', 
   '{"max_pages": 5, "max_users": 2, "max_storage_gb": 1}', 
   '{"custom_domain": false, "api_access": false, "remove_branding": false}', 
   1, false, '#94a3b8'),
  
  ('الخطة الاحترافية', 'Professional Plan', 299, 'monthly', 14, 
   '{"ecommerce", "page_builder"}', 
   '{"max_products": 100, "max_pages": 50, "max_users": 5, "max_storage_gb": 10}', 
   '{"custom_domain": true, "api_access": true, "remove_branding": true}', 
   2, true, '#6c63ff'),
  
  ('خطة الشركات', 'Enterprise Plan', 999, 'monthly', 14, 
   '{"ecommerce", "page_builder", "accounting", "hrms"}', 
   '{"max_products": -1, "max_pages": -1, "max_users": -1, "max_storage_gb": 100}', 
   '{"custom_domain": true, "api_access": true, "remove_branding": true, "priority_support": true, "white_label": true}', 
   3, false, '#00d4aa');

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
