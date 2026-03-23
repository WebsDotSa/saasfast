import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals
 * جلب بيانات برنامج الإحالات للمستخدم
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = await createClient();

    // جلب رمز الإحالة الخاص بالمستخدم
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .eq('status', 'registered')
      .single();

    if (referralError && referralError.code !== 'PGRST116') {
      console.error('Error fetching referral:', referralError);
    }

    // جلب الإحالات
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    // جلب المكافآت
    const { data: rewards, error: rewardsError } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // حساب الإحصائيات
    const stats = {
      totalReferrals: referrals?.length || 0,
      convertedReferrals: referrals?.filter(r => r.status === 'converted').length || 0,
      totalRewards: rewards?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
      pendingRewards: rewards?.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        referralCode: referral?.referral_code,
        referrals: referrals || [],
        rewards: rewards || [],
        stats,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/referrals:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}

/**
 * POST /api/referrals/track
 * تتبع إحالة جديدة (عند التسجيل)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referralCode, email, name } = body;

    if (!referralCode || !email) {
      return NextResponse.json(
        { error: 'رمز الإحالة والبريد مطلوبان' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // استخدام الدالة المخزنة لتسجيل الإحالة
    const { data, error } = await supabase.rpc('track_referral', {
      p_referral_code: referralCode,
      p_referred_email: email,
      p_referred_name: name || null,
    });

    if (error) {
      console.error('Error tracking referral:', error);
      return NextResponse.json({ error: 'فشل تتبع الإحالة' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      referralId: data,
    });
  } catch (error) {
    console.error('Error in POST /api/referrals/track:', error);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
