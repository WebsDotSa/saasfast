// ═══════════════════════════════════════════════════════════════════════════════
// Marketing Module - AI Features
// ═══════════════════════════════════════════════════════════════════════════════
// ميزات الذكاء الاصطناعي للتسويق - كتابة الحملات، اقتراح الخصومات، تقسيم الجمهور
// ═══════════════════════════════════════════════════════════════════════════════

// Anthropic/Qwen AI API Configuration
const AI_CONFIG = {
  authToken: process.env.ANTHROPIC_AUTH_TOKEN || '',
  baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/apps/anthropic',
  model: process.env.ANTHROPIC_MODEL || 'qwen3.5-plus',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
};

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export interface CampaignMessageInput {
  topic: string;
  audience: string;
  channel: 'sms' | 'whatsapp' | 'email';
  tone: 'friendly' | 'professional' | 'urgent' | 'exciting';
  brandName?: string;
  callToAction?: string;
  language?: 'ar' | 'en' | 'both';
}

export interface CampaignMessageOutput {
  message_ar: string;
  message_en?: string;
  subject_line?: string;
  call_to_action: string;
  estimated_length: number;
  character_count: number;
}

export interface DiscountSuggestionInput {
  productName: string;
  productPrice: number;
  productCategory: string;
  salesData: {
    avgDailySales: number;
    lastWeekSales: number;
    lastMonthSales: number;
  };
  competitorPrices?: number[];
  profitMargin?: number;
  season?: string;
}

export interface DiscountSuggestionOutput {
  suggested_rate: number;
  suggested_amount?: number;
  reasoning: string;
  expected_impact: {
    conversion_lift: number;
    revenue_impact: number;
    margin_impact: number;
  };
  alternative_rates: number[];
  best_time_to_apply: string;
  duration_recommendation: string;
}

export interface AudienceSuggestionInput {
  campaignGoal: 'promotion' | 'retention' | 're_engagement' | 'welcome';
  customerData: {
    totalCustomers: number;
    avgOrderValue: number;
    purchaseFrequency: number;
  };
  productCategory?: string;
  budget?: number;
}

export interface AudienceSuggestionOutput {
  segment_name: string;
  segment_name_ar: string;
  criteria: {
    last_purchase_days?: number;
    min_orders?: number;
    min_spent?: number;
    max_spent?: number;
    age_range?: string;
    location?: string[];
  };
  estimated_size: number;
  estimated_conversion_rate: number;
  messaging_recommendations: string;
  channel_recommendation: 'email' | 'sms' | 'whatsapp' | 'mixed';
  budget_allocation: {
    email?: number;
    sms?: number;
    whatsapp?: number;
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// AI Campaign Message Generator
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Generate campaign message using AI
 */
export async function generateCampaignMessage(
  input: CampaignMessageInput
): Promise<CampaignMessageOutput> {
  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: `object {
        message_ar: string,
        message_en?: string,
        subject_line?: string,
        call_to_action: string,
        estimated_length: number,
        character_count: number
      }`,
      prompt: `
اكتب رسالة تسويقية مقنعة لحملة ${input.channel}.

الموضوع: ${input.topic}
الجمهور المستهدف: ${input.audience}
النبرة: ${input.tone}
${input.brandName ? `اسم العلامة التجارية: ${input.brandName}` : ''}
${input.callToAction ? `الدعوة للإجراء: ${input.callToAction}` : ''}

المتطلبات:
- باللغة ${input.language === 'both' ? 'العربية والإنجليزية' : input.language === 'ar' ? 'العربية الفصحى' : 'الإنجليزية'}
- ${input.channel === 'sms' ? '160 حرف كحد أقصى' : input.channel === 'whatsapp' ? '500 حرف كحد أقصى' : 'لا حد معين'}
- نبرة ${input.tone === 'friendly' ? 'ودية' : input.tone === 'professional' ? 'احترافية' : input.tone === 'urgent' ? 'عاجلة' : 'مثيرة'}
- تحتوي على call-to-action واضح ومقنع
- تستخدم أسلوب الإقناع المناسب للجمهور
- تذكر ${input.brandName || 'العلامة التجارية'} بشكل طبيعي

اجعل الرسالة:
1. جذابة في البداية
2. توضح الفائدة للعميل
3. تخلق شعوراً بالإلحاح (إذا مناسب)
4. تنتهي بـ call-to-action واضح
      `,
      temperature: 0.7,
      maxTokens: 500,
    });

    return object as unknown as CampaignMessageOutput;

  } catch (error) {
    console.error('[AI] Error generating campaign message:', error);
    throw new Error('فشل إنشاء الرسالة التسويقية');
  }
}

/**
 * Generate campaign message variations (A/B testing)
 */
export async function generateCampaignVariations(
  input: CampaignMessageInput,
  variations: number = 3
): Promise<CampaignMessageOutput[]> {
  const results: CampaignMessageOutput[] = [];

  for (let i = 0; i < variations; i++) {
    try {
      const result = await generateCampaignMessage({
        ...input,
        topic: `${input.topic} - Variation ${i + 1}`,
      });
      results.push(result);
    } catch (error) {
      console.error(`[AI] Error generating variation ${i + 1}:`, error);
    }
  }

  return results;
}

