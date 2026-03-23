-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 043_settlements.sql
-- Description: نظام التسويات والتحويلات البنكية - للإدارة فقط
-- Reference: Zid Pay-style settlement management
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Enums for settlements
-- ───────────────────────────────────────────────────────────────────────────────

-- حالة التسوية
CREATE TYPE IF NOT EXISTS settlement_status AS ENUM (
  'pending',      -- معلقة الموافقة
  'processing',   -- قيد المعالجة
  'transferred',  -- تم التحويل
  'failed',       -- فشلت
  'on_hold'       -- موقوفة
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: settlements
-- ═══════════════════════════════════════════════════════════════════════════════
-- التسويات والتحويلات البنكية - القلب المالي للإدارة
-- التاجر يطلب تحويل ← الإدارة تراجع وتحوّل ← التاجر يستلم إشعاراً
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settlements (
  -- Primary Key
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant ID
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- رقم التسوية (تسلسلي فريد)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  settlement_number VARCHAR(50) UNIQUE NOT NULL,  -- STL-202603-0001
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الحساب البنكي
  -- ═══════════════════════════════════════════════════════════════════════════
  
  bank_account_id   UUID REFERENCES merchant_bank_accounts(id),
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- المبالغ (Amounts)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  gross_amount      NUMERIC(12,2) NOT NULL,  -- إجمالي العمليات
  gateway_fees      NUMERIC(12,2) NOT NULL,  -- رسوم البوابة
  platform_fees     NUMERIC(12,2) NOT NULL,  -- عمولة المنصة
  net_amount        NUMERIC(12,2) NOT NULL,  -- صافي التحويل للتاجر
  currency          VARCHAR(3) DEFAULT 'SAR', -- العملة
  
  -- عدد العمليات في هذه الدفعة
  transaction_count INTEGER,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الفترة الزمنية للعمليات
  -- ═══════════════════════════════════════════════════════════════════════════
  
  period_start      TIMESTAMPTZ NOT NULL,  -- بداية الفترة
  period_end        TIMESTAMPTZ NOT NULL,  -- نهاية الفترة
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الحالة
  -- ═══════════════════════════════════════════════════════════════════════════
  
  status            VARCHAR(30) DEFAULT 'pending',
  -- pending | processing | transferred | failed | on_hold
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- التحويل البنكي
  -- ═══════════════════════════════════════════════════════════════════════════
  
  bank_reference    VARCHAR(100),  -- رقم التحويل البنكي
  transferred_at    TIMESTAMPTZ,   -- تاريخ التحويل
  transfer_note     TEXT,          -- ملاحظات التحويل
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الموافقة (من الإدارة)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  approved_by       UUID,          -- من وافق على التحويل (admin user ID)
  approved_at       TIMESTAMPTZ,   -- تاريخ الموافقة
  rejected_by       UUID,          -- من رفض (admin user ID)
  rejected_at       TIMESTAMPTZ,   -- تاريخ الرفض
  rejection_reason  TEXT,          -- سبب الرفض
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ملاحظات
  -- ═══════════════════════════════════════════════════════════════════════════
  
  notes             TEXT,          -- ملاحظات داخلية
  admin_notes       TEXT,          -- ملاحظات الإدارة
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Timestamps
  -- ═══════════════════════════════════════════════════════════════════════════
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes لـ settlements
-- ───────────────────────────────────────────────────────────────────────────────

-- Index للبحث حسب التاجر
CREATE INDEX IF NOT EXISTS idx_settlements_tenant 
  ON settlements(tenant_id, created_at DESC);

-- Index للبحث حسب الحالة
CREATE INDEX IF NOT EXISTS idx_settlements_status 
  ON settlements(status);

-- Index للتسويات المعلقة (للموافقة)
CREATE INDEX IF NOT EXISTS idx_settlements_pending 
  ON settlements(status, created_at ASC)
  WHERE status = 'pending';

-- Index للتسويات المحولة
CREATE INDEX IF NOT EXISTS idx_settlements_transferred 
  ON settlements(transferred_at DESC)
  WHERE status = 'transferred';

-- Index للبحث حسب رقم التسوية
CREATE UNIQUE INDEX IF NOT EXISTS idx_settlements_number 
  ON settlements(settlement_number);

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: توليد رقم تسلسلي لـ settlements
-- ═══════════════════════════════════════════════════════════════════════════════
-- التنسيق: STL-YYYYMM-0001 (STL-السنة والشهر-رقم تسلسلي)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_settlement_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year_month TEXT;
  v_sequence INTEGER;
  v_settlement_number TEXT;
BEGIN
  -- الحصول على السنة والشهر الحالي
  v_year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- الحصول على آخر تسلسل لهذا الشهر
  SELECT COALESCE(
    NULLIF(SUBSTRING(settlement_number FROM 'STL-\d{6}-(\d+)$')::INTEGER, 0),
    0
  ) + 1
  INTO v_sequence
  FROM settlements
  WHERE settlement_number LIKE 'STL-' || v_year_month || '-%'
  ORDER BY settlement_number DESC
  LIMIT 1;
  
  -- توليد الرقم الجديد
  v_settlement_number := 'STL-' || v_year_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  NEW.settlement_number := v_settlement_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_settlement_number
  BEFORE INSERT ON settlements
  FOR EACH ROW
  WHEN (NEW.settlement_number IS NULL)
  EXECUTE FUNCTION generate_settlement_number();

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: تحديث updated_at
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_settlements_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: إنشاء تسوية جديدة
-- ═══════════════════════════════════════════════════════════════════════════════
-- تُستدعى عند طلب التاجر للتحويل
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_settlement(
  p_tenant_id UUID,
  p_bank_account_id UUID,
  p_amount NUMERIC(12,2),
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_settlement_id UUID;
  v_gateway_fees NUMERIC(12,2);
  v_platform_fees NUMERIC(12,2);
  v_net_amount NUMERIC(12,2);
  v_period_start TIMESTAMPTZ;
  v_last_settled_at TIMESTAMPTZ;
BEGIN
  -- الحصول على تاريخ آخر تسوية
  SELECT MAX(period_end)
  INTO v_last_settled_at
  FROM settlements
  WHERE tenant_id = p_tenant_id
    AND status = 'transferred';
  
  -- إذا لم يوجد، نبدأ من بداية الشهر الحالي
  IF v_last_settled_at IS NULL THEN
    v_period_start := DATE_TRUNC('month', NOW());
  ELSE
    v_period_start := v_last_settled_at;
  END IF;
  
  -- حساب الرسوم (يمكن تعديلها حسب الخطة)
  v_gateway_fees := ROUND(p_amount * 0.015, 2);  -- 1.5%
  v_platform_fees := ROUND(p_amount * 0.01, 2);  -- 1%
  v_net_amount := p_amount - v_gateway_fees - v_platform_fees;
  
  -- إنشاء التسوية
  INSERT INTO settlements (
    tenant_id,
    bank_account_id,
    gross_amount,
    gateway_fees,
    platform_fees,
    net_amount,
    period_start,
    period_end,
    status,
    notes
  )
  VALUES (
    p_tenant_id,
    p_bank_account_id,
    p_amount,
    v_gateway_fees,
    v_platform_fees,
    v_net_amount,
    v_period_start,
    NOW(),
    'pending',
    p_notes
  )
  RETURNING id INTO v_settlement_id;
  
  RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: الموافقة على تسوية وتنفيذ التحويل
-- ═══════════════════════════════════════════════════════════════════════════════
-- تُستدعى من الإدارة للموافقة على التحويل
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION approve_settlement(
  p_settlement_id UUID,
  p_admin_user_id UUID,
  p_bank_reference TEXT,
  p_transfer_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settlement RECORD;
  v_success BOOLEAN;
BEGIN
  -- الحصول على معلومات التسوية
  SELECT *
  INTO v_settlement
  FROM settlements
  WHERE id = p_settlement_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- تحديث حالة التسوية
  UPDATE settlements
  SET 
    status = 'transferred',
    bank_reference = p_bank_reference,
    transferred_at = NOW(),
    transfer_note = p_transfer_note,
    approved_by = p_admin_user_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_settlement_id;
  
  -- تحديث رصيد التاجر
  UPDATE merchant_balances
  SET 
    available_balance = available_balance - v_settlement.net_amount,
    reserved_balance = reserved_balance - v_settlement.net_amount,
    total_withdrawn = total_withdrawn + v_settlement.net_amount,
    last_updated = NOW()
  WHERE tenant_id = v_settlement.tenant_id;
  
  -- ربط العمليات بالتسوية
  UPDATE store_transactions
  SET 
    settlement_id = p_settlement_id,
    settled_at = NOW()
  WHERE tenant_id = v_settlement.tenant_id
    AND status = 'success'
    AND settlement_id IS NULL
    AND created_at BETWEEN v_settlement.period_start AND v_settlement.period_end;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: رفض تسوية
-- ═══════════════════════════════════════════════════════════════════════════════
-- تُستدعى من الإدارة لرفض التحويل
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reject_settlement(
  p_settlement_id UUID,
  p_admin_user_id UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settlement RECORD;
BEGIN
  -- الحصول على معلومات التسوية
  SELECT *
  INTO v_settlement
  FROM settlements
  WHERE id = p_settlement_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- تحديث حالة التسوية
  UPDATE settlements
  SET 
    status = 'failed',
    rejected_by = p_admin_user_id,
    rejected_at = NOW(),
    rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_settlement_id;
  
  -- إطلاق الرصيد المحجوز
  UPDATE merchant_balances
  SET 
    reserved_balance = reserved_balance - v_settlement.net_amount,
    available_balance = available_balance + v_settlement.net_amount,
    last_updated = NOW()
  WHERE tenant_id = v_settlement.tenant_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: وضع تسوية على hold
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION hold_settlement(
  p_settlement_id UUID,
  p_admin_user_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE settlements
  SET 
    status = 'on_hold',
    admin_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_settlement_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: جلب تسويات التاجر
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_merchant_settlements(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  settlement_number VARCHAR,
  gross_amount NUMERIC,
  gateway_fees NUMERIC,
  platform_fees NUMERIC,
  net_amount NUMERIC,
  transaction_count INTEGER,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  status VARCHAR,
  bank_reference VARCHAR,
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.settlement_number,
    s.gross_amount,
    s.gateway_fees,
    s.platform_fees,
    s.net_amount,
    s.transaction_count,
    s.period_start,
    s.period_end,
    s.status,
    s.bank_reference,
    s.transferred_at,
    s.created_at
  FROM settlements s
  WHERE s.tenant_id = p_tenant_id
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: ملخص التسويات للتاجر
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_merchant_settlement_summary(p_tenant_id UUID)
RETURNS TABLE (
  total_settlements BIGINT,
  total_transferred NUMERIC,
  total_pending NUMERIC,
  total_failed NUMERIC,
  last_settlement_date TIMESTAMPTZ,
  next_settlement_eligible_at TIMESTAMPTZ
) AS $$
DECLARE
  v_pending_balance NUMERIC;
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('transferred', 'failed', 'pending', 'on_hold')) AS total_settlements,
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'transferred'), 0) AS total_transferred,
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'pending'), 0) AS total_pending,
    COALESCE(SUM(net_amount) FILTER (WHERE status = 'failed'), 0) AS total_failed,
    MAX(transferred_at) FILTER (WHERE status = 'transferred') AS last_settlement_date,
    -- التاريخ التالي المؤهل للتحويل (بعد T+1)
    (
      SELECT MIN(created_at) + INTERVAL '1 day'
      FROM store_transactions
      WHERE tenant_id = p_tenant_id
        AND status = 'success'
        AND settlement_id IS NULL
    ) AS next_settlement_eligible_at
  FROM settlements
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- View: ملخص التسويات للإدارة
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW admin_settlements_summary AS
SELECT 
  s.id,
  s.settlement_number,
  s.tenant_id,
  t.name AS tenant_name,
  t.slug AS tenant_slug,
  s.bank_account_id,
  mba.bank_name,
  mba.iban,
  s.gross_amount,
  s.gateway_fees,
  s.platform_fees,
  s.net_amount,
  s.transaction_count,
  s.period_start,
  s.period_end,
  s.status,
  s.bank_reference,
  s.transferred_at,
  s.approved_by,
  s.created_at,
  CASE 
    WHEN s.status = 'pending' THEN 
      EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 3600 -- ساعات الانتظار
    ELSE NULL
  END AS pending_hours
FROM settlements s
JOIN tenants t ON t.id = s.tenant_id
LEFT JOIN merchant_bank_accounts mba ON mba.id = s.bank_account_id
ORDER BY 
  CASE WHEN s.status = 'pending' THEN 0 ELSE 1 END,
  s.created_at DESC;

-- ───────────────────────────────────────────────────────────────────────────────
-- View: التسويات المعلقة للموافقة
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW pending_settlements_for_approval AS
SELECT 
  s.id,
  s.settlement_number,
  s.tenant_id,
  t.name AS tenant_name,
  t.company_email,
  mba.bank_name,
  mba.iban,
  mba.account_holder,
  s.gross_amount,
  s.gateway_fees,
  s.platform_fees,
  s.net_amount,
  s.transaction_count,
  s.period_start,
  s.period_end,
  s.notes,
  s.created_at,
  EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 3600 AS pending_hours
FROM settlements s
JOIN tenants t ON t.id = s.tenant_id
JOIN merchant_bank_accounts mba ON mba.id = s.bank_account_id
WHERE s.status = 'pending'
ORDER BY s.created_at ASC;

-- ───────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

-- تفعيل RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- سياسة العزل: كل تاجر يرى تسوياته فقط
-- ملاحظة: الأدمن يستخدم service_role ويتجاوز RLS
CREATE POLICY settlements_tenant_isolation 
  ON settlements 
  FOR ALL 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR 
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- سياسة القراءة للتاجر
CREATE POLICY settlements_tenant_read 
  ON settlements 
  FOR SELECT 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- سياسة الإدخال (للتاجر لطلب تحويل)
CREATE POLICY settlements_tenant_insert 
  ON settlements 
  FOR INSERT 
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
  );

-- سياسة التحديث (للإدارة فقط)
CREATE POLICY settlements_admin_update 
  ON settlements 
  FOR UPDATE 
  USING (
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments للتوثيق
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE settlements IS 'نظام التسويات والتحويلات البنكية - الإدارة تدير تحويلات التجار';

COMMENT ON COLUMN settlements.settlement_number IS 'رقم تسلسلي فريد: STL-YYYYMM-0001';
COMMENT ON COLUMN settlements.gross_amount IS 'إجمالي العمليات في هذه الدفعة';
COMMENT ON COLUMN settlements.gateway_fees IS 'رسوم البوابة المخصومة';
COMMENT ON COLUMN settlements.platform_fees IS 'عمولة المنصة المخصومة';
COMMENT ON COLUMN settlements.net_amount IS 'صافي التحويل للتاجر';
COMMENT ON COLUMN settlements.period_start IS 'بداية الفترة الزمنية للعمليات';
COMMENT ON COLUMN settlements.period_end IS 'نهاية الفترة الزمنية للعمليات';
COMMENT ON COLUMN settlements.status IS 'حالة التسوية: pending, processing, transferred, failed, on_hold';
COMMENT ON COLUMN settlements.bank_reference IS 'رقم التحويل البنكي من البنك';
COMMENT ON COLUMN settlements.approved_by IS 'معرف المستخدم الإداري الذي وافق';
COMMENT ON COLUMN settlements.rejection_reason IS 'سبب رفض التحويل';

COMMENT ON FUNCTION create_settlement() IS 'إنشاء تسوية جديدة عند طلب التاجر للتحويل';
COMMENT ON FUNCTION approve_settlement() IS 'الموافقة على تسوية وتنفيذ التحويل';
COMMENT ON FUNCTION reject_settlement() IS 'رفض تسوية وإطلاق الرصيد';
COMMENT ON FUNCTION hold_settlement() IS 'وضع تسوية على hold';
COMMENT ON FUNCTION get_merchant_settlements() IS 'جلب تسويات التاجر';
COMMENT ON FUNCTION get_merchant_settlement_summary() IS 'ملخص تسويات التاجر';
COMMENT ON VIEW admin_settlements_summary IS 'ملخص جميع التسويات - للإدارة';
COMMENT ON VIEW pending_settlements_for_approval IS 'التسويات المعلقة للموافقة - للإدارة';

-- ───────────────────────────────────────────────────────────────────────────────
-- Grant Permissions
-- ───────────────────────────────────────────────────────────────────────────────

-- منح الصلاحيات للـ authenticated users
GRANT SELECT, INSERT, UPDATE ON settlements TO authenticated;

-- Grant للـ service_role (للأدمن)
GRANT ALL ON settlements TO service_role;

-- Grant للدوال
GRANT EXECUTE ON FUNCTION create_settlement(UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_settlement(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reject_settlement(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION hold_settlement(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_merchant_settlements(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_merchant_settlement_summary(UUID) TO authenticated;

-- Grant للـ views
GRANT SELECT ON admin_settlements_summary TO service_role;
GRANT SELECT ON pending_settlements_for_approval TO service_role;

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration
-- ───────────────────────────────────────────────────────────────────────────────
