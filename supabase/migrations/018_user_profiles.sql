-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 018_user_profiles.sql
-- Description: إنشاء جدول user_profiles لإدارة أدوار المستخدمين (Super Admin)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: user_profiles (ملفات تعريف المستخدمين)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- معرف المستخدم من auth.users
  user_id    UUID NOT NULL UNIQUE,
  -- REFERENCES auth.users(id) ON DELETE CASCADE

  -- الدور في النظام
  role       VARCHAR(50) NOT NULL DEFAULT 'user',
  -- 'user' | 'super_admin' | 'support'

  -- معلومات المستخدم (مزامنة من auth.users)
  email      VARCHAR(255),
  full_name  VARCHAR(255),
  avatar_url TEXT,
  bio        TEXT,

  -- إعدادات المستخدم
  preferences JSONB DEFAULT '{}'::jsonb,

  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى ملفه الشخصي فقط
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Super admin يرى الجميع (يستخدم service_role في الكود)
CREATE POLICY "user_profiles_select_service"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE user_profiles IS 'ملفات تعريف المستخدمين مع أدوارهم في النظام';
COMMENT ON COLUMN user_profiles.role IS 'دور المستخدم: user | super_admin | support';

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: إنشاء user_profile تلقائياً عند تسجيل مستخدم جديد
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
