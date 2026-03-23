import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation Schema
const updateRoleSchema = z.object({
  memberId: z.string().uuid('معرف العضو غير صالح'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer', 'developer']),
});

/**
 * PATCH /api/team/update-role
 * تحديث دور العضو
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const tenantId = (session?.user as any)?.tenant_id;

    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { memberId, role } = validation.data;
    const supabase = await createClient();

    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    // التحقق من أن المستخدم الحالي هو owner فقط
    const { data: currentUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!currentUser || currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'فقط المالك يمكنه تغيير أدوار الأعضاء' },
        { status: 403 }
      );
    }

    // التحقق من أن العضو موجود
    const { data: memberToUpdate } = await supabase
      .from('tenant_users')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single();

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 });
    }

    // لا يمكن تغيير دور المالك الوحيد
    if (memberToUpdate.role === 'owner' && role !== 'owner') {
      const { count: ownerCount } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'owner');

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'لا يمكن تغيير دور المالك الوحيد' },
          { status: 400 }
        );
      }
    }

    // تحديث الدور
    const { error: updateError } = await supabase
      .from('tenant_users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Error updating role:', updateError);
      return NextResponse.json({ error: 'فشل تحديث الدور' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الدور بنجاح',
    });
  } catch (error) {
    console.error('Error in PATCH /api/team/update-role:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
