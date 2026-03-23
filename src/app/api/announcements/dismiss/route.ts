import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/announcements/dismiss
 * تجاهل إعلان (عدم عرضه مرة أخرى)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json({ error: 'معرف الإعلان مطلوب' }, { status: 400 });
    }

    const supabase = await createClient();

    // تسجيل التجاهل
    const { error } = await supabase
      .from('user_announcements')
      .insert({
        user_id: userId,
        announcement_id: announcementId,
      });

    if (error) {
      console.error('Error dismissing announcement:', error);
      return NextResponse.json({ error: 'فشل التجاهل' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in POST /api/announcements/dismiss:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
