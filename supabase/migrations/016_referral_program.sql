-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 016_referral_program.sql
-- Description: نظام الإحالات والتسويق
-- Created: 2026-03-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: referrals (الإحالات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- المستخدم الذي أحال
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- المستخدم المُحال (قد يكون NULL إذا لم يسجل بعد)
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- رمز الإحالة الفريد
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  
  -- حالة الإحالة
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | registered | converted | rewarded | expired
  
  -- المكافأة
  reward_amount NUMERIC(10, 2) DEFAULT 0,
  reward_type VARCHAR(50) DEFAULT 'credit',
  -- credit | discount | cash
  
  -- بيانات المُحال
  referred_email VARCHAR(255),
  referred_name VARCHAR(200),
  
  -- متى تم التحويل
  converted_at TIMESTAMPTZ,
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  -- مثال: {"source": "twitter", "campaign": "summer2025"}
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id, status);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_email ON referrals(referred_email);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: referral_rewards (سجل المكافآت)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف الإحالة
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  
  -- المستفيد من المكافأة
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- نوع المكافأة
  reward_type VARCHAR(50) NOT NULL,
  
  -- القيمة
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- الحالة
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | processed | paid | cancelled
  
  -- وصف
  description TEXT,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id, status);
CREATE INDEX idx_referral_rewards_referral ON referral_rewards(referral_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: referral_settings (إعدادات البرنامج)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- هل البرنامج مفعل؟
  is_active BOOLEAN DEFAULT true,
  
  -- مكافأة المُحيل
  referrer_reward_type VARCHAR(50) DEFAULT 'credit',
  referrer_reward_value NUMERIC(10, 2) DEFAULT 50,
  
  -- مكافأة المُحال
  referred_reward_type VARCHAR(50) DEFAULT 'discount',
  referred_reward_value NUMERIC(10, 2) DEFAULT 20,
  
  -- الحد الأدنى للتحويل
  min_conversion_amount NUMERIC(10, 2) DEFAULT 100,
  
  -- مدة صلاحية الإحالة (بالأيام)
  referral_expiry_days INTEGER DEFAULT 30,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE UNIQUE INDEX idx_referral_settings_tenant ON referral_settings(tenant_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدم يرى إحالاته فقط
CREATE POLICY referrals_user_select ON referrals
  FOR SELECT
  USING (
    is_super_admin()
    OR auth.uid() = referrer_user_id
    OR auth.uid() = referred_user_id
  );

CREATE POLICY referrals_user_insert ON referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_rewards_user_select ON referral_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_settings_select ON referral_settings
  FOR SELECT
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = referral_settings.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: إنشاء رمز إحالة فريد
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- إنشاء رمز من 8 أحرف
    code := UPPER(substring(md5(user_id::text || random()::text) from 1 for 8));
    
    -- التحقق من عدم وجوده
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: إنشاء رمز إحالة تلقائياً عند التسجيل
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_referral_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO referrals (referrer_user_id, referral_code, status)
  VALUES (
    NEW.id,
    generate_referral_code(NEW.id),
    'registered'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تشغيل trigger عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS trg_create_referral_on_signup ON auth.users;
CREATE TRIGGER trg_create_referral_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_on_signup();

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: تسجيل إحالة جديدة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION track_referral(
  p_referral_code TEXT,
  p_referred_email TEXT,
  p_referred_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_referral_id UUID;
  v_referrer_id UUID;
BEGIN
  -- جلب المعرف الأصلي
  SELECT referrer_user_id INTO v_referrer_id
  FROM referrals
  WHERE referral_code = p_referral_code
  AND status IN ('registered', 'pending');
  
  IF v_referrer_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- إنشاء الإحالة
  INSERT INTO referrals (
    referrer_user_id,
    referred_email,
    referred_name,
    referral_code,
    status
  ) VALUES (
    v_referrer_id,
    p_referred_email,
    p_referred_name,
    p_referral_code,
    'registered'
  ) RETURNING id INTO v_referral_id;
  
  RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: تحويل الإحالة إلى مكافأة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION convert_referral(
  p_referral_id UUID,
  p_referred_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_settings referral_settings%ROWTYPE;
BEGIN
  -- جلب بيانات الإحالة
  SELECT referrer_user_id INTO v_referrer_id
  FROM referrals
  WHERE id = p_referral_id;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- جلب الإعدادات
  SELECT * INTO v_settings
  FROM referral_settings
  WHERE is_active = true
  LIMIT 1;
  
  -- تحديث حالة الإحالة
  UPDATE referrals
  SET 
    status = 'converted',
    referred_user_id = p_referred_user_id,
    converted_at = NOW(),
    reward_amount = v_settings.referrer_reward_value
  WHERE id = p_referral_id;
  
  -- إنشاء مكافأة للمُحيل
  INSERT INTO referral_rewards (
    referral_id,
    user_id,
    reward_type,
    amount,
    description
  ) VALUES (
    p_referral_id,
    v_referrer_id,
    v_settings.referrer_reward_type,
    v_settings.referrer_reward_value,
    'مكافأة إحالة مستخدم جديد'
  );
  
  -- إنشاء مكافأة للمُحال
  INSERT INTO referral_rewards (
    referral_id,
    user_id,
    reward_type,
    amount,
    description
  ) VALUES (
    p_referral_id,
    p_referred_user_id,
    v_settings.referred_reward_type,
    v_settings.referred_reward_value,
    'مكافأة انضمام عبر إحالة'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE referrals IS 'نظام تتبع الإحالات والتسويق';
COMMENT ON TABLE referral_rewards IS 'سجل مكافآت الإحالات';
COMMENT ON TABLE referral_settings IS 'إعدادات برنامج الإحالات';

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
