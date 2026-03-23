import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PlanFilterSelect } from '@/components/admin/plan-filter-select';

const PAGE_SIZE = 20;

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  trialing: { label: 'تجريبي', variant: 'secondary' },
  past_due: { label: 'متأخر', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
  expired: { label: 'منتهي', variant: 'outline' },
};

interface PageProps {
  searchParams: Promise<{ status?: string; plan?: string; page?: string }>;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const params = await searchParams;

  const status = params.status || '';
  const planFilter = params.plan || '';
  const page = Math.max(1, parseInt(params.page || '1'));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('subscriptions')
    .select(
      `*, tenants(name_ar, email), plans(name_ar, price, currency)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (planFilter) query = query.eq('plan_id', planFilter);

  const { data: subscriptions, count } = await query;
  const { data: plans } = await supabase.from('plans').select('id, name_ar');

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const statusOptions = [
    { value: '', label: 'الكل' },
    ...Object.entries(STATUS_MAP).map(([value, { label }]) => ({ value, label })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">إدارة الاشتراكات</h1>
        <p className="text-muted-foreground">عرض ومتابعة جميع الاشتراكات في المنصة</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {statusOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`?${new URLSearchParams({ ...(opt.value && { status: opt.value }), ...(planFilter && { plan: planFilter }) }).toString()}`}
            >
              <Button
                variant={status === opt.value ? 'default' : 'outline'}
                size="sm"
              >
                {opt.label}
              </Button>
            </Link>
          ))}
        </div>
        <PlanFilterSelect plans={plans || []} currentPlan={planFilter} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الاشتراكات</CardTitle>
          <CardDescription>{count || 0} اشتراك{status || planFilter ? ' (مفلتر)' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions && subscriptions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-right text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">المنشأة</th>
                      <th className="pb-3 font-medium">الخطة</th>
                      <th className="pb-3 font-medium">الحالة</th>
                      <th className="pb-3 font-medium">السعر</th>
                      <th className="pb-3 font-medium">بداية الدورة</th>
                      <th className="pb-3 font-medium">نهاية الدورة</th>
                      <th className="pb-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const st = STATUS_MAP[sub.status] || { label: sub.status, variant: 'outline' as const };
                      const isExpiringSoon =
                        sub.status === 'active' &&
                        sub.current_period_end &&
                        new Date(sub.current_period_end).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

                      return (
                        <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4">
                            <div>
                              <div className="font-medium">{(sub.tenants as any)?.name_ar}</div>
                              <div className="text-xs text-muted-foreground">{(sub.tenants as any)?.email}</div>
                            </div>
                          </td>
                          <td className="py-4 text-sm">{(sub.plans as any)?.name_ar}</td>
                          <td className="py-4">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                          <td className="py-4 text-sm">
                            {(sub.plans as any)?.price} {(sub.plans as any)?.currency || 'SAR'}
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {sub.current_period_start
                              ? new Date(sub.current_period_start).toLocaleDateString('ar-SA')
                              : '-'}
                          </td>
                          <td className="py-4 text-sm">
                            <span className={isExpiringSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                              {sub.current_period_end
                                ? new Date(sub.current_period_end).toLocaleDateString('ar-SA')
                                : '-'}
                              {isExpiringSoon && ' ⚠️'}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link href={`/admin/subscriptions/${sub.id}`}>
                              <Button variant="outline" size="sm">إدارة</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    صفحة {page} من {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`?${new URLSearchParams({ ...(status && { status }), ...(planFilter && { plan: planFilter }), page: String(page - 1) }).toString()}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ChevronRight className="h-4 w-4" /> السابق
                        </Button>
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link href={`?${new URLSearchParams({ ...(status && { status }), ...(planFilter && { plan: planFilter }), page: String(page + 1) }).toString()}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          التالي <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">لا توجد اشتراكات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
