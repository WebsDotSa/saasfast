import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/settings
 * جلب إعدادات المنشأة
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const tenantId = (session.user as any)?.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    const supabase = await createClient();

    // جلب إعدادات المنشأة
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'فشل جلب الإعدادات' }, { status: 404 });
    }

    // استخراج الإعدادات
    const settings = {
      name_ar: tenant.name_ar || '',
      name_en: tenant.name_en || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      country: tenant.country || 'SA',
      city: tenant.city || '',
      address: tenant.address || '',
      tax_number: tenant.tax_number || '',
      vat_number: tenant.vat_number || '',
      logo_url: tenant.logo_url || '',
      favicon_url: tenant.favicon_url || '',
      // من settings JSONB
      primary_color: tenant.settings?.primary_color || '#4F7AFF',
      secondary_color: tenant.settings?.secondary_color || '#6D93FF',
      font_family: tenant.settings?.font_family || 'IBM Plex Sans Arabic',
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

/**
 * PUT /api/settings
 * تحديث إعدادات المنشأة
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const tenantId = (session.user as any)?.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    const body = await req.json();
    const supabase = await createClient();

    // تحديث البيانات الأساسية
    const updateData: any = {
      name_ar: body.name_ar,
      name_en: body.name_en,
      email: body.email,
      phone: body.phone,
      country: body.country,
      city: body.city,
      address: body.address,
      tax_number: body.tax_number,
      vat_number: body.vat_number,
      logo_url: body.logo_url,
      favicon_url: body.favicon_url,
      updated_at: new Date().toISOString(),
    };

    // تحديث settings JSONB
    updateData.settings = {
      primary_color: body.primary_color || '#4F7AFF',
      secondary_color: body.secondary_color || '#6D93FF',
      font_family: body.font_family || 'IBM Plex Sans Arabic',
    };

    const { error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId);

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'فشل تحديث الإعدادات' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
    });
  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
