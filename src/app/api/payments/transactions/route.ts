// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/transactions
// Description: جلب قائمة عمليات الدفع للتاجر
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantId } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // الحصول على tenant_id من الجلسة
    const tenantId = await getTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // استخراج Parameters من URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('payment_method');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const offset = (page - 1) * limit;

    // بناء الاستعلام
    let query = supabase
      .from('store_transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // تطبيق الفلتر حسب الحالة
    if (status) {
      query = query.eq('status', status);
    }

    // تطبيق الفلتر حسب طريقة الدفع
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    // تطبيق الفلتر حسب التاريخ
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[Payments Transactions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
