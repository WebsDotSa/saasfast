import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// Activate Free Plan API
// ═══════════════════════════════════════════════════════════════════════════════
// يُستخدم لتفعيل الخطة المجانية مباشرة بدون دفع
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'معرف الخطة مطلوب' },
        { status: 400 }
      );
    }

    // الحصول على tenant_id من الـ session
    const tenantId = (session.user as any).tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'المنشأة غير موجودة' },
        { status: 404 }
      );
    }

    // إنشاء Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // التحقق من أن الخطة مجانية (price = 0)
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, price, name_ar, included_modules')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json(
        { error: 'الخطة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من أن الخطة مجانية
    if (plan.price !== 0) {
      return NextResponse.json(
        { error: 'هذه الخطة ليست مجانية' },
        { status: 400 }
      );
    }

    // التحقق من الاشتراك الحالي
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .single();

    if (existingSubscription) {
      // تحديث الاشتراك الحالي
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم
          trial_end: null,
          canceled_at: null,
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'فشل تحديث الاشتراك' },
          { status: 500 }
        );
      }
    } else {
      // إنشاء اشتراك جديد
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return NextResponse.json(
          { error: 'فشل إنشاء الاشتراك' },
          { status: 500 }
        );
      }
    }

    // تحديث حالة المنشأة إلى active
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({
        status: 'active',
      })
      .eq('id', tenantId);

    if (tenantError) {
      console.error('Error updating tenant status:', tenantError);
    }

    // تحديث modules إذا كانت موجودة في الخطة
    if (plan.included_modules && Array.isArray(plan.included_modules)) {
      await supabase
        .from('tenants')
        .update({
          modules: plan.included_modules,
        })
        .eq('id', tenantId);
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name_ar,
      },
    });
  } catch (error: any) {
    console.error('[Activate Free Plan] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
