import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  trialing: { label: 'تجريبي', variant: 'secondary' },
  past_due: { label: 'متأخر', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
  expired: { label: 'منتهي', variant: 'outline' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  const supabase = createAdminClient();
  const { id } = await params;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, tenants(id, name_ar, email, slug), plans(name_ar, price, currency, billing_interval)')
    .eq('id', id)
    .single();

  if (!sub) notFound();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', (sub.tenants as any)?.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const tenant = sub.tenants as any;
  const plan = sub.plans as any;
  const st = STATUS_MAP[sub.status] || { label: sub.status, variant: 'outline' as const };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/subscriptions" className="hover:text-foreground">الاشتراكات</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{tenant?.name_ar}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tenant?.name_ar}</h1>
          <p className="text-muted-foreground">{tenant?.email}</p>
        </div>
        <Badge variant={st.variant} className="text-sm px-3 py-1">{st.label}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">تفاصيل الاشتراك</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'الخطة', value: plan?.name_ar },
              { label: 'السعر', value: `${plan?.price} ${plan?.currency || 'SAR'} / ${plan?.billing_interval}` },
              { label: 'بداية الدورة', value: sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString('ar-SA') : '-' },
              { label: 'نهاية الدورة', value: sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('ar-SA') : '-' },
              { label: 'تاريخ الإنشاء', value: new Date(sub.created_at).toLocaleDateString('ar-SA') },
              { label: 'رقم MyFatoorah', value: sub.myfatoorah_invoice_id },
            ].map(({ label, value }) =>
              value ? (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ) : null
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">معلومات المنشأة</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'الاسم', value: tenant?.name_ar },
              { label: 'البريد', value: tenant?.email },
              { label: 'Slug', value: tenant?.slug },
            ].map(({ label, value }) =>
              value ? (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ) : null
            )}
            <div className="pt-2">
              <Link href={`/admin/tenants/${tenant?.id}`} className="text-primary text-sm hover:underline">
                عرض صفحة المنشأة ←
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader><CardTitle className="text-base">سجل الفواتير</CardTitle></CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">رقم الفاتورة</th>
                  <th className="pb-3 font-medium">الحالة</th>
                  <th className="pb-3 font-medium">المبلغ</th>
                  <th className="pb-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 text-sm font-mono">{inv.invoice_number}</td>
                    <td className="py-3">
                      <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'}>
                        {inv.status === 'paid' ? 'مدفوع' : inv.status === 'pending' ? 'معلق' : 'مرفوض'}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm font-medium">{inv.total_amount?.toLocaleString('ar-SA')} ر.س</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
