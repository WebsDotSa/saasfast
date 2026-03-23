import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/domains
 * جلب نطاقات المنشأة
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

    const { data: domains, error } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching domains:', error);
      return NextResponse.json({ error: 'فشل جلب النطاقات' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: domains || [],
    });
  } catch (error) {
    console.error('Error in GET /api/domains:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

/**
 * POST /api/domains
 * إضافة نطاق جديد
 */
export async function POST(req: NextRequest) {
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
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'النطاق مطلوب' }, { status: 400 });
    }

    const supabase = await createClient();

    // التحقق من أن النطاق غير مستخدم بالفعل
    const { data: existing } = await supabase
      .from('tenant_domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'هذا النطاق مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // إضافة النطاق
    const { data: newDomain, error } = await supabase
      .from('tenant_domains')
      .insert({
        tenant_id: tenantId,
        domain,
        domain_type: domain.includes(tenantId) ? 'subdomain' : 'custom',
        status: 'pending',
        ssl_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding domain:', error);
      return NextResponse.json({ error: 'فشل إضافة النطاق' }, { status: 500 });
    }

    // هنا يمكن إضافة Cloudflare API integration لاحقاً
    // const { data: cfData } = await fetch('https://api.cloudflare.com/...', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ ... }),
    // });

    return NextResponse.json({
      success: true,
      data: newDomain,
      message: 'تم إضافة النطاق. يرجى إضافة سجلات DNS ثم التحقق.',
    });
  } catch (error) {
    console.error('Error in POST /api/domains:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

/**
 * DELETE /api/domains
 * حذف نطاق
 */
export async function DELETE(req: NextRequest) {
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
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'معرف النطاق مطلوب' }, { status: 400 });
    }

    const supabase = await createClient();

    // التحقق من أن النطاق ينتمي للمنشأة
    const { data: domain } = await supabase
      .from('tenant_domains')
      .select('is_primary')
      .eq('id', domainId)
      .eq('tenant_id', tenantId)
      .single();

    if (!domain) {
      return NextResponse.json({ error: 'النطاق غير موجود' }, { status: 404 });
    }

    if (domain.is_primary) {
      return NextResponse.json(
        { error: 'لا يمكن حذف النطاق الأساسي' },
        { status: 400 }
      );
    }

    // حذف النطاق
    const { error } = await supabase
      .from('tenant_domains')
      .delete()
      .eq('id', domainId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting domain:', error);
      return NextResponse.json({ error: 'فشل حذف النطاق' }, { status: 500 });
    }

    // هنا يمكن حذف النطاق من Cloudflare لاحقاً

    return NextResponse.json({
      success: true,
      message: 'تم حذف النطاق بنجاح',
    });
  } catch (error) {
    console.error('Error in DELETE /api/domains:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
