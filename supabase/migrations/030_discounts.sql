-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 030: Discounts Module
-- ═══════════════════════════════════════════════════════════════════════════════
-- محرك الخصومات المتقدم - يدعم 6 أنواع من الخصومات
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. Discounts Table - الجدول الرئيسي للخصومات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  
  -- نوع الخصم
  discount_type   VARCHAR(30) NOT NULL DEFAULT 'percentage',
  -- percentage | fixed_amount | free_shipping | buy_x_get_y | bundle | tiered
  
  -- طريقة التطبيق
  applying_method VARCHAR(20) NOT NULL DEFAULT 'automatic',
  -- automatic | coupon_code
  
  -- التفاصيل الأساسية
  name_ar         VARCHAR(200) NOT NULL,
  name_en         VARCHAR(200),
  description_ar  TEXT,
  description_en  TEXT,
  code            VARCHAR(50),  -- كود الكوبون (لـ coupon_code)
  value           NUMERIC(10,2) NOT NULL DEFAULT 0,  -- قيمة الخصم
  
  -- حدود الاستخدام
  max_uses        INTEGER,  -- NULL = غير محدود
  used_count      INTEGER NOT NULL DEFAULT 0,
  uses_per_customer INTEGER,  -- حد الاستخدام لكل عميل
  
  -- الشروط
  min_order_amount NUMERIC(10,2),  -- الحد الأدنى للطلب
  max_discount_amount NUMERIC(10,2),  -- الحد الأقصى للخصم
  
  -- نطاق التطبيق
  applies_to      VARCHAR(20) NOT NULL DEFAULT 'all',
  -- all | specific_products | specific_categories | specific_customers | specific_regions
  
  -- التصفية (Arrays للمنتجات والتصنيفات)
  product_ids     UUID[] DEFAULT '{}',
  category_ids    UUID[] DEFAULT '{}',
  customer_ids    UUID[] DEFAULT '{}',
  region_ids      UUID[] DEFAULT '{}',
  collection_ids  UUID[] DEFAULT '{}',
  
  -- وسيلة الدفع المطلوبة
  payment_method  VARCHAR(50),  -- mada | credit | stc_pay | apple_pay | null
  
  -- الوقت
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  -- أولوية التطبيق (عند وجود خصومات متعددة)
  priority        INTEGER NOT NULL DEFAULT 0,
  
  -- لا يمكن دمجه مع خصومات أخرى
  is_combinable   BOOLEAN NOT NULL DEFAULT false,
  
  -- بيانات إضافية
  metadata        JSONB DEFAULT '{}',
  
  --.timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. Indexes - الفهارس
-- ───────────────────────────────────────────────────────────────────────────────

-- Index for tenant lookup with active status
CREATE INDEX idx_discounts_tenant_active 
  ON discounts(tenant_id, is_active) 
  WHERE deleted_at IS NULL;

-- Index for code lookup (coupon validation)
CREATE INDEX idx_discounts_code 
  ON discounts(code) 
  WHERE code IS NOT NULL AND is_active = true AND deleted_at IS NULL;

-- Index for date range queries
CREATE INDEX idx_discounts_dates 
  ON discounts(starts_at, ends_at) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Index for discount type
CREATE INDEX idx_discounts_type 
  ON discounts(discount_type) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Index for applies_to
CREATE INDEX idx_discounts_applies_to 
  ON discounts(applies_to) 
  WHERE is_active = true AND deleted_at IS NULL;

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. Discount Usage Log - سجل استخدام الخصومات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discount_usage_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  discount_id     UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  
  -- معلومات الطلب
  order_id        UUID,
  order_amount    NUMERIC(10,2) NOT NULL,
  
  -- معلومات العميل
  customer_id     UUID,
  customer_email  VARCHAR(255),
  
  -- قيمة الخصم
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- الحالة
  status          VARCHAR(20) NOT NULL DEFAULT 'applied',
  -- applied | cancelled | refunded
  
  -- الوقت
  used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB DEFAULT '{}'
);

-- Indexes for usage log
CREATE INDEX idx_discount_usage_discount 
  ON discount_usage_logs(discount_id, used_at);

CREATE INDEX idx_discount_usage_order 
  ON discount_usage_logs(order_id);

