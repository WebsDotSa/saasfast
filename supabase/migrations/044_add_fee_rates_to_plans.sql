-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 044_add_fee_rates_to_plans.sql
-- Description: إضافة حقول رسوم البوابة والعمولة لجدول الخطط
-- Reference: Required for payment fee calculation per plan
-- Created: 2026-03-21
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- إضافة حقول الرسوم لجدول plans
-- ───────────────────────────────────────────────────────────────────────────────

-- رسوم البوابة (افتراضي 1.5%)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS gateway_fee_rate NUMERIC(5,4) DEFAULT 0.015;

-- عمولة المنصة (افتراضي 1%)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS platform_fee_rate NUMERIC(5,4) DEFAULT 0.01;

-- ───────────────────────────────────────────────────────────────────────────────
-- تحديث الخطط الموجودة بقيم افتراضية
-- ───────────────────────────────────────────────────────────────────────────────

-- Basic: gateway=1.5%, platform=1.5%
UPDATE plans 
SET 
  gateway_fee_rate = 0.015,
  platform_fee_rate = 0.015
WHERE name_ar = 'Basic' OR name_en = 'Basic';

-- Professional: gateway=1.5%, platform=1.0%
UPDATE plans 
SET 
  gateway_fee_rate = 0.015,
  platform_fee_rate = 0.010
WHERE name_ar = 'Professional' OR name_en = 'Professional';

-- Enterprise: gateway=1.5%, platform=0.5%
UPDATE plans 
SET 
  gateway_fee_rate = 0.015,
  platform_fee_rate = 0.005
WHERE name_ar = 'Enterprise' OR name_en = 'Enterprise';

-- ───────────────────────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN plans.gateway_fee_rate IS 'نسبة رسوم البوابة (مثلاً 0.015 = 1.5%)';
COMMENT ON COLUMN plans.platform_fee_rate IS 'نسبة عمولة المنصة (مثلاً 0.01 = 1%)';

-- ───────────────────────────────────────────────────────────────────────────────
-- End of Migration
-- ───────────────────────────────────────────────────────────────────────────────
