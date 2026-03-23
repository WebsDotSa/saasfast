-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 033: Affiliate Marketing Module
-- ═══════════════════════════════════════════════════════════════════════════════
-- نظام التسويق بالعمولة - مسوقين، إحالات، وعمولات
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. Affiliates Table - المسوقين بالعمولة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  
  -- المعلومات الشخصية
  user_id         UUID,  -- ربط بحساب المستخدم (إن وجد)
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  
  -- معلومات الدفع
  company_name    VARCHAR(200),
  tax_number      VARCHAR(50),
  country         VARCHAR(100) DEFAULT 'SA',
  
  -- كود الإحالة
  referral_code   VARCHAR(50) NOT NULL,
  referral_link   TEXT,
  -- الرابط الكامل: https://store.com/?ref=CODE
  
  -- العمولة
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  -- نسبة العمولة المئوية
  
  commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  -- percentage: نسبة | fixed: قيمة ثابتة | tiered: متدرجة
  
  commission_value NUMERIC(10,2),
  -- القيمة الثابتة (لـ fixed)
  
  -- العمولات المتدرجة (JSON)
  tiered_commission JSONB DEFAULT '[]',
  /*
   [
     {"min_sales": 0, "max_sales": 10, "rate": 10},
     {"min_sales": 11, "max_sales": 50, "rate": 12},
     {"min_sales": 51, "max_sales": null, "rate": 15}
   ]
  */
  
  -- حالة الموافقة
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: بانتظار الموافقة | active: نشط | suspended: معلق | rejected: مرفوض | banned: محظور
  
  -- الإحصائيات
  total_clicks    INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_sales     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid      NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_payout  NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- طريقة الدفع
  payout_method   VARCHAR(50),
  -- bank_transfer: تحويل بنكي | paypal | paypal | credit: رصيد | crypto: عملة رقمية
  
  payout_details  JSONB DEFAULT '{}',
  /*
   {
     "bank_name": "Al Rajhi Bank",
     "account_holder": "Ahmed Mohammed",
     "iban": "SA00000000000000000000",
     "swift": "RJHISARI"
   }
  */
  
  -- الحد الأدنى للدفع
  min_payout_amount NUMERIC(10,2) DEFAULT 100.00,
  
  -- ملاحظات
  admin_notes     TEXT,
  rejection_reason TEXT,
  
  -- بيانات إضافية
  metadata        JSONB DEFAULT '{}',
  
  -- التواريخ
  approved_at     TIMESTAMPTZ,
  approved_by     UUID,
  last_payout_at  TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  
  -- قيود
  CONSTRAINT valid_commission_type CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  CONSTRAINT valid_affiliate_status CHECK (status IN ('pending', 'active', 'suspended', 'rejected', 'banned')),
  CONSTRAINT valid_payout_method CHECK (payout_method IS NULL OR payout_method IN ('bank_transfer', 'paypal', 'credit', 'crypto'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. Affiliate Clicks Table - نقرات الإحالة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- الزائر
  visitor_id      VARCHAR(100),
  -- معرف فريد للزائر (cookie fingerprint)
  
  ip_address      INET,
  user_agent      TEXT,
  
  -- الجهاز والمتصفح
  device_type     VARCHAR(50),
  -- mobile | desktop | tablet
  
  browser         VARCHAR(100),
  os              VARCHAR(100),
  
  -- الموقع
  country         VARCHAR(100),
  region          VARCHAR(100),
  city            VARCHAR(100),
  
  -- الرابط
  landing_url     TEXT,
  referring_url   TEXT,
  -- من أين جاء الزائر
  
  -- الحملة (UTM parameters)
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(200),
  utm_content     VARCHAR(200),
  utm_term        VARCHAR(200),
  
  -- التحويل
  converted       BOOLEAN NOT NULL DEFAULT false,
  conversion_id   UUID,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  metadata        JSONB DEFAULT '{}'
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. Affiliate Conversions Table - تحويلات الإحالة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- معلومات الطلب
  order_id        UUID NOT NULL,
  order_amount    NUMERIC(10,2) NOT NULL,
  
  -- العميل المحال
  customer_id     UUID,
  customer_email  VARCHAR(255),
  
  -- العمولة
  commission_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2),
  -- النسبة المطبقة
  
  -- الحالة
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: بانتظار الموافقة | approved: موافق | paid: مدفوع | rejected: مرفوض | refunded: مسترجع
  
  -- التواريخ
  clicked_at      TIMESTAMPTZ,
  -- متى نقر على الرابط
  
  converted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- متى تم الشراء
  
  approved_at     TIMESTAMPTZ,
  approved_by     UUID,
  
  paid_at         TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  -- رقم الحوالة أو المعاملة
  
  rejected_at     TIMESTAMPTZ,
  rejected_by     UUID,
  rejection_reason TEXT,
  
  refunded_at     TIMESTAMPTZ,
  -- متى تم استرجاع العمولة (لأن الطلب تم استرجاعه)
  
  -- بيانات إضافية
  metadata        JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_conversion_status CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'refunded'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. Affiliate Payouts Table - مدفوعات العمولات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- المبلغ
  amount          NUMERIC(10,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'SAR',
  
  -- الفترة
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  
  -- عدد التحويلات
  conversions_count INTEGER NOT NULL DEFAULT 0,
  
  -- حالة الدفع
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: بانتظار | processing: قيد المعالجة | completed: مكتمل | failed: فشل | cancelled: ملغى
  
  -- طريقة الدفع
  payout_method   VARCHAR(50) NOT NULL,
  
  -- تفاصيل الدفع
  payment_reference VARCHAR(100),
  -- رقم الحوالة / معرف PayPal
  
  payment_proof   TEXT,
  -- رابط صورة الإيصال
  
  bank_details    JSONB,
  -- نسخة من بيانات البنك وقت الدفع
  
  -- ملاحظات
  notes           TEXT,
  admin_notes     TEXT,
  
  -- التواريخ
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  processed_by    UUID,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. Affiliate Tier History Table - سجل تغييرات مستويات العمولة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_tier_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- المستويات
  from_rate       NUMERIC(5,2),
  to_rate         NUMERIC(5,2) NOT NULL,
  
  -- السبب
  reason          VARCHAR(50),
  -- sales_threshold: تجاوز حد المبيعات | manual: يدوي | promotion: ترقية
  
  reason_details  TEXT,
  
  -- الإحصائيات وقت التغيير
  total_sales_at_change NUMERIC(12,2),
  total_conversions_at_change INTEGER,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 6. Affiliate Banners Table - بانرات إعلانية للمسوقين
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_banners (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  
  -- المعلومات
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  
  -- النوع
  banner_type     VARCHAR(50),
  -- image: صورة | text: نصي | link: رابط
  
  -- المحتوى
  image_url       TEXT,
  text_content    TEXT,
  link_url        TEXT,
  
  -- الأبعاد
  width           INTEGER,
  height          INTEGER,
  
  -- الحالة
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  -- الإحصائيات
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 7. Indexes - الفهارس
-- ───────────────────────────────────────────────────────────────────────────────

-- Affiliates indexes
CREATE INDEX idx_affiliates_tenant_status 
  ON affiliates(tenant_id, status) 
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_affiliates_referral_code 
  ON affiliates(tenant_id, referral_code) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_affiliates_email 
  ON affiliates(tenant_id, email);

-- Clicks indexes
CREATE INDEX idx_affiliate_clicks_affiliate 
  ON affiliate_clicks(affiliate_id, created_at);

CREATE INDEX idx_affiliate_clicks_visitor 
  ON affiliate_clicks(visitor_id, created_at);

CREATE INDEX idx_affiliate_clicks_ip 
  ON affiliate_clicks(ip_address, created_at);

-- Conversions indexes
CREATE INDEX idx_affiliate_conversions_affiliate 
  ON affiliate_conversions(affiliate_id, status);

CREATE INDEX idx_affiliate_conversions_order 
  ON affiliate_conversions(order_id);

CREATE INDEX idx_affiliate_conversions_status 
  ON affiliate_conversions(status, created_at);

-- Payouts indexes
CREATE INDEX idx_affiliate_payouts_affiliate 
  ON affiliate_payouts(affiliate_id, status);

CREATE INDEX idx_affiliate_payouts_status 
  ON affiliate_payouts(status, created_at);

-- ───────────────────────────────────────────────────────────────────────────────
-- 8. Comments - التعليقات
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE affiliates IS 'جدول المسوقين بالعمولة - معلوماتهم وعمولاتهم';
COMMENT ON COLUMN affiliates.commission_type IS 'percentage: نسبة مئوية من البيع, fixed: قيمة ثابتة, tiered: مستويات متدرجة';
COMMENT ON COLUMN affiliates.status IS 'pending: بانتظار الموافقة, active: نشط, suspended: معلق, rejected: مرفوض, banned: محظور';
COMMENT ON TABLE affiliate_clicks IS 'تتبع نقرات روابط الإحالة';
COMMENT ON TABLE affiliate_conversions IS 'التحويلات (المبيعات) من الإحالات والعمولات المستحقة';
COMMENT ON TABLE affiliate_payouts IS 'مدفوعات العمولات للمسوقين';
COMMENT ON TABLE affiliate_tier_history IS 'سجل تغييرات مستويات عمولة المسوقين';
COMMENT ON TABLE affiliate_banners IS 'بانرات إعلانية جاهزة للمسوقين لاستخدامها';

-- ───────────────────────────────────────────────────────────────────────────────
-- 9. Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_banners ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY affiliates_tenant_isolation_policy ON affiliates
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY affiliate_clicks_tenant_isolation_policy ON affiliate_clicks
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY affiliate_conversions_tenant_isolation_policy ON affiliate_conversions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY affiliate_payouts_tenant_isolation_policy ON affiliate_payouts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY affiliate_tier_history_tenant_isolation_policy ON affiliate_tier_history
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY affiliate_banners_tenant_isolation_policy ON affiliate_banners
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ───────────────────────────────────────────────────────────────────────────────
-- 10. Triggers
-- ───────────────────────────────────────────────────────────────────────────────

-- Update updated_at for affiliates
CREATE TRIGGER update_affiliates_updated_at_trigger
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Update updated_at for affiliate_payouts
CREATE TRIGGER update_affiliate_payouts_updated_at_trigger
  BEFORE UPDATE ON affiliate_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Update updated_at for affiliate_banners
CREATE TRIGGER update_affiliate_banners_updated_at_trigger
  BEFORE UPDATE ON affiliate_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- 11. Functions - الدوال
-- ───────────────────────────────────────────────────────────────────────────────

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(
  p_name VARCHAR,
  p_tenant_id UUID
)
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(50);
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  -- Generate code from name + random string
  v_code := UPPER(SUBSTRING(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 6)) || 
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
  
  -- Check uniqueness
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM affiliates 
      WHERE tenant_id = p_tenant_id 
      AND referral_code = v_code
      AND deleted_at IS NULL
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists OR v_attempts > 10;
    
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
    v_attempts := v_attempts + 1;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate commission for conversion
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
  p_affiliate_id UUID,
  p_order_amount NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_affiliate affiliates%ROWTYPE;
  v_commission NUMERIC;
  v_tier JSONB;
BEGIN
  -- Get affiliate info
  SELECT * INTO v_affiliate
  FROM affiliates
  WHERE id = p_affiliate_id;
  
  IF v_affiliate IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate based on commission type
  IF v_affiliate.commission_type = 'percentage' THEN
    v_commission := p_order_amount * (v_affiliate.commission_rate / 100);
    
  ELSIF v_affiliate.commission_type = 'fixed' THEN
    v_commission := COALESCE(v_affiliate.commission_value, 0);
    
  ELSIF v_affiliate.commission_type = 'tiered' THEN
    -- Find applicable tier based on total sales
    FOR v_tier IN SELECT * FROM jsonb_array_elements(v_affiliate.tiered_commission)
    ORDER BY (v_tier->>'min_sales')::INTEGER
    LOOP
      IF v_affiliate.total_sales >= (v_tier->>'min_sales')::NUMERIC THEN
        IF (v_tier->>'max_sales') IS NULL OR 
           v_affiliate.total_sales <= (v_tier->>'max_sales')::NUMERIC THEN
          v_commission := p_order_amount * ((v_tier->>'rate')::NUMERIC / 100);
        END IF;
      END IF;
    END LOOP;
    
    -- Fallback to base rate if no tier matched
    IF v_commission IS NULL THEN
      v_commission := p_order_amount * (v_affiliate.commission_rate / 100);
    END IF;
  ELSE
    v_commission := 0;
  END IF;
  
  RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- 12. Sample Data - بيانات تجريبية
-- ───────────────────────────────────────────────────────────────────────────────

-- Sample affiliate
INSERT INTO affiliates (
  tenant_id,
  name,
  email,
  phone,
  referral_code,
  referral_link,
  commission_rate,
  commission_type,
  status,
  min_payout_amount,
  payout_method
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'أحمد محمد',
  'ahmed@example.com',
  '+966500000000',
  'AHMED2026',
  'https://store.saasfast.com/?ref=AHMED2026',
  10.00,
  'percentage',
  'active',
  100.00,
  'bank_transfer'
);

-- Sample affiliate banner
INSERT INTO affiliate_banners (
  tenant_id,
  name,
  description,
  banner_type,
  text_content,
  link_url,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'بانر نصي بسيط',
  'بانر إعلاني نصي للتسويق',
  'text',
  '🎉 تسوق الآن واحصل على أفضل العروض! تسوق الآن',
  'https://store.saasfast.com/?ref=AHMED2026',
  true
);

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration 033
-- ───────────────────────────────────────────────────────────────────────────────
