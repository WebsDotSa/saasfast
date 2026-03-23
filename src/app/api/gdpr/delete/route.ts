import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// GDPR Data Deletion API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لحذف جميع بيانات المستخدم حسب طلب GDPR
// الاستخدام: DELETE /api/gdpr/delete
// ═══════════════════════════════════════════════════════════════════════════════

export async function DELETE() {
  try {
    const supabase = await createClient();

    // التحقق من المصادقة
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // الحصول على جميع tenant_ids المرتبطة بالمستخدم
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', userId);

    const tenantIds = tenantUsers?.map((tu: any) => tu.tenant_id) || [];

    // حذف البيانات المرتبطة بـ tenants
    if (tenantIds.length > 0) {
      // حذف الفواتير
      await supabase.from('invoices').delete().in('tenant_id', tenantIds);

      // حذف الاشتراكات
      await supabase.from('subscriptions').delete().in('tenant_id', tenantIds);

      // حذف الطلبات
      await supabase.from('orders').delete().in('tenant_id', tenantIds);

      // حذف المنتجات
      await supabase.from('products').delete().in('tenant_id', tenantIds);

      // حذف العملاء
      await supabase.from('customers').delete().in('tenant_id', tenantIds);

      // حذف audit logs
      await supabase.from('audit_logs').delete().in('tenant_id', tenantIds);

      // حذف notification logs
      await supabase.from('notification_logs').delete().in('tenant_id', tenantIds);

      // حذف tenants أنفسهم
      await supabase.from('tenants').delete().in('id', tenantIds);
    }

    // حذف العضوية في tenant_users
    await supabase.from('tenant_users').delete().eq('user_id', userId);

    // ملاحظة: لا نحذف user من auth.users هنا
    // يجب أن يتم ذلك بشكل منفصل عبر Admin API
    // هذا فقط يحذف البيانات من قاعدة البيانات

    // تسجيل طلب الحذف
    await supabase.from('data_export_requests').insert({
      user_id: userId,
      status: 'deleted',
      metadata: {
        deleted_tenants: tenantIds,
        deleted_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Data deletion completed',
      deleted_tenants_count: tenantIds.length,
      deleted_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[GDPR Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
