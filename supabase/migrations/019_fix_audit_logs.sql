-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 019_fix_audit_logs.sql
-- Description: إصلاح جدول audit_logs — جعل tenant_id اختياري لأحداث النظام
-- ═══════════════════════════════════════════════════════════════════════════════

-- tenant_id يجب أن يكون nullable لأن أحداث مثل user.signed_in تحدث
-- قبل أن يكون للمستخدم منشأة (مثلاً عند تسجيل الدخول كـ super_admin)
ALTER TABLE audit_logs
  ALTER COLUMN tenant_id DROP NOT NULL;

-- إضافة عمود action_category لتصنيف الأحداث
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS action_category VARCHAR(50)
    GENERATED ALWAYS AS (split_part(action, '.', 1)) STORED;

CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(action_category);

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
