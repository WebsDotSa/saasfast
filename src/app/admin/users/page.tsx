import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || '1'));
  const search = params.search || '';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('user_profiles')
    .select('user_id, full_name, email, avatar_url, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, count } = await query;

  // جلب المنشآت لكل مستخدم دفعة واحدة
  const userIds = users?.map((u) => u.user_id) || [];
  const { data: tenantUsersData } = userIds.length
    ? await supabase
        .from('tenant_users')
        .select('user_id, tenant_id, role, tenants(name_ar)')
        .in('user_id', userIds)
    : { data: [] };

  // تجميع المنشآت حسب user_id
  const tenantsByUser: Record<string, any[]> = {};
  tenantUsersData?.forEach((tu: any) => {
    if (!tenantsByUser[tu.user_id]) tenantsByUser[tu.user_id] = [];
    tenantsByUser[tu.user_id].push(tu);
  });
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">جميع مستخدمي المنصة</p>
      </div>

      <div className="flex items-center gap-3">
        <form className="flex-1 max-w-sm">
          <input
            name="search"
            defaultValue={search}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full border rounded-md px-3 h-9 text-sm bg-background"
          />
        </form>
        <span className="text-sm text-muted-foreground">{count || 0} مستخدم</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المستخدمون</CardTitle>
          <CardDescription>صفحة {page} من {totalPages}</CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">المستخدم</th>
                  <th className="pb-3 font-medium">الدور</th>
                  <th className="pb-3 font-medium">المنشآت</th>
                  <th className="pb-3 font-medium">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.user_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="h-9 w-9 rounded-full" alt="" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">{user.full_name || '—'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {user.role === 'super_admin' ? (
                        <Badge variant="destructive">Super Admin</Badge>
                      ) : (
                        <Badge variant="outline">مستخدم</Badge>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {tenantsByUser[user.user_id]?.slice(0, 3).map((tu: any) => (
                          <Badge key={tu.tenant_id} variant="secondary" className="text-xs">
                            {tu.tenants?.name_ar}
                          </Badge>
                        ))}
                        {(tenantsByUser[user.user_id]?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tenantsByUser[user.user_id].length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-muted-foreground py-12">لا يوجد مستخدمون</p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">صفحة {page} من {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}
                    className="border rounded-md px-3 h-8 flex items-center text-sm hover:bg-muted">
                    السابق
                  </a>
                )}
                {page < totalPages && (
                  <a href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}
                    className="border rounded-md px-3 h-8 flex items-center text-sm hover:bg-muted">
                    التالي
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