// ───────────────────────────────────────────────────────────────────────────────
// AI Discount Suggester
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Suggest optimal discount rate using AI
 */
export async function suggestDiscountRate(
  input: DiscountSuggestionInput
): Promise<DiscountSuggestionOutput> {
  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: `object {
        suggested_rate: number,
        suggested_amount?: number,
        reasoning: string,
        expected_impact: {
          conversion_lift: number,
          revenue_impact: number,
          margin_impact: number
        },
        alternative_rates: number[],
        best_time_to_apply: string,
        duration_recommendation: string
      }`,
      prompt: `
اقترح نسبة خصم مثالية لمنتج بناءً على البيانات التالية:

اسم المنتج: ${input.productName}
سعر المنتج: ${input.productPrice} ريال
التصنيف: ${input.productCategory}
${input.profitMargin ? `هامش الربح: ${input.profitMargin}%` : ''}
${input.season ? `الموسم: ${input.season}` : ''}

بيانات المبيعات:
- متوسط المبيعات اليومية: ${input.salesData.avgDailySales}
- مبيعات الأسبوع الماضي: ${input.salesData.lastWeekSales}
- مبيعات الشهر الماضي: ${input.salesData.lastMonthSales}

${input.competitorPrices && input.competitorPrices.length > 0 
  ? `أسعار المنافسين: ${input.competitorPrices.join(', ')} ريال` 
  : ''}

خذ في الاعتبار:
1. مرونة السعر للمنتج
2. هوامش الربح
3. الموسمية (إذا وجدت)
4. سلوك العملاء
5. أسعار المنافسين
6. الهدف: زيادة المبيعات مع الحفاظ على الربحية

قدم:
1. نسبة الخصم المقترحة (%)
2. المبلغ المقترح (إذا كان خصم ثابت)
3. التحليل والسبب
4. التأثير المتوقع على:
   - معدل التحويل (%)
   - الإيرادات (%)
   - الهامش (%)
5. بدائل أخرى (2-3 نسب)
6. أفضل وقت لتطبيق الخصم
7. المدة الموصى بها للخصم
      `,
      temperature: 0.5,
      maxTokens: 600,
    });

    return object as unknown as DiscountSuggestionOutput;

  } catch (error) {
    console.error('[AI] Error suggesting discount rate:', error);
    throw new Error('فشل اقتراح نسبة الخصم');
  }
}

/**
 * Suggest discount based on customer segment
 */
