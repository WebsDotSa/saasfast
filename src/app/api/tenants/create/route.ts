import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';
import { rateLimiters, checkRateLimit, getIdentifier } from '@/lib/rate-limit';

// ═══════════════════════════════════════════════════════════════════════════════
// Create Tenant API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لإنشاء tenant جديد عند التسجيل
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة أولاً
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Rate limiting - 3 محاولات إنشاء tenant كل ساعة
    const identifier = getIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, rateLimiters.tenantCreate);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'محاولات كثيرة. حاول مجدداً لاحقاً.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { name } = body;

    // أخذ userId وemail من الـ session (أكثر أماناً من الـ body)
    const userId = (session.user as any)?.id;
    const email = session.user?.email;

    if (!userId || !name || !email) {
      return NextResponse.json(
        { error: 'حقول مطلوبة ناقصة' },
        { status: 400 }
      );
    }

    // إنشاء Supabase client بـ service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // التحقق من وجود tenant بالفعل
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', generateSlug(name))
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant already exists' },
        { status: 409 }
      );
    }

    // إنشاء tenant افتراضي
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        slug: generateSlug(name),
        name_ar: name,
        name_en: name,
        email,
        status: 'trial',
        modules: ['page_builder'], // تفعيل وحدة بناء الصفحات افتراضياً
        settings: {
          primary_color: '#6c63ff',
          font_family: 'IBM Plex Sans Arabic',
        },
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 يوم تجربة
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      );
    }

    // إضافة المستخدم كـ owner للـ tenant
    const { error: userError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: 'owner',
        permissions: [],
        invitation_status: 'accepted',
        accepted_at: new Date().toISOString(),
      });

    if (userError) {
      console.error('Error adding tenant user:', userError);
      // لا نرجع خطأ لأن tenant تم إنشاؤه بنجاح
    }

    // إرسال welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/emails');
      await sendWelcomeEmail(
        email,
        {
          userName: name.split(' ')[0] || 'عميلنا الكريم',
          tenantName: name,
          appName: process.env.APP_NAME || 'SaaS Core',
        }
      );
    } catch (emailError) {
      console.error('[Welcome Email] Error:', emailError);
      // لا نرجع خطأ لأن الإيميل اختياري
    }

    // إنشاء اشتراك تجريبي
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('name_ar', 'الخطة الأساسية')
      .single();

    if (plan) {
      await supabase.from('subscriptions').insert({
        tenant_id: tenant.id,
        plan_id: plan.id,
        status: 'trialing',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name_ar,
      },
    });
  } catch (error: any) {
    console.error('[Create Tenant] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * توليد slug من الاسم
 * يدعم العربية والإنجليزية — ينتج ASCII-only slug
 */
function generateSlug(name: string): string {
  // خريطة لتحويل الأحرف العربية إلى لاتينية
  const arabicToLatin: Record<string, string> = {
    'أ': 'a', 'إ': 'i', 'آ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't',
    'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r',
    'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'ة': 'h', 'و': 'w', 'ى': 'a', 'ي': 'y', 'ئ': 'a',
    'ء': 'a', 'ؤ': 'o', 'گ': 'g', 'چ': 'ch', 'پ': 'p', 'ژ': 'zh',
  };

  let slug = name.trim();

  // تحويل الأحرف العربية إلى لاتينية
  slug = slug.split('').map(char => arabicToLatin[char] || char).join('');

  // إزالة التشكيل والأحرف الخاصة
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // استبدال المسافات والأحرف الخاصة بـ -
  slug = slug
    .replace(/[^a-zA-Z0-9\s-]/g, '') // إزالة الأحرف غير المسموحة
    .replace(/\s+/g, '-') // استبدال المسافات بـ -
    .replace(/-+/g, '-'); // إزالة الـ - المكررة

  // تحويل إلى lowercase
  slug = slug.toLowerCase();

  // حد أقصى 50 حرف
  return slug.substring(0, 50);
}
