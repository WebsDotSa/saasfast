import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// Cron Job for Subscription Management
// ═══════════════════════════════════════════════════════════════════════════════
// يُنفذ يومياً الساعة 2:00 صباحاً عبر Vercel Cron
//
// المهام:
// 1. تحويل التجارب المنتهية → expired
// 2. إرسال تنبيه قبل 7 أيام من انتهاء الاشتراك
// 3. تعليق الحسابات المتأخرة عن الدفع > 7 أيام
// 4. تنظيف سلات التسوق المنتهية (> 30 يوم)
//
// Vercel Cron Config (vercel.json):
// {
//   "crons": [{
//     "path": "/api/cron/subscriptions",
//     "schedule": "0 2 * * *"
//   }]
// }
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  // التحقق من أن الطلب من مصدر موثوق (Vercel Cron أو Admin)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // في development، نسمح بالطلب بدون secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = {
      expiredTrials: 0,
      upcomingExpirations: 0,
      suspendedAccounts: 0,
      cleanedCarts: 0,
      emailsSent: 0,
    };

    // 1. تحويل التجارب المنتهية → expired
    console.log('[Cron] Processing expired trials...');
    const expiredTrialsResult = await processExpiredTrials(supabase);
    results.expiredTrials = expiredTrialsResult.count;
    results.emailsSent += expiredTrialsResult.emailsSent;

    // 2. إرسال تنبيه قبل 7 أيام من انتهاء الاشتراك
    console.log('[Cron] Processing upcoming expirations...');
    const upcomingResult = await processUpcomingExpirations(supabase);
    results.upcomingExpirations = upcomingResult.count;
    results.emailsSent += upcomingResult.emailsSent;

    // 3. تعليق الحسابات المتأخرة عن الدفع > 7 أيام
    console.log('[Cron] Processing past due subscriptions...');
    const suspendedResult = await processPastDueSubscriptions(supabase);
    results.suspendedAccounts = suspendedResult.count;
    results.emailsSent += suspendedResult.emailsSent;

    // 4. تنظيف سلات التسوق المنتهية (> 30 يوم)
    console.log('[Cron] Cleaning old carts...');
    const cleanedCartsResult = await cleanOldCarts(supabase);
    results.cleanedCarts = cleanedCartsResult.count;

    console.log('[Cron] Completed successfully:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Task 1: تحويل التجارب المنتهية → expired
// ───────────────────────────────────────────────────────────────────────────────

async function processExpiredTrials(supabase: any) {
  const now = new Date().toISOString();
  
  // الحصول على الاشتراكات التجريبية المنتهية
  const { data: expiredTrials } = await supabase
    .from('subscriptions')
    .select(`
      id,
      tenant_id,
      trial_end,
      tenants (
        id,
        name_ar,
        email,
        status
      )
    `)
    .eq('status', 'trialing')
    .lt('trial_end', now);

  if (!expiredTrials || expiredTrials.length === 0) {
    return { count: 0, emailsSent: 0 };
  }

  let emailsSent = 0;

  for (const subscription of expiredTrials) {
    // تحديث الاشتراك إلى expired
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: now,
      })
      .eq('id', subscription.id);

    // تحديث حالة tenant إلى suspended
    await supabase
      .from('tenants')
      .update({
        status: 'suspended',
        updated_at: now,
      })
      .eq('id', subscription.tenant_id);

    // إرسال إيميل
    try {
      const { sendSubscriptionExpiredEmail } = await import('@/lib/emails');
      await sendSubscriptionExpiredEmail(
        subscription.tenants.email,
        {
          tenantName: subscription.tenants.name_ar || 'عميلنا الكريم',
          planName: 'الفترة التجريبية',
          expiryDate: new Date(subscription.trial_end).toLocaleDateString('ar-SA'),
        }
      );
      emailsSent++;
    } catch (error) {
      console.error('[Cron] Failed to send expiration email:', error);
    }

    // تسجيل audit log
    await supabase.from('audit_logs').insert({
      tenant_id: subscription.tenant_id,
      action: 'subscription.expired',
      resource_type: 'subscription',
      resource_id: subscription.id,
      metadata: { reason: 'trial_ended', trial_end: subscription.trial_end },
    });
  }

  return { count: expiredTrials.length, emailsSent };
}

// ───────────────────────────────────────────────────────────────────────────────
// Task 2: إرسال تنبيه قبل 7 أيام من انتهاء الاشتراك
// ───────────────────────────────────────────────────────────────────────────────

