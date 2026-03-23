-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 031_campaigns.sql (Fixed)
-- Description: نظام الحملات التسويقية متعددة القنوات
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table: marketing_campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  channel VARCHAR(20) NOT NULL,
  goal VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  audience_filter JSONB NOT NULL DEFAULT '{}',
  message_ar TEXT NOT NULL,
  message_en TEXT,
  subject_line VARCHAR(200),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10, 2),
  cost_actual NUMERIC(10, 2),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: campaign_recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id UUID,
  email VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON marketing_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);

-- RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE ON marketing_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campaign_recipients TO authenticated;
GRANT ALL ON marketing_campaigns TO service_role;
GRANT ALL ON campaign_recipients TO service_role;
