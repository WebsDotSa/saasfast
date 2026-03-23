// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/payments/merchants
// Description: قائمة جميع التجار مع أرباحهم - للإدارة فقط
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isSuperAdmin = (session?.user as any)?.is_super_admin || false;
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort') || 'total_earned';
    const sortOrder = searchParams.get('order') || 'desc';

    const offset = (page - 1) * limit;

    // ═══════════════════════════════════════════════════════════════════════════
    // جلب جميع التجار مع أرصدتهم
    // ═══════════════════════════════════════════════════════════════════════════

    let query = supabase
      .from('merchant_balances')
      .select(`
        *,
        tenants (
          id,
          name,
          slug,
          company_email,
          created_at
        )
      `, { count: 'exact' });

    // Sorting
    if (sortBy === 'total_earned') {
      query = query.order('total_earned', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'available_balance') {
      query = query.order('available_balance', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'total_withdrawn') {
      query = query.order('total_withdrawn', { ascending: sortOrder === 'asc' });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: balances, count } = await query;

    // ═══════════════════════════════════════════════════════════════════════════
    // إضافة إحصائيات إضافية لكل تاجر
    // ═══════════════════════════════════════════════════════════════════════════

    const merchants = await Promise.all(
      (balances || []).map(async (balance: any) => {
        const tenant = balance.tenants as any;

        // آخر تسوية
        const { data: lastSettlement } = await supabase
          .from('settlements')
          .select('transferred_at, net_amount')
          .eq('tenant_id', balance.tenant_id)
          .eq('status', 'transferred')
          .order('transferred_at', { ascending: false })
          .limit(1)
          .single();

        // تسويات قيد الانتظار
        const { data: pendingSettlements } = await supabase
          .from('settlements')
          .select('net_amount')
          .eq('tenant_id', balance.tenant_id)
          .eq('status', 'pending');

        const pendingAmount = pendingSettlements?.reduce(
          (sum, s) => sum + parseFloat(s.net_amount || 0),
          0
        ) || 0;

        // عمليات الشهر الحالي
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthTransactions } = await supabase
          .from('store_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', balance.tenant_id)
          .eq('status', 'success')
          .gte('created_at', startOfMonth.toISOString());

        return {
          tenant_id: balance.tenant_id,
          tenant_name: tenant?.name || 'غير محدد',
          tenant_slug: tenant?.slug || '',
          tenant_email: tenant?.company_email || '',
          tenant_created_at: tenant?.created_at,
          balance: {
            available: parseFloat(balance.available_balance || 0),
            pending: parseFloat(balance.pending_balance || 0),
            reserved: parseFloat(balance.reserved_balance || 0),
            total_earned: parseFloat(balance.total_earned || 0),
            total_withdrawn: parseFloat(balance.total_withdrawn || 0),
          },
          stats: {
            total_transactions: balance.total_transactions || 0,
            successful_transactions: balance.successful_transactions || 0,
            month_transactions: monthTransactions || 0,
          },
          settlements: {
            last_settlement: lastSettlement?.transferred_at,
            last_settlement_amount: parseFloat(lastSettlement?.net_amount || 0),
            pending_amount: pendingAmount,
            pending_count: pendingSettlements?.length || 0,
          },
        };
      })
    );

    return NextResponse.json({
      merchants,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Payments Merchants] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
