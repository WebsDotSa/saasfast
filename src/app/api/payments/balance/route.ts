// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/balance
// Description: جلب رصيد التاجر الحالي
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantId } from '@/lib/tenant';

export async function GET() {
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

    // جلب رصيد التاجر
    const { data: balance, error } = await supabase
      .from('merchant_balances')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows found
      throw error;
    }

    // إذا لم يوجد سجل، نرجع قيم صفرية
    if (!balance) {
      return NextResponse.json({
        available_balance: '0.00',
        pending_balance: '0.00',
        reserved_balance: '0.00',
        total_earned: '0.00',
        total_withdrawn: '0.00',
        currency: 'SAR',
        total_transactions: 0,
        successful_transactions: 0,
        last_updated: new Date().toISOString(),
      });
    }

    return NextResponse.json(balance);
  } catch (error: any) {
    console.error('[Payments Balance] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
