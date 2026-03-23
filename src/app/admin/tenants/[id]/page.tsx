import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantActions } from '@/components/admin/tenant-actions';
import Link from 'next/link';
import { ChevronRight, Users, CreditCard, FileText, Activity, Globe } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  trial: { label: 'تجريبي', variant: 'secondary' },
  suspended: { label: 'معلق', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
  archived: { label: 'مؤرشف', variant: 'outline' },
};

const ROLE_MAP: Record<string, string> = {
  owner: 'مالك',
  admin: 'مدير',
  editor: 'محرر',
  viewer: 'مشاهد',
  developer: 'مطور',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: PageProps) {
  const supabase = createAdminClient();
  const { id } = await params;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (!tenant) notFound();

  const [
    { data: subscriptions },
    { data: memberRows },
    { data: invoices },
    { data: auditLogs },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*, plans(name_ar, name_en, price, currency, billing_interval)')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tenant_users')
      .select('user_id, role, created_at')
      .eq('tenant_id', id),
    supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('plans').select('id, name_ar').eq('is_active', true),
  ]);

  // جلب user_profiles للأعضاء
  const memberUserIds = memberRows?.map((m) => m.user_id) || [];
  const { data: memberProfiles } = memberUserIds.length
    ? await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', memberUserIds)
    : { data: [] };

  const profilesMap: Record<string, any> = {};
  memberProfiles?.forEach((p) => { profilesMap[p.user_id] = p; });

  const members = memberRows?.map((m) => ({
    ...m,
    user_profiles: profilesMap[m.user_id] || null,
  }));

  const activeSub = subscriptions?.find((s) => ['active', 'trialing'].includes(s.status));
  const statusInfo = STATUS_MAP[tenant.status] || { label: tenant.status, variant: 'outline' as const };
  const totalRevenue = invoices?.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/tenants" className="hover:text-foreground">
          المستأجرون
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{tenant.name_ar}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover border" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {tenant.name_ar?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{tenant.name_ar}</h1>
            {tenant.name_en && <p className="text-muted-foreground">{tenant.name_en}</p>}
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{tenant.slug}</code>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
          </div>
        </div>
        <TenantActions
          tenantId={tenant.id}
          tenantName={tenant.name_ar}
          currentStatus={tenant.status}
          plans={plans || []}
          currentPlanId={activeSub?.plan_id}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              الاشتراك الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {(activeSub?.plans as any)?.name_ar || 'لا يوجد'}
            </div>
            {activeSub && (
              <p className="text-xs text-muted-foreground mt-1">
                {activeSub.status === 'trialing' ? 'تجريبي · ' : ''}
                ينتهي {new Date(activeSub.current_period_end).toLocaleDateString('ar-SA')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              الأعضاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{members?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              إجمالي الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              إجمالي الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{totalRevenue.toLocaleString('ar-SA')} ر.س</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="members">الأعضاء ({members?.length || 0})</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير ({invoices?.length || 0})</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">معلومات المنشأة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'البريد الإلكتروني', value: tenant.email },
                  { label: 'الهاتف', value: tenant.phone },
                  { label: 'الموقع', value: tenant.website },
                  { label: 'الدولة', value: tenant.country },
                  { label: 'رقم الضريبة', value: tenant.tax_number },
                  { label: 'تاريخ الإنشاء', value: new Date(tenant.created_at).toLocaleDateString('ar-SA') },
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
              <CardHeader>
                <CardTitle className="text-base">الوحدات المفعّلة</CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.modules && tenant.modules.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tenant.modules.map((m: string) => (
                      <Badge key={m} variant="outline">
                        {m}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد وحدات مفعّلة</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {members && members.length > 0 ? (
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-right text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">المستخدم</th>
                      <th className="pb-3 font-medium">الدور</th>
                      <th className="pb-3 font-medium">تاريخ الانضمام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any) => (
                      <tr key={m.user_id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {m.user_profiles?.avatar_url ? (
                              <img src={m.user_profiles.avatar_url} className="h-8 w-8 rounded-full" alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {m.user_profiles?.full_name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium">{m.user_profiles?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{m.user_profiles?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                            {ROLE_MAP[m.role] || m.role}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا يوجد أعضاء</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((sub) => {
                  const plan = sub.plans as any;
                  const subStatus = STATUS_MAP[sub.status] || { label: sub.status, variant: 'outline' as const };
                  return (
                    <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{plan?.name_ar || 'خطة غير معروفة'}</div>
                        <Badge variant={subStatus.variant}>{subStatus.label}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">السعر: </span>
                          <span>{plan?.price} {plan?.currency || 'SAR'} / {plan?.billing_interval}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">البداية: </span>
                          <span>{new Date(sub.current_period_start).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الانتهاء: </span>
                          <span>{new Date(sub.current_period_end).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد اشتراكات</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="pt-6">
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
                          <Badge
                            variant={
                              inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {inv.status === 'paid' ? 'مدفوع' : inv.status === 'pending' ? 'معلق' : 'مرفوض'}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm font-medium">
                          {inv.total_amount?.toLocaleString('ar-SA')} ر.س
                        </td>
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
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <Activity className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                          {log.resource_type && (
                            <span className="text-xs text-muted-foreground">{log.resource_type}</span>
                          )}
                        </div>
                        {log.metadata && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
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
                <p className="text-center text-muted-foreground py-8">لا يوجد نشاط مسجل</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