async function processUpcomingExpirations(supabase: any) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // الحصول على الاشتراكات التي تنتهي خلال 7 أيام
  const { data: upcomingExpirations } = await supabase
    .from('subscriptions')
    .select(`
      id,
      tenant_id,
      current_period_end,
      tenants (
        id,
        name_ar,
        email
      )
    `)
    .eq('status', 'active')
    .lte('current_period_end', sevenDaysFromNow)
    .gt('current_period_end', now.toISOString());

  if (!upcomingExpirations || upcomingExpirations.length === 0) {
    return { count: 0, emailsSent: 0 };
  }

  let emailsSent = 0;

  for (const subscription of upcomingExpirations) {
    // التحقق من عدم إرسال تنبيه من قبل
    const { data: existingNotification } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('tenant_id', subscription.tenant_id)
      .eq('notification_type', 'renewal_reminder')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existingNotification) {
      continue; // تم الإرسال بالفعل اليوم
    }

    // إرسال إيميل تنبيه
    try {
      const { sendTrialEndingEmail } = await import('@/lib/emails');
      await sendTrialEndingEmail(
        subscription.tenants.email,
        {
          tenantName: subscription.tenants.name_ar || 'عميلنا الكريم',
          daysRemaining: 7,
          planName: 'الاشتراك الحالي',
        }
      );

      // تسجيل الإيميل
      await supabase.from('notification_logs').insert({
        tenant_id: subscription.tenant_id,
        notification_type: 'renewal_reminder',
        sent_at: now.toISOString(),
        status: 'sent',
      });

      emailsSent++;
    } catch (error) {
      console.error('[Cron] Failed to send renewal reminder:', error);
    }
  }

  return { count: upcomingExpirations.length, emailsSent };
}

// ───────────────────────────────────────────────────────────────────────────────
// Task 3: تعليق الحسابات المتأخرة عن الدفع > 7 أيام
// ───────────────────────────────────────────────────────────────────────────────

async function processPastDueSubscriptions(supabase: any) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // الحصول على الاشتراكات المتأخرة عن الدفع
  const { data: pastDueSubscriptions } = await supabase
    .from('subscriptions')
    .select(`
      id,
      tenant_id,
      current_period_end,
      tenants (
        id,
        name_ar,
        email
      )
    `)
    .eq('status', 'past_due')
    .lt('current_period_end', sevenDaysAgo);

  if (!pastDueSubscriptions || pastDueSubscriptions.length === 0) {
    return { count: 0, emailsSent: 0 };
  }

  let emailsSent = 0;

  for (const subscription of pastDueSubscriptions) {
    // تعليق الاشتراك
    await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.id);

    // تعليق tenant
    await supabase
      .from('tenants')
      .update({
        status: 'suspended',
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.tenant_id);

    // إرسال إيميل
    try {
      const { sendSubscriptionExpiredEmail } = await import('@/lib/emails');
      await sendSubscriptionExpiredEmail(
        subscription.tenants.email,
        {
          tenantName: subscription.tenants.name_ar || 'عميلنا الكريم',
          planName: 'الاشتراك',
          expiryDate: 'بسبب تأخر الدفع',
        }
      );
      emailsSent++;
    } catch (error) {
      console.error('[Cron] Failed to send suspension email:', error);
    }

    // تسجيل audit log
    await supabase.from('audit_logs').insert({
      tenant_id: subscription.tenant_id,
      action: 'subscription.suspended',
      resource_type: 'subscription',
      resource_id: subscription.id,
      metadata: { reason: 'payment_overdue', days_overdue: 7 },
    });
  }

  return { count: pastDueSubscriptions.length, emailsSent };
}

// ───────────────────────────────────────────────────────────────────────────────
// Task 4: تنظيف سلات التسوق المنتهية (> 30 يوم)
// ───────────────────────────────────────────────────────────────────────────────

async function cleanOldCarts(supabase: any) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: oldCarts } = await supabase
    .from('carts')
    .select('id')
    .lt('updated_at', thirtyDaysAgo);

  if (!oldCarts || oldCarts.length === 0) {
    return { count: 0 };
  }

  // حذف cart items أولاً
  await supabase
    .from('cart_items')
    .delete()
    .in(
      'cart_id',
      oldCarts.map((cart: any) => cart.id)
    );

  // ثم حذف carts
  await supabase
    .from('carts')
    .delete()
    .in(
      'cart_id',
      oldCarts.map((cart: any) => cart.id)
    );

  return { count: oldCarts.length };
}
