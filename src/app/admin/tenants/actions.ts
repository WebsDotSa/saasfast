'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth-options';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('غير مصرح');

  const isAdmin =
    (session.user as any).role === 'super_admin' ||
    session.user.email?.endsWith('@saascore.com') ||
    process.env.ADMIN_EMAILS?.split(',').includes(session.user.email || '');

  if (!isAdmin) throw new Error('غير مصرح: ليس أدمن');
  return createAdminClient();
}

export async function suspendTenant(tenantId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'suspended' })
    .eq('id', tenantId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tenants');
  revalidatePath(`/admin/tenants/${tenantId}`);
}

export async function activateTenant(tenantId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'active' })
    .eq('id', tenantId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tenants');
  revalidatePath(`/admin/tenants/${tenantId}`);
}

export async function cancelTenant(tenantId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'cancelled' })
    .eq('id', tenantId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tenants');
  revalidatePath(`/admin/tenants/${tenantId}`);
}

export async function changeTenantPlan(tenantId: string, planId: string) {
  const supabase = await requireAdmin();

  // تحديث الاشتراك النشط
  const { error } = await supabase
    .from('subscriptions')
    .update({ plan_id: planId })
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'trialing']);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tenants/${tenantId}`);
}

export async function extendTrial(tenantId: string, days: number) {
  const supabase = await requireAdmin();

  const newEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('subscriptions')
    .update({
      current_period_end: newEnd,
      status: 'trialing',
    })
    .eq('tenant_id', tenantId)
    .eq('status', 'trialing');

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tenants/${tenantId}`);
}

export async function deleteTenant(tenantId: string) {
  const supabase = await requireAdmin();

  // حذف المستأجر (cascade يحذف الاشتراكات والأعضاء)
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'archived' })
    .eq('id', tenantId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/tenants');
}

export async function updateTenantModules(tenantId: string, modules: string[]) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('tenants')
    .update({ modules })
    .eq('id', tenantId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tenants/${tenantId}`);
}
