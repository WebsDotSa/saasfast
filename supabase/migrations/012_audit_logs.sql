-- ═══════════════════════════════════════════════════════════════════════════════
-- Audit Logs System
-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 012_audit_logs.sql
-- 
-- ملاحظة: audit_logs table قد تكون موجودة بالفعل في migration سابق
-- هذا الملف للتأكد من وجودindexes والـ RLS الصحيحة
-- ═══════════════════════════════════════════════════════════════════════════════

-- إنشاء الجدول إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للاستعلامات السريعة
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: كل tenant يرى logs الخاصة به فقط
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR tenant_id IS NULL
  );

-- Policy: Service role يمكنه كل شيء
DROP POLICY IF EXISTS audit_logs_service_role ON audit_logs;
CREATE POLICY audit_logs_service_role ON audit_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Admins يمكنهم القراءة
DROP POLICY IF EXISTS audit_logs_admin_read ON audit_logs;
CREATE POLICY audit_logs_admin_read ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = audit_logs.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- دالة مساعدة لتسجيل audit log
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- الحصول على tenant_id من المستخدم
  SELECT tenant_id INTO v_tenant_id
  FROM tenant_users
  WHERE user_id = v_user_id
  LIMIT 1;

  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_value,
    new_value,
    metadata,
    created_at
  ) VALUES (
    v_tenant_id,
    v_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_value,
    p_new_value,
    p_metadata,
    NOW()
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger لتسجيل التغييرات تلقائياً على جداول مهمة
-- ───────────────────────────────────────────────────────────────────────────────

-- مثال: Trigger على جدول tenants
CREATE OR REPLACE FUNCTION audit_tenants_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'tenant.create',
      'tenant',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'tenant.update',
      'tenant',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'tenant.delete',
      'tenant',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_tenants_trigger ON tenants;
CREATE TRIGGER audit_tenants_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION audit_tenants_changes();

-- ───────────────────────────────────────────────────────────────────────────────
-- تعليقات توضيحية
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE audit_logs IS 'سجل التدقيق الأمني - يسجل جميع العمليات الحساسة في النظام';
COMMENT ON COLUMN audit_logs.action IS 'نوع العملية: user.login, tenant.create, payment.success, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'نوع المورد المتأثر: tenant, subscription, invoice, etc.';
COMMENT ON COLUMN audit_logs.old_value IS 'القيم القديمة قبل التعديل (JSON)';
COMMENT ON COLUMN audit_logs.new_value IS 'القيم الجديدة بعد التعديل (JSON)';
