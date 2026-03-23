-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 042_payment_links_bank_accounts.sql
-- Description: روابط الدفع السريعة + الحسابات البنكية للتجار
-- Reference: Zid Pay - "روابط الدفع" + "حساباتك البنكية"
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: payment_links
-- ═══════════════════════════════════════════════════════════════════════════════
-- روابط الدفع السريعة - مرجع: زد "روابط الدفع"
-- التاجر ينشئ رابط دفع ويرسله للعميل عبر واتساب/SMS
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_links (
  -- Primary Key
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant ID
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- رقم الرابط (تسلسلي فريد)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  link_number     VARCHAR(50) UNIQUE NOT NULL,  -- PLK-000001
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- معلومات الرابط
  -- ═══════════════════════════════════════════════════════════════════════════
  
  title           VARCHAR(200),                  -- عنوان الرابط
  amount          NUMERIC(12,2) NOT NULL,        -- المبلغ
  currency        VARCHAR(3) DEFAULT 'SAR',      -- العملة
  description     TEXT,                          -- وصف
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- معلومات العميل
  -- ═══════════════════════════════════════════════════════════════════════════
  
  customer_name   VARCHAR(200),                  -- اسم العميل
  customer_phone  VARCHAR(20),                   -- هاتف العميل
  customer_email  VARCHAR(255),                  -- إيميل العميل
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- MyFatoorah Integration
  -- ═══════════════════════════════════════════════════════════════════════════
  
  myfatoorah_url  TEXT,                          -- رابط الدفع من MyFatoorah
  short_url       VARCHAR(100),                  -- رابط مختصر (للـ sharing)
  myfatoorah_invoice_id VARCHAR(100),            -- رقم الفاتورة بعد الدفع
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الحالة
  -- ═══════════════════════════════════════════════════════════════════════════
  
  status          VARCHAR(20) DEFAULT 'active',  -- active | paid | expired | cancelled
  payment_status  VARCHAR(20) DEFAULT 'pending', -- pending | success | failed
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ربط بالعمليات
  -- ═══════════════════════════════════════════════════════════════════════════
  
  transaction_id  UUID REFERENCES store_transactions(id),  -- بعد الدفع
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- تاريخ الانتهاء
  -- ═══════════════════════════════════════════════════════════════════════════
  
  expires_at      TIMESTAMPTZ,                   -- تاريخ الانتهاء
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Timestamps
  -- ═══════════════════════════════════════════════════════════════════════════
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes لـ payment_links
-- ───────────────────────────────────────────────────────────────────────────────

-- Index للبحث حسب التاجر
CREATE INDEX IF NOT EXISTS idx_payment_links_tenant 
  ON payment_links(tenant_id, created_at DESC);

-- Index للبحث حسب الحالة
CREATE INDEX IF NOT EXISTS idx_payment_links_status 
  ON payment_links(status);

-- Index للبحث حسب حالة الدفع
CREATE INDEX IF NOT EXISTS idx_payment_links_payment_status 
  ON payment_links(payment_status);

-- Index فريد لرقم الفاتورة
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_links_mf_invoice 
  ON payment_links(myfatoorah_invoice_id)
  WHERE myfatoorah_invoice_id IS NOT NULL;

-- Index للروابط النشطة
CREATE INDEX IF NOT EXISTS idx_payment_links_active 
  ON payment_links(tenant_id, created_at DESC)
  WHERE status = 'active';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: merchant_bank_accounts
-- ═══════════════════════════════════════════════════════════════════════════════
-- الحسابات البنكية للتاجر - مرجع: زد "حساباتك البنكية"
-- التاجر يضيف حساباته البنكية لاستقبال التحويلات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
  -- Primary Key
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant ID
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- معلومات البنك
  -- ═══════════════════════════════════════════════════════════════════════════
  
  bank_name       VARCHAR(100) NOT NULL,         -- اسم البنك
  account_holder  VARCHAR(200) NOT NULL,         -- اسم صاحب الحساب
  account_number  VARCHAR(50),                   -- رقم الحساب (اختياري)
  iban            VARCHAR(34) NOT NULL,          -- IBAN: SA + 22 رقم
  swift_code      VARCHAR(20),                   -- SWIFT Code (للتحويلات الدولية)
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- حالة الحساب
  -- ═══════════════════════════════════════════════════════════════════════════
  
  is_primary      BOOLEAN DEFAULT false,         -- الحساب الأساسي
  is_verified     BOOLEAN DEFAULT false,         -- تم التحقق
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- تاريخ التحقق
  -- ═══════════════════════════════════════════════════════════════════════════
  
  verified_at     TIMESTAMPTZ,                   -- تاريخ التحقق
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Timestamps
  -- ═══════════════════════════════════════════════════════════════════════════
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes لـ merchant_bank_accounts
-- ───────────────────────────────────────────────────────────────────────────────

-- Index للبحث حسب التاجر
CREATE INDEX IF NOT EXISTS idx_merchant_bank_accounts_tenant 
  ON merchant_bank_accounts(tenant_id);

-- Index للحساب الأساسي
CREATE INDEX IF NOT EXISTS idx_merchant_bank_accounts_primary 
  ON merchant_bank_accounts(tenant_id, is_primary)
  WHERE is_primary = true;

-- Index للبحث حسب IBAN
CREATE INDEX IF NOT EXISTS idx_merchant_bank_accounts_iban 
  ON merchant_bank_accounts(iban);

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: توليد رقم تسلسلي لـ payment_links
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_payment_link_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_link_number TEXT;
BEGIN
  -- الحصول على السنة الحالية
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- الحصول على آخر تسلسل
  SELECT COALESCE(
    NULLIF(SUBSTRING(link_number FROM 'PLK-(\d+)$')::INTEGER, 0),
    0
  ) + 1
  INTO v_sequence
  FROM payment_links
  WHERE link_number LIKE 'PLK-%'
  ORDER BY link_number DESC
  LIMIT 1;
  
  -- توليد الرقم الجديد
  v_link_number := 'PLK-' || LPAD(v_sequence::TEXT, 6, '0');
  
  NEW.link_number := v_link_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_payment_link_number
  BEFORE INSERT ON payment_links
  FOR EACH ROW
  WHEN (NEW.link_number IS NULL)
  EXECUTE FUNCTION generate_payment_link_number();

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: تحديث updated_at
-- ───────────────────────────────────────────────────────────────────────────────

-- لـ payment_links
CREATE OR REPLACE FUNCTION update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_links_updated_at();

-- لـ merchant_bank_accounts
CREATE OR REPLACE FUNCTION update_merchant_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_merchant_bank_accounts_updated_at
  BEFORE UPDATE ON merchant_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_bank_accounts_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: التحقق من صحة IBAN
-- ═══════════════════════════════════════════════════════════════════════════════
-- IBAN السعودي: SA + 22 رقم (SAkk bbcccccccccccccccccc)
-- حيث kk = خانة التحقق، bb = رمز البنك، cccccccccccccccccc = رقم الحساب
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_saudi_iban(p_iban TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_iban_clean TEXT;
  v_iban_length INTEGER;
BEGIN
  -- إزالة المسافات والأحرف الخاصة
  v_iban_clean := UPPER(REPLACE(p_iban, ' ', ''));
  
  -- التحقق من الطول (SA + 22 = 24)
  v_iban_length := LENGTH(v_iban_clean);
  
  IF v_iban_length != 24 THEN
    RETURN FALSE;
  END IF;
  
  -- التحقق من البدء بـ SA
  IF SUBSTRING(v_iban_clean FROM 1 FOR 2) != 'SA' THEN
    RETURN FALSE;
  END IF;
  
  -- التحقق من أن الباقي أرقام فقط
  IF SUBSTRING(v_iban_clean FROM 3) !~ '^[0-9]+$' THEN
    RETURN FALSE;
  END IF;
  
  -- هنا يمكن إضافة خوارزمية التحقق من صحة IBAN الكاملة
  -- للتبسيط، نتحقق من التنسيق فقط
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: تعيين حساب كـ primary
-- ═══════════════════════════════════════════════════════════════════════════════
-- عند تعيين حساب كـ primary، يتم إلغاء primary من الحسابات الأخرى
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_primary_bank_account(
  p_account_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- إلغاء primary من جميع الحسابات الأخرى
  UPDATE merchant_bank_accounts
  SET is_primary = false
  WHERE tenant_id = p_tenant_id
    AND id != p_account_id;
  
  -- تعيين الحساب الجديد كـ primary
  UPDATE merchant_bank_accounts
  SET is_primary = true
  WHERE id = p_account_id
    AND tenant_id = p_tenant_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: التحقق من الحساب البنكي
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION verify_bank_account(
  p_account_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_bank_accounts
  SET 
    is_verified = true,
    verified_at = NOW()
  WHERE id = p_account_id
    AND tenant_id = p_tenant_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- View: الحسابات البنكية النشطة للتجار
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW active_merchant_bank_accounts AS
SELECT 
  mba.id,
  mba.tenant_id,
  t.name AS tenant_name,
  mba.bank_name,
  mba.account_holder,
  mba.iban,
  mba.swift_code,
  mba.is_primary,
  mba.is_verified,
  mba.created_at
FROM merchant_bank_accounts mba
JOIN tenants t ON t.id = mba.tenant_id
WHERE mba.is_verified = true
ORDER BY mba.is_primary DESC, mba.created_at DESC;

-- ───────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- payment_links RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- سياسة العزل
CREATE POLICY payment_links_isolation 
  ON payment_links 
  FOR ALL 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR 
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- merchant_bank_accounts RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE merchant_bank_accounts ENABLE ROW LEVEL SECURITY;

-- سياسة العزل
CREATE POLICY merchant_bank_accounts_isolation 
  ON merchant_bank_accounts 
  FOR ALL 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR 
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments للتوثيق
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE payment_links IS 'روابط الدفع السريعة - التاجر ينشئ رابط ويرسله للعميل';
COMMENT ON TABLE merchant_bank_accounts IS 'الحسابات البنكية للتجار - لاستقبال التحويلات';

COMMENT ON COLUMN payment_links.link_number IS 'رقم تسلسلي فريد: PLK-000001';
COMMENT ON COLUMN payment_links.myfatoorah_url IS 'رابط الدفع من MyFatoorah';
COMMENT ON COLUMN payment_links.short_url IS 'رابط مختصر للمشاركة عبر واتساب/SMS';
COMMENT ON COLUMN payment_links.transaction_id IS 'رابط بالعملية بعد نجاح الدفع';

COMMENT ON COLUMN merchant_bank_accounts.iban IS 'IBAN السعودي: SA + 22 رقم';
COMMENT ON COLUMN merchant_bank_accounts.is_primary IS 'الحساب الأساسي للتحويل';
COMMENT ON COLUMN merchant_bank_accounts.is_verified IS 'تم التحقق من الحساب';

COMMENT ON FUNCTION validate_saudi_iban() IS 'التحقق من صحة IBAN سعودي';
COMMENT ON FUNCTION set_primary_bank_account() IS 'تعيين حساب كـ primary وإلغاء الباقي';
COMMENT ON FUNCTION verify_bank_account() IS 'التحقق من حساب بنكي';
COMMENT ON VIEW active_merchant_bank_accounts IS 'الحسابات البنكية المفعلة - للإدارة';

-- ───────────────────────────────────────────────────────────────────────────────
-- Grant Permissions
-- ───────────────────────────────────────────────────────────────────────────────

-- payment_links
GRANT SELECT, INSERT, UPDATE ON payment_links TO authenticated;
GRANT ALL ON payment_links TO service_role;

-- merchant_bank_accounts
GRANT SELECT, INSERT, UPDATE ON merchant_bank_accounts TO authenticated;
GRANT ALL ON merchant_bank_accounts TO service_role;

-- الدوال
GRANT EXECUTE ON FUNCTION validate_saudi_iban(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_primary_bank_account(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_bank_account(UUID, UUID) TO authenticated;

-- الـ views
GRANT SELECT ON active_merchant_bank_accounts TO service_role;

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration
-- ───────────────────────────────────────────────────────────────────────────────
