import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { createPaymentLink, getPaymentStatus } from '@/lib/myfatoorah';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getIdentifier } from '@/lib/rate-limit';

// ═══════════════════════════════════════════════════════════════════════════════
// Initiate Payment — إنشاء دفعة جديدة
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لإنشاء رابط دفع للاشتراكات
// ═══════════════════════════════════════════════════════════════════════════════

// Validation Schema
const initiatePaymentSchema = z.object({
  planId: z.string().uuid('معرف الخطة غير صحيح'),
  customerName: z.string().min(2, 'الاسم مطلوب').optional(),
  customerEmail: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  customerMobile: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 دفعات كل ساعة
    const identifier = getIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, rateLimiters.payments);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many payment attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // التحقق من المصادقة
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // قراءة البيانات
    const body = await request.json();
    const validation = initiatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { planId, customerName, customerEmail, customerMobile } =
      validation.data;

    const supabase = await createClient();

    // الحصول على tenant_id من الـ session
    const tenantId = (session.user as any)?.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'المنشأة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من الخطة
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'الخطة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من المنشأة
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'المنشأة غير موجودة' },
        { status: 404 }
      );
    }

    // إنشاء الفاتورة
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceData = {
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      amount_sar: plan.price,
      vat_amount: plan.price * 0.15,
      total_amount: plan.price * 1.15,
      currency: 'SAR',
      status: 'pending',
      period_start: new Date().toISOString(),
      period_end: new Date(
        Date.now() + getPeriodMilliseconds(plan.billing_interval)
      ).toISOString(),
      line_items: [
        {
          description: `${plan.name_ar} - ${plan.billing_interval}`,
          amount: plan.price,
          quantity: 1,
          total: plan.price,
        },
      ],
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('[Invoice] Error:', invoiceError);
      return NextResponse.json(
        { error: 'فشل إنشاء الفاتورة' },
        { status: 500 }
      );
    }

    // الحصول على معلومات المستخدم
    const userName = customerName || session.user?.name || '';
    const userEmail = customerEmail || session.user?.email || '';

    // إنشاء رابط الدفع عبر MyFatoorah
    const paymentResult = await createPaymentLink({
      amount: Number(invoiceData.total_amount),
      customerName: userName,
      customerEmail: userEmail,
      customerMobile: customerMobile || '',
      customerReference: invoiceNumber,
      callBackUrl: `${process.env.APP_URL}/api/payments/callback?invoice=${invoice.id}`,
      errorUrl: `${process.env.APP_URL}/billing/error`,
      displayCurrency: 'SAR',
      language: 'ar',
      invoiceItems: (invoiceData.line_items as any[]).map(item => ({
        ItemName: item.description,
        Quantity: item.quantity,
        UnitPrice: item.amount,
      })),
      metadata: {
        invoiceId: invoice.id,
        tenantId,
        planId,
      },
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error },
        { status: 500 }
      );
    }

    // تحديث الفاتورة بـ MyFatoorah Invoice ID
    await supabase
      .from('invoices')
      .update({
        myfatoorah_invoice_id: paymentResult.invoiceId?.toString(),
        myfatoorah_payment_url: paymentResult.invoiceUrl,
      })
      .eq('id', invoice.id);

    // إنشاء اشتراك مؤقت
    const { data: subscription } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        status: 'trialing',
        myfatoorah_invoice_id: paymentResult.invoiceId?.toString(),
      })
      .select()
      .single();

    await supabase
      .from('invoices')
      .update({ subscription_id: subscription?.id })
      .eq('id', invoice.id);

    // إرجاع رابط الدفع
    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      paymentUrl: paymentResult.invoiceUrl,
      invoiceUrl: paymentResult.invoiceUrl,
      myfatoorahInvoiceId: paymentResult.invoiceId,
    });
  } catch (error: any) {
    console.error('[Payment] Error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

function getPeriodMilliseconds(interval: string): number {
  switch (interval) {
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000;
    case 'yearly':
      return 365 * 24 * 60 * 60 * 1000;
    case 'quarterly':
      return 90 * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}
