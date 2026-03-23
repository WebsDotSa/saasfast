'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  Shield,
  LogOut,
  Bell,
  ClipboardList,
  Receipt,
  UserCog,
  ChevronDown,
  ChevronUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: { title: string; href: string }[];
}

const navigation: NavItem[] = [
  { title: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
  {
    title: 'المستأجرون',
    href: '/admin/tenants',
    icon: Users,
  },
  {
    title: 'المدفوعات',
    href: '/admin/payments',
    icon: Wallet,
    children: [
      { title: 'نظرة عامة', href: '/admin/payments/overview' },
      { title: 'تجار المنصة', href: '/admin/payments/merchants' },
      { title: 'التسويات', href: '/admin/payments/settlements' },
    ],
  },
  {
    title: 'الاشتراكات',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
  { title: 'الفواتير', href: '/admin/invoices', icon: Receipt },
  { title: 'خطط الأسعار', href: '/admin/plans', icon: FileText },
  { title: 'المستخدمون', href: '/admin/users', icon: UserCog },
  { title: 'الإعلانات', href: '/admin/announcements', icon: Bell },
  { title: 'سجل التدقيق', href: '/admin/audit-logs', icon: ClipboardList },
  { title: 'الإعدادات', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/admin/payments': true, // Expand payments by default
  });

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-64 bg-white border-l shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold">Admin Panel</div>
            <div className="text-xs text-muted-foreground">SaaS Core</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems[item.href];

          return (
            <div key={item.href}>
              <div
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-sm cursor-pointer',
                  active && !hasChildren
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
                onClick={() => hasChildren && toggleExpand(item.href)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-foreground' : 'text-gray-400')} />
                  <span>{item.title}</span>
                </div>
                {hasChildren && (
                  isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )
                )}
              </div>
              {hasChildren && isExpanded && (
                <div className="mr-8 mt-1 space-y-0.5">
                  {item.children?.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-2 rounded-lg transition-all text-xs',
                          childActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {userName?.charAt(0) || userEmail?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{userName || 'Admin'}</div>
            <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
          </div>
          <Link
            href="/api/auth/signout"
            className="text-gray-400 hover:text-destructive transition-colors shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
