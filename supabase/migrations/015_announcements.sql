-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 015_announcements.sql
-- Description: نظام الإعلانات والتحديثات
-- Created: 2026-03-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: announcements (الإعلانات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- العنوان والمحتوى
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  
  -- النوع
  type VARCHAR(30) DEFAULT 'info',
  -- info | update | alert | maintenance
  
  -- الأولوية (0-10)
  priority INTEGER DEFAULT 0,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  -- تاريخ الانتهاء (اختياري)
  show_until TIMESTAMPTZ,
  
  -- من أنشأ الإعلان
  created_by UUID REFERENCES auth.users(id),
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  -- مثال: {"link": "...", "button_text": "..."}
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_announcements_tenant_id ON announcements(tenant_id);
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_priority ON announcements(priority DESC);
CREATE INDEX idx_announcements_show_until ON announcements(show_until);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: user_announcements (متابعة القراءة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_announcements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

-- Index
CREATE INDEX idx_user_announcements_user ON user_announcements(user_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون إعلانات منشأتهم فقط
CREATE POLICY announcements_tenant_select ON announcements
  FOR SELECT
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = announcements.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

-- Policy: فقط owner/admin يمكنهم إنشاء الإعلانات
CREATE POLICY announcements_tenant_insert ON announcements
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = announcements.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Policy: فقط owner/admin يمكنهم تحديث الإعلانات
CREATE POLICY announcements_tenant_update ON announcements
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = announcements.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Policy: فقط owner/admin يمكنهم حذف الإعلانات
CREATE POLICY announcements_tenant_delete ON announcements
  FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = announcements.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- user_announcements policies
ALTER TABLE user_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_announcements_select ON user_announcements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_announcements_insert ON user_announcements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_announcements_delete ON user_announcements
  FOR DELETE
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: تحديث updated_at
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: تنظيف الإعلانات المنتهية
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION deactivate_expired_announcements()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE announcements
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE 
    is_active = true 
    AND show_until < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE announcements IS 'نظام الإعلانات والتحديثات للمنشأة';
COMMENT ON COLUMN announcements.type IS 'نوع الإعلان: info, update, alert, maintenance';
COMMENT ON COLUMN announcements.priority IS 'الأولوية: 0-10، الأعلى أهم';
COMMENT ON COLUMN announcements.show_until IS 'تاريخ الانتهاء التلقائي';
COMMENT ON TABLE user_announcements IS 'تتبع الإعلانات التي تم تجاهلها من قبل المستخدمين';

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
