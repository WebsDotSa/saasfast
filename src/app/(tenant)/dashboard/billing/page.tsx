import { auth } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const supabase = await createClient();

  // الحصول على معلومات tenant والاشتراك الحالي
  const { data: tenant } = await supabase
    .from('tenants')
    .select(`
      *,
      subscriptions (
        id,
        status,
        current_period_end,
        plan_id,
        plans (
          id,
          name_ar,
          name_en,
          price,
          billing_interval,
          features,
          limits,
          included_modules,
          color
        )
      )
    `)
    .eq('id', (session.user as any).tenant_id)
    .single();

  const currentSubscription = tenant?.subscriptions?.[0];
  const currentPlan = (currentSubscription?.plans as any) || null;

  // الحصول على جميع الخطط
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">الاشتراكات والفواتير</h1>
        <p className="text-muted-foreground">إدارة خطتك ودفعاتك</p>
      </div>

      {/* Current Plan */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>الخطة الحالية</CardTitle>
            <CardDescription>معلومات اشتراكك الحالي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: currentPlan.color }}
                  />
                  <span className="text-2xl font-bold">{currentPlan.name_ar}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentSubscription?.status === 'active' ? (
                    <Badge className="bg-green-500 text-white">نشط ✓</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-white">غير نشط</Badge>
                  )}
                </div>
                {currentSubscription?.current_period_end && (
                  <div className="text-sm text-muted-foreground">
                    ينتهي في{' '}
                    {new Date(currentSubscription.current_period_end).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold">{currentPlan.price}</div>
                <div className="text-sm text-muted-foreground">ريال شهرياً</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              إدارة الاشتراك
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">الخطط المتاحة</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isPopular = plan.is_popular;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isPopular ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    الأكثر شعبية
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: plan.color }}
                    />
                    <CardTitle className="text-xl">{plan.name_ar}</CardTitle>
                  </div>
                  <CardDescription>{plan.description_ar}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> ر.س/شهرياً</span>
                  </div>

                  <ul className="space-y-3">
                    {(plan.features as any)?.custom_domain && (
                      <ListItem>نطاق مخصص</ListItem>
                    )}
                    {(plan.features as any)?.api_access && (
                      <ListItem>API Access</ListItem>
                    )}
                    {(plan.features as any)?.remove_branding && (
                      <ListItem>إزالة العلامة التجارية</ListItem>
                    )}
                    {(plan.features as any)?.priority_support && (
                      <ListItem>دعم ذو أولوية</ListItem>
                    )}
                    {(plan.limits as any)?.max_products && (
                      <ListItem>
                        {(plan.limits as any).max_products === -1
                          ? 'منتجات غير محدودة'
                          : `${(plan.limits as any).max_products} منتج`}
                      </ListItem>
                    )}
                    {(plan.limits as any)?.max_users && (
                      <ListItem>
                        {(plan.limits as any).max_users === -1
                          ? 'مستخدمين غير محدودين'
                          : `${(plan.limits as any).max_users} مستخدم`}
                      </ListItem>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    asChild
                  >
                    {isCurrentPlan ? (
                      <span>خطتك الحالية</span>
                    ) : (
                      <Link href={`/dashboard/billing/upgrade?plan=${plan.id}`}>
                        {currentPlan ? 'ترقية الخطة' : 'اشترك الآن'}
                      </Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المدفوعات</CardTitle>
          <CardDescription>الفواتير السابقة والمدفوعات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            لا توجد فواتير بعد
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-green-500" />
      {children}
    </li>
  );
}
