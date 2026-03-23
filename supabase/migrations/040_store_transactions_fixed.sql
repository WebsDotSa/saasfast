-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 040_store_transactions.sql (Fixed)
-- Description: جدول كل عملية دفع - القلب الأساسي لنظام المدفوعات
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Enums for payment tracking
-- ───────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM (
    'pending', 'success', 'failed', 'refunded', 'partial_refund', 'chargeback'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM (
    'mada', 'visa', 'mastercard', 'apple_pay', 'stcpay', 'knet', 'benefit', 'fawry', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_network_type AS ENUM (
    'Mada', 'Visa', 'Mastercard', 'Amex', 'UnionPay'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: store_transactions
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  myfatoorah_invoice_id   VARCHAR(100),
  myfatoorah_payment_id   VARCHAR(100),
  store_order_id          UUID,
  payment_link_id         UUID,
  external_reference      VARCHAR(200),
  
  gross_amount        NUMERIC(12,2) NOT NULL,
  currency            VARCHAR(3) DEFAULT 'SAR',
  
  gateway_fee_rate    NUMERIC(5,4) DEFAULT 0.015,
  gateway_fee_amount  NUMERIC(12,2),
  
  platform_fee_rate   NUMERIC(5,4) DEFAULT 0.01,
  platform_fee_amount NUMERIC(12,2),
  
  net_amount          NUMERIC(12,2),
  
  payment_method      VARCHAR(50),
  payment_network     VARCHAR(50),
  card_last4          VARCHAR(4),
  card_brand          VARCHAR(20),
  
  customer_name       VARCHAR(200),
  customer_email      VARCHAR(255),
  customer_phone      VARCHAR(20),
  
  status              VARCHAR(30) NOT NULL DEFAULT 'pending',
  
  refunded_amount     NUMERIC(12,2) DEFAULT 0,
  refund_reason       TEXT,
  refunded_at         TIMESTAMPTZ,
  
  settlement_id       UUID,
  settled_at          TIMESTAMPTZ,
  
  raw_payload         JSONB,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- Function to calculate fees (trigger)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_transaction_fees()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gateway_fee_amount = ROUND(NEW.gross_amount * NEW.gateway_fee_rate, 2);
  NEW.platform_fee_amount = ROUND(NEW.gross_amount * NEW.platform_fee_rate, 2);
  NEW.net_amount = NEW.gross_amount - NEW.gateway_fee_amount - NEW.platform_fee_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_transaction_fees
  BEFORE INSERT OR UPDATE ON store_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_transaction_fees();

-- ───────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ───────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_store_tx_tenant ON store_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_tx_status ON store_transactions(status);
CREATE INDEX IF NOT EXISTS idx_store_tx_settlement ON store_transactions(settlement_id);
CREATE INDEX IF NOT EXISTS idx_store_tx_payment_link ON store_transactions(payment_link_id) WHERE payment_link_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_tx_mf_invoice ON store_transactions(myfatoorah_invoice_id) WHERE myfatoorah_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tx_external_ref ON store_transactions(external_reference) WHERE external_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tx_success_date ON store_transactions(created_at DESC) WHERE status = 'success';

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE store_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tx_tenant_isolation ON store_transactions;
CREATE POLICY tx_tenant_isolation ON store_transactions FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID OR current_setting('app.bypass_rls', true)::boolean = true);

DROP POLICY IF EXISTS tx_tenant_read ON store_transactions;
CREATE POLICY tx_tenant_read ON store_transactions FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID OR current_setting('app.bypass_rls', true)::boolean = true);

DROP POLICY IF EXISTS tx_webhook_insert ON store_transactions;
CREATE POLICY tx_webhook_insert ON store_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS tx_webhook_update ON store_transactions;
CREATE POLICY tx_webhook_update ON store_transactions FOR UPDATE USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- Trigger for updated_at
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

-- Grants
GRANT SELECT, INSERT, UPDATE ON store_transactions TO authenticated;
GRANT ALL ON store_transactions TO service_role;
