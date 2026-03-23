-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix Tenant Creation Trigger
-- ═══════════════════════════════════════════════════════════════════════════════
-- هذا الملف يُصلح مشكلة إنشاء tenant_user تلقائياً عند إنشاء tenant
-- ═══════════════════════════════════════════════════════════════════════════════

-- حذف trigger القديم
DROP TRIGGER IF EXISTS trigger_create_tenant_owner ON tenants;

-- حذف function القديمة
DROP FUNCTION IF EXISTS create_tenant_owner();

-- إنشاء function جديدة
CREATE OR REPLACE FUNCTION create_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- محاولة الحصول على user_id من email
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = NEW.email 
  LIMIT 1;
  
  -- إذا وجد user، أضفه كـ owner
  IF new_user_id IS NOT NULL THEN
    INSERT INTO tenant_users (tenant_id, user_id, role, permissions, invitation_status, accepted_at)
    VALUES (NEW.id, new_user_id, 'owner', '[]'::jsonb, 'accepted', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعادة إنشاء trigger
CREATE TRIGGER trigger_create_tenant_owner
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_owner();

-- تعليق للتوثيق
COMMENT ON FUNCTION create_tenant_owner() IS 'إنشاء tenant_user تلقائياً عند إنشاء tenant جديد';

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
