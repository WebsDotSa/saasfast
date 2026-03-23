import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation Schema
const removeSchema = z.object({
  memberId: z.string().uuid('معرف العضو غير صالح'),
});

/**
 * POST /api/team/remove
 * إزالة عضو من الفريق
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const tenantId = (session?.user as any)?.tenant_id;

    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const validation = removeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { memberId } = validation.data;
    const supabase = await createClient();

    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    // التحقق من أن المستخدم الحالي لديه صلاحية الإزالة
    const { data: currentUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية إزالة أعضاء' },
        { status: 403 }
      );
    }

    // التحقق من أن العضو المراد إزالته موجود
    const { data: memberToRemove } = await supabase
      .from('tenant_users')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single();

    if (!memberToRemove) {
      return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 });
    }

    // لا يمكن إزالة owner الوحيد
    if (memberToRemove.role === 'owner') {
      const { count: ownerCount } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'owner');

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'لا يمكن إزالة المالك الوحيد من المنشأة' },
          { status: 400 }
        );
      }
    }

    // لا يمكن للمستخدم إزالة نفسه
    if (memberToRemove.user_id === userId) {
      return NextResponse.json(
        { error: 'لا يمكنك إزالة نفسك، يجب نقل الملكية أولاً' },
        { status: 400 }
      );
    }

    // إزالة العضو
    const { error: removeError } = await supabase
      .from('tenant_users')
      .delete()
      .eq('id', memberId)
      .eq('tenant_id', tenantId);

    if (removeError) {
      console.error('Error removing member:', removeError);
      return NextResponse.json({ error: 'فشل إزالة العضو' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إزالة العضو بنجاح',
    });
  } catch (error) {
    console.error('Error in POST /api/team/remove:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
