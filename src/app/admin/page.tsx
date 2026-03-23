import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, TrendingUp, Activity, AlertTriangle, Bell } from 'lucide-react';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { TenantsBarChart } from '@/components/admin/tenants-bar-chart';
import { PlanDistributionChart } from '@/components/admin/plan-distribution-chart';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
  const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13).toISOString();

  // جميع الاستعلامات بالتوازي — استعلام واحد لكل نوع بدلاً من 26+
  const [
    { count: totalTenants },
    { count: totalSubscriptions },
    { count: activeSubscriptions },
    { count: trialSubscriptions },
    { count: newTenants },
    { data: revenueData },
    { data: allInvoicesData },
    { data: allTenantsData },
    { data: planDist },
    { data: expiringSoon },
    { data: recentInvoices },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing'),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('invoices').select('total_amount, created_at').eq('status', 'paid').gte('created_at', thirtyDaysAgo),
    supabase.from('invoices').select('total_amount, created_at').eq('status', 'paid').gte('created_at', twelveMonthsAgo),
    supabase.from('tenants').select('created_at').gte('created_at', fourteenDaysAgo),
    supabase.from('subscriptions').select('plan_id, plans(name_ar)').eq('status', 'active'),
    supabase.from('subscriptions').select('*, tenants(name_ar)').eq('status', 'active').lte('current_period_end', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).gte('current_period_end', new Date().toISOString()).limit(5),
    supabase.from('invoices').select('*, tenants(name_ar)').order('created_at', { ascending: false }).limit(5),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const monthlyRevenue = revenueData?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  // تجميع الإيرادات حسب الشهر في JavaScript
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const revenue = (allInvoicesData || [])
      .filter((inv) => {
        const dt = new Date(inv.created_at);
        return dt.getFullYear() === year && dt.getMonth() === month;
      })
      .reduce((s, r) => s + (r.total_amount || 0), 0);
    revenueByMonth.push({
      month: d.toLocaleDateString('ar-SA', { month: 'short' }),
      revenue,
    });
  }

  // تجميع المستأجرين حسب اليوم في JavaScript
  const tenantsByDay: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = d.getDate();
    const count = (allTenantsData || []).filter((t) => {
      const dt = new Date(t.created_at);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === date;
    }).length;
    tenantsByDay.push({
      day: d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
      count,
    });
  }

  // توزيع الخطط (من البيانات المجلوبة مسبقاً)
  const planMap: Record<string, { name: string; count: number }> = {};
  planDist?.forEach((s: any) => {
    const id = s.plan_id;
    const name = s.plans?.name_ar || id;
    if (!planMap[id]) planMap[id] = { name, count: 0 };
    planMap[id].count++;
  });
  const planDistData = Object.values(planMap).map((p) => ({ name: p.name, value: p.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">لوحة تحكم الأدمن</h1>
        <p className="text-muted-foreground">نظرة عامة على المنصة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستأجرين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">+{newTenants || 0} هذا الأسبوع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyRevenue.toLocaleString('ar-SA')} ر.س
            </div>
            <p className="text-xs text-muted-foreground">آخر 30 يوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {trialSubscriptions || 0} تجريبي · من {totalSubscriptions || 0} إجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنتهي قريباً</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringSoon?.length || 0}</div>
            <p className="text-xs text-muted-foreground">اشتراك خلال 7 أيام</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيرادات الشهرية</CardTitle>
            <CardDescription>آخر 12 شهر</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الخطط</CardTitle>
            <CardDescription>الاشتراكات النشطة</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDistributionChart data={planDistData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المستأجرون الجدد</CardTitle>
          <CardDescription>آخر 14 يوم</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantsBarChart data={tenantsByDay} />
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expiring Soon */}
        {(expiringSoon?.length || 0) > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                اشتراكات تنتهي قريباً
              </CardTitle>
              <CardDescription className="text-amber-700">خلال 7 أيام القادمة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringSoon?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-900">
                      {(sub.tenants as any)?.name_ar || 'Unknown'}
                    </span>
                    <span className="text-xs text-amber-700">
                      {new Date(sub.current_period_end).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Invoices */}
        <Card className={!expiringSoon?.length ? 'lg:col-span-2' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>الفواتير الأخيرة</CardTitle>
              <CardDescription>آخر 5 فواتير</CardDescription>
            </div>
            <Link href="/admin/invoices" className="text-xs text-primary hover:underline">
              عرض الكل
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices && recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {(invoice.tenants as any)?.name_ar || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">{invoice.invoice_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'default'
                            : invoice.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {invoice.status === 'paid'
                          ? 'مدفوع'
                          : invoice.status === 'pending'
                          ? 'معلق'
                          : 'مرفوض'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {invoice.total_amount?.toLocaleString('ar-SA') || 0} ر.س
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">لا توجد فواتير حديثة</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                آخر الأنشطة
              </CardTitle>
              <CardDescription>سجل التدقيق</CardDescription>
            </div>
            <Link href="/admin/audit-logs" className="text-xs text-primary hover:underline">
              عرض الكل
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-muted-foreground">{log.resource_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
