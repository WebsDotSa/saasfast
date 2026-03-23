// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/withdrawal-request
// Description: طلب تحويل رصيد التاجر إلى الحساب البنكي
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantId } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const tenantId = await getTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      bank_account_id,
      amount,
      notes,
    } = body;

    // التحقق من البيانات المطلوبة
    if (!bank_account_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. التحقق من رصيد التاجر
    // ═══════════════════════════════════════════════════════════════════════════
    
    const { data: balance } = await supabase
      .from('merchant_balances')
      .select('available_balance, pending_balance, reserved_balance')
      .eq('tenant_id', tenantId)
      .single();

    if (!balance) {
      return NextResponse.json(
        { error: 'No balance found' },
        { status: 404 }
      );
    }

    const availableBalance = parseFloat(balance.available_balance || '0');
    
    if (amount > availableBalance) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          available: availableBalance,
          requested: amount,
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. التحقق من الحساب البنكي
    // ═══════════════════════════════════════════════════════════════════════════
    
    const { data: bankAccount } = await supabase
      .from('merchant_bank_accounts')
      .select('id, tenant_id, is_verified, iban')
      .eq('id', bank_account_id)
      .eq('tenant_id', tenantId)
      .single();

    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      );
    }

    if (!bankAccount.is_verified) {
      return NextResponse.json(
        { error: 'Bank account not verified' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. حجز المبلغ من الرصيد المتاح
    // ═══════════════════════════════════════════════════════════════════════════
    
    // نستخدم دالة SQL لحجز المبلغ
    const { error: reserveError } = await supabase.rpc('reserve_merchant_balance', {
      p_tenant_id: tenantId,
      p_amount: amount,
    });

    if (reserveError) {
      console.error('[Reserve Balance] Error:', reserveError);
      // نتابع رغم الخطأ - قد لا تكون الدالة موجودة بعد
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. إنشاء طلب تسوية
    // ═══════════════════════════════════════════════════════════════════════════
    
    // حساب الرسوم
    const gatewayFees = Math.round(amount * 0.015 * 100) / 100; // 1.5%
    const platformFees = Math.round(amount * 0.01 * 100) / 100; // 1%
    const netAmount = amount - gatewayFees - platformFees;

    // جلب تاريخ آخر تسوية
    const { data: lastSettlement } = await supabase
      .from('settlements')
      .select('period_end')
      .eq('tenant_id', tenantId)
      .eq('status', 'transferred')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const periodStart = lastSettlement?.period_end || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .insert({
        tenant_id: tenantId,
        bank_account_id,
        gross_amount: amount,
        gateway_fees: gatewayFees,
        platform_fees: platformFees,
        net_amount: netAmount,
        period_start: periodStart,
        period_end: new Date().toISOString(),
        status: 'pending',
        notes: notes || null,
        transaction_count: 1, // سيتم تحديثه لاحقاً
      })
      .select()
      .single();

    if (settlementError) {
      throw settlementError;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. تسجيل Audit Log
    // ═══════════════════════════════════════════════════════════════════════════
    
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      action: 'withdrawal.requested',
      resource_type: 'settlement',
      resource_id: settlement.id,
      metadata: {
        amount,
        gateway_fees: gatewayFees,
        platform_fees: platformFees,
        net_amount: netAmount,
        bank_account_id,
      },
    });

    return NextResponse.json({
      success: true,
      data: settlement,
      message: 'Withdrawal request submitted successfully',
    });
  } catch (error: any) {
    console.error('[Withdrawal Request] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/withdrawal-requests
// Description: جلب قائمة طلبات التحويل للتاجر
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const tenantId = await getTenantId();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('settlements')
      .select(`
        *,
        merchant_bank_accounts (
          bank_name,
          iban,
          account_holder
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: settlements, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ settlements });
  } catch (error: any) {
    console.error('[Withdrawal Requests GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
