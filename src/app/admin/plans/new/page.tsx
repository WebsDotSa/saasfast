import { PlanForm } from '@/components/admin/plan-form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function NewPlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/plans" className="hover:text-foreground">خطط الأسعار</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">خطة جديدة</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-1">إنشاء خطة جديدة</h1>
        <p className="text-muted-foreground">أضف خطة اشتراك جديدة للمنصة</p>
      </div>

      <PlanForm />
    </div>
  );
}
