-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 026_ai_agent_module.sql
-- Description: نظام وكيل الذكاء الاصطناعي الكامل (AI Agent Module)
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- ملاحظات:
-- هذا الملف يُنشئ نظام AI Agent كامل كما في الخطة
-- يشمل: Agents، Conversations، Messages، Knowledge Base، Analytics
-- جميع الجداول معزولة بـ RLS لكل Tenant
-- ───────────────────────────────────────────────────────────────────────────────

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: ai_agents (وكلاء الذكاء الاصطناعي)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- المعلومات الأساسية
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- نوع الوكيل
  agent_type VARCHAR(50) NOT NULL DEFAULT 'support',
  -- support | sales | hr | custom
  
  -- النموذج المستخدم
  model_provider VARCHAR(50) DEFAULT 'anthropic',
  -- openai | anthropic | google | msaed
  
  model_name VARCHAR(100) DEFAULT 'claude-sonnet-4-5',
  -- claude-sonnet-4 | gpt-4-turbo | gemini-pro | msaed-chat-v1
  
  -- إعدادات النموذج
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  
  -- System Prompt
  system_prompt TEXT NOT NULL DEFAULT 'أنت مساعد ذكي ومفيد.',
  
  -- القنوات المفعلة
  channels TEXT[] DEFAULT '{}',
  -- website | whatsapp | snap | telegram
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  
  -- التصميم
  avatar_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#6c63ff',
  welcome_message TEXT DEFAULT 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
  
  -- الإعدادات المتقدمة
  settings JSONB DEFAULT '{}'::jsonb,
  -- {"use_rag": true, "max_context_docs": 5, "similarity_threshold": 0.7}
  
  -- الإحصاءات
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  satisfaction_rate NUMERIC(3, 2) DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_agents_tenant ON ai_agents(tenant_id);
CREATE INDEX idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX idx_ai_agents_active ON ai_agents(is_active);
CREATE INDEX idx_ai_agents_channels ON ai_agents USING GIN(channels);

