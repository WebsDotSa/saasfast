-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 032: Loyalty Program Module
-- ═══════════════════════════════════════════════════════════════════════════════
-- نظام ولاء العملاء - نقاط، مستويات، ومكافآت
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. Loyalty Programs Table - برامج الولاء
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL,
  
  -- المعلومات الأساسية
  name_ar          VARCHAR(200) NOT NULL,
  name_en          VARCHAR(200),
  description_ar   TEXT,
  description_en   TEXT,
  
  -- إعدادات النقاط
  points_per_sar   NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  -- كم نقطة يحصل عليها العميل لكل ريال
  
  sar_per_point    NUMERIC(10,4) NOT NULL DEFAULT 0.05,
  -- قيمة النقطة بالريال عند الاسترداد
  
  min_points_to_redeem INTEGER NOT NULL DEFAULT 100,
  -- أقل عدد نقاط يمكن استردادها
  
  -- النقاط الأسية
  points_expiry_months INTEGER,
  -- عدد الأشهر بعد ذلك تنتهي النقاط (NULL = لا تنتهي)
  
  -- المستويات (JSON)
  tiers_enabled    BOOLEAN NOT NULL DEFAULT true,
  tiers_config     JSONB DEFAULT '[]',
  /*
   [
     {
       "id": "bronze",
       "name_ar": "برونزي",
       "name_en": "Bronze",
       "icon": "🥉",
       "min_points": 0,
       "min_spent": 0,
       "points_multiplier": 1.0,
       "benefits": ["نقطة واحدة لكل ريال"],
       "color": "#cd7f32"
     },
     {
       "id": "silver",
       "name_ar": "فضي",
       "name_en": "Silver",
       "icon": "🥈",
       "min_points": 500,
       "min_spent": 500,
       "points_multiplier": 1.25,
       "benefits": ["1.25 نقطة لكل ريال", "خصم 5% إضافي"],
       "color": "#c0c0c0"
     },
     {
       "id": "gold",
       "name_ar": "ذهبي",
       "name_en": "Gold",
       "icon": "🥇",
       "min_points": 2000,
       "min_spent": 2000,
       "points_multiplier": 1.5,
       "benefits": ["1.5 نقطة لكل ريال", "خصم 10% إضافي", "شحن مجاني"],
       "color": "#ffd700"
     },
     {
       "id": "platinum",
       "name_ar": "بلاتيني",
       "name_en": "Platinum",
       "icon": "💎",
       "min_points": 5000,
       "min_spent": 5000,
       "points_multiplier": 2.0,
       "benefits": ["2 نقطة لكل ريال", "خصم 15% إضافي", "شحن مجاني", "دعم VIP"],
       "color": "#e5e4e2"
     }
   ]
  */
  
  -- المكافآت
  rewards_enabled  BOOLEAN NOT NULL DEFAULT true,
  rewards_config   JSONB DEFAULT '[]',
  /*
   [
     {
       "id": "reward_1",
       "name_ar": "خصم 10 ريال",
       "name_en": "10 SAR Discount",
       "points_cost": 200,
       "type": "discount",
       "value": 10,
       "description_ar": "خصم 10 ريال على طلبك القادم",
       "min_order_amount": 100,
       "expiry_days": 30
     }
   ]
  */
  
  -- الحالة
  is_active        BOOLEAN NOT NULL DEFAULT true,
  
  -- إحصائيات
  total_members    INTEGER DEFAULT 0,
  total_points_issued INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  
  -- timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_points_per_sar CHECK (points_per_sar > 0),
  CONSTRAINT valid_sar_per_point CHECK (sar_per_point >= 0)
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. Loyalty Accounts Table - حسابات ولاء العملاء
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL,
  customer_id      UUID NOT NULL,
  
  -- معلومات العميل
  customer_email   VARCHAR(255),
  customer_name    VARCHAR(200),
  customer_phone   VARCHAR(20),
  
  -- الرصيد
  current_balance  INTEGER NOT NULL DEFAULT 0,
  lifetime_earned  INTEGER NOT NULL DEFAULT 0,
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
  lifetime_expired INTEGER NOT NULL DEFAULT 0,
  
  -- المستوى الحالي
  current_tier     VARCHAR(50) NOT NULL DEFAULT 'bronze',
  tier_updated_at  TIMESTAMPTZ,
  
  -- المستوى التالي
  next_tier        VARCHAR(50),
  points_to_next_tier INTEGER,
  
  -- تاريخ الانتهاء
  points_expiring_at TIMESTAMPTZ,
  points_expiring_amount INTEGER DEFAULT 0,
  
  -- الحالة
  status           VARCHAR(20) NOT NULL DEFAULT 'active',
  -- active | suspended | closed
  
  -- تفضيلات
  notify_on_earn   BOOLEAN DEFAULT true,
  notify_on_redeem BOOLEAN DEFAULT true,
  notify_on_tier   BOOLEAN DEFAULT true,
  notify_on_expiry BOOLEAN DEFAULT true,
  
  -- بيانات إضافية
  metadata         JSONB DEFAULT '{}',
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT unique_tenant_customer UNIQUE(tenant_id, customer_id),
  CONSTRAINT valid_account_status CHECK (status IN ('active', 'suspended', 'closed'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. Loyalty Transactions Table - معاملات النقاط
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  account_id      UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  
  -- النوع
  type            VARCHAR(20) NOT NULL,
  -- earn: كسب | redeem: استرداد | expire: انتهاء | adjust: تعديل | refund: استرجاع
  
  -- القيمة
  points          INTEGER NOT NULL,
  -- موجب للكسب، سالب للاسترداد
  
  balance_after   INTEGER NOT NULL,
  -- الرصيد بعد المعاملة
  
  -- القيمة المالية (للاسترداد)
  monetary_value  NUMERIC(10,2),
  -- قيمة الخصم بالريال
  
  -- المرجع
  reference_type  VARCHAR(50),
  -- order: طلب | manual: يدوي | promotion: عرض | adjustment: تعديل | refund: استرجاع
  
  reference_id    UUID,
  -- معرف الطلب أو المعاملة المرجعية
  
  order_amount    NUMERIC(10,2),
  -- قيمة الطلب (للكسب)
  
  -- الوصف
  description     TEXT,
  notes           TEXT,
  
  -- انتهاء الصلاحية
  expires_at      TIMESTAMPTZ,
  
  -- الحالة
  status          VARCHAR(20) NOT NULL DEFAULT 'completed',
  -- pending | completed | cancelled | reversed
  
  -- بيانات إضافية
  metadata        JSONB DEFAULT '{}',
  /*
   {
     "order_number": "ORD-123",
     "tier_multiplier": 1.25,
     "base_points": 100,
     "bonus_points": 25,
     "reason": "Birthday bonus"
   }
  */
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (type IN ('earn', 'redeem', 'expire', 'adjust', 'refund')),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'cancelled', 'reversed'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. Loyalty Rewards Table - المكافآت المتاحة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  
  -- المعلومات
  name_ar         VARCHAR(200) NOT NULL,
  name_en         VARCHAR(200),
  description_ar  TEXT,
  description_en  TEXT,
  
  -- النوع
  reward_type     VARCHAR(30) NOT NULL,
  -- discount: خصم | free_shipping: شحن مجاني | product: منتج مجاني | gift_card: بطاقة هدية
  
  -- التكلفة
  points_cost     INTEGER NOT NULL,
  
  -- القيمة
  discount_type   VARCHAR(20),
  -- percentage | fixed
  discount_value  NUMERIC(10,2),
  
  -- الشروط
  min_order_amount NUMERIC(10,2),
  max_discount_amount NUMERIC(10,2),
  applicable_products UUID[],
  applicable_categories UUID[],
  
  -- الصلاحية
  validity_days   INTEGER DEFAULT 30,
  -- عدد أيام صلاحية المكافأة بعد الاسترداد
  
  -- الحدود
  total_quantity  INTEGER,
  -- العدد الإجمالي (NULL = غير محدود)
  redeemed_count  INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  -- حد الاسترداد لكل عميل
  
  -- الحالة
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  -- الترتيب
  sort_order      INTEGER DEFAULT 0,
  
  -- صورة
  image_url       TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_reward_type CHECK (reward_type IN ('discount', 'free_shipping', 'product', 'gift_card'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. Loyalty Redemptions Table - استردادات المكافآت
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  account_id      UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  reward_id       UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  
  -- العميل
  customer_id     UUID NOT NULL,
  customer_email  VARCHAR(255),
  
  -- النقاط
  points_used     INTEGER NOT NULL,
  
  -- المكافأة
  reward_code     VARCHAR(100) UNIQUE,
  -- كود المكافأة المولد
  
  discount_code   VARCHAR(50),
  -- كود الخصم (إذا كان خصم)
  
  -- الحالة
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  -- active | used | expired | cancelled
  
  -- الاستخدام
  used_at         TIMESTAMPTZ,
  used_order_id   UUID,
  -- معرف الطلب الذي استخدمت فيه المكافأة
  
  -- الانتهاء
  expires_at      TIMESTAMPTZ NOT NULL,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_redemption_status CHECK (status IN ('active', 'used', 'expired', 'cancelled'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 6. Tier History Table - سجل تغييرات المستويات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loyalty_tier_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  account_id      UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  
  -- المستويات
  from_tier       VARCHAR(50),
  to_tier         VARCHAR(50) NOT NULL,
  
  -- السبب
  reason          VARCHAR(50),
  -- points_threshold: تجاوز حد النقاط | spent_threshold: تجاوز حد الإنفاق | manual: يدوي
  
  reason_details  TEXT,
  
  -- النقاط وقت التغيير
  points_at_change INTEGER,
  lifetime_spent_at_change NUMERIC(10,2),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 7. Indexes - الفهارس
-- ───────────────────────────────────────────────────────────────────────────────

-- Programs index
CREATE INDEX idx_loyalty_programs_tenant 
  ON loyalty_programs(tenant_id) 
  WHERE is_active = true;

-- Accounts indexes
CREATE INDEX idx_loyalty_accounts_tenant_customer 
  ON loyalty_accounts(tenant_id, customer_id);

CREATE INDEX idx_loyalty_accounts_status 
  ON loyalty_accounts(status);

CREATE INDEX idx_loyalty_accounts_tier 
  ON loyalty_accounts(current_tier);

-- Transactions indexes
CREATE INDEX idx_loyalty_transactions_account 
  ON loyalty_transactions(account_id, created_at);

CREATE INDEX idx_loyalty_transactions_type 
  ON loyalty_transactions(type, created_at);

CREATE INDEX idx_loyalty_transactions_reference 
  ON loyalty_transactions(reference_type, reference_id);

-- Redemptions indexes
CREATE INDEX idx_loyalty_redemptions_account 
  ON loyalty_redemptions(account_id, status);

CREATE INDEX idx_loyalty_redemptions_code 
  ON loyalty_redemptions(discount_code) 
  WHERE status = 'active';

-- Tier history index
CREATE INDEX idx_tier_history_account 
  ON loyalty_tier_history(account_id, created_at);

-- ───────────────────────────────────────────────────────────────────────────────
-- 8. Comments - التعليقات
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE loyalty_programs IS 'إعدادات برنامج الولاء - نقاط، مستويات، مكافآت';
COMMENT ON COLUMN loyalty_programs.points_per_sar IS 'عدد النقاط المكتسبة لكل ريال سعودي';
COMMENT ON COLUMN loyalty_programs.sar_per_point IS 'قيمة النقطة بالريال عند الاسترداد';
COMMENT ON TABLE loyalty_accounts IS 'حساب ولاء كل عميل - الرصيد والمستوى';
COMMENT ON TABLE loyalty_transactions IS 'سجل جميع معاملات النقاط (كسب، استرداد، انتهاء)';
COMMENT ON TABLE loyalty_rewards IS 'المكافآت المتاحة للاسترداد';
COMMENT ON TABLE loyalty_redemptions IS 'المكافآت المستردة وكود الاستخدام';
COMMENT ON TABLE loyalty_tier_history IS 'سجل تغييرات مستويات العملاء';

-- ───────────────────────────────────────────────────────────────────────────────
-- 9. Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tier_history ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY loyalty_programs_tenant_policy ON loyalty_programs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY loyalty_accounts_tenant_policy ON loyalty_accounts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY loyalty_transactions_tenant_policy ON loyalty_transactions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY loyalty_rewards_tenant_policy ON loyalty_rewards
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY loyalty_redemptions_tenant_policy ON loyalty_redemptions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY loyalty_tier_history_tenant_policy ON loyalty_tier_history
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ───────────────────────────────────────────────────────────────────────────────
-- 10. Triggers
-- ───────────────────────────────────────────────────────────────────────────────

-- Update updated_at for loyalty_programs
CREATE TRIGGER update_loyalty_programs_updated_at_trigger
  BEFORE UPDATE ON loyalty_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Update updated_at for loyalty_accounts
CREATE TRIGGER update_loyalty_accounts_updated_at_trigger
  BEFORE UPDATE ON loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Update updated_at for loyalty_rewards
CREATE TRIGGER update_loyalty_rewards_updated_at_trigger
  BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- 11. Functions - الدوال
-- ───────────────────────────────────────────────────────────────────────────────

-- Function: Get or create loyalty account
CREATE OR REPLACE FUNCTION get_or_create_loyalty_account(
  p_tenant_id UUID,
  p_customer_id UUID,
  p_customer_email VARCHAR DEFAULT NULL,
  p_customer_name VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  account_id UUID,
  current_balance INTEGER,
  current_tier VARCHAR,
  lifetime_earned INTEGER
) AS $$
DECLARE
  v_account_id UUID;
BEGIN
  -- Try to find existing account
  SELECT id INTO v_account_id
  FROM loyalty_accounts
  WHERE tenant_id = p_tenant_id AND customer_id = p_customer_id;
  
  -- Create if not exists
  IF v_account_id IS NULL THEN
    INSERT INTO loyalty_accounts (
      tenant_id,
      customer_id,
      customer_email,
      customer_name,
      current_balance,
      lifetime_earned,
      lifetime_redeemed,
      lifetime_expired,
      current_tier
    ) VALUES (
      p_tenant_id,
      p_customer_id,
      p_customer_email,
      p_customer_name,
      0,
      0,
      0,
      0,
      'bronze'
    )
    RETURNING id INTO v_account_id;
  END IF;
  
  -- Return account info
  RETURN QUERY
  SELECT 
    la.id,
    la.current_balance,
    la.current_tier,
    la.lifetime_earned
  FROM loyalty_accounts la
  WHERE la.id = v_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate tier based on points/spending
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(
  p_tenant_id UUID,
  p_lifetime_points INTEGER,
  p_lifetime_spent NUMERIC
)
RETURNS VARCHAR AS $$
DECLARE
  v_tiers JSONB;
  v_tier JSONB;
  v_result_tier VARCHAR := 'bronze';
BEGIN
  -- Get tiers config
  SELECT tiers_config INTO v_tiers
  FROM loyalty_programs
  WHERE tenant_id = p_tenant_id AND is_active = true
  LIMIT 1;
  
  IF v_tiers IS NULL OR v_tiers = '[]' THEN
    RETURN 'bronze';
  END IF;
  
  -- Iterate through tiers (sorted by min_points desc)
  FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers) ORDER BY (v_tier->>'min_points')::INTEGER DESC
  LOOP
    IF p_lifetime_points >= (v_tier->>'min_points')::INTEGER THEN
      v_result_tier := v_tier->>'id';
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_result_tier;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- 12. Sample Data - بيانات تجريبية
-- ───────────────────────────────────────────────────────────────────────────────

-- Sample loyalty program with tiers
INSERT INTO loyalty_programs (
  tenant_id,
  name_ar,
  name_en,
  description_ar,
  points_per_sar,
  sar_per_point,
  min_points_to_redeem,
  tiers_enabled,
  tiers_config,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'برنامج الولاء',
  'Loyalty Program',
  'اجمع النقاط واحصل على مكافآت حصرية',
  1.0,  -- 1 point per SAR
  0.05, -- 0.05 SAR per point (5% back)
  100,  -- Min 100 points to redeem
  true,
  '[
    {
      "id": "bronze",
      "name_ar": "برونزي",
      "name_en": "Bronze",
      "icon": "🥉",
      "min_points": 0,
      "min_spent": 0,
      "points_multiplier": 1.0,
      "benefits": ["نقطة واحدة لكل ريال"],
      "color": "#cd7f32"
    },
    {
      "id": "silver",
      "name_ar": "فضي",
      "name_en": "Silver",
      "icon": "🥈",
      "min_points": 500,
      "min_spent": 500,
      "points_multiplier": 1.25,
      "benefits": ["1.25 نقطة لكل ريال", "خصم 5% إضافي", "دعم ذو أولوية"],
      "color": "#c0c0c0"
    },
    {
      "id": "gold",
      "name_ar": "ذهبي",
      "name_en": "Gold",
      "icon": "🥇",
      "min_points": 2000,
      "min_spent": 2000,
      "points_multiplier": 1.5,
      "benefits": ["1.5 نقطة لكل ريال", "خصم 10% إضافي", "شحن مجاني", "دعم VIP"],
      "color": "#ffd700"
    },
    {
      "id": "platinum",
      "name_ar": "بلاتيني",
      "name_en": "Platinum",
      "icon": "💎",
      "min_points": 5000,
      "min_spent": 5000,
      "points_multiplier": 2.0,
      "benefits": ["2 نقطة لكل ريال", "خصم 15% إضافي", "شحن مجاني", "دعم VIP 24/7", "عروض حصرية"],
      "color": "#e5e4e2"
    }
  ]'::jsonb,
  true
);

-- Sample rewards
INSERT INTO loyalty_rewards (
  tenant_id,
  name_ar,
  name_en,
  description_ar,
  reward_type,
  points_cost,
  discount_type,
  discount_value,
  min_order_amount,
  validity_days,
  is_active,
  sort_order
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'خصم 10 ريال',
  '10 SAR Discount',
  'خصم 10 ريال على طلبك القادم',
  'discount',
  200,
  'fixed',
  10.00,
  100.00,
  30,
  true,
  1
),
(
  '00000000-0000-0000-0000-000000000000',
  'خصم 25 ريال',
  '25 SAR Discount',
  'خصم 25 ريال على طلبك القادم',
  'discount',
  450,
  'fixed',
  25.00,
  200.00,
  30,
  true,
  2
),
(
  '00000000-0000-0000-0000-000000000000',
  'خصم 15%',
  '15% Discount',
  'خصم 15% على جميع المنتجات',
  'discount',
  600,
  'percentage',
  15.00,
  150.00,
  30,
  true,
  3
),
(
  '00000000-0000-0000-0000-000000000000',
  'شحن مجاني',
  'Free Shipping',
  'شحن مجاني لطلبك القادم',
  'free_shipping',
  150,
  NULL,
  NULL,
  50.00,
  30,
  true,
  4
);

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration 032
-- ───────────────────────────────────────────────────────────────────────────────
