-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 020_fix_announcements.sql
-- Description: إصلاح جدول announcements — جعل tenant_id اختياري للإعلانات العامة
-- ═══════════════════════════════════════════════════════════════════════════════

-- tenant_id اختياري → الإعلانات بدون tenant_id هي إعلانات عامة من المنصة
ALTER TABLE announcements
  ALTER COLUMN tenant_id DROP NOT NULL;

-- إضافة عمود is_global لتمييز الإعلانات العامة عن إعلانات المنشأة
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- تحديث السياسات لتشمل الإعلانات العامة
DROP POLICY IF EXISTS announcements_tenant_select ON announcements;

CREATE POLICY announcements_tenant_select ON announcements
  FOR SELECT
  USING (
    is_global = true
    OR is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = announcements.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
