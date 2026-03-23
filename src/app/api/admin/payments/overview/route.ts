// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/payments/overview
// Description: إحصائيات المنصة الشاملة - للإدارة فقط
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // التحقق من أن المستخدم super_admin
    const isSuperAdmin = (session?.user as any)?.is_super_admin || false;
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // ═══════════════════════════════════════════════════════════════════════════
    // إحصائيات شاملة
    // ═══════════════════════════════════════════════════════════════════════════

    // 1. إجمالي مبيعات المنصة
    const { data: grossStats } = await supabase.rpc('get_payment_stats', {
      p_start_date: startDate.toISOString(),
      p_end_date: new Date().toISOString(),
    });

    // 2. إحصائيات حسب كل متجر
    const { data: merchantStats } = await supabase
      .from('store_transactions')
      .select(`
        tenant_id,
        tenants!inner (
          id,
          name,
          slug,
          company_email
        )
      `)
      .eq('status', 'success')
      .gte('created_at', startDate.toISOString());

    // 3. تجميع الإحصائيات
    const statsByMerchant: Record<string, any> = {};
    let totalGross = 0;
    let totalGatewayFees = 0;
    let totalPlatformFees = 0;
    let totalNet = 0;
    let totalTransactions = 0;

    if (merchantStats) {
      merchantStats.forEach((tx: any) => {
        const tenantId = tx.tenant_id;
        const tenant = tx.tenants as any;

        if (!statsByMerchant[tenantId]) {
          statsByMerchant[tenantId] = {
            tenant_id: tenantId,
            tenant_name: tenant.name,
            tenant_slug: tenant.slug,
            tenant_email: tenant.company_email,
            gross_amount: 0,
            gateway_fees: 0,
            platform_fees: 0,
            net_amount: 0,
            transactions_count: 0,
          };
        }

        statsByMerchant[tenantId].gross_amount += parseFloat(tx.gross_amount || 0);
        statsByMerchant[tenantId].gateway_fees += parseFloat(tx.gateway_fee_amount || 0);
        statsByMerchant[tenantId].platform_fees += parseFloat(tx.platform_fee_amount || 0);
        statsByMerchant[tenantId].net_amount += parseFloat(tx.net_amount || 0);
        statsByMerchant[tenantId].transactions_count += 1;

        totalGross += parseFloat(tx.gross_amount || 0);
        totalGatewayFees += parseFloat(tx.gateway_fee_amount || 0);
        totalPlatformFees += parseFloat(tx.platform_fee_amount || 0);
        totalNet += parseFloat(tx.net_amount || 0);
        totalTransactions += 1;
      });
    }

    // 4. أعلى 10 متاجر
    const topMerchants = Object.values(statsByMerchant)
      .sort((a: any, b: any) => b.gross_amount - a.gross_amount)
      .slice(0, 10);

    // 5. إحصائيات التسويات
    const { data: settlementStats } = await supabase
      .from('settlements')
      .select('status, net_amount')
      .gte('created_at', startDate.toISOString());

    const settlementsByStatus: Record<string, number> = {
      pending: 0,
      processing: 0,
      transferred: 0,
      failed: 0,
      on_hold: 0,
    };

    let totalSettled = 0;
    let totalPending = 0;

    settlementStats?.forEach((s: any) => {
      settlementsByStatus[s.status] = (settlementsByStatus[s.status] || 0) + 1;
      if (s.status === 'transferred') {
        totalSettled += parseFloat(s.net_amount || 0);
      }
      if (s.status === 'pending') {
        totalPending += parseFloat(s.net_amount || 0);
      }
    });

    // 6. نمو المدفوعات (آخر 7 أيام)
    const dailyStats = await supabase
      .from('store_transactions')
      .select('created_at, gross_amount')
      .eq('status', 'success')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    const dailyGrowth = dailyStats.data?.reduce((acc: any, tx: any) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += parseFloat(tx.gross_amount || 0);
      return acc;
    }, {});

    return NextResponse.json({
      summary: {
        total_gross: totalGross,
        total_gateway_fees: totalGatewayFees,
        total_platform_fees: totalPlatformFees,
        total_net: totalNet,
        total_transactions: totalTransactions,
        period_days: parseInt(period),
      },
      settlements: {
        total_settled: totalSettled,
        pending_amount: totalPending,
        by_status: settlementsByStatus,
      },
      top_merchants: topMerchants,
      daily_growth: dailyGrowth,
      merchant_count: Object.keys(statsByMerchant).length,
    });
  } catch (error: any) {
    console.error('[Admin Payments Overview] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
