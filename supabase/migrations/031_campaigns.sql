-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 031: Marketing Campaigns Module
-- ═══════════════════════════════════════════════════════════════════════════════
-- نظام الحملات التسويقية متعددة القنوات
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. Marketing Campaigns Table - جدول الحملات التسويقية
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  
  -- معلومات الحملة
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  
  -- القناة
  channel         VARCHAR(20) NOT NULL,
  -- sms | whatsapp | email | push | all
  
  -- الهدف
  goal            VARCHAR(50),
  -- promotion | retention | re_engagement | welcome | abandoned_cart | post_purchase
  
  -- الحالة
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- draft | scheduled | running | paused | completed | failed | cancelled
  
  -- فلتر الجمهور (JSON)
  audience_filter JSONB NOT NULL DEFAULT '{}',
  /*
   {
     "segment": "all" | "vip" | "new" | "inactive",
     "last_purchase_days": 90,
     "min_orders": 2,
     "min_spent": 500,
     "max_spent": null,
     "categories": [],
     "regions": [],
     "customer_ids": [],
     "exclude_customer_ids": []
   }
  */
  
  -- المحتوى
  message_ar      TEXT NOT NULL,
  message_en      TEXT,
  subject_line    VARCHAR(200),  -- للإيميل
  sender_name     VARCHAR(100),  -- للإيميل
  
  -- قالب جاهز
  template_id     VARCHAR(100),
  template_vars   JSONB DEFAULT '{}',
  
  -- التوقيت
  scheduled_at    TIMESTAMPTZ,
  timezone        VARCHAR(50) DEFAULT 'Asia/Riyadh',
  
  -- الإحصائيات
  total_recipients INTEGER DEFAULT 0,
  sent_count      INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count    INTEGER DEFAULT 0,
  clicked_count   INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  bounced_count   INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  
  -- الإيرادات
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  
  -- التكلفة
  total_cost      NUMERIC(10,2) DEFAULT 0,
  cost_per_message NUMERIC(10,4) DEFAULT 0,
  
  -- A/B Testing
  is_ab_test      BOOLEAN DEFAULT false,
  ab_test_variant VARCHAR(10),  -- A | B
  ab_test_winner  VARCHAR(10),
  
  -- بيانات إضافية
  metadata        JSONB DEFAULT '{}',
  
  -- timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  
  -- قيود
  CONSTRAINT valid_channel CHECK (channel IN ('sms', 'whatsapp', 'email', 'push', 'all')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_ab_variant CHECK (ab_test_variant IS NULL OR ab_test_variant IN ('A', 'B'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. Campaign Recipients Table - قائمة المستلمين
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  campaign_id     UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  
  -- معلومات العميل
  customer_id     UUID,
  customer_email  VARCHAR(255),
  customer_phone  VARCHAR(20),
  customer_name   VARCHAR(200),
  
  -- الحالة
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending | queued | sent | delivered | opened | clicked | converted | bounced | failed
  
  -- التتبع
  message_id      VARCHAR(255),  -- معرف الرسالة من المزود
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  
  -- التحويل
  order_id        UUID,  -- إذا تم تحويل
  revenue         NUMERIC(10,2) DEFAULT 0,
  
  -- أخطاء
  error_message   TEXT,
  error_code      VARCHAR(50),
  
  -- بيانات إضافية
  metadata        JSONB DEFAULT '{}',
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_recipient_status CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'bounced', 'failed'))
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. Campaign Clicks Table - تتبع النقرات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_clicks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL,
  campaign_id     UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  recipient_id    UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  
  -- معلومات النقرة
  url             TEXT NOT NULL,
  url_alias       VARCHAR(100),  -- رابط مختصر
  
  -- الزائر
  ip_address      INET,
  user_agent      TEXT,
  device_type     VARCHAR(50),  -- mobile | desktop | tablet
  browser         VARCHAR(100),
  os              VARCHAR(100),
  
  -- الموقع
  country         VARCHAR(100),
  city            VARCHAR(100),
  
  clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  metadata        JSONB DEFAULT '{}'
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. Email Templates Table - قوالب الإيميل
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID,  -- NULL = قالب عام للمنصة
  
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  
  -- النوع
  template_type   VARCHAR(50) NOT NULL,
  -- marketing | transactional | newsletter
  
  -- المحتوى
  subject         VARCHAR(500) NOT NULL,
  preview_text    VARCHAR(200),
  html_content    TEXT NOT NULL,
  text_content    TEXT,
  
  -- المتغيرات المتاحة
  variables       JSONB DEFAULT '[]',
  /*
   [
     {"name": "customer_name", "type": "string", "required": false},
     {"name": "discount_code", "type": "string", "required": false},
     {"name": "order_total", "type": "number", "required": false}
   ]
  */
  
  -- التصنيف
  category        VARCHAR(100),
  tags            VARCHAR(100)[],
  
  -- الحالة
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_public       BOOLEAN NOT NULL DEFAULT false,  -- متاح لكل المنشآت
  
  -- إحصائيات
  usage_count     INTEGER DEFAULT 0,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. SMS Templates Table - قوالب SMS
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID,
  
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  
  -- المحتوى
  content         TEXT NOT NULL,
  max_length      INTEGER DEFAULT 160,
  
  -- المتغيرات
  variables       JSONB DEFAULT '[]',
  
  -- الحالة
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────────────────
-- 6. Indexes - الفهارس
-- ───────────────────────────────────────────────────────────────────────────────

-- Campaigns indexes
CREATE INDEX idx_campaigns_tenant_status 
  ON marketing_campaigns(tenant_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_campaigns_tenant_scheduled 
  ON marketing_campaigns(tenant_id, scheduled_at) 
  WHERE status = 'scheduled' AND deleted_at IS NULL;

CREATE INDEX idx_campaigns_channel 
  ON marketing_campaigns(channel) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Recipients indexes
CREATE INDEX idx_recipients_campaign_status 
  ON campaign_recipients(campaign_id, status);

CREATE INDEX idx_recipients_customer 
  ON campaign_recipients(customer_id, campaign_id);

CREATE INDEX idx_recipients_created 
  ON campaign_recipients(created_at);

-- Clicks indexes
CREATE INDEX idx_clicks_campaign 
  ON campaign_clicks(campaign_id, clicked_at);

CREATE INDEX idx_clicks_recipient 
  ON campaign_clicks(recipient_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- 7. Comments - التعليقات
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE marketing_campaigns IS 'جدول الحملات التسويقية متعددة القنوات';
COMMENT ON COLUMN marketing_campaigns.channel IS 'sms: رسائل نصية, whatsapp: واتساب, email: إيميل, push: إشعارات, all: جميع القنوات';
COMMENT ON COLUMN marketing_campaigns.goal IS 'promotion: عرض ترويجي, retention: احتفاظ, re_engagement: إعادة تفاعل, welcome: ترحيب, abandoned_cart: سلة مهجورة, post_purchase: بعد الشراء';
COMMENT ON COLUMN marketing_campaigns.audience_filter IS 'JSON يحتوي على فلتر الجمهور المستهدف';
COMMENT ON TABLE campaign_recipients IS 'قائمة مستلمي الحملة وتتبع حالتهم';
COMMENT ON TABLE campaign_clicks IS 'سجل نقرات الروابط في الحملات';
COMMENT ON TABLE email_templates IS 'قوالب الإيميل الجاهزة';
COMMENT ON TABLE sms_templates IS 'قوالب رسائل SMS الجاهزة';

-- ───────────────────────────────────────────────────────────────────────────────
-- 8. Row Level Security (RLS)
-- ───────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for marketing_campaigns
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY campaigns_tenant_isolation_policy ON marketing_campaigns
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Allow reading active public campaigns
CREATE POLICY campaigns_read_public_policy ON marketing_campaigns
  FOR SELECT
  USING (
    (tenant_id = current_setting('app.current_tenant_id')::UUID)
    OR 
    (is_public = true AND status = 'active')
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for campaign_recipients
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY recipients_tenant_isolation_policy ON campaign_recipients
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for campaign_clicks
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY clicks_tenant_isolation_policy ON campaign_clicks
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies for templates
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY email_templates_tenant_policy ON email_templates
  FOR ALL
  USING (
    tenant_id IS NULL 
    OR tenant_id = current_setting('app.current_tenant_id')::UUID
  )
  WITH CHECK (
    tenant_id IS NULL 
    OR tenant_id = current_setting('app.current_tenant_id')::UUID
  );

CREATE POLICY sms_templates_tenant_policy ON sms_templates
  FOR ALL
  USING (
    tenant_id IS NULL 
    OR tenant_id = current_setting('app.current_tenant_id')::UUID
  )
  WITH CHECK (
    tenant_id IS NULL 
    OR tenant_id = current_setting('app.current_tenant_id')::UUID
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- 9. Triggers
-- ───────────────────────────────────────────────────────────────────────────────

-- Update updated_at trigger for marketing_campaigns
CREATE TRIGGER update_campaigns_updated_at_trigger
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Update updated_at trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at_trigger
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- Update updated_at trigger for sms_templates
CREATE TRIGGER update_sms_templates_updated_at_trigger
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_discounts_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- 10. Sample Data - بيانات تجريبية
-- ───────────────────────────────────────────────────────────────────────────────

-- Sample email template
INSERT INTO email_templates (
  tenant_id,
  name,
  description,
  template_type,
  subject,
  preview_text,
  html_content,
  text_content,
  variables,
  is_public,
  is_active
) VALUES (
  NULL,  -- Public template
  'عرض ترويجي عام',
  'قالب إيميل لعرض ترويجي مع خصم',
  'marketing',
  'عرض خاص لك - خصم {{discount_percent}}%!',
  'لا تفوت الفرصة، العرض لفترة محدودة',
  $$
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f8f9fa; padding: 30px; }
      .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 عرض خاص لك!</h1>
      </div>
      <div class="content">
        <p>مرحباً {{customer_name}},</p>
        <p>لدينا عرض مميز خصيصاً لك! احصل على خصم <strong>{{discount_percent}}%</strong> على جميع منتجاتنا.</p>
        <p>استخدم الكود: <strong style="font-size: 18px; color: #667eea;">{{discount_code}}</strong></p>
        <p style="text-align: center;">
          <a href="{{cta_link}}" class="cta-button">تسوق الآن</a>
        </p>
        <p style="color: #e53e3e; font-size: 14px;">⏰ العرض ينتهي في {{expiry_date}}</p>
      </div>
      <div class="footer">
        <p>هذا البريد تم إرساله إلى {{customer_email}}</p>
        <p>© 2026 جميع الحقوق محفوظة</p>
      </div>
    </div>
  </body>
  </html>
  $$,
  'مرحباً {{customer_name}}، لدينا عرض مميز خصيصاً لك! احصل على خصم {{discount_percent}}% على جميع منتجاتنا. استخدم الكود: {{discount_code}}',
  '[{"name": "customer_name", "type": "string", "required": true}, {"name": "discount_percent", "type": "number", "required": true}, {"name": "discount_code", "type": "string", "required": true}, {"name": "cta_link", "type": "string", "required": true}, {"name": "expiry_date", "type": "string", "required": false}, {"name": "customer_email", "type": "string", "required": false}]',
  'promotion',
  ARRAY['marketing', 'discount', 'promotion'],
  true,
  true
);

-- Sample SMS template
INSERT INTO sms_templates (
  tenant_id,
  name,
  description,
  content,
  variables,
  is_active
) VALUES (
  NULL,
  'تذكير سلة مهجورة',
  'رسالة تذكير للعميل الذي ترك سلة مهجورة',
  'مرحباً {{customer_name}}، لقد تركت منتجات في سلتك. أكمل طلبك الآن واحصل على خصم 10%! استخدم الكود: {{discount_code}}. الرابط: {{short_link}}',
  '[{"name": "customer_name", "type": "string", "required": true}, {"name": "discount_code", "type": "string", "required": false}, {"name": "short_link", "type": "string", "required": true}]',
  true
);

-- Sample campaign
INSERT INTO marketing_campaigns (
  tenant_id,
  title,
  description,
  channel,
  goal,
  status,
  audience_filter,
  message_ar,
  message_en,
  subject_line,
  scheduled_at,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'عرض رمضان',
  'حملة رمضان التسويقية',
  'email',
  'promotion',
  'draft',
  '{"segment": "all", "last_purchase_days": null, "min_orders": 0}',
  'مرحباً {{customer_name}}، استقبل رمضان معنا بخصومات تصل إلى 50% على جميع المنتجات!',
  'Hello {{customer_name}}, Welcome Ramadan with discounts up to 50% off!',
  '🌙 عرض رمضان الخاص - خصم حتى 50%',
  NOW() + INTERVAL '7 days',
  true
);

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration 031
-- ───────────────────────────────────────────────────────────────────────────────
