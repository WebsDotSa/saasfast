import { auth } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const supabase = createAdminClient();
  const userId = (session.user as any).id;

  let userProfile: { role: string } | null = null;
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    userProfile = data;
  } catch {
    // table may not exist yet — fall through to email-based checks
  }

  const isAdmin =
    userProfile?.role === 'super_admin' ||
    session.user.email?.endsWith('@saascore.com') ||
    process.env.ADMIN_EMAILS?.split(',').includes(session.user.email || '');

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar
        userName={session.user.name || ''}
        userEmail={session.user.email || ''}
      />
      <main className="mr-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
