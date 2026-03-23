-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 041_merchant_balances.sql
-- Description: رصيد كل متجر - يتحدث تلقائياً مع كل عملية دفع
-- Reference: Zid Pay-style balance tracking
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: merchant_balances
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS merchant_balances (
  -- Primary Key
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant ID (فريد - كل تاجر له رصيد واحد)
  tenant_id           UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الأرصدة (Balances)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  available_balance   NUMERIC(12,2) DEFAULT 0,  -- جاهز للتحويل
  pending_balance     NUMERIC(12,2) DEFAULT 0,  -- قيد المعالجة (T+1)
  reserved_balance    NUMERIC(12,2) DEFAULT 0,  -- محجوز للردود/النزاعات
  total_earned        NUMERIC(12,2) DEFAULT 0,  -- إجمالي ما كسبه التاجر
  total_withdrawn     NUMERIC(12,2) DEFAULT 0,  -- إجمالي ما حوّله التاجر
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الإحصائيات (Statistics)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  total_transactions     INTEGER DEFAULT 0,       -- إجمالي عدد العمليات
  successful_transactions INTEGER DEFAULT 0,      -- العمليات الناجحة
  failed_transactions    INTEGER DEFAULT 0,       -- العمليات الفاشلة
  refunded_transactions  INTEGER DEFAULT 0,       -- العمليات المستردة
  total_refunded         NUMERIC(12,2) DEFAULT 0, -- إجمالي مبالغ الاسترداد
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- معلومات أخرى
  -- ═══════════════════════════════════════════════════════════════════════════
  
  currency            VARCHAR(3) DEFAULT 'SAR',  -- العملة
  last_updated        TIMESTAMPTZ DEFAULT NOW()  -- آخر تحديث
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ───────────────────────────────────────────────────────────────────────────────

-- Index للبحث حسب tenant_id
CREATE INDEX IF NOT EXISTS idx_merchant_balances_tenant 
  ON merchant_balances(tenant_id);

-- Index للأرصدة المتاحة (للتاجر الذي يريد تحويل)
CREATE INDEX IF NOT EXISTS idx_merchant_balances_available 
  ON merchant_balances(available_balance DESC)
  WHERE available_balance > 0;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: تحديث الرصيد عند عملية جديدة
-- ═══════════════════════════════════════════════════════════════════════════════
-- هذه الدالة تُستدعى تلقائياً عند كل INSERT/UPDATE على store_transactions
-- وتقوم بتحديث رصيد التاجر بناءً على حالة العملية
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_merchant_balance_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_gateway_rate NUMERIC(5,4);
  v_platform_rate NUMERIC(5,4);
BEGIN
  -- ═══════════════════════════════════════════════════════════════════════════
  -- حالة 1: عملية ناجحة جديدة (INSERT أو UPDATE من failed إلى success)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF NEW.status = 'success' AND (OLD IS NULL OR OLD.status != 'success') THEN
    
    -- إضافة للرصيد المعلق (pending) - لأن التحويلات تكون T+1
    INSERT INTO merchant_balances (
      tenant_id, 
      pending_balance, 
      total_earned, 
      total_transactions, 
      successful_transactions,
      last_updated
    )
    VALUES (
      NEW.tenant_id, 
      NEW.net_amount, 
      NEW.net_amount, 
      1, 
      1,
      NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      pending_balance = merchant_balances.pending_balance + NEW.net_amount,
      total_earned = merchant_balances.total_earned + NEW.net_amount,
      total_transactions = merchant_balances.total_transactions + 1,
      successful_transactions = merchant_balances.successful_transactions + 1,
      last_updated = NOW();
    
    RETURN NEW;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- حالة 2: عملية فشلت (UPDATE إلى failed)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF NEW.status = 'failed' AND OLD.status = 'success' THEN
    
    -- خصم من الرصيد المعلق
    UPDATE merchant_balances
    SET 
      pending_balance = pending_balance - OLD.net_amount,
      total_earned = total_earned - OLD.net_amount,
      successful_transactions = successful_transactions - 1,
      failed_transactions = failed_transactions + 1,
      last_updated = NOW()
    WHERE tenant_id = NEW.tenant_id;
    
    RETURN NEW;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- حالة 3: استرداد كامل (UPDATE إلى refunded)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF NEW.status IN ('refunded', 'partial_refund') AND OLD.status = 'success' THEN
    
    -- خصم من الرصيد المعلق/المتاح
    UPDATE merchant_balances
    SET 
      pending_balance = pending_balance - NEW.refunded_amount,
      total_refunded = total_refunded + NEW.refunded_amount,
      refunded_transactions = refunded_transactions + 1,
      last_updated = NOW()
    WHERE tenant_id = NEW.tenant_id;
    
    RETURN NEW;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- حالة 4: نزاع بنكي (chargeback)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF NEW.status = 'chargeback' AND OLD.status = 'success' THEN
    
    -- خصم من الرصيد المتاح + حجز مبلغ للنزاع
    UPDATE merchant_balances
    SET 
      available_balance = available_balance - OLD.net_amount,
      reserved_balance = reserved_balance + OLD.net_amount,
      last_updated = NOW()
    WHERE tenant_id = NEW.tenant_id;
    
    RETURN NEW;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- حالة 5: تحويل إلى متاح (بعد فترة التسوية T+1)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  IF NEW.settlement_id IS NOT NULL AND OLD.settlement_id IS NULL THEN
    
    -- نقل من المتاح إلى المحوّل (يتم في عملية التسوية)
    -- هذه الحالة تُعالج في settlement process
    NULL;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger: تحديث الرصيد تلقائياً
-- ═══════════════════════════════════════════════════════════════════════════════
-- يُستدعى بعد كل INSERT أو UPDATE على store_transactions
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_update_merchant_balance_on_transaction
  AFTER INSERT OR UPDATE ON store_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_balance_on_transaction();

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: نقل الرصيد من pending إلى available
-- ═══════════════════════════════════════════════════════════════════════════════
-- تُستدعى يدوياً أو عبر cron job بعد فترة التسوية (T+1)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION move_pending_to_available(
  p_tenant_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_balances
  SET 
    pending_balance = pending_balance - p_amount,
    available_balance = available_balance + p_amount,
    last_updated = NOW()
  WHERE tenant_id = p_tenant_id
    AND pending_balance >= p_amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: حجز رصيد (للنزاعات أو التحويلات المعلقة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reserve_merchant_balance(
  p_tenant_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_balances
  SET 
    available_balance = available_balance - p_amount,
    reserved_balance = reserved_balance + p_amount,
    last_updated = NOW()
  WHERE tenant_id = p_tenant_id
    AND available_balance >= p_amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: إطلاق رصيد محجوز
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION release_reserved_balance(
  p_tenant_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_balances
  SET 
    reserved_balance = reserved_balance - p_amount,
    available_balance = available_balance + p_amount,
    last_updated = NOW()
  WHERE tenant_id = p_tenant_id
    AND reserved_balance >= p_amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: خصم من الرصيد المحجوز (للنزاعات المنتهية)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION deduct_from_reserved(
  p_tenant_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE merchant_balances
  SET 
    reserved_balance = reserved_balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,  -- يُعتبر مسحوب
    last_updated = NOW()
  WHERE tenant_id = p_tenant_id
    AND reserved_balance >= p_amount;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Function: جلب رصيد التاجر
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_merchant_balance(p_tenant_id UUID)
RETURNS TABLE (
  available_balance NUMERIC(12,2),
  pending_balance NUMERIC(12,2),
  reserved_balance NUMERIC(12,2),
  total_earned NUMERIC(12,2),
  total_withdrawn NUMERIC(12,2),
  currency VARCHAR(3)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(mb.available_balance, 0) AS available_balance,
    COALESCE(mb.pending_balance, 0) AS pending_balance,
    COALESCE(mb.reserved_balance, 0) AS reserved_balance,
    COALESCE(mb.total_earned, 0) AS total_earned,
    COALESCE(mb.total_withdrawn, 0) AS total_withdrawn,
    COALESCE(mb.currency, 'SAR') AS currency
  FROM merchant_balances mb
  WHERE mb.tenant_id = p_tenant_id;
  
  -- إذا لم يوجد سجل، إرجاع قيم صفرية
  IF NOT FOUND THEN
    available_balance := 0;
    pending_balance := 0;
    reserved_balance := 0;
    total_earned := 0;
    total_withdrawn := 0;
    currency := 'SAR';
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- View: ملخص أرصدة جميع التجار (للإدارة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW admin_merchant_balances_summary AS
SELECT 
  mb.tenant_id,
  t.name AS tenant_name,
  t.slug AS tenant_slug,
  mb.available_balance,
  mb.pending_balance,
  mb.reserved_balance,
  mb.total_earned,
  mb.total_withdrawn,
  mb.total_earned - mb.total_withdrawn AS net_pending,
  mb.total_transactions,
  mb.successful_transactions,
  mb.currency,
  mb.last_updated
FROM merchant_balances mb
JOIN tenants t ON t.id = mb.tenant_id
ORDER BY mb.total_earned DESC;

-- ───────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

-- تفعيل RLS
ALTER TABLE merchant_balances ENABLE ROW LEVEL SECURITY;

-- سياسة العزل: كل تاجر يرى رصيده فقط
CREATE POLICY merchant_balance_isolation 
  ON merchant_balances 
  FOR ALL 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR 
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- سياسة القراءة للتاجر
CREATE POLICY merchant_balance_read 
  ON merchant_balances 
  FOR SELECT 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- سياسة التحديث (للدوال الداخلية فقط)
CREATE POLICY merchant_balance_update 
  ON merchant_balances 
  FOR UPDATE 
  USING (true);

-- سياسة الإدخال (للدوال الداخلية فقط)
CREATE POLICY merchant_balance_insert 
  ON merchant_balances 
  FOR INSERT 
  WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments للتوثيق
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE merchant_balances IS 'رصيد كل متجر - يتحدث تلقائياً عبر Trigger مع كل عملية دفع';

COMMENT ON COLUMN merchant_balances.tenant_id IS 'معرف التاجر - فريد (كل تاجر له سجل واحد)';
COMMENT ON COLUMN merchant_balances.available_balance IS 'الرصيد الجاهز للتحويل الفوري';
COMMENT ON COLUMN merchant_balances.pending_balance IS 'الرصيد قيد المعالجة (T+1) - لم يصبح متاحاً بعد';
COMMENT ON COLUMN merchant_balances.reserved_balance IS 'الرصيد المحجوز للنزاعات أو التحويلات المعلقة';
COMMENT ON COLUMN merchant_balances.total_earned IS 'إجمالي ما كسبه التاجر منذ البداية';
COMMENT ON COLUMN merchant_balances.total_withdrawn IS 'إجمالي ما حوّله التاجر إلى حسابه البنكي';

COMMENT ON COLUMN merchant_balances.total_transactions IS 'إجمالي عدد العمليات';
COMMENT ON COLUMN merchant_balances.successful_transactions IS 'عدد العمليات الناجحة';
COMMENT ON COLUMN merchant_balances.refunded_transactions IS 'عدد العمليات المستردة';
COMMENT ON COLUMN merchant_balances.total_refunded IS 'إجمالي مبالغ الاسترداد';

COMMENT ON FUNCTION update_merchant_balance_on_transaction() IS 'دالة Trigger تحدث الرصيد تلقائياً عند كل عملية';
COMMENT ON FUNCTION move_pending_to_available() IS 'نقل الرصيد من pending إلى available بعد T+1';
COMMENT ON FUNCTION reserve_merchant_balance() IS 'حجز مبلغ من الرصيد المتاح';
COMMENT ON FUNCTION release_reserved_balance() IS 'إطلاق رصيد محجوز وإعادته للمتاح';
COMMENT ON FUNCTION deduct_from_reserved() IS 'خصم من الرصيد المحجوز (للنزاعات المنتهية)';
COMMENT ON FUNCTION get_merchant_balance() IS 'جلب رصيد تاجر معين';
COMMENT ON VIEW admin_merchant_balances_summary IS 'ملخص أرصدة جميع التجار - للإدارة فقط';

-- ───────────────────────────────────────────────────────────────────────────────
-- Grant Permissions
-- ───────────────────────────────────────────────────────────────────────────────

-- منح الصلاحيات للـ authenticated users
GRANT SELECT, INSERT, UPDATE ON merchant_balances TO authenticated;

-- Grant للـ service_role (للأدمن)
GRANT ALL ON merchant_balances TO service_role;

-- Grant للدوال
GRANT EXECUTE ON FUNCTION get_merchant_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_pending_to_available(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_merchant_balance(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION release_reserved_balance(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_from_reserved(UUID, NUMERIC) TO authenticated;

-- Grant للـ view
GRANT SELECT ON admin_merchant_balances_summary TO service_role;

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration
-- ───────────────────────────────────────────────────────────────────────────────
