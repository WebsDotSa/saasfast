import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/team/invitation/[token]
 * جلب تفاصيل دعوة (بدون مصادقة)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'رمز الدعوة مطلوب' }, { status: 400 });
    }

    const supabase = await createClient();

    // جلب تفاصيل الدعوة
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        message,
        created_at,
        tenants:tenant_id (
          id,
          name_ar,
          slug
        )
      `)
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'الدعوة غير صالحة أو منتهية' },
        { status: 404 }
      );
    }

    // التحقق من حالة الدعوة
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'هذه الدعوة لم تعد صالحة' },
        { status: 400 }
      );
    }

    // التحقق من انتهاء الصلاحية
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'انتهت صلاحية هذه الدعوة' },
        { status: 400 }
      );
    }

    const roleNames: Record<string, string> = {
      owner: 'المالك',
      admin: 'مدير',
      editor: 'محرر',
      viewer: 'مشاهد',
      developer: 'مطور',
    };

    const tenant = Array.isArray(invitation.tenants)
      ? invitation.tenants[0]
      : invitation.tenants;

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        tenantName: tenant?.name_ar || tenant?.slug || 'منصة',
        roleName: roleNames[invitation.role] || invitation.role,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        message: invitation.message,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team/invitation/[token]:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
