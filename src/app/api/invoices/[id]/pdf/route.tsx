import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoice-pdf-template';

// ═══════════════════════════════════════════════════════════════════════════════
// Invoice PDF Generation API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لتوليد PDF للفواتير
// الاستخدام: GET /api/invoices/[id]/pdf
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // التحقق من المصادقة
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    // الحصول على معلومات الفاتورة
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        created_at,
        paid_at,
        total_amount,
        currency,
        tenant_id,
        subscription_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoiceData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // التحقق من أن المستخدم يملك الفاتورة
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', session.user.id)
      .eq('tenant_id', invoiceData.tenant_id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // الحصول على معلومات tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name_ar, email, phone, address')
      .eq('id', invoiceData.tenant_id)
      .single();

    // الحصول على معلومات الاشتراك
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        id,
        amount,
        currency,
        current_period_start,
        current_period_end,
        plans (
          name_ar
        )
      `)
      .eq('id', invoiceData.subscription_id)
      .single();

    // الحصول على معلومات العميل
    const { data: customer } = await supabase.auth.admin.getUserById(
      session.user.id
    );

    // توليد PDF
    const pdfDocument = (
      <InvoicePDF
        invoice={{
          invoice_number: invoiceData.invoice_number,
          status: invoiceData.status,
          created_at: invoiceData.created_at,
          paid_at: invoiceData.paid_at,
        }}
        tenant={{
          name_ar: tenant?.name_ar || 'Unknown',
          email: tenant?.email,
          phone: tenant?.phone,
          address: tenant?.address,
        }}
        customer={{
          name: customer?.user?.user_metadata?.full_name || session.user.email || 'Customer',
          email: session.user.email,
          phone: customer?.user?.user_metadata?.phone,
        }}
        subscription={{
          plan_name: (subscription?.plans as any)?.name_ar || 'Subscription',
          amount: invoiceData.total_amount || 0,
          currency: invoiceData.currency || 'SAR',
          period_start: subscription?.current_period_start,
          period_end: subscription?.current_period_end,
        }}
      />
    );

    const pdfBuffer = await renderToBuffer(pdfDocument);

    // إرجاع PDF كـ response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceData.invoice_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[Invoice PDF] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
