// ═══════════════════════════════════════════════════════════════════════════════
// Module Registry — نظام الوحدات
// ═══════════════════════════════════════════════════════════════════════════════
// تعريف جميع الوحدات المتاحة وتكوينها
// ═══════════════════════════════════════════════════════════════════════════════

export interface ModuleDefinition {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  icon: string;
  color: string;
  tables: string[];
  routes: string[];
  permissions: string[];
  dependencies?: string[];
  availableInPlans?: string[];
}

/**
 * تعريف جميع الوحدات المتاحة
 */
export const MODULE_REGISTRY = {
  // ─────────────────────────────────────────────────────────────────────────────
  // E-commerce Module
  // ─────────────────────────────────────────────────────────────────────────────
  
  ecommerce: {
    id: 'ecommerce',
    label: 'متجر إلكتروني',
    labelEn: 'E-commerce',
    description: 'نظام متجر إلكتروني كامل: منتجات، طلبات، سلة تسوق، كوبونات، شحن',
    icon: '🛒',
    color: '#6c63ff',
    tables: [
      'products',
      'product_categories',
      'orders',
      'order_items',
      'carts',
      'coupons',
    ],
    routes: [
      '/dashboard/products',
      '/dashboard/orders',
      '/dashboard/coupons',
      '/store',
    ],
    permissions: [
      'products.view',
      'products.create',
      'products.edit',
      'products.delete',
      'orders.view',
      'orders.edit',
      'coupons.view',
      'coupons.manage',
    ],
    availableInPlans: ['basic', 'professional', 'enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // Page Builder Module
  // ─────────────────────────────────────────────────────────────────────────────
  
  page_builder: {
    id: 'page_builder',
    label: 'بناء صفحات',
    labelEn: 'Page Builder',
    description: 'بناء صفحات بصرياً: drag & drop، قوالب، SEO، نشر فوري',
    icon: '🌐',
    color: '#00d4aa',
    tables: ['pages', 'blocks', 'themes'],
    routes: ['/dashboard/pages', '/dashboard/themes', '/pages'],
    permissions: [
      'pages.view',
      'pages.create',
      'pages.edit',
      'pages.delete',
      'pages.publish',
      'blocks.manage',
      'themes.manage',
    ],
    availableInPlans: ['basic', 'professional', 'enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // Accounting Module
  // ─────────────────────────────────────────────────────────────────────────────
  
  accounting: {
    id: 'accounting',
    label: 'محاسبة',
    labelEn: 'Accounting',
    description: 'نظام محاسبة كامل متوافق مع ZATCA: فواتير ضريبية، حسابات، تقارير',
    icon: '📊',
    color: '#ffd166',
    tables: ['accounts', 'journal_entries', 'journal_entry_lines', 'invoices_ar'],
    routes: ['/dashboard/accounting', '/dashboard/invoices', '/dashboard/reports'],
    permissions: [
      'accounts.view',
      'accounts.manage',
      'invoices.view',
      'invoices.create',
      'invoices.edit',
      'reports.view',
      'zatca.submit',
    ],
    dependencies: ['ecommerce'],
    availableInPlans: ['professional', 'enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // HRMS Module
  // ─────────────────────────────────────────────────────────────────────────────
  
  hrms: {
    id: 'hrms',
    label: 'موارد بشرية',
    labelEn: 'HRMS',
    description: 'إدارة الموارد البشرية: موظفين، رواتب، حضور، إجازات، GOSI',
    icon: '👥',
    color: '#ff6b6b',
    tables: ['employees', 'payroll', 'payroll_items'],
    routes: ['/dashboard/hrms', '/dashboard/employees', '/dashboard/payroll'],
    permissions: [
      'employees.view',
      'employees.create',
      'employees.edit',
      'payroll.view',
      'payroll.manage',
      'reports.view',
    ],
    availableInPlans: ['enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // CRM Module
  // ─────────────────────────────────────────────────────────────────────────────
  
  crm: {
    id: 'crm',
    label: 'إدارة عملاء',
    labelEn: 'CRM',
    description: 'إدارة علاقات العملاء: جهات اتصال، صفقات، pipeline مبيعات',
    icon: '🤝',
    color: '#4cc9f0',
    tables: ['contacts', 'deals', 'pipelines', 'activities'],
    routes: ['/dashboard/crm', '/dashboard/contacts', '/dashboard/deals'],
    permissions: [
      'contacts.view',
      'contacts.manage',
      'deals.view',
      'deals.manage',
      'pipelines.manage',
    ],
    availableInPlans: ['professional', 'enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // Booking Module
  // ─────────────────────────────────────────────────────────────────────────────
  
  booking: {
    id: 'booking',
    label: 'حجوزات',
    labelEn: 'Booking',
    description: 'نظام حجوزات: خدمات، مواعيد، تقويم، تذكيرات تلقائية',
    icon: '📅',
    color: '#a855f7',
    tables: ['services', 'appointments', 'bookings'],
    routes: ['/dashboard/booking', '/dashboard/appointments'],
    permissions: [
      'services.view',
      'services.manage',
      'appointments.view',
      'appointments.manage',
    ],
    availableInPlans: ['professional', 'enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // AI Agent Module
  // ─────────────────────────────────────────────────────────────────────────────

  ai_agent: {
    id: 'ai_agent',
    label: 'وكيل AI',
    labelEn: 'AI Agent',
    description: 'وكيل AI للواتساب/سناب: ردود تلقائية، تكامل مع msaed.ai',
    icon: '🤖',
    color: '#06d6a0',
    tables: ['agents', 'conversations', 'agent_responses'],
    routes: ['/dashboard/ai', '/dashboard/agents'],
    permissions: [
      'agents.view',
      'agents.manage',
      'conversations.view',
    ],
    availableInPlans: ['enterprise'],
  } as ModuleDefinition,

  // ─────────────────────────────────────────────────────────────────────────────
  // Marketing Module
  // ─────────────────────────────────────────────────────────────────────────────

  marketing: {
    id: 'marketing',
    label: 'التسويق',
    labelEn: 'Marketing',
    description: 'أدوات تسويقية متكاملة: خصومات، حملات، ولاء، إحالة',
    icon: '📢',
    color: '#f5a623',
    tables: [
      'discounts',
      'discount_usage_logs',
      'customer_discount_usage',
      'marketing_campaigns',
      'campaign_recipients',
      'campaign_clicks',
      'email_templates',
      'sms_templates',
      'loyalty_programs',
      'loyalty_accounts',
      'loyalty_transactions',
      'loyalty_rewards',
      'loyalty_redemptions',
      'loyalty_tier_history',
      'affiliates',
      'affiliate_clicks',
      'affiliate_conversions',
      'affiliate_payouts',
      'affiliate_banners',
    ],
    routes: [
      '/dashboard/marketing',
      '/dashboard/discounts',
      '/dashboard/campaigns',
      '/dashboard/loyalty',
      '/dashboard/affiliates',
    ],
    permissions: [
      'discounts.view',
      'discounts.create',
      'discounts.edit',
      'discounts.delete',
      'campaigns.view',
      'campaigns.manage',
      'loyalty.view',
      'loyalty.manage',
      'affiliates.view',
      'affiliates.manage',
    ],
    availableInPlans: ['professional', 'enterprise'],
    dependencies: ['ecommerce'],
  } as ModuleDefinition,
} as const;

/**
 * الحصول على قائمة بجميع الوحدات
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * الحصول على وحدة معينة بالـ ID
 */
export function getModule(moduleId: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY[moduleId as keyof typeof MODULE_REGISTRY];
}

/**
 * التحقق إذا كان Module مفعل لـ Tenant
 */
export function hasModule(tenantModules: string[], moduleId: string): boolean {
  return tenantModules.includes(moduleId);
}

/**
 * الحصول على الوحدات المفعلة فقط
 */
export function getEnabledModules(tenantModules: string[]): ModuleDefinition[] {
  return getAllModules().filter(module => 
    tenantModules.includes(module.id)
  );
}

/**
 * التحقق من Dependencies لـ Module
 */
export function checkModuleDependencies(
  tenantModules: string[],
  moduleId: string
): { satisfied: boolean; missing: string[] } {
  const module = getModule(moduleId);
  
  if (!module?.dependencies) {
    return { satisfied: true, missing: [] };
  }

  const missing = module.dependencies.filter(
    dep => !tenantModules.includes(dep)
  );

  return {
    satisfied: missing.length === 0,
    missing,
  };
}

/**
 * الحصول على Routes لوحدة معينة
 */
export function getModuleRoutes(moduleId: string): string[] {
  const module = getModule(moduleId);
  return module?.routes || [];
}

/**
 * الحصول على Tables لوحدة معينة
 */
export function getModuleTables(moduleId: string): string[] {
  const module = getModule(moduleId);
  return module?.tables || [];
}

/**
 * التحقق إذا كان Route ينتمي لوحدة معينة
 */
export function isModuleRoute(pathname: string, moduleId: string): boolean {
  const module = getModule(moduleId);
  
  if (!module) {
    return false;
  }

  return module.routes.some(route => pathname.startsWith(route));
}

/**
 * الحصول على Module لـ Route معين
 */
export function getModuleForRoute(pathname: string): ModuleDefinition | null {
  for (const module of getAllModules()) {
    if (isModuleRoute(pathname, module.id)) {
      return module;
    }
  }
  
  return null;
}

/**
 * التحقق من الصلاحيات لوحدة معينة
 */
export function checkModulePermission(
  userPermissions: string[],
  moduleId: string,
  requiredPermission: string
): boolean {
  const module = getModule(moduleId);
  
  if (!module) {
    return false;
  }

  // Owner و Admin لديهم كل الصلاحيات
  if (userPermissions.includes('owner') || userPermissions.includes('admin')) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
}

/**
 * الحصول على الوحدات المتاحة لخطة معينة
 */
export function getModulesForPlan(planName: string): ModuleDefinition[] {
  return getAllModules().filter(module => 
    !module.availableInPlans || 
    module.availableInPlans.includes(planName.toLowerCase())
  );
}
