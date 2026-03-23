-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 014_team_management.sql
-- Description: تحسين نظام إدارة الفريق والدعوات
-- Created: 2026-03-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: team_invitations (دعوات الفريق)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معرف المنشأة
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- البريد الإلكتروني للمدعو
  email VARCHAR(255) NOT NULL,
  
  -- الدور
  role member_role DEFAULT 'viewer',
  
  -- الصلاحيات المخصصة
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- من أرسل الدعوة
  invited_by UUID NOT NULL,
  -- REFERENCES auth.users(id)
  
  -- حالة الدعوة
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | accepted | declined | expired | cancelled
  
  -- رمز الدعوة (للقبول عبر البريد)
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  
  -- رسالة شخصية من الداعي
  message TEXT,
  
  -- تنتهي في
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  
  -- قُبلت في
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- عنوان IP للمدعو
  accepted_ip INET,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_tenant_id ON team_invitations(tenant_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email, status);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);
CREATE INDEX idx_team_invitations_created_at ON team_invitations(created_at DESC);

-- Constraint: بريد إلكتروني واحد لكل منشأة في نفس الحالة
CREATE UNIQUE INDEX idx_team_invitations_unique_pending 
  ON team_invitations(tenant_id, email) 
  WHERE status = 'pending';

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يرون دعوات المنشأة التي هم أعضاء فيها
CREATE POLICY team_invitations_tenant_access_select ON team_invitations
  FOR SELECT
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_invitations.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

-- Policy: يمكن إنشاء دعوة إذا كنت عضو في المنشأة
CREATE POLICY team_invitations_tenant_access_insert ON team_invitations
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_invitations.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Policy: يمكن تحديث الدعوة إذا كنت عضو في المنشأة
CREATE POLICY team_invitations_tenant_access_update ON team_invitations
  FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_invitations.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

-- Policy: يمكن حذف الدعوة إذا كنت عضو في المنشأة
CREATE POLICY team_invitations_tenant_access_delete ON team_invitations
  FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = team_invitations.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: تحديث updated_at
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: تنظيف الدعوات المنتهية تلقائياً
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    NEW.status := 'expired';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_invitation_expiry
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION expire_old_invitations();

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: قبول الدعوة وإنشاء عضوية
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION accept_invitation(p_token UUID, p_user_id UUID, p_ip INET DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_invitation team_invitations%ROWTYPE;
  v_member tenant_users%ROWTYPE;
BEGIN
  -- جلب الدعوة
  SELECT * INTO v_invitation
  FROM team_invitations
  WHERE token = p_token
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found or expired');
  END IF;
  
  -- التحقق من أن البريد الإلكتروني مطابق
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id
    AND email != v_invitation.email
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Email mismatch');
  END IF;
  
  -- إنشاء عضوية في tenant_users
  INSERT INTO tenant_users (tenant_id, user_id, role, permissions, invited_by, invitation_status, accepted_at)
  VALUES (
    v_invitation.tenant_id,
    p_user_id,
    v_invitation.role,
    v_invitation.permissions,
    v_invitation.invited_by,
    'accepted',
    NOW()
  )
  RETURNING * INTO v_member;
  
  -- تحديث حالة الدعوة
  UPDATE team_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_ip = p_ip,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN json_build_object(
    'success', true,
    'member', v_member,
    'tenant_id', v_invitation.tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: إلغاء الدعوات القديمة (للـ Cron Job)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cancel_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE team_invitations
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE team_invitations IS 'دعوات إضافة أعضاء جدد للمنشأة';
COMMENT ON COLUMN team_invitations.token IS 'رمز فريد لقبول الدعوة عبر البريد';
COMMENT ON COLUMN team_invitations.message IS 'رسالة شخصية من الداعي';
COMMENT ON COLUMN team_invitations.accepted_ip IS 'عنوان IP عند قبول الدعوة';

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
