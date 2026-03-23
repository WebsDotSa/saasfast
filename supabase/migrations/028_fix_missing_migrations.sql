-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 028_fix_missing_migrations.sql
-- Description: إنشاء الجداول المفقودة بين 018-027
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- ملاحظة: هذا الملف يجمع الجداول المفقودة من migrations 019-026
-- ───────────────────────────────────────────────────────────────────────────────

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. إصلاح audit_logs (من 019)
-- ───────────────────────────────────────────────────────────────────────────────

-- التأكد من وجود عمود tenant_id في audit_logs
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- إضافة index لـ tenant_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant 
  ON audit_logs(tenant_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. user_profiles (من 018)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- المعلومات الشخصية
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  
  -- الصورة
  avatar_url TEXT,
  
  -- معلومات الاتصال
  phone VARCHAR(20),
  alternate_email VARCHAR(255),
  
  -- التفضيلات
  language VARCHAR(10) DEFAULT 'ar',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  theme VARCHAR(20) DEFAULT 'light',
  
  -- الإشعارات
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  
  -- معلومات إضافية
  bio TEXT,
  job_title VARCHAR(100),
  department VARCHAR(100),
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(alternate_email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_select ON user_profiles
  FOR SELECT
  USING (auth.uid() = id OR is_super_admin());

CREATE POLICY user_profiles_update ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id OR is_super_admin());

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. referral_program (من 016)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- المرسل
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  
  -- المستقبل
  referred_email VARCHAR(255) NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- حالة الإحالة
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | registered | activated | rewarded
  
  -- المكافأة
  reward_amount NUMERIC(10,2) DEFAULT 0,
  reward_status VARCHAR(30) DEFAULT 'pending',
  -- pending | credited | withdrawn
  
  -- تتبع
  referral_code VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code) 
  WHERE referral_code IS NOT NULL;

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_select ON referrals
  FOR SELECT
  USING (
    auth.uid() = referrer_id 
    OR auth.uid() = referred_user_id
    OR is_super_admin()
  );

CREATE POLICY referrals_insert ON referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id OR is_super_admin());

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. team_management (من 014)
-- ───────────────────────────────────────────────────────────────────────────────

-- جدول team_members (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  -- owner | admin | member | viewer
  
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | active | suspended | removed
  
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  
  permissions JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id),
  UNIQUE(tenant_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_select ON team_members
  FOR SELECT
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_members.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY team_members_insert ON team_members
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_members.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

CREATE POLICY team_members_update ON team_members
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_members.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

CREATE POLICY team_members_delete ON team_members
  FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_members.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. Helper Functions
-- ───────────────────────────────────────────────────────────────────────────────

-- دالة التحقق من super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'is_super_admin')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE user_profiles IS 'ملفات المستخدمين الشخصية';
COMMENT ON TABLE referrals IS 'نظام الإحالات والمكافآت';
COMMENT ON TABLE team_members IS 'أعضاء فريق المنشأة';

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
