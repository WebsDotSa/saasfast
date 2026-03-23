import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/emails/send';
import { InvitationEmail } from '@/lib/emails/templates/invitation';
import { z } from 'zod';

// Validation Schema
const inviteSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer', 'developer']),
  message: z.string().max(500).optional(),
});

/**
 * GET /api/team
 * جلب قائمة أعضاء الفريق والدعوات المعلقة
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const tenantId = (session?.user as any)?.tenant_id;

    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = await createClient();

    // الحصول على tenant_id من الجلسة
    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    // التحقق من أن المستخدم عضو في المنشأة
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'غير عضو في هذه المنشأة' }, { status: 403 });
    }

    // جلب أعضاء الفريق
    const { data: members, error: membersError } = await supabase
      .from('tenant_users')
      .select(`
        id,
        user_id,
        role,
        permissions,
        invitation_status,
        accepted_at,
        created_at,
        users:user_id (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'فشل جلب الأعضاء' }, { status: 500 });
    }

    // جلب الدعوات المعلقة
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json({ error: 'فشل جلب الدعوات' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        members: members || [],
        invitations: invitations || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

/**
 * POST /api/team
 * إرسال دعوة لعضو جديد
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
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, role, message } = validation.data;
    const supabase = await createClient();

    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    // التحقق من أن المستخدم الحالي لديه صلاحية الدعوة
    const { data: currentUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية دعوة أعضاء' },
        { status: 403 }
      );
    }

    // التحقق من أن العضو غير موجود بالفعل
    const { data: existingMember } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('invitation_status', 'accepted')
      .single();

    // التحقق من أن الدعوة غير موجودة بالفعل
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'تم إرسال دعوة لهذا البريد بالفعل' },
        { status: 400 }
      );
    }

    // إنشاء الدعوة
    const { data: invitation, error: createError } = await supabase
      .from('team_invitations')
      .insert({
        tenant_id: tenantId,
        email: email.toLowerCase(),
        role,
        message,
        invited_by: userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invitation:', createError);
      return NextResponse.json({ error: 'فشل إنشاء الدعوة' }, { status: 500 });
    }

    // جلب معلومات المنشأة
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name_ar, slug')
      .eq('id', tenantId)
      .single();

    // إرسال البريد الإلكتروني
    const acceptUrl = `${process.env.APP_URL}/team/accept?token=${invitation.token}`;

    try {
      await sendTemplateEmail(
        email,
        `دعوة للانضمام إلى فريق ${tenant?.name_ar || 'فريق'}`,
        InvitationEmail,
        {
          inviterName: session?.user?.name || 'أحد الأعضاء',
          tenantName: tenant?.name_ar || tenant?.slug || 'منصة',
          roleName: getRoleName(role),
          inviteLink: acceptUrl,
        }
      );
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // لا نفشل العملية إذا فشل الإيميل
    }

    return NextResponse.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    console.error('Error in POST /api/team:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

// Helper function to get role name in Arabic
function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    owner: 'المالك',
    admin: 'مدير',
    editor: 'محرر',
    viewer: 'مشاهد',
    developer: 'مطور',
  };
  return roleNames[role] || role;
}
