-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 026_ai_agent_module.sql (Fixed)
-- Description: نظام وكيل الذكاء الاصطناعي الكامل
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table: ai_agents
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  agent_type VARCHAR(50) NOT NULL DEFAULT 'support',
  model_provider VARCHAR(50) DEFAULT 'anthropic',
  model_name VARCHAR(100) DEFAULT 'claude-sonnet-4-5',
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT NOT NULL DEFAULT 'أنت مساعد ذكي ومفيد.',
  channels TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  avatar_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#6c63ff',
  welcome_message TEXT DEFAULT 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
  settings JSONB DEFAULT '{}',
  total_conversations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ai_conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id UUID,
  session_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ai_messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ai_knowledge_base
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  source_url VARCHAR(500),
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_tenant ON ai_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tenant ON ai_knowledge_base(tenant_id);

-- RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE ON ai_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_knowledge_base TO authenticated;
GRANT ALL ON ai_agents TO service_role;
GRANT ALL ON ai_conversations TO service_role;
GRANT ALL ON ai_messages TO service_role;
GRANT ALL ON ai_knowledge_base TO service_role;
