import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentStatus } from '@/lib/myfatoorah';

// ═══════════════════════════════════════════════════════════════════════════════
// Payment Callback — معالجة العودة من بوابة الدفع
// ═══════════════════════════════════════════════════════════════════════════════
// بعد إتمام الدفع، يعود المستخدم إلى هذا الرابط
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoice');

    if (!invoiceId) {
      return NextResponse.redirect(new URL('/billing/error?message=invalid', request.url));
    }

    const supabase = await createClient();

    // الحصول على معلومات الفاتورة
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        *,
        tenants (
          id,
          slug,
          name_ar
        ),
        subscriptions (
          id,
          plan_id
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return NextResponse.redirect(new URL('/billing/error?message=not_found', request.url));
    }

    // التحقق من حالة الدفع عبر MyFatoorah
    if (invoice.myfatoorah_invoice_id) {
      const paymentStatus = await getPaymentStatus({
        invoiceId: invoice.myfatoorah_invoice_id,
      });

      if (paymentStatus.success) {
        const status = paymentStatus.status;
        const isSuccess = status === 'success';

        // تحديث الفاتورة
        await supabase
          .from('invoices')
          .update({
            status: isSuccess ? 'paid' : 'failed',
            paid_at: isSuccess ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        // إذا كان الدفع ناجح، تحديث الاشتراك
        if (isSuccess && invoice.subscriptions?.id) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select(`
              plan_id,
              plans (
                included_modules
              )
            `)
            .eq('id', invoice.subscriptions.id)
            .single();

          if (subscription) {
            // تحديث الاشتراك
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_end: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(),
                last_payment_amount: invoice.total_amount,
                last_payment_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', invoice.subscriptions.id);

            // تفعيل الوحدات
            if ((subscription.plans as any)?.included_modules) {
              const modules = (subscription.plans as any).included_modules;

              await supabase
                .from('tenants')
                .update({
                  modules,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', invoice.tenant_id);
            }
          }
        }

        // إعادة التوجيه حسب الحالة
        if (isSuccess) {
          const tenantSlug = (invoice.tenants as any)?.slug;
          const dashboardUrl = tenantSlug
            ? `https://${tenantSlug}.${process.env.PLATFORM_DOMAIN || 'localhost:3000'}/dashboard?payment=success`
            : `/dashboard?payment=success`;

          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        } else {
          return NextResponse.redirect(
            new URL('/billing/error?message=payment_failed', request.url)
          );
        }
      }
    }

    // إذا لم يكن هناك myfatoorah_invoice_id، التحقق من الحالة المحلية
    if (invoice.status === 'paid') {
      const tenantSlug = (invoice.tenants as any)?.slug;
      const dashboardUrl = tenantSlug
        ? `https://${tenantSlug}.${process.env.PLATFORM_DOMAIN || 'localhost:3000'}/dashboard?payment=success`
        : `/dashboard?payment=success`;

      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // حالة افتراضية
    return NextResponse.redirect(
      new URL('/billing/error?message=unknown_status', request.url)
    );
  } catch (error: any) {
    console.error('[Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/billing/error?message=server_error', request.url)
    );
  }
}