CREATE INDEX idx_discount_usage_customer 
  ON discount_usage_logs(customer_id, used_at);

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. Customer Discount Usage - تتبع استخدام كل عميل للخصم
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_discount_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  discount_id     UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL,
  
  usage_count     INTEGER NOT NULL DEFAULT 0,
  last_used_at    TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(discount_id, customer_id)
);

CREATE INDEX idx_customer_discount_customer 
  ON customer_discount_usage(customer_id, discount_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. Comments - تعليقات على الجداول
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE discounts IS 'محرك الخصومات المتقدم - يدعم 6 أنواع من الخصومات';
COMMENT ON COLUMN discounts.discount_type IS 'percentage: نسبة مئوية, fixed_amount: قيمة ثابتة, free_shipping: شحن مجاني, buy_x_get_y: اشترِ X واحصل على Y, bundle: حزمة, tiered: متدرج';
COMMENT ON COLUMN discounts.applying_method IS 'automatic: تلقائي بدون كود, coupon_code: يحتاج كود كوبون';
COMMENT ON COLUMN discounts.applies_to IS 'all: الكل, specific_products: منتجات محددة, specific_categories: تصنيفات محددة, specific_customers: عملاء محددين, specific_regions: مناطق محددة';
COMMENT ON TABLE discount_usage_logs IS 'سجل استخدام الخصومات لتتبع كل عملية خصم';
COMMENT ON TABLE customer_discount_usage IS 'تتبع عدد مرات استخدام كل عميل لكل خصم';

-- ───────────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security (RLS) - أمان مستوى الصفوف
-- ───────────────────────────────────────────────────────────────────────────────

-- Enable RLS on discounts table
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_discount_usage ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for discounts
-- ───────────────────────────────────────────────────────────────────────────────

-- Policy: Tenant isolation - كل منشأة ترى فقط خصوماتها
CREATE POLICY discounts_tenant_isolation_policy ON discounts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Allow authenticated users to read active discounts
CREATE POLICY discounts_read_active_policy ON discounts
  FOR SELECT
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
    AND deleted_at IS NULL
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for discount_usage_logs
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY discount_usage_tenant_isolation_policy ON discount_usage_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for customer_discount_usage
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY customer_discount_tenant_isolation_policy ON customer_discount_usage
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ───────────────────────────────────────────────────────────────────────────────
-- 7. Trigger for updated_at
-- ───────────────────────────────────────────────────────────────────────────────

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for discounts table
CREATE TRIGGER update_discounts_updated_at_trigger
  BEFORE UPDATE ON discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Trigger for customer_discount_usage table
CREATE TRIGGER update_customer_discount_usage_updated_at_trigger
  BEFORE UPDATE ON customer_discount_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- 8. Sample Data - بيانات تجريبية (للتطوير فقط)
-- ───────────────────────────────────────────────────────────────────────────────

-- NOTE: Remove this section in production or run conditionally

-- Sample discount 1: Percentage discount with coupon code
INSERT INTO discounts (
  tenant_id,
  discount_type,
  applying_method,
  name_ar,
  name_en,
  description_ar,
  code,
  value,
  min_order_amount,
  max_uses,
  starts_at,
  ends_at,
  is_active,
  priority
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Will be replaced with actual tenant ID
  'percentage',
  'coupon_code',
  'خصم رمضان الكريم',
  'Ramadan Special Discount',
  'خصم 20% على جميع المنتجات',
  'RAMADAN20',
  20.00,
  100.00,
  1000,
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  1
);

-- Sample discount 2: Free shipping
INSERT INTO discounts (
  tenant_id,
  discount_type,
  applying_method,
  name_ar,
  name_en,
  description_ar,
  value,
  min_order_amount,
  is_active,
  priority
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'free_shipping',
  'automatic',
  'شحن مجاني',
  'Free Shipping',
  'شحن مجاني للطلبات فوق 200 ريال',
  0,
  200.00,
  true,
  0
);

-- Sample discount 3: Fixed amount discount
INSERT INTO discounts (
  tenant_id,
  discount_type,
  applying_method,
  name_ar,
  name_en,
  code,
  value,
  min_order_amount,
  max_discount_amount,
  is_active,
  priority
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'fixed_amount',
  'coupon_code',
  'خصم 50 ريال',
  '50 SAR Off',
  'SAVE50',
  50.00,
  300.00,
  50.00,
  true,
  2
);

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration 030
-- ───────────────────────────────────────────────────────────────────────────────
