'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth-options';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('غير مصرح');

  const isAdmin =
    (session.user as any).role === 'super_admin' ||
    session.user.email?.endsWith('@saascore.com') ||
    process.env.ADMIN_EMAILS?.split(',').includes(session.user.email || '');

  if (!isAdmin) throw new Error('غير مصرح');
  return createAdminClient();
}

export interface PlanFormData {
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  currency: string;
  billing_interval: string;
  trial_period_days: number;
  max_users?: number | null;
  max_products?: number | null;
  max_orders?: number | null;
  included_modules: string[];
  is_active: boolean;
  is_featured?: boolean;
}

export async function createPlan(data: PlanFormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('plans').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/plans');
  revalidatePath('/');
  redirect('/admin/plans');
}

export async function updatePlan(planId: string, data: PlanFormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('plans').update(data).eq('id', planId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/plans');
  revalidatePath(`/admin/plans/${planId}`);
  revalidatePath('/');
  redirect('/admin/plans');
}

export async function togglePlanStatus(planId: string, isActive: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('plans').update({ is_active: isActive }).eq('id', planId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/plans');
  revalidatePath('/');
}

export async function deletePlan(planId: string) {
  const supabase = await requireAdmin();

  // تحقق أنه لا توجد اشتراكات نشطة
  const { count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId)
    .in('status', ['active', 'trialing']);

  if ((count || 0) > 0) {
    throw new Error(`لا يمكن حذف الخطة: يوجد ${count} اشتراك نشط`);
  }

  const { error } = await supabase.from('plans').delete().eq('id', planId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/plans');
}
