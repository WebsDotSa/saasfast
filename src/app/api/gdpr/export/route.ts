import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// GDPR Data Export API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لتصدير جميع بيانات المستخدم حسب طلب GDPR
// الاستخدام: GET /api/gdpr/export
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const supabase = await createClient();

    // التحقق من المصادقة
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = session.user.id;

    // تجميع جميع بيانات المستخدم
    const exportData: any = {
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.user_metadata?.full_name,
        created_at: session.user.created_at,
      },
      tenants: [],
      subscriptions: [],
      invoices: [],
      orders: [],
      audit_logs: [],
    };

    // الحصول على tenants
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select(`
        id,
        role,
        permissions,
        created_at,
        tenants (
          id,
          name_ar,
          name_en,
          email,
          slug,
          status,
          settings,
          modules,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (tenantUsers) {
      exportData.tenants = tenantUsers.map((tu: any) => tu.tenants);
    }

    // الحصول على الاشتراكات
    const tenantIds = tenantUsers?.map((tu: any) => tu.tenant_id) || [];
    if (tenantIds.length > 0) {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end,
          created_at,
          plans (
            name_ar,
            price,
            currency
          )
        `)
        .in('tenant_id', tenantIds);

      exportData.subscriptions = subscriptions || [];

      // الحصول على الفواتير
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .in('tenant_id', tenantIds);

      exportData.invoices = invoices || [];

      // الحصول على الطلبات
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('tenant_id', tenantIds);

      exportData.orders = orders || [];

      // الحصول على audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .in('tenant_id', tenantIds)
        .order('created_at', { ascending: false })
        .limit(100);

      exportData.audit_logs = auditLogs || [];
    }

    // إنشاء سجل تصدير
    await supabase.from('data_export_requests').insert({
      user_id: userId,
      status: 'completed',
      export_data: exportData,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    // إرجاع البيانات كـ JSON
    return NextResponse.json({
      success: true,
      exported_at: new Date().toISOString(),
      data: exportData,
    });
  } catch (error: any) {
    console.error('[GDPR Export] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
