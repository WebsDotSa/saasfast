-- ═══════════════════════════════════════════════════════════════════════════════
-- Subscription Notifications & Cron Job Support
-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 010_subscription_notifications.sql
-- 
-- الجداول:
-- 1. notification_logs - لتتبع الإشعارات المرسلة
--
-- المهام التلقائية (Cron Jobs):
-- 1. تحويل التجارب المنتهية → expired
-- 2. إرسال تنبيه قبل 7 أيام من انتهاء الاشتراك
-- 3. تعليق الحسابات المتأخرة عن الدفع > 7 أيام
-- 4. تنظيف سلات التسوق المنتهية (> 30 يوم)
-- ═══════════════════════════════════════════════════════════════════════════════

-- جدول سجل الإشعارات
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_type VARCHAR(100) NOT NULL, -- renewal_reminder, trial_ending, payment_failed, etc.
  channel VARCHAR(50) DEFAULT 'email', -- email, sms, in_app
  status VARCHAR(30) DEFAULT 'pending', -- pending, sent, failed
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes للاستعلامات السريعة
CREATE INDEX idx_notification_logs_tenant ON notification_logs(tenant_id, created_at DESC);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type, status);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC) WHERE sent_at IS NOT NULL;

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: كل tenant يرى إشعاراته فقط
CREATE POLICY notification_logs_tenant_isolation ON notification_logs
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
  );

-- Policy: Service role يمكنه كل شيء (لـ Cron Jobs)
CREATE POLICY notification_logs_service_role ON notification_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- دالة مساعدة لتتبع الإشعارات
-- ───────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_notification(
  p_tenant_id UUID,
  p_notification_type VARCHAR,
  p_status VARCHAR DEFAULT 'sent',
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notification_logs (
    tenant_id,
    notification_type,
    status,
    metadata,
    sent_at
  ) VALUES (
    p_tenant_id,
    p_notification_type,
    p_status,
    p_metadata,
    CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- بيانات تجريبية (اختياري - للتطوير فقط)
-- ───────────────────────────────────────────────────────────────────────────────

-- COMMENT ON TABLE notification_logs IS 'سجل الإشعارات المرسلة للمستخدمين - يُستخدم لمنع التكرار وتتبع الحالة';
-- COMMENT ON COLUMN notification_logs.notification_type IS 'نوع الإشعار: renewal_reminder, trial_ending, payment_failed, subscription_expired, etc.';
-- COMMENT ON COLUMN notification_logs.channel IS 'قناة الإرسال: email, sms, in_app, push';
-- COMMENT ON COLUMN notification_logs.status IS 'حالة الإرسال: pending, sent, failed, bounced';
