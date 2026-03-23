import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Analytics Overview API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لجلب الإحصاءات العامة للوحة التحليلات
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const supabase = await createClient();

    // الحصول على tenant الحالي
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // الحصول على tenant_id من session
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', session.user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    const tenantId = tenantUser.tenant_id;

    // جلب الإحصاءات الأساسية
    const [
      { count: totalOrders },
      { count: totalProducts },
      { count: totalCustomers },
      { data: ordersData },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase
        .from('orders')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed'),
    ]);

    // حساب الإيرادات الكلية
    const revenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    //_orders الأخيرة
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    // المنتجات الأكثر مبيعاً
    const { data: topProducts } = await supabase
      .from('products')
      .select('id, name_ar, price, inventory_quantity')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    // نمو الإيرادات (آخر 7 أيام)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weeklyRevenue } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo);

    // تجميع الإيرادات حسب اليوم
    const revenueByDay = weeklyRevenue?.reduce((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString('ar-SA');
      acc[date] = (acc[date] || 0) + (order.total_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // الإيرادات حسب الشهر (لـ Line Chart)
    const { data: monthlyRevenue } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    const revenueByMonth = monthlyRevenue?.reduce((acc, order) => {
      const month = new Date(order.created_at).toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.revenue += order.total_amount || 0;
      } else {
        acc.push({ month, revenue: order.total_amount || 0 });
      }
      return acc;
    }, [] as Array<{ month: string; revenue: number }>);

    // الطلبات حسب الحالة (لـ Pie Chart)
    const { data: ordersByStatusData } = await supabase
      .from('orders')
      .select('status')
      .eq('tenant_id', tenantId);

    const ordersByStatus = ordersByStatusData?.reduce((acc, order) => {
      const existing = acc.find(item => item.status === order.status);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ status: order.status || 'unknown', count: 1 });
      }
      return acc;
    }, [] as Array<{ status: string; count: number }>) || [];

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        totalRevenue: revenue,
      },
      recentOrders: recentOrders || [],
      topProducts: topProducts || [],
      revenueByDay: revenueByDay || {},
      revenueByMonth: revenueByMonth || [],
      ordersByStatus: ordersByStatus || [],
    });
  } catch (error: any) {
    console.error('[Analytics Overview] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
