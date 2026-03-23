-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 043_settlements.sql (Fixed)
-- Description: نظام التسويات والتحويلات البنكية
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE settlement_status AS ENUM (
    'pending', 'processing', 'transferred', 'failed', 'on_hold'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table: settlements
CREATE TABLE IF NOT EXISTS settlements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  settlement_number VARCHAR(50) UNIQUE NOT NULL,
  bank_account_id   UUID,
  gross_amount      NUMERIC(12,2) NOT NULL,
  gateway_fees      NUMERIC(12,2) NOT NULL,
  platform_fees     NUMERIC(12,2) NOT NULL,
  net_amount        NUMERIC(12,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'SAR',
  transaction_count INTEGER,
  period_start      TIMESTAMPTZ NOT NULL,
  period_end        TIMESTAMPTZ NOT NULL,
  status            VARCHAR(30) DEFAULT 'pending',
  bank_reference    VARCHAR(100),
  transferred_at    TIMESTAMPTZ,
  transfer_note     TEXT,
  approved_by       UUID,
  approved_at       TIMESTAMPTZ,
  rejected_by       UUID,
  rejected_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  notes             TEXT,
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_settlements_tenant ON settlements(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_number ON settlements(settlement_number);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);

-- RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stl_tenant_isolation ON settlements;
CREATE POLICY stl_tenant_isolation ON settlements FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID OR current_setting('app.bypass_rls', true)::boolean = true);

-- Grants
GRANT SELECT, INSERT, UPDATE ON settlements TO authenticated;
GRANT ALL ON settlements TO service_role;
