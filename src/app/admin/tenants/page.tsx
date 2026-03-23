import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TenantsFilter } from '@/components/admin/tenants-filter';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const PAGE_SIZE = 20;

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  trial: { label: 'تجريبي', variant: 'secondary' },
  suspended: { label: 'معلق', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
  archived: { label: 'مؤرشف', variant: 'outline' },
};

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function AdminTenantsPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const params = await searchParams;

  const search = params.search || '';
  const status = params.status || '';
  const page = Math.max(1, parseInt(params.page || '1'));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('tenants')
    .select(
      `
      id, name_ar, name_en, email, slug, status, created_at,
      subscriptions ( status, plan_id, plans(name_ar) ),
      tenant_users ( user_id )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%,email.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data: tenants, count } = await query;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">إدارة المستأجرين</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع المستأجرين في المنصة</p>
        </div>
      </div>

      <TenantsFilter />

      <Card>
        <CardHeader>
          <CardTitle>المستأجرون</CardTitle>
          <CardDescription>
            {count || 0} مستأجر{search || status ? ' (نتائج مفلترة)' : ' في المنصة'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants && tenants.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-right text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">المنشأة</th>
                      <th className="pb-3 font-medium">Slug</th>
                      <th className="pb-3 font-medium">الحالة</th>
                      <th className="pb-3 font-medium">الخطة</th>
                      <th className="pb-3 font-medium">الأعضاء</th>
                      <th className="pb-3 font-medium">تاريخ الإنشاء</th>
                      <th className="pb-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => {
                      const sub = (tenant.subscriptions as any[])?.[0];
                      const statusInfo = STATUS_MAP[tenant.status] || { label: tenant.status, variant: 'outline' as const };
                      const membersCount = (tenant.tenant_users as any[])?.length || 0;

                      return (
                        <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4">
                            <div>
                              <div className="font-medium">{tenant.name_ar}</div>
                              {tenant.email && (
                                <div className="text-xs text-muted-foreground">{tenant.email}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{tenant.slug}</code>
                          </td>
                          <td className="py-4">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </td>
                          <td className="py-4 text-sm">
                            {sub?.plans?.name_ar || (
                              <span className="text-muted-foreground text-xs">لا يوجد</span>
                            )}
                          </td>
                          <td className="py-4 text-sm text-center">{membersCount}</td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="py-4">
                            <Link href={`/admin/tenants/${tenant.id}`}>
                              <Button variant="outline" size="sm">
                                عرض
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    صفحة {page} من {totalPages} · {count} نتيجة
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`?${new URLSearchParams({ ...(search && { search }), ...(status && { status }), page: String(page - 1) }).toString()}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ChevronRight className="h-4 w-4" />
                          السابق
                        </Button>
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link href={`?${new URLSearchParams({ ...(search && { search }), ...(status && { status }), page: String(page + 1) }).toString()}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          التالي
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              {search || status ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد مستأجرين بعد'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
