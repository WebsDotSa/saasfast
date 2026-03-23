-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 041_merchant_balances.sql (Fixed)
-- Description: أرصدة التجار - Trigger-based balance tracking
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table: merchant_balances
CREATE TABLE IF NOT EXISTS merchant_balances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  available_balance NUMERIC(12,2) DEFAULT 0,
  pending_balance   NUMERIC(12,2) DEFAULT 0,
  total_earned      NUMERIC(12,2) DEFAULT 0,
  total_withdrawn   NUMERIC(12,2) DEFAULT 0,
  
  currency          VARCHAR(3) DEFAULT 'SAR',
  
  last_transaction_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_balances_tenant ON merchant_balances(tenant_id);

-- RLS
ALTER TABLE merchant_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mb_tenant_isolation ON merchant_balances;
CREATE POLICY mb_tenant_isolation ON merchant_balances FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID OR current_setting('app.bypass_rls', true)::boolean = true);

-- Grants
GRANT SELECT, INSERT, UPDATE ON merchant_balances TO authenticated;
GRANT ALL ON merchant_balances TO service_role;
