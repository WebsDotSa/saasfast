'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Globe,
  Settings,
  Package,
  Users,
  FileText,
  ShoppingCart,
  Home,
  Briefcase,
  MessageSquare,
  Bot,
  TrendingUp,
  Gift,
  Wallet,
  Megaphone,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

interface DashboardSidebarProps {
  tenantName?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function DashboardSidebar({ tenantName, user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    // جلب الشعار من localStorage
    const savedLogo = localStorage.getItem('tenant_logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const navigation = [
    {
      title: 'نظرة عامة',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'التحليلات',
      href: '/dashboard/analytics',
      icon: TrendingUp,
    },
    {
      title: 'المتجر',
      href: '/dashboard/products',
      icon: ShoppingCart,
      module: 'ecommerce',
    },
    {
      title: 'الصفحات',
      href: '/dashboard/pages',
      icon: Globe,
      module: 'page_builder',
    },
    {
      title: 'المحاسبة',
      href: '/dashboard/accounting',
      icon: FileText,
      module: 'accounting',
    },
    {
      title: 'الموظفين',
      href: '/dashboard/hrms',
      icon: Users,
      module: 'hrms',
    },
    {
      title: 'العملاء',
      href: '/dashboard/crm',
      icon: MessageSquare,
      module: 'crm',
    },
    {
      title: 'الحجوزات',
      href: '/dashboard/booking',
      icon: Home,
      module: 'booking',
    },
    {
      title: 'AI Agent',
      href: '/dashboard/ai',
      icon: Bot,
      module: 'ai_agent',
    },
    {
      title: 'التسويق',
      href: '/dashboard/marketing',
      icon: Megaphone,
    },
    {
      separator: true,
    },
    {
      title: 'الفريق',
      href: '/dashboard/team',
      icon: Users,
    },
    {
      title: 'الإحالات',
      href: '/dashboard/referrals',
      icon: Gift,
    },
    {
      title: 'المدفوعات',
      href: '/dashboard/payments',
      icon: Wallet,
    },
    {
      title: 'الاشتراكات',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
    {
      title: 'النطاقات',
      href: '/dashboard/domains',
      icon: Globe,
    },
    {
      separator: true,
    },
    {
      title: 'الإعدادات',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
          )}
          <div>
            <div className="text-sm font-bold">{tenantName || 'SaaS Core'}</div>
            {tenantName && (
              <div className="text-xs text-muted-foreground">لوحة التحكم</div>
            )}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarBody>
        <SidebarNav>
          {navigation.map((item, index) => {
            if ('separator' in item && item.separator) {
              return <div key={index} className="my-2 border-t" />;
            }

            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const IconComponent = item.icon as any;

            return (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                active={isActive}
                icon={<IconComponent className="h-4 w-4" />}
              >
                {item.title}
                {item.module && (
                  <Badge className="bg-secondary text-secondary-foreground mr-auto text-xs">
                    قريباً
                  </Badge>
                )}
              </SidebarNavItem>
            );
          })}
        </SidebarNav>
      </SidebarBody>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-right">
                <div className="text-sm font-medium">{user?.name || 'مستخدم'}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
            <DropdownMenuItem>الإعدادات</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
