import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/announcements
 * جلب الإعلانات النشطة
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const tenantId = (session.user as any)?.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: 'منشأة غير صالحة' }, { status: 400 });
    }

    const supabase = await createClient();

    // جلب الإعلانات النشطة
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .or(`show_until.is.null,show_until.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json({ error: 'فشل جلب الإعلانات' }, { status: 500 });
    }

    // جلب الإعلانات التي تم تجاهلها
    let dismissedIds: string[] = [];
    if (userId) {
      const { data: dismissed } = await supabase
        .from('user_announcements')
        .select('announcement_id')
        .eq('user_id', userId);
      
      dismissedIds = dismissed?.map(d => d.announcement_id) || [];
    }

    // تصفية الإعلانات التي تم تجاهلها
    const filteredAnnouncements = (announcements || []).filter(
      a => !dismissedIds.includes(a.id)
    );

    return NextResponse.json({
      success: true,
      data: filteredAnnouncements,
    });
  } catch (error) {
    console.error('Error in GET /api/announcements:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

/**
 * POST /api/announcements
 * إنشاء إعلان جديد
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const tenantId = (session?.user as any)?.tenant_id;

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = await createClient();

    // التحقق من الصلاحية
    const { data: currentUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const body = await req.json();

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        tenant_id: tenantId,
        title: body.title,
        content: body.content,
        type: body.type || 'info',
        priority: body.priority || 0,
        show_until: body.show_until,
        metadata: body.metadata || {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json({ error: 'فشل إنشاء الإعلان' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error in POST /api/announcements:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
