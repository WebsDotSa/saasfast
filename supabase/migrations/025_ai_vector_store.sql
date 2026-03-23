-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 025_ai_vector_store.sql
-- Description: جداول الذكاء الاصطناعي وتخجهيز متجهات (Vector Store)
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- ملاحظات مهمة
-- ───────────────────────────────────────────────────────────────────────────────
-- هذه الهجرة تُنشئ البنية التحتية الكاملة للذكاء الاصطناعي
-- تشمل: pgvector، جداول المعرفة، المحادثات، وسجل الاستخدام
-- جميع الجداول معزولة بـ RLS لكل Tenant

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_documents (مستندات المعرفة لـ RAG)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- نوع المستند
  document_type VARCHAR(50) NOT NULL,
  -- knowledge_base | product_info | faq | support_ticket | user_manual | blog_post
  
  -- المعلومات الأساسية
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  content_hash VARCHAR(64),
  
  -- Vector embedding (1536 dimensions for OpenAI/text-embedding-3-large)
  -- يمكن تغييره لـ 1024 لـ Claude embeddings
  embedding vector(1536),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- {"source": "imported", "language": "ar", "category": "billing", "tags": [...]}
  
  -- الوصول
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vector similarity search
CREATE INDEX idx_ai_documents_tenant ON ai_documents(tenant_id);
CREATE INDEX idx_ai_documents_type ON ai_documents(document_type);
CREATE INDEX idx_ai_documents_is_active ON ai_documents(is_active);
CREATE INDEX idx_ai_documents_tags ON ai_documents USING GIN(tags);

-- Vector similarity index using ivfflat for fast approximate nearest neighbor search
CREATE INDEX idx_ai_documents_embedding 
  ON ai_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Comments
COMMENT ON TABLE ai_documents IS 'مستندات المعرفة لـ RAG (Retrieval-Augmented Generation)';
COMMENT ON COLUMN ai_documents.embedding IS 'Vector embedding للاسترجاع التشابهي';
COMMENT ON COLUMN ai_documents.metadata IS 'بيانات إضافية: source, language, category, etc.';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_conversations (محادثات AI)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  
  -- نوع المحادثة
  conversation_type VARCHAR(50) NOT NULL,
  -- support_chat | analytics_query | content_generation | data_analysis | general
  
  -- الجلسة
  session_id VARCHAR(100) NOT NULL,
  title VARCHAR(500),
  
  -- الرسائل
  messages JSONB DEFAULT '[]'::jsonb,
  -- [{"role": "system", "content": "..."},
  --  {"role": "user", "content": "...", "timestamp": "..."},
  --  {"role": "assistant", "content": "...", "model": "...", "tokens": 123}]
  
  -- السياق المستخدم (RAG documents)
  context_documents UUID[] DEFAULT '{}',
  
  -- التقييم
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- التكلفة والاستخدام
  total_tokens INTEGER DEFAULT 0,
  total_cost NUMERIC(10, 6) DEFAULT 0,
  model_used VARCHAR(100),
  
  -- الحالة
  status VARCHAR(20) DEFAULT 'active',
  -- active | archived | flagged
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_type ON ai_conversations(conversation_type);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX idx_ai_conversations_context ON ai_conversations USING GIN(context_documents);

-- Comments
COMMENT ON TABLE ai_conversations IS 'سجل محادثات AI مع المستخدمين';
COMMENT ON COLUMN ai_conversations.context_documents IS 'معرّفات مستندات RAG المستخدمة';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_usage_logs (سجل استخدام AI)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  
  -- نوع الطلب
  request_type VARCHAR(50) NOT NULL,
  -- chat | completion | embedding | image_generation
  
  -- النموذج المستخدم
  model_used VARCHAR(100) NOT NULL,
  -- claude-sonnet-4 | gpt-4-turbo | msaed-chat-v1 | gemini-pro
  
  -- الاستخدام (Tokens)
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- التكلفة
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  cost_sar NUMERIC(10, 2) DEFAULT 0,
  
  -- الأداء
  latency_ms INTEGER DEFAULT 0,
  
  -- النجاح/الفشل
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- السياق
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  prompt_text TEXT,
  response_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- معلومات الطلب
  ip_address INET,
  user_agent TEXT,
  
  -- timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_usage_logs_tenant ON ai_usage_logs(tenant_id);
CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_type ON ai_usage_logs(request_type);
CREATE INDEX idx_ai_usage_logs_model ON ai_usage_logs(model_used);
CREATE INDEX idx_ai_usage_logs_success ON ai_usage_logs(success);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_conversation ON ai_usage_logs(conversation_id);