-- Comments
COMMENT ON TABLE ai_agents IS 'وكلاء الذكاء الاصطناعي لكل Tenant';
COMMENT ON COLUMN ai_agents.channels IS 'القنوات المفعلة: website, whatsapp, snap, telegram';
COMMENT ON COLUMN ai_agents.settings IS 'إعدادات متقدمة: RAG, context limits, etc.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: ai_conversations (المحادثات)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  
  -- معلومات الجلسة
  session_id VARCHAR(100) NOT NULL,
  conversation_id VARCHAR(100), -- من القناة الخارجية (WhatsApp, etc.)
  
  -- القناة
  channel VARCHAR(50) DEFAULT 'website',
  -- website | whatsapp | snap | telegram | api
  
  -- العميل
  customer_id VARCHAR(200), -- معرف العميل في النظام الخارجي
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- الحالة
  status VARCHAR(30) DEFAULT 'active',
  -- active | paused | closed | escalated | flagged
  
  -- السياق
  context JSONB DEFAULT '{}'::jsonb,
  -- {"user_agent": "...", "ip": "...", "page_url": "...", "metadata": {}}
  
  -- التقييم
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- التصعيد
  escalated_to UUID, -- user_id
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- الإحصاءات
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost NUMERIC(10, 6) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  
  -- التواريخ
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX idx_ai_conversations_agent ON ai_conversations(agent_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_channel ON ai_conversations(channel);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX idx_ai_conversations_customer ON ai_conversations(customer_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX idx_ai_conversations_last_message ON ai_conversations(last_message_at DESC);

-- Comments
COMMENT ON TABLE ai_conversations IS 'محادثات AI Agent مع العملاء';
COMMENT ON COLUMN ai_conversations.context IS 'سياق المحادثة: browser info, page url, etc.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: ai_messages (الرسائل)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- نوع الرسالة
  message_type VARCHAR(30) NOT NULL,
  -- text | image | audio | file | quick_reply
  
  -- الدور
  role VARCHAR(30) NOT NULL,
  -- user | assistant | system | human
  
  -- المحتوى
  content TEXT NOT NULL,
  content_json JSONB, -- للمحتوى المنظم
  
  -- الوسائط
  media_url TEXT,
  media_type VARCHAR(50),
  
  -- AI Metadata
  model_used VARCHAR(100),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  
  -- RAG Context
  rag_context UUID[] DEFAULT '{}', -- معرفات المستندات المستخدمة
  
  -- الحالة
  is_visible BOOLEAN DEFAULT true,
  is_edited BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_tenant ON ai_messages(tenant_id);
CREATE INDEX idx_ai_messages_role ON ai_messages(role);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at DESC);
CREATE INDEX idx_ai_messages_rag_context ON ai_messages USING GIN(rag_context);

-- Comments
COMMENT ON TABLE ai_messages IS 'رسائل المحادثات مع AI Agent';
COMMENT ON COLUMN ai_messages.rag_context IS 'معرفات مستندات RAG المستخدمة في الرد';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: ai_knowledge_base (قاعدة المعرفة)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- النوع
  knowledge_type VARCHAR(50) DEFAULT 'document',
  -- document | faq | url | manual
  
  -- المصدر
  source_url TEXT,
  source_file_name VARCHAR(255),
  source_file_size INTEGER,
  
  -- المحتوى
  content TEXT NOT NULL,
  content_hash VARCHAR(64),
  
  -- Vector Embedding
  embedding vector(1536),
  
  -- التصنيف
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- اللغة
  language VARCHAR(10) DEFAULT 'ar',
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  processing_status VARCHAR(20) DEFAULT 'pending',
  -- pending | processing | completed | failed
  
  -- الاستخدام
  usage_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- {"chunk_index": 0, "total_chunks": 5, "original_id": "..."}
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_knowledge_base_tenant ON ai_knowledge_base(tenant_id);
CREATE INDEX idx_ai_knowledge_base_type ON ai_knowledge_base(knowledge_type);
CREATE INDEX idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX idx_ai_knowledge_base_language ON ai_knowledge_base(language);
CREATE INDEX idx_ai_knowledge_base_active ON ai_knowledge_base(is_active);
CREATE INDEX idx_ai_knowledge_base_tags ON ai_knowledge_base USING GIN(tags);
CREATE INDEX idx_ai_knowledge_base_embedding 
  ON ai_knowledge_base USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Comments
COMMENT ON TABLE ai_knowledge_base IS 'قاعدة المعرفة لـ AI Agent (RAG)';
COMMENT ON COLUMN ai_knowledge_base.embedding IS 'Vector embedding للاسترجاع التشابهي';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: ai_analytics (تحليلات AI)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- الفترة
  period_date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  -- hourly | daily | weekly | monthly
  
  -- الإحصاءات
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  
  -- الأداء
  avg_response_time_ms INTEGER DEFAULT 0,
  avg_tokens_per_message INTEGER DEFAULT 0,
  
  -- التكلفة
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10, 6) DEFAULT 0,
  
  -- الجودة
  avg_rating NUMERIC(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  resolution_rate NUMERIC(5, 4) DEFAULT 0,
  escalation_rate NUMERIC(5, 4) DEFAULT 0,
  
  -- القنوات
  channel_breakdown JSONB DEFAULT '{}'::jsonb,
  -- {"website": 100, "whatsapp": 50, "snap": 25}
  
  -- الأسئلة الشائعة
  top_questions JSONB DEFAULT '[]'::jsonb,
  -- [{"question": "...", "count": 10}, ...]
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE (tenant_id, agent_id, period_date, period_type)
);

-- Indexes
CREATE INDEX idx_ai_analytics_tenant ON ai_analytics(tenant_id);
CREATE INDEX idx_ai_analytics_agent ON ai_analytics(agent_id);
CREATE INDEX idx_ai_analytics_period ON ai_analytics(period_date);
CREATE INDEX idx_ai_analytics_type ON ai_analytics(period_type);

-- Comments
COMMENT ON TABLE ai_analytics IS 'تحليلات وأداء AI Agents';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: ai_channel_configs (إعدادات القنوات)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_channel_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- القناة
  channel VARCHAR(50) NOT NULL,
  -- whatsapp | snap | telegram | website
  
  -- الإعدادات
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- WhatsApp: {"phone_number": "...", "api_key": "..."}
  -- Snapchat: {"app_id": "...", "api_key": "..."}
  -- Telegram: {"bot_token": "..."}
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  webhook_url TEXT,
  last_sync_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_channel_configs_tenant ON ai_channel_configs(tenant_id);
CREATE INDEX idx_ai_channel_configs_agent ON ai_channel_configs(agent_id);
CREATE INDEX idx_ai_channel_configs_channel ON ai_channel_configs(channel);
CREATE INDEX idx_ai_channel_configs_active ON ai_channel_configs(is_active);

