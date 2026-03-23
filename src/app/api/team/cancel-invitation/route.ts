import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation Schema
const cancelSchema = z.object({
  invitationId: z.string().uuid('معرف الدعوة غير صالح'),
});

/**
 * POST /api/team/cancel-invitation
 * إلغاء دعوة معلقة
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const validation = cancelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { invitationId } = validation.data;
    const supabase = await createClient();

    const tenantId = (session?.user as any)?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    // التحقق من أن المستخدم الحالي لديه صلاحية الإلغاء
    const { data: currentUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية إلغاء الدعوات' },
        { status: 403 }
      );
    }

    // التحقق من أن الدعوة موجودة وتنتمي للمنشأة
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('status')
      .eq('id', invitationId)
      .eq('tenant_id', tenantId)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'الدعوة غير موجودة' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'لا يمكن إلغاء دعوة غير معلقة' },
        { status: 400 }
      );
    }

    // إلغاء الدعوة
    const { error: cancelError } = await supabase
      .from('team_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .eq('tenant_id', tenantId);

    if (cancelError) {
      console.error('Error cancelling invitation:', cancelError);
      return NextResponse.json({ error: 'فشل إلغاء الدعوة' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء الدعوة بنجاح',
    });
  } catch (error) {
    console.error('Error in POST /api/team/cancel-invitation:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