-- Comments
COMMENT ON TABLE ai_usage_logs IS 'سجل تفصيلي لاستخدام AI للتكلفة والتحليل';
COMMENT ON COLUMN ai_usage_logs.cost_usd IS 'التكلفة بالدولار الأمريكي';
COMMENT ON COLUMN ai_usage_logs.cost_sar IS 'التكلفة بالريال السعودي';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_knowledge_base (قاعدة المعرفة للمنشآت)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- النوع
  knowledge_type VARCHAR(50) DEFAULT 'custom',
  -- custom | imported | auto_generated
  
  -- المصدر
  source_url TEXT,
  source_file VARCHAR(255),
  
  -- المحتوى
  content TEXT NOT NULL,
  
  -- التصنيف
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- اللغة
  language VARCHAR(10) DEFAULT 'ar',
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_processed BOOLEAN DEFAULT false,
  
  -- Embedding status
  embedding_status VARCHAR(20) DEFAULT 'pending',
  -- pending | processing | completed | failed
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_knowledge_base_tenant ON ai_knowledge_base(tenant_id);
CREATE INDEX idx_ai_knowledge_base_type ON ai_knowledge_base(knowledge_type);
CREATE INDEX idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX idx_ai_knowledge_base_language ON ai_knowledge_base(language);
CREATE INDEX idx_ai_knowledge_base_status ON ai_knowledge_base(is_active);
CREATE INDEX idx_ai_knowledge_base_tags ON ai_knowledge_base USING GIN(tags);

-- Comments
COMMENT ON TABLE ai_knowledge_base IS 'قاعدة المعرفة الخاصة بكل منشأة لـ AI Support';

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_models (سجل النماذج المستخدمة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معلومات النموذج
  model_name VARCHAR(100) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  -- openai | anthropic | google | msaed
  
  -- التسعير
  input_cost_per_1k NUMERIC(10, 8) DEFAULT 0,
  output_cost_per_1k NUMERIC(10, 8) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- المواصفات
  max_tokens INTEGER,
  context_window INTEGER,
  supports_vision BOOLEAN DEFAULT false,
  supports_functions BOOLEAN DEFAULT false,
  
  -- الأداء
  avg_latency_ms INTEGER,
  reliability_score NUMERIC(3, 2) DEFAULT 1.0,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_ai_models_name ON ai_models(model_name);
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);

-- Comments
COMMENT ON TABLE ai_models IS 'سجل نماذج AI المتاحة مع التسعير والمواصفات';

-- Insert default models
INSERT INTO ai_models (model_name, provider, input_cost_per_1k, output_cost_per_1k, max_tokens, context_window, is_default) VALUES
  ('claude-sonnet-4-5', 'anthropic', 0.003, 0.015, 4096, 200000, true),
  ('gpt-4-turbo', 'openai', 0.01, 0.03, 4096, 128000, false),
  ('msaed-chat-v1', 'msaed', 0.002, 0.006, 2048, 32000, false),
  ('gemini-pro', 'google', 0.0005, 0.0015, 2048, 32000, false)
ON CONFLICT (model_name) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_prompts (مكتبة قوالب Prompts)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- النوع
  prompt_type VARCHAR(50) NOT NULL,
  -- support_chat | content_generation | analytics | translation
  
  -- القالب
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  
  -- الإعدادات
  model VARCHAR(100) DEFAULT 'claude-sonnet-4-5',
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  
  -- المتغيرات
  variables TEXT[] DEFAULT '{}',
  -- ["question", "context", "history"]
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  
  -- الإحصاءات
  usage_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3, 2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_prompts_tenant ON ai_prompts(tenant_id);
CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active);

-- Comments
COMMENT ON TABLE ai_prompts IS 'مكتبة قوالب Prompts المخصصة';

-- Insert default prompts
INSERT INTO ai_prompts (name, prompt_type, system_prompt, user_prompt_template, variables, is_system) VALUES
  (
    'دعم فني عربي',
    'support_chat',
    'أنت مساعد دعم فني محترف لمنصة SaaS.
- تحدث باللهجة السعودية المهذبة
- كن مختصراً ومفيداً
- استخدم المصطلحات التقنية بالعربي
- إذا لم تجد الإجابة، اعتذر بلباقة واقترح التواصل مع الدعم البشري',
    'السؤال: {{question}}
سياق العميل: {{customer_context}}
المنتجات المستخدمة: {{products}}
السجل السابق: {{history}}',
    ARRAY['question', 'customer_context', 'products', 'history'],
    true
  ),
  (
    'وصف منتجات',
    'content_generation',
    'أنت كاتب محتوى متخصص في وصف المنتجات للتجارة الإلكترونية.
- اكتب وصفاً جذاباً ومقنعاً
- استخدم كلمات مفتاحية لـ SEO
- اذكر الميزات والفوائد
- الطول: 150-200 كلمة',
    'اسم المنتج: {{product_name}}
التصنيف: {{category}}
الميزات الرئيسية: {{features}}
الجمهور المستهدف: {{target_audience}}
نبرة الصوت: {{tone}}',
    ARRAY['product_name', 'category', 'features', 'target_audience', 'tone'],
    true
  ),
  (
    'تحليل بيانات',
    'analytics',
    'أنت محلل بيانات خبير.
- حلل الاتجاهات والأنماط
- قدم توصيات قابلة للتنفيذ
- استخدم الأرقام والإحصائيات
- حذر من المخاطر المحتملة',
    'بيانات المبيعات: {{sales_data}}
بيانات العملاء: {{customer_data}}
الموسم الحالي: {{season}}
أهداف العمل: {{goals}}',
    ARRAY['sales_data', 'customer_data', 'season', 'goals'],
    true
  )
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: ai_quotas (حدود الاستخدام لكل خطة)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  
  -- الحدود
  monthly_token_limit INTEGER NOT NULL DEFAULT 50000,
  monthly_cost_limit_usd NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  daily_request_limit INTEGER NOT NULL DEFAULT 100,
  max_concurrent_requests INTEGER NOT NULL DEFAULT 2,
  
  -- الأسعار
  overage_cost_per_1k_tokens NUMERIC(10, 6) DEFAULT 0.02,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_quotas_plan ON ai_quotas(plan_id);

