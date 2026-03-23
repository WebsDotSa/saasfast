-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 040_store_transactions.sql
-- Description: جدول كل عملية دفع - القلب الأساسي لنظام المدفوعات
-- Reference: Zid Pay-style payment tracking
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Enums for payment tracking
-- ───────────────────────────────────────────────────────────────────────────────

-- حالة عملية الدفع
CREATE TYPE IF NOT EXISTS transaction_status AS ENUM (
  'pending',           -- قيد الانتظار
  'success',           -- ناجحة
  'failed',            -- فشلت
  'refunded',          -- مستردة كاملة
  'partial_refund',    -- مستردة جزئياً
  'chargeback'         -- نزاع بنكي
);

-- طريقة الدفع
CREATE TYPE IF NOT EXISTS payment_method_type AS ENUM (
  'mada',
  'visa',
  'mastercard',
  'apple_pay',
  'stcpay',
  'knet',
  'benefit',
  'fawry',
  'other'
);

-- شبكة الدفع
CREATE TYPE IF NOT EXISTS payment_network_type AS ENUM (
  'Mada',
  'Visa',
  'Mastercard',
  'Amex',
  'UnionPay'
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: store_transactions
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_transactions (
  -- Primary Key
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant ID (مهم جداً للعزل)
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- المعرفات الخارجية (External Identifiers)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  myfatoorah_invoice_id   VARCHAR(100),  -- رقم الفاتورة في MyFatoorah
  myfatoorah_payment_id   VARCHAR(100),  -- رقم الدفعة في MyFatoorah
  store_order_id          UUID,          -- رابط بطلب المتجر (إن وُجد)
  payment_link_id         UUID,          -- رابط برابط الدفع (إن وُجد)
  external_reference      VARCHAR(200),  -- مرجع خارجي
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- المبالغ (Amounts)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  gross_amount        NUMERIC(12,2) NOT NULL,  -- المبلغ الإجمالي
  currency            VARCHAR(3) DEFAULT 'SAR', -- العملة
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الرسوم (Fees) - تُحسَب تلقائياً
  -- ═══════════════════════════════════════════════════════════════════════════
  
  gateway_fee_rate    NUMERIC(5,4) DEFAULT 0.015,  -- 1.5% افتراضي
  gateway_fee_amount  NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(gross_amount * gateway_fee_rate, 2)
  ) STORED,
  
  platform_fee_rate   NUMERIC(5,4) DEFAULT 0.01,   -- 1% عمولة المنصة
  platform_fee_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(gross_amount * platform_fee_rate, 2)
  ) STORED,
  
  -- صافي التاجر (محسوب تلقائياً)
  net_amount          NUMERIC(12,2) GENERATED ALWAYS AS (
    gross_amount 
    - ROUND(gross_amount * gateway_fee_rate, 2)
    - ROUND(gross_amount * platform_fee_rate, 2)
  ) STORED,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- طريقة الدفع (Payment Method)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  payment_method      VARCHAR(50),  -- mada | visa | mastercard | apple_pay | stcpay
  payment_network     VARCHAR(50),  -- Visa | Mastercard | Mada
  card_last4          VARCHAR(4),   -- آخر 4 أرقام من البطاقة
  card_brand          VARCHAR(20),  -- نوع البطاقة
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- معلومات العميل (Customer Info)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  customer_name       VARCHAR(200),
  customer_email      VARCHAR(255),
  customer_phone      VARCHAR(20),
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الحالة (Status)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  status              VARCHAR(30) NOT NULL DEFAULT 'pending',
  -- pending | success | failed | refunded | partial_refund | chargeback
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الاسترداد (Refund)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  refunded_amount     NUMERIC(12,2) DEFAULT 0,
  refund_reason       TEXT,
  refunded_at         TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- الإيداع/التسوية (Settlement)
  -- ═══════════════════════════════════════════════════════════════════════════
  
  settlement_id       UUID,  -- رابط بعملية التسوية
  settled_at          TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- البيانات الخام من MyFatoorah
  -- ═══════════════════════════════════════════════════════════════════════════
  
  raw_payload         JSONB,  -- البيانات الكاملة من API
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- Timestamps
  -- ═══════════════════════════════════════════════════════════════════════════
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes للأداء
-- ───────────────────────────────────────────────────────────────────────────────

-- Index لجلب عمليات تاجر معين (الأكثر استخداماً)
CREATE INDEX IF NOT EXISTS idx_store_tx_tenant 
  ON store_transactions(tenant_id, created_at DESC);

-- Index للبحث حسب الحالة
CREATE INDEX IF NOT EXISTS idx_store_tx_status 
  ON store_transactions(status);

-- Index للبحث حسب التسوية
CREATE INDEX IF NOT EXISTS idx_store_tx_settlement 
  ON store_transactions(settlement_id);

-- Index للبحث حسب رابط الدفع
CREATE INDEX IF NOT EXISTS idx_store_tx_payment_link 
  ON store_transactions(payment_link_id)
  WHERE payment_link_id IS NOT NULL;

