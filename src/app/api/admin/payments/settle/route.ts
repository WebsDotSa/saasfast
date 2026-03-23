// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/payments/settle
// Description: الموافقة على تسوية وتنفيذ تحويل - للإدارة فقط
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const isSuperAdmin = (session?.user as any)?.is_super_admin || false;
    const adminId = (session?.user as any)?.id;
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    const {
      settlement_id,
      bank_reference,
      transfer_note,
      action = 'approve', // approve | reject | hold
      rejection_reason,
    } = body;

    if (!settlement_id) {
      return NextResponse.json(
        { error: 'settlement_id required' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // جلب معلومات التسوية
    // ═══════════════════════════════════════════════════════════════════════════

    const { data: settlement } = await supabase
      .from('settlements')
      .select(`
        *,
        merchant_bank_accounts (
          iban,
          account_holder,
          bank_name
        ),
        tenants (
          name,
          company_email
        )
      `)
      .eq('id', settlement_id)
      .single();

    if (!settlement) {
      return NextResponse.json(
        { error: 'Settlement not found' },
        { status: 404 }
      );
    }

    if (settlement.status !== 'pending') {
      return NextResponse.json(
        { error: 'Settlement is not pending' },
        { status: 400 }
      );
    }

    const tenant = settlement.tenants as any;
    const bankAccount = settlement.merchant_bank_accounts as any;

    // ═══════════════════════════════════════════════════════════════════════════
    // معالجة حسب الإجراء
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'approve') {
      if (!bank_reference) {
        return NextResponse.json(
          { error: 'bank_reference required for approval' },
          { status: 400 }
        );
      }

      // 1. تحديث حالة التسوية
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          status: 'transferred',
          bank_reference,
          transfer_note: transfer_note || null,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', settlement_id);

      if (updateError) throw updateError;

      // 2. تحديث رصيد التاجر
      const { error: balanceError } = await supabase.rpc('update_balance_on_settlement', {
        p_tenant_id: settlement.tenant_id,
        p_amount: settlement.net_amount,
      });

      if (balanceError) {
        console.error('[Update Balance] Error:', balanceError);
        // نتابع رغم الخطأ
      }

      // 3. ربط العمليات بالتسوية
      await supabase
        .from('store_transactions')
        .update({
          settlement_id,
          settled_at: new Date().toISOString(),
        })
        .eq('tenant_id', settlement.tenant_id)
        .eq('status', 'success')
        .is('settlement_id', null)
        .gte('created_at', settlement.period_start)
        .lte('created_at', settlement.period_end);

      // 4. إرسال إيميل للتاجر
      try {
        const { sendSettlementEmail } = await import('@/lib/emails');
        await sendSettlementEmail(tenant?.company_email || '', {
          tenantName: tenant?.name || 'عميلنا الكريم',
          amount: settlement.net_amount.toString(),
          currency: settlement.currency || 'SAR',
          bankReference: bank_reference,
          settlementNumber: settlement.settlement_number,
          settlementDate: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error('[Send Email] Error:', emailError);
        // نتابع رغم الخطأ
      }

      // 5. تسجيل Audit Log
      await supabase.from('audit_logs').insert({
        tenant_id: settlement.tenant_id,
        user_id: adminId,
        action: 'settlement.approved',
        resource_type: 'settlement',
        resource_id: settlement_id,
        metadata: {
          amount: settlement.net_amount,
          bank_reference,
          admin_id: adminId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تمت الموافقة على التسوية بنجاح',
        settlement: {
          ...settlement,
          status: 'transferred',
          bank_reference,
          transferred_at: new Date().toISOString(),
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // رفض التسوية
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'reject') {
      if (!rejection_reason) {
        return NextResponse.json(
          { error: 'rejection_reason required' },
          { status: 400 }
        );
      }

      // 1. تحديث حالة التسوية
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          status: 'failed',
          rejected_by: adminId,
          rejected_at: new Date().toISOString(),
          rejection_reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settlement_id);

      if (updateError) throw updateError;

      // 2. إطلاق الرصيد المحجوز
      await supabase.rpc('release_reserved_balance', {
        p_tenant_id: settlement.tenant_id,
        p_amount: settlement.net_amount,
      });

      // 3. تسجيل Audit Log
      await supabase.from('audit_logs').insert({
        tenant_id: settlement.tenant_id,
        user_id: adminId,
        action: 'settlement.rejected',
        resource_type: 'settlement',
        resource_id: settlement_id,
        metadata: {
          rejection_reason,
          admin_id: adminId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم رفض التسوية',
        settlement: {
          ...settlement,
          status: 'failed',
          rejected_by: adminId,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // وضع التسوية على hold
    // ═══════════════════════════════════════════════════════════════════════════

    if (action === 'hold') {
      const { error: updateError } = await supabase
        .from('settlements')
        .update({
          status: 'on_hold',
          admin_notes: transfer_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settlement_id);

      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert({
        tenant_id: settlement.tenant_id,
        user_id: adminId,
        action: 'settlement.held',
        resource_type: 'settlement',
        resource_id: settlement_id,
        metadata: {
          notes: transfer_note,
          admin_id: adminId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم وضع التسوية على الانتظار',
        settlement: {
          ...settlement,
          status: 'on_hold',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Admin Settle] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/payments/settlements
// Description: قائمة جميع التسويات - للإدارة فقط
// ═══════════════════════════════════════════════════════════════════════════════

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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('settlements')
      .select(`
        *,
        tenants (
          name,
          slug
        ),
        merchant_bank_accounts (
          bank_name,
          iban
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: settlements, count } = await query;

    return NextResponse.json({
      settlements,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Settlements GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