-- Comments
COMMENT ON TABLE ai_channel_configs IS 'إعدادات قنوات التواصل للـ AI Agent';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function: Search Knowledge Base (RAG)
CREATE OR REPLACE FUNCTION search_ai_knowledge(
  p_tenant_id UUID,
  p_embedding vector(1536),
  p_limit INTEGER DEFAULT 5,
  p_categories TEXT[] DEFAULT NULL,
  p_min_similarity FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  similarity FLOAT,
  category VARCHAR(100),
  tags TEXT[],
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> p_embedding) AS similarity,
    kb.category,
    kb.tags,
    kb.usage_count
  FROM ai_knowledge_base kb
  WHERE kb.tenant_id = p_tenant_id
    AND kb.is_active = true
    AND kb.processing_status = 'completed'
    AND (p_categories IS NULL OR kb.category = ANY(p_categories))
    AND (1 - (kb.embedding <=> p_embedding)) >= p_min_similarity
  ORDER BY kb.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_ai_knowledge IS 'البحث في قاعدة المعرفة باستخدام Vector Similarity (RAG)';

-- Function: Create Conversation
CREATE OR REPLACE FUNCTION create_ai_conversation(
  p_tenant_id UUID,
  p_agent_id UUID,
  p_session_id VARCHAR,
  p_channel VARCHAR DEFAULT 'website',
  p_customer_id VARCHAR DEFAULT NULL,
  p_customer_name VARCHAR DEFAULT NULL,
  p_customer_email VARCHAR DEFAULT NULL,
  p_customer_phone VARCHAR DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  INSERT INTO ai_conversations (
    tenant_id, agent_id, session_id, channel,
    customer_id, customer_name, customer_email, customer_phone,
    context, status, started_at
  ) VALUES (
    p_tenant_id, p_agent_id, p_session_id, p_channel,
    p_customer_id, p_customer_name, p_customer_email, p_customer_phone,
    p_context, 'active', NOW()
  ) RETURNING id INTO v_conversation_id;
  
  -- Update agent stats
  UPDATE ai_agents
  SET total_conversations = total_conversations + 1
  WHERE id = p_agent_id AND tenant_id = p_tenant_id;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_ai_conversation IS 'إنشاء محادثة جديدة وتحديث إحصائيات الوكيل';

-- Function: Add Message
CREATE OR REPLACE FUNCTION add_ai_message(
  p_conversation_id UUID,
  p_tenant_id UUID,
  p_role VARCHAR,
  p_content TEXT,
  p_message_type VARCHAR DEFAULT 'text',
  p_content_json JSONB DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_media_type VARCHAR DEFAULT NULL,
  p_model_used VARCHAR DEFAULT NULL,
  p_prompt_tokens INTEGER DEFAULT 0,
  p_completion_tokens INTEGER DEFAULT 0,
  p_total_tokens INTEGER DEFAULT 0,
  p_cost_usd NUMERIC DEFAULT 0,
  p_latency_ms INTEGER DEFAULT 0,
  p_rag_context UUID[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO ai_messages (
    conversation_id, tenant_id, role, content,
    message_type, content_json, media_url, media_type,
    model_used, prompt_tokens, completion_tokens, total_tokens,
    cost_usd, latency_ms, rag_context, metadata
  ) VALUES (
    p_conversation_id, p_tenant_id, p_role, p_content,
    p_message_type, p_content_json, p_media_url, p_media_type,
    p_model_used, p_prompt_tokens, p_completion_tokens, p_total_tokens,
    p_cost_usd, p_latency_ms, p_rag_context, p_metadata
  ) RETURNING id INTO v_message_id;
  
  -- Update conversation stats
  UPDATE ai_conversations
  SET 
    message_count = message_count + 1,
    total_tokens = total_tokens + p_total_tokens,
    total_cost = total_cost + p_cost_usd,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_conversation_id;
  
  -- Update agent stats
  UPDATE ai_agents
  SET 
    total_messages = total_messages + 1,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_ai_message IS 'إضافة رسالة وتحديث الإحصائيات';

-- Function: Rate Conversation
CREATE OR REPLACE FUNCTION rate_ai_conversation(
  p_conversation_id UUID,
  p_rating INTEGER,
  p_feedback TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_conversations
  SET 
    rating = p_rating,
    feedback = p_feedback,
    updated_at = NOW()
  WHERE id = p_conversation_id;
  
  -- Update agent satisfaction rate
  WITH agent_stats AS (
    SELECT 
      agent_id,
      AVG(rating) as avg_rating,
      COUNT(*) FILTER (WHERE rating IS NOT NULL) as total_ratings
    FROM ai_conversations
    WHERE agent_id = (SELECT agent_id FROM ai_conversations WHERE id = p_conversation_id)
      AND rating IS NOT NULL
    GROUP BY agent_id
  )
  UPDATE ai_agents
  SET 
    satisfaction_rate = COALESCE((SELECT avg_rating FROM agent_stats), 0),
    updated_at = NOW()
  WHERE id = (SELECT agent_id FROM ai_conversations WHERE id = p_conversation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rate_ai_conversation IS 'تقييم المحادثة وتحديث معدل الرضا';

-- Function: Get Analytics
CREATE OR REPLACE FUNCTION get_ai_agent_analytics(
  p_tenant_id UUID,
  p_agent_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  total_conversations BIGINT,
  total_messages BIGINT,
  total_users BIGINT,
  avg_response_time_ms BIGINT,
  total_tokens BIGINT,
  total_cost_usd NUMERIC,
  avg_rating NUMERIC,
  resolution_rate NUMERIC,
  escalation_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(c.started_at) as date,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    COUNT(DISTINCT c.customer_id) as total_users,
    AVG(c.avg_response_time_ms)::BIGINT as avg_response_time_ms,
    COALESCE(SUM(c.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(c.total_cost), 0)::NUMERIC as total_cost_usd,
    AVG(c.rating)::NUMERIC as avg_rating,
    (COUNT(*) FILTER (WHERE c.status = 'closed')::NUMERIC / NULLIF(COUNT(*), 0)) as resolution_rate,
    (COUNT(*) FILTER (WHERE c.status = 'escalated')::NUMERIC / NULLIF(COUNT(*), 0)) as escalation_rate
  FROM ai_conversations c
  LEFT JOIN ai_messages m ON m.conversation_id = c.id
  WHERE c.tenant_id = p_tenant_id
    AND (p_agent_id IS NULL OR c.agent_id = p_agent_id)
    AND (p_start_date IS NULL OR c.started_at >= p_start_date)
    AND (p_end_date IS NULL OR c.started_at <= p_end_date)
  GROUP BY DATE(c.started_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_ai_agent_analytics IS 'الحصول على تحليلات AI Agent';

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_channel_configs ENABLE ROW LEVEL SECURITY;

-- AI Agents Policies
CREATE POLICY ai_agents_tenant_isolation ON ai_agents
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_agents_service_role ON ai_agents
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Conversations Policies
CREATE POLICY ai_conversations_tenant_isolation ON ai_conversations
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_conversations_user_access ON ai_conversations
  FOR SELECT USING (
    customer_id = CURRENT_SETTING('app.current_user_id')::TEXT 
    OR CURRENT_SETTING('role') = 'service_role'
  );

CREATE POLICY ai_conversations_service_role ON ai_conversations
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Messages Policies
CREATE POLICY ai_messages_tenant_isolation ON ai_messages
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_messages_service_role ON ai_messages
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Knowledge Base Policies
CREATE POLICY ai_knowledge_base_tenant_isolation ON ai_knowledge_base
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_knowledge_base_service_role ON ai_knowledge_base
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Analytics Policies
CREATE POLICY ai_analytics_tenant_isolation ON ai_analytics
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_analytics_service_role ON ai_analytics
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Channel Configs Policies
CREATE POLICY ai_channel_configs_tenant_isolation ON ai_channel_configs
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_channel_configs_service_role ON ai_channel_configs
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_knowledge_base_updated_at
  BEFORE UPDATE ON ai_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_channel_configs_updated_at
  BEFORE UPDATE ON ai_channel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- Default Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert default agent template
INSERT INTO ai_agents (name, agent_type, system_prompt, welcome_message, is_public) VALUES
  (
    'مساعد الدعم الذكي',
    'support',
    'أنت مساعد دعم فني محترف لمنصة SaaS.
- تحدث باللهجة السعودية المهذبة
- كن مختصراً ومفيداً
- استخدم المصطلحات التقنية بالعربي
- إذا لم تجد الإجابة، اعتذر بلباقة واقترح التواصل مع الدعم البشري',
    'مرحباً! 👋 كيف يمكنني مساعدتك اليوم؟',
    true
  )
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
