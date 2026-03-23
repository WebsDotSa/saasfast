-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 002_rls_policies.sql
-- Description: تطبيق Row Level Security (RLS) على جميع الجداول
-- Created: 2025-03-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- ملاحظات مهمة
-- ───────────────────────────────────────────────────────────────────────────────
-- RLS يضمن أن كل منشأة (tenant) ترى بياناتها فقط
-- Super Admin يمكنه رؤية كل البيانات عبر role خاص
-- سياسات RLS تُطبّق على مستوى الصف وليس الجدول

-- ───────────────────────────────────────────────────────────────────────────────
-- Helper Functions
-- ───────────────────────────────────────────────────────────────────────────────

-- دالة للحصول على tenant_id من الطلب الحالي
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- نحاول الحصول على tenant_id من JWT claim
  tenant_id := NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
  
  -- إذا لم يوجد، نحاول من auth.jwt
  IF tenant_id IS NULL THEN
    BEGIN
      tenant_id := (auth.jwt() ->> 'tenant_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      tenant_id := NULL;
    END;
  END IF;
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق إذا كان المستخدم عضو في tenant
CREATE OR REPLACE FUNCTION is_tenant_member(tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_users.tenant_id = is_tenant_member.tenant_id
    AND tenant_users.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق إذا كان المستخدم super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'is_super_admin')::BOOLEAN = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION has_permission(permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_users.tenant_id = current_tenant_id()
    AND tenant_users.user_id = auth.uid()
    AND (
      permission = ANY(tenant_users.permissions::TEXT[])
      OR 
      -- الأدوار لها صلاحيات ضمنية
      CASE tenant_users.role
        WHEN 'owner' THEN TRUE
        WHEN 'admin' THEN TRUE
        ELSE FALSE
      END
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: tenants
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون فقط tenants التي هم أعضاء فيها
CREATE POLICY tenant_isolation_select ON tenants
  FOR SELECT
  USING (
    is_super_admin() 
    OR is_tenant_member(id)
  );

-- Policy: لا يمكن إنشاء tenant إلا عند التسجيل
CREATE POLICY tenant_insert ON tenants
  FOR INSERT
  WITH CHECK (TRUE);

-- Policy: فقط owner أو admin يمكنهم تحديث tenant
CREATE POLICY tenant_isolation_update ON tenants
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- Policy: لا يمكن حذف tenant (soft delete فقط عبر updated_at)
-- لا نسمح بـ DELETE مباشر

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: plans
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policy: الجميع يمكنه رؤية الخطط النشطة (للعرض العام)
CREATE POLICY plans_select ON plans
  FOR SELECT
  USING (
    is_active = TRUE 
    OR is_super_admin()
  );

-- Policy: فقط super admin يمكنه إدارة الخطط
CREATE POLICY plans_insert ON plans
  FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY plans_update ON plans
  FOR UPDATE
  USING (is_super_admin());

CREATE POLICY plans_delete ON plans
  FOR DELETE
  USING (is_super_admin());

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: subscriptions
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون اشتراكات tenant الخاصة بهم
CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: إنشاء اشتراك جديد
CREATE POLICY subscriptions_insert ON subscriptions
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: تحديث الاشتراك (للـ billing system)
CREATE POLICY subscriptions_update ON subscriptions
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = subscriptions.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: invoices
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون فواتير tenant الخاصة بهم
CREATE POLICY invoices_select ON invoices
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: إنشاء فاتورة (للـ billing system)
CREATE POLICY invoices_insert ON invoices
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = invoices.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- Policy: تحديث الفاتورة
CREATE POLICY invoices_update ON invoices
  FOR UPDATE
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: tenant_domains
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون نطاقات tenant الخاصة بهم
CREATE POLICY tenant_domains_select ON tenant_domains
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: إضافة نطاق جديد
CREATE POLICY tenant_domains_insert ON tenant_domains
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_domains.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- Policy: تحديث نطاق
CREATE POLICY tenant_domains_update ON tenant_domains
  FOR UPDATE
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: حذف نطاق
CREATE POLICY tenant_domains_delete ON tenant_domains
  FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_domains.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: tenant_users
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون أعضاء فريقهم
CREATE POLICY tenant_users_select ON tenant_users
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: إضافة عضو جديد (owner/admin فقط)
CREATE POLICY tenant_users_insert ON tenant_users
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Policy: تحديث عضو (owner/admin فقط)
CREATE POLICY tenant_users_update ON tenant_users
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Policy: حذف عضو (owner/admin فقط، ولا يمكن حذف owner)
CREATE POLICY tenant_users_delete ON tenant_users
  FOR DELETE
  USING (
    is_super_admin()
    OR (
      EXISTS (
        SELECT 1 FROM tenant_users tu
        WHERE tu.tenant_id = tenant_users.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role IN ('owner', 'admin')
      )
      AND tenant_users.role != 'owner'
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: invitations
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: رؤية الدعوات
CREATE POLICY invitations_select ON invitations
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
    OR (auth.uid() = invited_by)
  );

-- Policy: إنشاء دعوة
CREATE POLICY invitations_insert ON invitations
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = invitations.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- Policy: تحديث دعوة
CREATE POLICY invitations_update ON invitations
  FOR UPDATE
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
    OR (auth.uid() = invited_by)
  );

-- Policy: حذف دعوة
CREATE POLICY invitations_delete ON invitations
  FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = invitations.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: audit_logs
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: رؤية سجلات التدقيق
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: إنشاء سجل تدقيق (للنظام فقط)
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Policy: لا يمكن تحديث أو حذف سجلات التدقيق
-- (لا نسمح بـ UPDATE أو DELETE)

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: api_keys
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: رؤية مفاتيح API
CREATE POLICY api_keys_select ON api_keys
  FOR SELECT
  USING (
    is_super_admin()
    OR is_tenant_member(tenant_id)
  );

-- Policy: إنشاء مفتاح API
CREATE POLICY api_keys_insert ON api_keys
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = api_keys.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin', 'developer')
    )
  );

-- Policy: تحديث مفتاح API
CREATE POLICY api_keys_update ON api_keys
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = api_keys.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- Policy: حذف مفتاح API
CREATE POLICY api_keys_delete ON api_keys
  FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = api_keys.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ───────────────────────────────────────────────────────────────────────────────

-- Trigger: إنشاء tenant_user تلقائياً عند إنشاء tenant
CREATE OR REPLACE FUNCTION create_tenant_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_users (tenant_id, user_id, role, permissions, invitation_status, accepted_at)
  VALUES (NEW.id, auth.uid(), 'owner', '[]'::jsonb, 'accepted', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_tenant_owner
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_tenant_owner();

-- Trigger: تسجيل audit log عند إنشاء tenant
CREATE OR REPLACE FUNCTION log_tenant_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values)
  VALUES (NEW.id, auth.uid(), 'tenant.created', 'tenant', NEW.id, row_to_json(NEW)::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_tenant_creation
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION log_tenant_creation();

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes for Performance
-- ───────────────────────────────────────────────────────────────────────────────

-- Indexes محسّنة لـ RLS
CREATE INDEX IF NOT EXISTS idx_tenant_users_lookup 
  ON tenant_users(tenant_id, user_id, role);

CREATE INDEX IF NOT EXISTS idx_invitations_lookup 
  ON invitations(tenant_id, email, status);

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON FUNCTION current_tenant_id() IS 'الحصول على tenant_id من السياق الحالي';
COMMENT ON FUNCTION is_tenant_member(UUID) IS 'التحقق إذا كان المستخدم عضو في tenant';
COMMENT ON FUNCTION is_super_admin() IS 'التحقق إذا كان المستخدم super admin';
COMMENT ON FUNCTION has_permission(TEXT) IS 'التحقق من صلاحية معينة';

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
