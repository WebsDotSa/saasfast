import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PlanForm } from '@/components/admin/plan-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlanPage({ params }: PageProps) {
  const supabase = createAdminClient();
  const { id } = await params;

  const [{ data: plan }, { count: activeCount }] = await Promise.all([
    supabase.from('plans').select('*').eq('id', id).single(),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', id)
      .in('status', ['active', 'trialing']),
  ]);

  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/plans" className="hover:text-foreground">خطط الأسعار</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{plan.name_ar}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">تعديل خطة: {plan.name_ar}</h1>
          <p className="text-muted-foreground">تعديل إعدادات وسعر الخطة</p>
        </div>
      </div>

      {(activeCount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>
            يوجد <strong>{activeCount}</strong> اشتراك نشط على هذه الخطة. تغيير السعر لن يؤثر على الاشتراكات الحالية.
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">اشتراكات نشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <PlanForm plan={plan} />
    </div>
  );
}
