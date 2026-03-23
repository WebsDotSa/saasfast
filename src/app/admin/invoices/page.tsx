import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; tenant?: string }>;
}

export default async function AdminInvoicesPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || '1'));
  const statusFilter = params.status || '';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('invoices')
    .select('*, tenants(id, name_ar)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (statusFilter) query = query.eq('status', statusFilter);

  const { data: invoices, count } = await query;

  // إجمالي الإيرادات
  const { data: paidData } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('status', 'paid');

  const totalRevenue = paidData?.reduce((s, i) => s + (i.total_amount || 0), 0) || 0;

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const STATUS_MAP = {
    paid: { label: 'مدفوع', variant: 'default' as const },
    pending: { label: 'معلق', variant: 'secondary' as const },
    failed: { label: 'فشل', variant: 'destructive' as const },
    refunded: { label: 'مسترد', variant: 'outline' as const },
  };

  const statusOptions = [
    { value: '', label: 'الكل' },
    ...Object.entries(STATUS_MAP).map(([value, { label }]) => ({ value, label })),
  ];

  // إحصائيات
  const paid = invoices?.filter((i) => i.status === 'paid').length || 0;
  const pending = invoices?.filter((i) => i.status === 'pending').length || 0;
  const failed = invoices?.filter((i) => i.status === 'failed').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">الفواتير</h1>
        <p className="text-muted-foreground">سجل كامل لجميع الفواتير في المنصة</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString('ar-SA')} ر.س</div>
            <p className="text-sm text-muted-foreground mt-1">إجمالي الإيرادات المحصّلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{count || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">إجمالي الفواتير</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{pending}</div>
            <p className="text-sm text-muted-foreground mt-1">فواتير معلقة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <p className="text-sm text-muted-foreground mt-1">فواتير فاشلة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`?${opt.value ? `status=${opt.value}` : ''}`}
          >
            <Button variant={statusFilter === opt.value ? 'default' : 'outline'} size="sm">
              {opt.label}
            </Button>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الفواتير</CardTitle>
          <CardDescription>{count || 0} فاتورة</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-right text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">رقم الفاتورة</th>
                      <th className="pb-3 font-medium">المنشأة</th>
                      <th className="pb-3 font-medium">الحالة</th>
                      <th className="pb-3 font-medium">المبلغ</th>
                      <th className="pb-3 font-medium">التاريخ</th>
                      <th className="pb-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const st = STATUS_MAP[inv.status as keyof typeof STATUS_MAP] || { label: inv.status, variant: 'outline' as const };
                      return (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{inv.invoice_number}</code>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/tenants/${(inv.tenants as any)?.id}`}
                              className="text-sm font-medium hover:text-primary hover:underline"
                            >
                              {(inv.tenants as any)?.name_ar}
                            </Link>
                          </td>
                          <td className="py-4">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                          <td className="py-4 text-sm font-medium">
                            {inv.total_amount?.toLocaleString('ar-SA')} ر.س
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {new Date(inv.created_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="py-4">
                            <Link href={`/admin/tenants/${(inv.tenants as any)?.id}`}>
                              <Button variant="ghost" size="sm">عرض المنشأة</Button>
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
                  <p className="text-sm text-muted-foreground">صفحة {page} من {totalPages}</p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ChevronRight className="h-4 w-4" /> السابق
                        </Button>
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link href={`?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>
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
            <p className="text-center text-muted-foreground py-12">لا توجد فواتير</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
