-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 042_payment_links_bank_accounts.sql (Fixed)
-- Description: روابط الدفع والحسابات البنكية للتجار
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table: payment_links
CREATE TABLE IF NOT EXISTS payment_links (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  
  amount            NUMERIC(12,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'SAR',
  
  link_code         VARCHAR(50) UNIQUE NOT NULL,
  short_url         VARCHAR(500),
  
  status            VARCHAR(20) DEFAULT 'active',
  
  expires_at        TIMESTAMPTZ,
  max_uses          INTEGER,
  current_uses      INTEGER DEFAULT 0,
  
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(20),
  customer_name     VARCHAR(200),
  
  metadata          JSONB DEFAULT '{}',
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Table: merchant_bank_accounts
CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  bank_name         VARCHAR(100) NOT NULL,
  account_holder    VARCHAR(200) NOT NULL,
  account_number    VARCHAR(50) NOT NULL,
  iban              VARCHAR(34) NOT NULL,
  swift_code        VARCHAR(20),
  
  is_primary        BOOLEAN DEFAULT false,
  is_verified       BOOLEAN DEFAULT false,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_tenant ON payment_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON payment_links(link_code);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);

CREATE INDEX IF NOT EXISTS idx_merchant_bank_tenant ON merchant_bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_bank_iban ON merchant_bank_accounts(iban);

-- RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pl_tenant_isolation ON payment_links;
CREATE POLICY pl_tenant_isolation ON payment_links FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID OR current_setting('app.bypass_rls', true)::boolean = true);

DROP POLICY IF EXISTS mba_tenant_isolation ON merchant_bank_accounts;
CREATE POLICY mba_tenant_isolation ON merchant_bank_accounts FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID OR current_setting('app.bypass_rls', true)::boolean = true);

-- Grants
GRANT SELECT, INSERT, UPDATE ON payment_links TO authenticated;
GRANT ALL ON payment_links TO service_role;

GRANT SELECT, INSERT, UPDATE ON merchant_bank_accounts TO authenticated;
GRANT ALL ON merchant_bank_accounts TO service_role;
