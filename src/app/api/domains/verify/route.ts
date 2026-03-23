import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/domains/verify
 * التحقق من نطاق مخصص
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
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'معرف النطاق مطلوب' }, { status: 400 });
    }

    const supabase = await createClient();

    // جلب النطاق
    const { data: domain } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('id', domainId)
      .eq('tenant_id', tenantId)
      .single();

    if (!domain) {
      return NextResponse.json({ error: 'النطاق غير موجود' }, { status: 404 });
    }

    // هنا يمكن التحقق من DNS records
    // في الإنتاج، استخدم Cloudflare API أو تحقق من DNS records

    // محاكاة التحقق (للتطوير)
    const isVerified = true; // في الواقع، تحقق من DNS records
    const sslReady = true; // في الواقع، تحقق من SSL status

    // تحديث حالة النطاق
    const updateData: any = {
      status: isVerified ? 'active' : 'error',
      verified_at: isVerified ? new Date().toISOString() : null,
    };

    if (sslReady && isVerified) {
      updateData.ssl_status = 'active';
      updateData.ssl_verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('tenant_domains')
      .update(updateData)
      .eq('id', domainId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Error updating domain:', updateError);
      return NextResponse.json({ error: 'فشل تحديث النطاق' }, { status: 500 });
    }

    // هنا يمكن الاستدعاء على Cloudflare API لتفعيل SSL
    // POST https://api.cloudflare.com/client/v4/zones/{zone_id}/custom_hostnames

    return NextResponse.json({
      success: true,
      message: isVerified
        ? 'تم التحقق من النطاق بنجاح'
        : 'فشل التحقق. تأكد من إضافة سجلات DNS بشكل صحيح.',
      verified: isVerified,
      sslReady,
    });
  } catch (error) {
    console.error('Error in POST /api/domains/verify:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