export async function suggestSegmentDiscount(
  segment: 'new' | 'vip' | 'inactive' | 'regular',
  avgOrderValue: number,
  productCategory?: string
): Promise<{ rate: number; reasoning: string }> {
  const segmentStrategies: Record<string, string> = {
    new: 'جذب عملاء جدد وتشجيع الشراء الأول',
    vip: 'مكافأة العملاء المميزين وزيادة الولاء',
    inactive: 'إعادة تفعيل العملاء الخاملين',
    regular: 'تشجيع العملاء العاديين على زيادة الشراء',
  };

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: `object { rate: number, reasoning: string }`,
      prompt: `
اقترح نسبة خصم مثالية لـ ${segmentStrategies[segment]}.

متوسط قيمة الطلب: ${avgOrderValue} ريال
${productCategory ? `التصنيف: ${productCategory}` : ''}

الاستراتيجية: ${segmentStrategies[segment]}

قدم:
1. نسبة الخصم المقترحة (%)
2. السبب والتحليل
      `,
      temperature: 0.5,
      maxTokens: 300,
    });

    return object as unknown as { rate: number; reasoning: string };

  } catch (error) {
    console.error('[AI] Error suggesting segment discount:', error);
    return { rate: 10, reasoning: 'نسبة افتراضية بناءً على الممارسات الشائعة' };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// AI Audience Suggester
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Suggest optimal audience segment for campaign
 */
export async function suggestAudience(
  input: AudienceSuggestionInput
): Promise<AudienceSuggestionOutput> {
  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: `object {
        segment_name: string,
        segment_name_ar: string,
        criteria: {
          last_purchase_days?: number,
          min_orders?: number,
          min_spent?: number,
          max_spent?: number,
          age_range?: string,
          location?: string[]
        },
        estimated_size: number,
        estimated_conversion_rate: number,
        messaging_recommendations: string,
        channel_recommendation: 'email' | 'sms' | 'whatsapp' | 'mixed',
        budget_allocation: {
          email?: number,
          sms?: number,
          whatsapp?: number
        }
      }`,
      prompt: `
حدد أفضل شريحة عملاء لحملة تسويقية:

الهدف: ${input.campaignGoal === 'promotion' ? 'عرض ترويجي' : input.campaignGoal === 'retention' ? 'احتفاظ' : input.campaignGoal === 're_engagement' ? 'إعادة تفاعل' : 'ترحيب'}

بيانات العملاء:
- إجمالي العملاء: ${input.customerData.totalCustomers}
- متوسط قيمة الطلب: ${input.customerData.avgOrderValue} ريال
- تكرار الشراء: ${input.customerData.purchaseFrequency} أيام
${input.productCategory ? `- التصنيف: ${input.productCategory}` : ''}
${input.budget ? `- الميزانية: ${input.budget} ريال` : ''}

اقترح شريحة بناءً على:
1. سلوك الشراء
2. قيمة العميل
3. احتمالية الاستجابة
4. الهدف من الحملة

قدم:
1. اسم الشريحة (بالإنجليزية والعربية)
2. معايير التحديد:
   - آخر شراء (أيام)
   - الحد الأدنى للطلبات
   - الحد الأدنى للإنفاق
   - الحد الأقصى للإنفاق (إذا وجد)
   - الفئة العمرية (إذا وجدت)
   - الموقع (إذا وجد)
3. الحجم المقدر للشريحة
4. معدل التحويل المتوقع (%)
5. توصيات للرسالة المناسبة
6. القناة الموصى بها (email/sms/whatsapp/mixed)
7. توزيع الميزانية المقترح
      `,
      temperature: 0.6,
      maxTokens: 700,
    });

    return object as unknown as AudienceSuggestionOutput;

  } catch (error) {
    console.error('[AI] Error suggesting audience:', error);
    throw new Error('فشل اقتراح الجمهور المستهدف');
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// AI Product Description Generator
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Generate product description for marketing
 */
export async function generateProductDescription(
  productName: string,
  features: string[],
  targetAudience: string,
  tone: 'professional' | 'friendly' | 'luxury' | 'casual' = 'friendly'
): Promise<{ description_ar: string; description_en: string; short_description: string }> {
  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: `object {
        description_ar: string,
        description_en: string,
        short_description: string
      }`,
      prompt: `
اكتب وصف تسويقي لمنتج:

اسم المنتج: ${productName}
المميزات: ${features.join(', ')}
الجمهور المستهدف: ${targetAudience}
النبرة: ${tone === 'professional' ? 'احترافية' : tone === 'friendly' ? 'ودية' : tone === 'luxury' ? 'فاخرة' : 'عادية'}

قدم:
1. وصف كامل بالعربية (150-200 كلمة)
2. وصف كامل بالإنجليزية (150-200 كلمة)
3. وصف قصير بالعربية (50 كلمة) للعرض السريع

اجعل الوصف:
- جذاباً ومقنعاً
- يبرز الفوائد وليس فقط المميزات
- مناسباً للجمهور المستهدف
- بالنبرة المطلوبة
      `,
      temperature: 0.7,
      maxTokens: 800,
    });

    return object as unknown as { description_ar: string; description_en: string; short_description: string };

  } catch (error) {
    console.error('[AI] Error generating product description:', error);
    throw new Error('فشل إنشاء وصف المنتج');
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// AI Email Subject Line Generator
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Generate email subject line variations
 */
export async function generateEmailSubjectLines(
  topic: string,
  urgency: 'low' | 'medium' | 'high' = 'medium',
  count: number = 5
): Promise<string[]> {
  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: `object { subject_lines: string[] }`,
      prompt: `
أنشئ ${count} عناوين إيميل جذابة عن: ${topic}

مستوى الإلحاح: ${urgency === 'low' ? 'منخفض' : urgency === 'medium' ? 'متوسط' : 'عالي'}

المتطلبات:
- قصيرة (40-60 حرف)
- جذابة وتثير الفضول
- مناسبة للغة العربية
- ${urgency === 'high' ? 'تخلق شعوراً بالإلحاح' : urgency === 'medium' ? 'متوازنة' : 'غير ضاغطة'}

قدم قائمة بـ ${count} عناوين مختلفة.
      `,
      temperature: 0.8,
      maxTokens: 400,
    });

    return (object as any).subject_lines || [];

  } catch (error) {
    console.error('[AI] Error generating email subject lines:', error);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Get AI model info
 */
export function getAIModelInfo(): { available: boolean; model: string } {
  return {
    available: isAIEnabled(),
    model: 'claude-sonnet-4-20250514',
  };
}

/**
 * Estimate token usage
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for Arabic
  return Math.ceil(text.length / 4);
}

/**
 * Calculate AI cost estimate
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet pricing (approximate)
  const inputCost = (inputTokens / 1000000) * 3; // $3 per 1M input tokens
  const outputCost = (outputTokens / 1000000) * 15; // $15 per 1M output tokens
  return inputCost + outputCost;
}

// ───────────────────────────────────────────────────────────────────────────────
// Export all functions
// ───────────────────────────────────────────────────────────────────────────────

export default {
  // Campaign Message
  generateCampaignMessage,
  generateCampaignVariations,

  // Discount Suggestions
  suggestDiscountRate,
  suggestSegmentDiscount,

  // Audience Suggestions
  suggestAudience,

  // Product Content
  generateProductDescription,

  // Email
  generateEmailSubjectLines,

  // Helpers
  isAIEnabled,
  getAIModelInfo,
  estimateTokens,
  estimateCost,
};
