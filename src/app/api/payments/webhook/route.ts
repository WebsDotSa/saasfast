import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createPaymentLink,
  handleWebhook,
  verifyWebhook,
  getPaymentStatus,
} from '@/lib/myfatoorah';
import type { WebhookPayload } from 'myfatoorah-sdk';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

// ═══════════════════════════════════════════════════════════════════════════════
// MyFatoorah Webhook Handler
// ═══════════════════════════════════════════════════════════════════════════════
// هذا الـ endpoint يستقبل إشعارات من MyFatoorah عند تغير حالة الدفع
//
// Webhook Configuration:
// 1. Dashboard → Settings → Webhooks
// 2. Add URL: https://yourdomain.com/api/payments/webhook
// 3. Select Events: Transaction Status Changed
// 4. Copy Webhook Secret to .env.local
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Rate limiting للـ webhooks
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimitResult = await checkRateLimit(`webhook:${ip}`, rateLimiters.webhooks);

    if (!rateLimitResult.success) {
      console.warn('[Webhook] Rate limit exceeded');
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // الحصول على Signature من Headers
    const signature =
      request.headers.get('myfatoorah-signature') ||
      request.headers.get('MyFatoorah-Signature') ||
      '';

    if (!signature) {
      console.error('[Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // قراءة payload
    const payload: WebhookPayload = await request.json();

    // التحقق من صحة signature
    const isValid = verifyWebhook(payload, signature);

    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // معالجة Webhook
    const result = await handleWebhook(payload);

    if (!result.success) {
      console.error('[Webhook] Handling error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const { status, invoiceId, customerReference, isSuccess } = result;

    console.log('[Webhook] Received:', {
      status,
      invoiceId,
      customerReference,
      isSuccess,
    });

    // الحصول على معلومات الدفع الكاملة
    if (invoiceId) {
      const paymentStatus = await getPaymentStatus({ invoiceId: invoiceId.toString() });

      if (paymentStatus.success) {
        const supabase = await createClient();

        // البحث عن الفاتورة في قاعدة البيانات
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, tenant_id, subscription_id, myfatoorah_invoice_id')
          .eq('myfatoorah_invoice_id', invoiceId.toString())
          .single();

        if (invoice) {
          // تحديث حالة الفاتورة
          const updateData: any = {
            status: mapPaymentStatusToInvoiceStatus(status),
            updated_at: new Date().toISOString(),
          };

          if (isSuccess) {
            updateData.paid_at = new Date().toISOString();
            updateData.payment_method = (paymentStatus.data as any)?.PaymentMethod || 'MyFatoorah';
          }

          await supabase
            .from('invoices')
            .update(updateData)
            .eq('id', invoice.id);

          // ═══════════════════════════════════════════════════════════════════════
          // حفظ في store_transactions (جديد - نظام المدفوعات المتكامل)
          // ═══════════════════════════════════════════════════════════════════════
          if (isSuccess) {
            const paymentData = paymentStatus.data as any;

            // جلب رسوم الخطة
            const feeRates = await getTenantFeeRates(invoice.tenant_id);

            await supabase
              .from('store_transactions')
              .upsert({
                tenant_id: invoice.tenant_id,
                myfatoorah_invoice_id: invoiceId.toString(),
                myfatoorah_payment_id: paymentData?.PaymentId?.toString(),
                store_order_id: invoice.id || null,
                gross_amount: paymentData?.InvoiceValue || 0,
                currency: paymentData?.ExtraMerchantCode || 'SAR',
                gateway_fee_rate: feeRates.gatewayRate,
                platform_fee_rate: feeRates.platformRate,
                payment_method: paymentData?.PaymentMethod?.toLowerCase() || 'unknown',
                payment_network: paymentData?.PaymentType || null,
                card_last4: paymentData?.CardInfo?.CardLastFour || null,
                card_brand: paymentData?.CardInfo?.Brand || null,
                customer_name: paymentData?.CustomerName || null,
                customer_email: paymentData?.CustomerEmail || null,
                customer_phone: paymentData?.CustomerMobile || null,
                status: 'success',
                raw_payload: paymentData || {},
              }, {
                onConflict: 'myfatoorah_invoice_id'
              });

            // ملاحظة: الـ Trigger في merchant_balances سيحدث الرصيد تلقائياً!
          }

          // إذا كان الدفع ناجح، تحديث الاشتراك
          if (isSuccess && invoice.subscription_id) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_end: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(), // إضافة شهر
                last_payment_amount: paymentStatus.data?.InvoiceValue,
                last_payment_date: new Date().toISOString(),
                myfatoorah_invoice_id: invoiceId.toString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', invoice.subscription_id);

            // تفعيل الوحدات حسب الخطة
            await enablePlanModules(invoice.tenant_id, invoice.subscription_id);

            // إرسال إيميل نجاح الدفع
            const { data: tenantData } = await supabase
              .from('tenants')
              .select('name, company_email')
              .eq('id', invoice.tenant_id)
              .single();

            const { data: subscriptionData } = await supabase
              .from('subscriptions')
              .select(`
                plan_id,
                plans (
                  name_ar,
                  price
                )
              `)
              .eq('id', invoice.subscription_id)
              .single();

            if (tenantData && subscriptionData) {
              const { sendPaymentSuccessEmail } = await import('@/lib/emails');
              await sendPaymentSuccessEmail(
                tenantData.company_email || '',
                {
                  tenantName: tenantData.name || 'عميلنا الكريم',
                  amount: paymentStatus.data?.InvoiceValue?.toString() || '0.00',
                  currency: 'SAR',
                  invoiceNumber: invoice.myfatoorah_invoice_id || '',
                  planName: (subscriptionData.plans as any)?.name_ar || 'الخطة المختارة',
                }
              );
            }
          }

          // تسجيل audit log
          await supabase.from('audit_logs').insert({
            tenant_id: invoice.tenant_id,
            action: `payment.${isSuccess ? 'succeeded' : 'failed'}`,
            resource_type: 'invoice',
            resource_id: invoice.id,
            metadata: {
              invoiceId,
              customerReference,
              status,
              paymentData: paymentStatus.data,
            },
          });
        }
      }
    }

    // إرسال استجابة ناجحة
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * تحويل حالة الدفع إلى حالة الفاتورة
 */
function mapPaymentStatusToInvoiceStatus(status: string | null): string {
  switch (status) {
    case 'success':
      return 'paid';
    case 'failed':
      return 'failed';
    case 'pending':
      return 'pending';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
}

/**
 * جلب رسوم الخطة للتاجر
 * Returns gateway_fee_rate and platform_fee_rate from tenant's subscription plan
 */
async function getTenantFeeRates(tenantId: string): Promise<{ gatewayRate: number; platformRate: number }> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      plan_id,
      plans (
        gateway_fee_rate,
        platform_fee_rate
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  // القيم الافتراضية
  const defaultGatewayRate = 0.015; // 1.5%
  const defaultPlatformRate = 0.01; // 1%

  if (!subscription || !(subscription.plans as any)) {
    return {
      gatewayRate: defaultGatewayRate,
      platformRate: defaultPlatformRate,
    };
  }

  const plan = subscription.plans as any;

  return {
    gatewayRate: plan.gateway_fee_rate || defaultGatewayRate,
    platformRate: plan.platform_fee_rate || defaultPlatformRate,
  };
}

/**
 * تفعيل الوحدات حسب الخطة
 */
async function enablePlanModules(
  tenantId: string,
  subscriptionId: string
) {
  const supabase = await createClient();

  // الحصول على معلومات الخطة
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      plan_id,
      plans (
        included_modules
      )
    `)
    .eq('id', subscriptionId)
    .single();

  if (subscription && (subscription.plans as any)?.included_modules) {
    const modules = (subscription.plans as any).included_modules;

    await supabase
      .from('tenants')
      .update({
        modules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);
  }
}