-- Comments
COMMENT ON TABLE ai_quotas IS 'حدود استخدام AI لكل خطة اشتراك';

-- Insert default quotas
INSERT INTO ai_quotas (plan_id, monthly_token_limit, monthly_cost_limit_usd, daily_request_limit, max_concurrent_requests, overage_cost_per_1k_tokens)
SELECT 
  p.id,
  CASE p.name_ar
    WHEN 'الخطة الأساسية' THEN 50000
    WHEN 'الخطة الاحترافية' THEN 500000
    WHEN 'خطة الشركات' THEN 5000000
    ELSE 50000
  END,
  CASE p.name_ar
    WHEN 'الخطة الأساسية' THEN 10.00
    WHEN 'الخطة الاحترافية' THEN 100.00
    WHEN 'خطة الشركات' THEN 1000.00
    ELSE 10.00
  END,
  CASE p.name_ar
    WHEN 'الخطة الأساسية' THEN 100
    WHEN 'الخطة الاحترافية' THEN 1000
    WHEN 'خطة الشركات' THEN 10000
    ELSE 100
  END,
  CASE p.name_ar
    WHEN 'الخطة الأساسية' THEN 2
    WHEN 'الخطة الاحترافية' THEN 5
    WHEN 'خطة الشركات' THEN 20
    ELSE 2
  END,
  0.02
FROM plans p
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────────
-- Functions
-- ───────────────────────────────────────────────────────────────────────────────

