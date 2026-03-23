import { ReactNode } from 'react';
import { auth } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { TenantThemeProvider } from '@/components/tenant-theme-provider';
import { CrispChat } from '@/components/crisp-chat';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { ImpersonationBanner } from '@/components/impersonation-banner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <TenantThemeProvider>
      <div className="flex min-h-screen flex-col">
        {/* Impersonation Banner */}
        <ImpersonationBanner />

        {/* Announcement Banner */}
        <AnnouncementBanner />

        <div className="flex flex-1">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <DashboardHeader user={session.user} />
            <main className="flex-1 p-6 bg-muted/30">
              {children}
            </main>
          </div>
        </div>
      </div>
      <CrispChat />
    </TenantThemeProvider>
  );
}
