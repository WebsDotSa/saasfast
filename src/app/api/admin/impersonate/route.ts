import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const adminId = (session.user as any)?.id;
    const isAdmin = (session.user as any)?.role === 'super_admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'فقط Super Admin يمكنه استخدام هذه الميزة' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, tenantId } = body;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'معرف المستخدم والمنشأة مطلوبان' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !targetUser.user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    await logAudit({
      action: 'IMPERSONATE_START',
      resource_type: 'user',
      metadata: { targetUserId: userId, targetTenantId: tenantId },
    });

    const response = NextResponse.json({
      success: true,
      redirectUrl: `${process.env.APP_URL}/dashboard?impersonated=true`,
    });

    response.cookies.set('impersonating', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
