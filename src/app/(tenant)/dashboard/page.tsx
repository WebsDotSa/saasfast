import { auth } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  CreditCard,
  ArrowLeft,
  Plus,
  FileText,
  Globe,
  Settings,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const supabase = await createClient();

  // الحصول على معلومات tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select(`
      *,
      plans (
        name_ar,
        name_en
      ),
      subscriptions (
        status,
        current_period_end
      )
    `)
    .eq('id', (session.user as any).tenant_id)
    .single();

  // إحصائيات عامة
  const stats = {
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
  };

  // الحصول على الإحصائيات إذا كان module مفعل
  if (tenant?.modules?.includes('ecommerce')) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);
    stats.products = count || 0;

    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);
    stats.orders = ordersCount || 0;

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('tenant_id', tenant.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    stats.revenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  }

  const subscription = tenant?.subscriptions?.[0];
  const planName = (tenant?.plans as any)?.name_ar || 'خطة مجانية';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">نظرة عامة</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة التحكم</p>
        </div>
        <Badge className={tenant?.status === 'active' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
          {tenant?.status === 'active' ? 'نشط ✓' : 'تجريبي'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المبيعات"
          value={`${stats.revenue.toLocaleString()} ر.س`}
          description="هذا الشهر"
          trend={15.5}
          icon={DollarSign}
        />

        <StatCard
          title="الطلبات"
          value={stats.orders.toString()}
          description="طلب هذا الشهر"
          trend={8.2}
          icon={ShoppingCart}
        />

        <StatCard
          title="المنتجات"
          value={stats.products.toString()}
          description="منتج نشط"
          trend={-2.5}
          icon={Package}
        />

        <StatCard
          title="العملاء"
          value={stats.customers.toString()}
          description="عميل مسجل"
          trend={25.3}
          icon={Users}
        />
      </div>

      {/* Plan & Modules */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الخطة الحالية</CardTitle>
            <CardDescription>معلومات اشتراكك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">{planName}</div>
                  <div className="text-sm text-muted-foreground">
                    {subscription?.status === 'active' ? '✓ نشط' : 'غير نشط'}
                  </div>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>

              {subscription?.current_period_end && (
                <div className="text-sm text-muted-foreground">
                  ينتهي في{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Badge className="border text-foreground">
                  {tenant?.modules?.length || 0} وحدات مفعلة
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/billing">
                    ترقية الخطة
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الوحدات المفعلة</CardTitle>
            <CardDescription>الوحدات المتاحة لك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tenant?.modules?.map((module: string) => (
                <Badge key={module} className="bg-secondary text-secondary-foreground">
                  {getModuleName(module)}
                </Badge>
              ))}
              {(!tenant?.modules || tenant.modules.length === 0) && (
                <div className="text-sm text-muted-foreground">
                  لا توجد وحدات مفعلة - قم بترقية خطتك لتفعيل المزيد
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>أهم الإجراءات التي يمكنك القيام بها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <QuickActionCard
              title="إضافة منتج"
              description="أضف منتج جديد لمتجرك"
              icon={Package}
              href="/dashboard/products/new"
              disabled={!tenant?.modules?.includes('ecommerce')}
            />

            <QuickActionCard
              title="إنشاء صفحة"
              description="أنشئ صفحة جديدة"
              icon={FileText}
              href="/dashboard/pages/new"
              disabled={!tenant?.modules?.includes('page_builder')}
            />

            <QuickActionCard
              title="الإعدادات"
              description="إعدادات المتجر"
              icon={Settings}
              href="/dashboard/settings"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>آخر النشاطات</CardTitle>
          <CardDescription>آخر العمليات التي تمت في حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div>مرحباً بك في SaaS Core Platform 🎉</div>
            </div>
            {stats.orders > 0 && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div>لديك {stats.orders} طلبات هذا الشهر</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  trend?: number;
  icon: any;
}) {
  const isPositive = trend && trend > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend !== undefined && (
            <>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span>{isPositive ? '+' : ''}{trend}%</span>
            </>
          )}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  disabled,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/40 opacity-50">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <Badge className="bg-secondary text-secondary-foreground">غير مفعل</Badge>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className="group flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
      </div>
    </Link>
  );
}

function getModuleName(moduleId: string): string {
  const names: Record<string, string> = {
    ecommerce: 'متجر إلكتروني',
    page_builder: 'بناء صفحات',
    accounting: 'محاسبة',
    hrms: 'موارد بشرية',
    crm: 'إدارة عملاء',
    booking: 'حجوزات',
    ai_agent: 'وكيل AI',
  };
  return names[moduleId] || moduleId;
}
