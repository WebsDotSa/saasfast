-- ═══════════════════════════════════════════════════════════════════════════════
-- GDPR & Data Protection Tables
-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 011_gdpr_tables.sql
-- 
-- الجداول:
-- 1. consent_records - سجل موافقات المستخدمين
-- 2. data_export_requests - سجل طلبات تصدير البيانات
--
-- يتوافق مع GDPR (General Data Protection Regulation)
-- ═══════════════════════════════════════════════════════════════════════════════

-- جدول سجل الموافقات
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  consent_type VARCHAR(100) NOT NULL, -- privacy_policy, marketing, analytics, etc.
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول طلبات تصدير/حذف البيانات
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) DEFAULT 'export', -- export, delete
  status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, failed, deleted
  export_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Indexes للاستعلامات السريعة
CREATE INDEX idx_consent_records_user ON consent_records(user_id, created_at DESC);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type, granted);
CREATE INDEX idx_data_export_requests_user ON data_export_requests(user_id, created_at DESC);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status, created_at);

-- RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Policy: كل user يرى موافقاته فقط
CREATE POLICY consent_records_user_isolation ON consent_records
  FOR ALL USING (user_id = auth.uid());

-- Policy: كل user يرى طلباته فقط
CREATE POLICY data_export_requests_user_isolation ON data_export_requests
  FOR ALL USING (user_id = auth.uid());

-- Policy: Service role يمكنه كل شيء (لـ Admin operations)
CREATE POLICY consent_records_service_role ON consent_records
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY data_export_requests_service_role ON data_export_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ───────────────────────────────────────────────────────────────────────────────
-- دالة مساعدة لتسجيل الموافقة
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_consent(
  p_consent_type VARCHAR,
  p_granted BOOLEAN,
  p_tenant_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_consent_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO consent_records (
    user_id,
    consent_type,
    granted,
    tenant_id,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    v_user_id,
    p_consent_type,
    p_granted,
    p_tenant_id,
    NULL, -- سيتم تعبئتها من التطبيق
    NULL, -- سيتم تعبئتها من التطبيق
    NOW()
  ) RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- دالة لحذف بيانات المستخدم (Soft Delete)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION soft_delete_user_data(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tenant_ids UUID[];
BEGIN
  -- الحصول على جميع tenants
  SELECT ARRAY_AGG(tenant_id) INTO v_tenant_ids
  FROM tenant_users
  WHERE user_id = p_user_id;

  -- تحديث حالة tenants إلى deleted
  UPDATE tenants
  SET 
    status = 'deleted',
    updated_at = NOW()
  WHERE id = ANY(v_tenant_ids);

  -- حذف العضوية
  DELETE FROM tenant_users WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- تعليقات توضيحية
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE consent_records IS 'سجل موافقات المستخدمين على سياسات الخصوصية - متوافق مع GDPR';
COMMENT ON COLUMN consent_records.consent_type IS 'نوع الموافقة: privacy_policy, marketing_emails, analytics, cookies, etc.';
COMMENT ON COLUMN consent_records.granted IS 'true = موافق، false = سحب الموافقة';
COMMENT ON COLUMN consent_records.ip_address IS 'عنوان IP وقت الموافقة للتدقيق';
COMMENT ON COLUMN consent_records.user_agent IS 'معلومات المتصفح وقت الموافقة';

COMMENT ON TABLE data_export_requests IS 'سجل طلبات تصدير وحذف بيانات المستخدمين - متوافق مع GDPR Article 15 & 17';
COMMENT ON COLUMN data_export_requests.request_type IS 'نوع الطلب: export (تصدير), delete (حذف)';
COMMENT ON COLUMN data_export_requests.status IS 'حالة الطلب: pending, processing, completed, failed, deleted';
COMMENT ON COLUMN data_export_requests.export_data IS 'البيانات المصدرة بصيغة JSON';