-- Index فريد لرقم فاتورة MyFatoorah
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_tx_mf_invoice 
  ON store_transactions(myfatoorah_invoice_id)
  WHERE myfatoorah_invoice_id IS NOT NULL;

-- Index للبحث حسب المعرف الخارجي
CREATE INDEX IF NOT EXISTS idx_store_tx_external_ref 
  ON store_transactions(external_reference)
  WHERE external_reference IS NOT NULL;

-- Index للبحث بالتاريخ للحالات الناجحة (للتسويات)
CREATE INDEX IF NOT EXISTS idx_store_tx_success_date 
  ON store_transactions(created_at DESC)
  WHERE status = 'success';

-- ───────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

-- تفعيل RLS
ALTER TABLE store_transactions ENABLE ROW LEVEL SECURITY;

-- سياسة العزل: كل تاجر يرى عملياته فقط
-- ملاحظة: الأدمن يستخدم service_role ويتجاوز RLS
CREATE POLICY tx_tenant_isolation 
  ON store_transactions 
  FOR ALL 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR 
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- سياسة القراءة للتاجر
CREATE POLICY tx_tenant_read 
  ON store_transactions 
  FOR SELECT 
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR
    current_setting('app.bypass_rls', true)::boolean = true
  );

-- سياسة الإدخال (للـ Webhook)
CREATE POLICY tx_webhook_insert 
  ON store_transactions 
  FOR INSERT 
  WITH CHECK (true);  -- Webhook يمكنه الإدخال (يتم التحقق في الكود)

-- سياسة التحديث (للـ Webhook والتسويات)
CREATE POLICY tx_webhook_update 
  ON store_transactions 
  FOR UPDATE 
  USING (true);  -- Webhook يمكنه التحديث (يتم التحقق في الكود)

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger لتحديث updated_at
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_store_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_store_transactions_updated_at
  BEFORE UPDATE ON store_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_store_transactions_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments للتوثيق
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE store_transactions IS 'جدول كل عملية دفع في المنصة - يسجل جميع المدفوعات من جميع المتاجر';

COMMENT ON COLUMN store_transactions.tenant_id IS 'معرف المتجر/التاجر - يستخدم للعزل (RLS)';
COMMENT ON COLUMN store_transactions.myfatoorah_invoice_id IS 'رقم الفاتورة في MyFatoorah - فريد';
COMMENT ON COLUMN store_transactions.store_order_id IS 'رابط بطلب المتجر في جدول orders (إن وُجد)';
COMMENT ON COLUMN store_transactions.payment_link_id IS 'رابط برابط الدفع (إن وُجد)';

COMMENT ON COLUMN store_transactions.gross_amount IS 'المبلغ الإجمالي الذي دفعه العميل';
COMMENT ON COLUMN store_transactions.gateway_fee_rate IS 'نسبة رسوم البوابة (مثلاً 0.015 = 1.5%)';
COMMENT ON COLUMN store_transactions.gateway_fee_amount IS 'مبلغ رسوم البوابة - محسوب تلقائياً';
COMMENT ON COLUMN store_transactions.platform_fee_rate IS 'نسبة عمولة المنصة (مثلاً 0.01 = 1%)';
COMMENT ON COLUMN store_transactions.platform_fee_amount IS 'مبلغ عمولة المنصة - محسوب تلقائياً';
COMMENT ON COLUMN store_transactions.net_amount IS 'صافي التاجر بعد خصم جميع الرسوم - محسوب تلقائياً';

COMMENT ON COLUMN store_transactions.payment_method IS 'طريقة الدفع: mada, visa, mastercard, apple_pay, stcpay';
COMMENT ON COLUMN store_transactions.payment_network IS 'شبكة الدفع: Mada, Visa, Mastercard';
COMMENT ON COLUMN store_transactions.card_last4 IS 'آخر 4 أرقام من البطاقة';
COMMENT ON COLUMN store_transactions.card_brand IS 'علامة البطاقة التجارية';

COMMENT ON COLUMN store_transactions.status IS 'حالة العملية: pending, success, failed, refunded, partial_refund, chargeback';
COMMENT ON COLUMN store_transactions.refunded_amount IS 'مبلغ الاسترداد (كامل أو جزئي)';
COMMENT ON COLUMN store_transactions.settlement_id IS 'رابط بعملية التسوية - يضاف عند التحويل';

COMMENT ON COLUMN store_transactions.raw_payload IS 'البيانات الكاملة من MyFatoorah API - للرجوع إليها عند الحاجة';

-- ───────────────────────────────────────────────────────────────────────────────
-- Grant Permissions
-- ───────────────────────────────────────────────────────────────────────────────

-- منح الصلاحيات للـ authenticated users
GRANT SELECT, INSERT, UPDATE ON store_transactions TO authenticated;

-- Grant للـ service_role (للأدمن)
GRANT ALL ON store_transactions TO service_role;

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration
-- ───────────────────────────────────────────────────────────────────────────────