-- Function: Similarity Search (RAG)
CREATE OR REPLACE FUNCTION search_similar_documents(
  p_tenant_id UUID,
  p_embedding vector(1536),
  p_limit INTEGER DEFAULT 5,
  p_document_types TEXT[] DEFAULT NULL,
  p_min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  document_type VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    1 - (d.embedding <=> p_embedding) AS similarity,
    d.metadata,
    d.document_type
  FROM ai_documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.is_active = true
    AND (p_document_types IS NULL OR d.document_type = ANY(p_document_types))
    AND (1 - (d.embedding <=> p_embedding)) >= p_min_similarity
  ORDER BY d.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_similar_documents IS 'بحث عن مستندات مشابهة باستخدام Vector Similarity (RAG)';

-- Function: Track AI Usage
CREATE OR REPLACE FUNCTION track_ai_usage(
  p_tenant_id UUID,
  p_user_id UUID,
  p_request_type VARCHAR,
  p_model_used VARCHAR,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_total_tokens INTEGER,
  p_cost_usd NUMERIC,
  p_latency_ms INTEGER,
  p_success BOOLEAN,
  p_conversation_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
  v_cost_sar NUMERIC;
BEGIN
  -- Convert USD to SAR
  v_cost_sar := p_cost_usd * 3.75;
  
  -- Insert usage log
  INSERT INTO ai_usage_logs (
    tenant_id, user_id, request_type, model_used,
    prompt_tokens, completion_tokens, total_tokens,
    cost_usd, cost_sar, latency_ms, success,
    conversation_id, metadata
  ) VALUES (
    p_tenant_id, p_user_id, p_request_type, p_model_used,
    p_prompt_tokens, p_completion_tokens, p_total_tokens,
    p_cost_usd, v_cost_sar, p_latency_ms, p_success,
    p_conversation_id, p_metadata
  );
  
  -- Update conversation totals if provided
  IF p_conversation_id IS NOT NULL THEN
    UPDATE ai_conversations
    SET 
      total_tokens = total_tokens + p_total_tokens,
      total_cost = total_cost + v_cost_sar,
      updated_at = NOW()
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_ai_usage IS 'تتبع استخدام AI وتحديث السجلات';

-- Function: Get Current Usage
CREATE OR REPLACE FUNCTION get_ai_usage_current_month(
  p_tenant_id UUID
)
RETURNS TABLE (
  total_tokens BIGINT,
  total_cost_usd NUMERIC,
  total_cost_sar NUMERIC,
  total_requests BIGINT,
  period_start DATE,
  period_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ul.total_tokens), 0)::BIGINT,
    COALESCE(SUM(ul.cost_usd), 0)::NUMERIC,
    COALESCE(SUM(ul.cost_sar), 0)::NUMERIC,
    COALESCE(COUNT(*), 0)::BIGINT,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
  FROM ai_usage_logs ul
  WHERE ul.tenant_id = p_tenant_id
    AND ul.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND ul.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_ai_usage_current_month IS 'الحصول على استخدام AI للشهر الحالي';

-- Function: Check Quota
CREATE OR REPLACE FUNCTION check_ai_quota(
  p_tenant_id UUID
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_tokens BIGINT,
  remaining_cost_usd NUMERIC,
  remaining_requests BIGINT,
  quota_tokens BIGINT,
  quota_cost_usd NUMERIC,
  quota_requests BIGINT
) AS $$
DECLARE
  v_plan_id UUID;
  v_usage RECORD;
  v_quota ai_quotas%ROWTYPE;
BEGIN
  -- Get tenant's plan
  SELECT t.plan_id INTO v_plan_id
  FROM tenants t
  WHERE t.id = p_tenant_id;
  
  -- Get quota for plan
  SELECT * INTO v_quota
  FROM ai_quotas q
  WHERE q.plan_id = v_plan_id
    AND q.is_active = true
  LIMIT 1;
  
  -- If no quota found, use default
  IF v_quota.id IS NULL THEN
    v_quota.monthly_token_limit := 50000;
    v_quota.monthly_cost_limit_usd := 10.00;
    v_quota.daily_request_limit := 100;
  END IF;
  
  -- Get current usage
  SELECT * INTO v_usage
  FROM get_ai_usage_current_month(p_tenant_id);
  
  -- Calculate remaining
  RETURN QUERY
  SELECT 
    (v_usage.total_tokens < v_quota.monthly_token_limit 
     AND v_usage.total_cost_usd < v_quota.monthly_cost_limit_usd
     AND v_usage.total_requests < v_quota.daily_request_limit) AS allowed,
    (v_quota.monthly_token_limit - v_usage.total_tokens)::BIGINT AS remaining_tokens,
    (v_quota.monthly_cost_limit_usd - v_usage.total_cost_usd)::NUMERIC AS remaining_cost_usd,
    (v_quota.daily_request_limit - v_usage.total_requests)::BIGINT AS remaining_requests,
    v_quota.monthly_token_limit::BIGINT AS quota_tokens,
    v_quota.monthly_cost_limit_usd::NUMERIC AS quota_cost_usd,
    v_quota.daily_request_limit::BIGINT AS quota_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_ai_quota IS 'التحقق من حصة AI المتبقية';

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ───────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all AI tables
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- AI Documents Policies
CREATE POLICY ai_documents_tenant_isolation ON ai_documents
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_documents_service_role ON ai_documents
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Conversations Policies
CREATE POLICY ai_conversations_tenant_isolation ON ai_conversations
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_conversations_user_access ON ai_conversations
  FOR SELECT USING (user_id = CURRENT_SETTING('app.current_user_id')::UUID);

CREATE POLICY ai_conversations_service_role ON ai_conversations
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Usage Logs Policies
CREATE POLICY ai_usage_logs_tenant_isolation ON ai_usage_logs
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_usage_logs_service_role ON ai_usage_logs
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Knowledge Base Policies
CREATE POLICY ai_knowledge_base_tenant_isolation ON ai_knowledge_base
  FOR ALL USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);

CREATE POLICY ai_knowledge_base_service_role ON ai_knowledge_base
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- AI Prompts Policies
CREATE POLICY ai_prompts_tenant_isolation ON ai_prompts
  FOR ALL USING (
    tenant_id IS NULL 
    OR tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID
  );

CREATE POLICY ai_prompts_service_role ON ai_prompts
  FOR ALL USING (CURRENT_SETTING('role') = 'service_role');

-- ───────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ───────────────────────────────────────────────────────────────────────────────

-- Auto-update updated_at for ai_documents
CREATE TRIGGER update_ai_documents_updated_at
  BEFORE UPDATE ON ai_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for ai_conversations
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for ai_knowledge_base
CREATE TRIGGER update_ai_knowledge_base_updated_at
  BEFORE UPDATE ON ai_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for ai_prompts
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for ai_models
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for ai_quotas
CREATE TRIGGER update_ai_quotas_updated_at
  BEFORE UPDATE ON ai_quotas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
