import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// Get Plans API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لجلب جميع الخطط المتاحة
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // الحصول على جميع الخطط النشطة
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'فشل تحميل الخطط' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plans: plans || [],
    });
  } catch (error: any) {
    console.error('[Get Plans] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
