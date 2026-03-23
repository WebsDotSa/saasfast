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
  if (!isAdmin) throw new Error('غير مصرح');
  return createAdminClient();
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  type: string;
  is_active: boolean;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('announcements').insert([{
    ...data,
    is_global: true,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/announcements');
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('announcements').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/announcements');
}

export async function deleteAnnouncement(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/announcements');
}
