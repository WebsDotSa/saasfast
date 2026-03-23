import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminPlansPage() {
  const supabase = createAdminClient();

  // الحصول على جميع خطط الأسعار
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">📋 خطط الأسعار</h1>
          <p className="text-muted-foreground">إدارة خطط الاشتراك والأسعار</p>
        </div>
        <Link href="/admin/plans/new">
          <Button>
            <span className="ml-2">+</span>
            خطة جديدة
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name_ar}</span>
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </CardTitle>
                <CardDescription>{plan.name_en}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {plan.price?.toLocaleString('ar-SA')}{' '}
                  <span className="text-sm font-normal">{plan.currency || 'SAR'}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.billing_interval || 'شهر'}
                  </span>
                </div>

                {plan.description_ar && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description_ar}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Users:</span>
                    <span className="font-medium">{plan.max_users || '∞'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Tenants:</span>
                    <span className="font-medium">{plan.max_tenants || '1'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trial Days:</span>
                    <span className="font-medium">{plan.trial_period_days || 0}</span>
                  </div>
                </div>

                {plan.included_modules && plan.included_modules.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-2">الوحدات المتضمنة:</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.included_modules.map((module: string) => (
                        <Badge key={module} variant="outline" className="text-xs">
                          {module}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/plans/${plan.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      تعديل
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8 col-span-full">
            لا توجد خطط أسعار
          </p>
        )}
      </div>
    </div>
  );
}
