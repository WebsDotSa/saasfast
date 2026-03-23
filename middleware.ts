import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateSession } from '@/lib/supabase/middleware';

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware — Tenant Resolution & Auth Guard
// ═══════════════════════════════════════════════════════════════════════════════
// هذا هو أهم ملف في المشروع — يتعامل مع:
// 1. تحديد المنشأة (Tenant) من subdomain أو custom domain
// 2. التحقق من حالة الاشتراك
// 3. حقن tenant context في headers
// 4. حماية المسارات
// ═══════════════════════════════════════════════════════════════════════════════

// تهيئة عميل Supabase للـ tenant resolution
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// المسارات العامة (لا تحتاج tenant)
const PUBLIC_PATHS = [
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/sitemap.xml',
  '/robots.txt',
];

// المسارات التي تتطلب super admin
const ADMIN_PATHS = [
  '/admin',
  '/(admin)',
];

// المسارات التي تتطلب tenant
const TENANT_PATHS = [
  '/dashboard',
  '/(tenant)',
  '/(modules)',
  '/api/tenants',
  '/api/payments',
];

export async function middleware(request: NextRequest) {
  const { pathname, hostname, searchParams } = request.nextUrl;

  // ─────────────────────────────────────────────────────────────────────────────
  // 0. تحديث Session Supabase أولاً (بدون return مبكر)
  // ─────────────────────────────────────────────────────────────────────────────

  const supabaseResponse = updateSession(request);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. تخطي middleware للمسارات العامة
  // ─────────────────────────────────────────────────────────────────────────────

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return supabaseResponse;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. تحديد Tenant من Hostname
  // ─────────────────────────────────────────────────────────────────────────────
  
  const tenant = await resolveTenant(hostname);

  // إذا لم يكن tenant موجود في مسار يتطلب tenant
  if (!tenant && isTenantPath(pathname)) {
    // إعادة توجيه للصفحة الرئيسية أو صفحة not found
    const notFoundUrl = new URL('/not-found', request.url);
    return NextResponse.rewrite(notFoundUrl, { headers: supabaseResponse.headers });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. التحقق من حالة الاشتراك و Onboarding
  // ─────────────────────────────────────────────────────────────────────────────

  if (tenant && 'status' in tenant) {
    // التحقق من حالة tenant
    if ((tenant as any).status === 'suspended') {
      // إعادة توجيه لصفحة التعليق
      const suspendedUrl = new URL('/suspended', request.url);
      return NextResponse.rewrite(suspendedUrl, { headers: supabaseResponse.headers });
    }

    // التحقق من onboarding - إذا لم يكن business_type موجود
    const tenantSettings = (tenant as any).settings;
    const needsOnboarding = !tenantSettings?.business_type;
    const isOnboardingPath = pathname.startsWith('/onboarding');

    // إذا كان يحتاج onboarding وليس في مسار onboarding
    if (needsOnboarding && !isOnboardingPath && pathname.startsWith('/dashboard')) {
      const onboardingUrl = new URL('/onboarding/business-type', request.url);
      return NextResponse.redirect(onboardingUrl, { headers: supabaseResponse.headers });
    }

    // التحقق من انتهاء الاشتراك
    if ((tenant as any).status === 'trial' && (tenant as any).trial_ends_at) {
      const trialEnded = new Date((tenant as any).trial_ends_at) < new Date();
      if (trialEnded && !(tenant as any).subscription_active) {
        const billingUrl = new URL('/dashboard/billing', request.url);
        billingUrl.searchParams.set('reason', 'trial_ended');
        return NextResponse.redirect(billingUrl, { headers: supabaseResponse.headers });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. حقن Tenant Context في Headers
  // ─────────────────────────────────────────────────────────────────────────────

  if (tenant && 'id' in tenant) {
    // Inject tenant info into headers
    supabaseResponse.headers.set('x-tenant-id', (tenant as any).id);
    supabaseResponse.headers.set('x-tenant-slug', (tenant as any).slug);
    supabaseResponse.headers.set('x-tenant-name', (tenant as any).name_ar);
    supabaseResponse.headers.set('x-tenant-plan', (tenant as any).plan_name || 'free');
    supabaseResponse.headers.set('x-tenant-status', (tenant as any).status);
    supabaseResponse.headers.set('x-tenant-modules', (tenant as any).modules?.join(',') || '');

    // Theme settings
    if ((tenant as any).settings?.primary_color) {
      supabaseResponse.headers.set('x-tenant-primary-color', (tenant as any).settings.primary_color);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Admin Paths — access control handled in admin/layout.tsx
  // ─────────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. إضافة CORS headers للـ API routes
  // ─────────────────────────────────────────────────────────────────────────────

  if (pathname.startsWith('/api/')) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', '*');
    supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');
  }

  return supabaseResponse;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * تحديد Tenant من hostname
 * يدعم:
 * - Subdomains: store.platform.sa → store
 * - Custom domains: www.mystore.sa → lookup في tenant_domains
 * - Localhost: localhost:3000 → tenant افتراضي
 */
async function resolveTenant(hostname: string) {
  // إزالة port من hostname
  const host = hostname.split(':')[0];

  try {
    // ───────────────────────────────────────────────────────────────────────────
    // حالة 1: Localhost (للتطوير)
    // ───────────────────────────────────────────────────────────────────────────
    
    if (host === 'localhost' || host === '127.0.0.1') {
      // في التطوير، نحاول الحصول على tenant من search params أو cookie
      // هذا يسمح بتجربة tenant محدد: localhost:3000/dashboard?tenant=test-store
      return null; // في التطوير نسمح بالدخول بدون tenant
    }

    // ───────────────────────────────────────────────────────────────────────────
    // حالة 2: Subdomain (tenant.platform.sa)
    // ───────────────────────────────────────────────────────────────────────────
    
    const platformDomain = process.env.PLATFORM_DOMAIN || 'platform.sa';
    
    if (host.endsWith(`.${platformDomain}`)) {
      // استخراج subdomain
      const subdomain = host.replace(`.${platformDomain}`, '');
      
      // تجاهل www و other common subdomains
      if (['www', 'app', 'admin', 'api'].includes(subdomain)) {
        return null;
      }

      // البحث عن tenant بالـ slug
      const { data: tenant } = await supabase
        .from('tenants')
        .select(`
          id,
          slug,
          name_ar,
          name_en,
          status,
          modules,
          settings,
          trial_ends_at,
          plan_id,
          plans (
            name_ar,
            name_en
          )
        `)
        .eq('slug', subdomain)
        .is('deleted_at', null)
        .single();

      if (tenant) {
        return {
          ...(tenant as any),
          plan_name: (tenant as any).plans?.[0]?.name_ar || null,
          subscription_active: (tenant as any).status === 'active'
        };
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // حالة 3: Custom Domain (www.mystore.sa)
    // ───────────────────────────────────────────────────────────────────────────
    
    // البحث في tenant_domains
    const { data: domain } = await supabase
      .from('tenant_domains')
      .select(`
        id,
        domain,
        status,
        tenants (
          id,
          slug,
          name_ar,
          name_en,
          status,
          modules,
          settings,
          trial_ends_at,
          plan_id,
          plans (
            name_ar,
            name_en
          )
        )
      `)
      .eq('domain', host)
      .eq('status', 'active')
      .single();

    if (domain && domain.tenants) {
      return {
        ...(domain.tenants as any),
        plan_name: (domain.tenants as any).plans?.[0]?.name_ar || null,
        subscription_active: (domain.tenants as any).status === 'active',
        custom_domain: domain.domain
      };
    }

    // ───────────────────────────────────────────────────────────────────────────
    // حالة 4: Platform Domain (platform.sa)
    // ───────────────────────────────────────────────────────────────────────────
    
    if (host === platformDomain || host === `www.${platformDomain}`) {
      // هذا هو domain المنصة الرئيسي — لا tenant محدد
      return null;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // لم يتم العثور على tenant
    // ───────────────────────────────────────────────────────────────────────────
    
    return null;

  } catch (error) {
    console.error('[Middleware] Error resolving tenant:', error);
    return null;
  }
}

/**
 * التحقق إذا كان المسار يتطلب tenant
 */
function isTenantPath(pathname: string): boolean {
  return TENANT_PATHS.some(path => pathname.startsWith(path));
}

/**
 * التحقق إذا كان المسار يتطلب super admin
 */
function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(path => pathname.startsWith(path));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Matcher Configuration
// ═══════════════════════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml, robots.txt
     * - public files (e.g. .png, .jpg, .svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|pdf|zip|json)$).*)',
  ],
};
