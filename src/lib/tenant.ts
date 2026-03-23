import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// Tenant Helpers — Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════
// دوال مساعدة للتعامل مع Tenant Context
// ═══════════════════════════════════════════════════════════════════════════════

export interface TenantContext {
  id: string;
  slug: string;
  name_ar: string;
  name_en?: string;
  status: string;
  modules: string[];
  settings: Record<string, any>;
  plan_name?: string;
  custom_domain?: string;
}

/**
 * الحصول على Tenant Context من Headers
 * يُستخدم في Server Components
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = await headers();

  const tenantId = headersList.get('x-tenant-id');
  
  if (!tenantId) {
    return null;
  }

  return {
    id: tenantId,
    slug: headersList.get('x-tenant-slug') || '',
    name_ar: headersList.get('x-tenant-name') || '',
    status: headersList.get('x-tenant-status') || 'trial',
    modules: (headersList.get('x-tenant-modules') || '').split(',').filter(Boolean),
    plan_name: headersList.get('x-tenant-plan') || undefined,
    custom_domain: undefined,
    settings: {
      primary_color: headersList.get('x-tenant-primary-color') || '#6c63ff',
    },
  };
}

/**
 * التحقق إذا كان المستخدم عضو في Tenant
 */
export async function isTenantMember(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

/**
 * الحصول على دور المستخدم في Tenant
 */
export async function getUserRole(tenantId: string, userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  return data?.role || null;
}

/**
 * التحقق من صلاحية معينة
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const tenant = await getTenantContext();
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !tenant) {
    return false;
  }

  // التحقق من الصلاحيات المخصصة
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('role, permissions')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) {
    return false;
  }

  // Owner و Admin لديهم كل الصلاحيات
  if (['owner', 'admin'].includes(tenantUser.role)) {
    return true;
  }

  // التحقق من الصلاحيات المخصصة
  const permissions = tenantUser.permissions as string[] || [];
  return permissions.includes(permission);
}

/**
 * التحقق إذا كان Module مفعل لـ Tenant
 */
export function hasModule(modules: string[], moduleName: string): boolean {
  return modules.includes(moduleName);
}

/**
 * التحقق إذا كان Tenant يمكنه الوصول لـ feature معينة
 */
export async function canAccessFeature(feature: string): Promise<boolean> {
  const tenant = await getTenantContext();
  
  if (!tenant) {
    return false;
  }

  // التحقق من أن module مفعل
  const moduleMap: Record<string, string> = {
    'products': 'ecommerce',
    'orders': 'ecommerce',
    'cart': 'ecommerce',
    'pages': 'page_builder',
    'blocks': 'page_builder',
    'invoices_ar': 'accounting',
    'employees': 'hrms',
    'payroll': 'hrms',
  };

  const requiredModule = moduleMap[feature];
  
  if (requiredModule && !hasModule(tenant.modules, requiredModule)) {
    return false;
  }

  // التحقق من حدود الخطة
  const planLimits = await getPlanLimits(tenant.id);
  
  if (planLimits) {
    // مثال: التحقق من حد أقصى للمنتجات
    if (feature === 'products' && planLimits.max_products) {
      const productCount = await getResourceCount('products');
      if (productCount >= planLimits.max_products) {
        return false;
      }
    }
  }

  return true;
}

/**
 * الحصول على حدود الخطة
 */
export async function getPlanLimits(tenantId: string): Promise<Record<string, any> | null> {
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select(`
      plan_id,
      plans (
        limits
      )
    `)
    .eq('id', tenantId)
    .single();

  return (tenant?.plans as any)?.limits || null;
}

/**
 * عد الموارد
 */
export async function getResourceCount(resource: string): Promise<number> {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  if (!tenant) {
    return 0;
  }

  const { count } = await supabase
    .from(resource)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);

  return count || 0;
}

/**
 * الحصول على Tenant ID
 * يُستخدم في API Routes
 */
export async function getTenantId(): Promise<string | null> {
  const tenant = await getTenantContext();
  return tenant?.id || null;
}

/**
 * الحصول على إعدادات Tenant
 */
export async function getTenantSettings(): Promise<Record<string, any>> {
  const tenant = await getTenantContext();
  
  return tenant?.settings || {
    primary_color: '#6c63ff',
    font_family: 'IBM Plex Sans Arabic',
    logo_position: 'right',
    show_branding: true,
  };
}

/**
 * التحقق من حالة الاشتراك
 */
export async function getSubscriptionStatus(): Promise<{
  status: string;
  plan_name?: string;
  current_period_end?: Date;
  trial_ends_at?: Date;
} | null> {
  const tenant = await getTenantContext();
  const supabase = await createClient();

  if (!tenant) {
    return null;
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      status,
      current_period_end,
      plans (
        name_ar,
        name_en
      )
    `)
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'trialing'])
    .single();

  if (!subscription) {
    // التحقق من trial
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('trial_ends_at, status')
      .eq('id', tenant.id)
      .single();

    return {
      status: tenantData?.status || 'trial',
      trial_ends_at: tenantData?.trial_ends_at ? new Date(tenantData.trial_ends_at) : undefined,
    };
  }

  return {
    status: subscription.status,
    plan_name: (subscription.plans as any)?.name_ar,
    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end) : undefined,
  };
}
