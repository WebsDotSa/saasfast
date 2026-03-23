import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// Update Tenant Settings API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لتحديث إعدادات المنشأة (مثل business_type) أثناء الـ onboarding
// ═══════════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { business_type } = body;

    if (!business_type) {
      return NextResponse.json(
        { error: 'نوع النشاط مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من صحة business_type
    const validBusinessTypes = ['individual', 'foundation', 'company', 'nonprofit'];
    if (!validBusinessTypes.includes(business_type)) {
      return NextResponse.json(
        { error: 'نوع النشاط غير صالح' },
        { status: 400 }
      );
    }

    // الحصول على tenant_id من الـ session
    const tenantId = (session.user as any).tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'المنشأة غير موجودة' },
        { status: 404 }
      );
    }

    // إنشاء Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // تحديث settings
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('Error fetching tenant:', tenantError);
      return NextResponse.json(
        { error: 'المنشأة غير موجودة' },
        { status: 404 }
      );
    }

    // دمج business_type مع settings الحالية
    const updatedSettings = {
      ...(tenant.settings || {}),
      business_type,
    };

    // تحديث settings
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        settings: updatedSettings,
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Error updating tenant settings:', updateError);
      return NextResponse.json(
        { error: 'فشل تحديث الإعدادات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('[Update Settings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
