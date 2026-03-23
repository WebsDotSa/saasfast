import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation Schema
const acceptSchema = z.object({
  token: z.string().uuid('رمز دعوة غير صالح'),
});

/**
 * POST /api/team/accept
 * قبول الدعوة والانضمام إلى الفريق
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = acceptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token } = validation.data;
    const supabase = await createClient();

    // الحصول على المستخدم الحالي
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    // جلب الدعوة
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'الدعوة غير صالحة أو منتهية الصلاحية' },
        { status: 404 }
      );
    }

    // التحقق من أن البريد الإلكتروني مطابق
    if (user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني لا يتطابق مع الدعوة' },
        { status: 403 }
      );
    }

    // التحقق من أن الدعوة لم تنتهِ
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'انتهت صلاحية هذه الدعوة' },
        { status: 400 }
      );
    }

    // استخدام الدالة المخزنة لقبول الدعوة
    const { data: result, error: acceptError } = await supabase.rpc(
      'accept_invitation',
      {
        p_token: token,
        p_user_id: user.id,
        p_ip: req.ip || null,
      }
    );

    if (acceptError) {
      console.error('Error accepting invitation:', acceptError);
      return NextResponse.json({ error: 'فشل قبول الدعوة' }, { status: 500 });
    }

    const parsedResult = result as any;
    if (!parsedResult.success) {
      return NextResponse.json(
        { error: parsedResult.error || 'فشل قبول الدعوة' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant_id: parsedResult.tenant_id,
        message: 'تم قبول الدعوة بنجاح',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/team/accept:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
