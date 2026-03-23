import * as React from 'react';

import { cn } from '@/lib/utils';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full min-h-screen w-64 flex-col border-l bg-muted/40',
      className
    )}
    {...props}
  />
));
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-16 items-center border-b px-6', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

const SidebarBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-auto py-4', className)}
    {...props}
  />
));
SidebarBody.displayName = 'SidebarBody';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('border-t p-6', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

const SidebarNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn('flex flex-col gap-1 px-3', className)}
    {...props}
  />
));
SidebarNav.displayName = 'SidebarNav';

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ className, href, icon, active, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          className
        )}
        {...props}
      >
        {icon && <span className="h-4 w-4">{icon}</span>}
        {children}
      </a>
    );
  }
);
SidebarNavItem.displayName = 'SidebarNavItem';

export {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
};
