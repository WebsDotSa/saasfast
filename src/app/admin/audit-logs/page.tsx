import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<{ page?: string; action?: string; tenant?: string }>;
}

export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || '1'));
  const actionFilter = params.action || '';
  const tenantFilter = params.tenant || '';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('audit_logs')
    .select('*, tenants(name_ar)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (actionFilter) query = query.eq('action', actionFilter);
  if (tenantFilter) query = query.eq('tenant_id', tenantFilter);

  const { data: logs, count } = await query;

  // الحصول على الأنواع المتاحة للفلترة
  const { data: actions } = await supabase
    .from('audit_logs')
    .select('action')
    .order('action');

  const uniqueActions = [...new Set(actions?.map((a) => a.action) || [])];
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const ACTION_COLORS: Record<string, string> = {
    USER_SIGNIN: 'bg-blue-100 text-blue-800',
    USER_CREATED: 'bg-green-100 text-green-800',
    IMPERSONATE_START: 'bg-purple-100 text-purple-800',
    TENANT_CREATED: 'bg-teal-100 text-teal-800',
    PAYMENT_SUCCESS: 'bg-green-100 text-green-800',
    PAYMENT_FAILED: 'bg-red-100 text-red-800',
    SUBSCRIPTION_CANCELLED: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">سجل التدقيق</h1>
        <p className="text-muted-foreground">جميع الأنشطة والعمليات في المنصة</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/audit-logs">
          <Badge variant={!actionFilter ? 'default' : 'outline'} className="cursor-pointer">
            الكل
          </Badge>
        </Link>
        {uniqueActions.slice(0, 10).map((action) => (
          <Link key={action} href={`?action=${action}`}>
            <Badge
              variant={actionFilter === action ? 'default' : 'outline'}
              className="cursor-pointer font-mono text-xs"
            >
              {action}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>السجلات</CardTitle>
          <CardDescription>{count || 0} حدث مسجل</CardDescription>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="shrink-0 mt-0.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono ${
                        ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {log.action}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.resource_type && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {log.resource_type}
                        </span>
                      )}
                      {(log.tenants as any)?.name_ar && (
                        <span className="text-xs text-muted-foreground">
                          · {(log.tenants as any).name_ar}
                        </span>
                      )}
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">لا توجد سجلات</p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">صفحة {page} من {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ''}`}
                    className="border rounded-md px-3 h-8 flex items-center text-sm hover:bg-muted"
                  >
                    السابق
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ''}`}
                    className="border rounded-md px-3 h-8 flex items-center text-sm hover:bg-muted"
                  >
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
