// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/bank-accounts
// Description: إدارة الحسابات البنكية للتاجر
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantId } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// POST - إضافة حساب بنكي جديد
// ───────────────────────────────────────────────────────────────────────────────

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
      bank_name,
      account_holder,
      account_number,
      iban,
      swift_code,
      is_primary = false,
    } = body;

    // التحقق من البيانات المطلوبة
    if (!bank_name || !account_holder || !iban) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // التحقق من صحة IBAN
    if (!validateIBAN(iban)) {
      return NextResponse.json(
        { error: 'Invalid IBAN format' },
        { status: 400 }
      );
    }

    // إذا كان primary، نلغي primary من الحسابات الأخرى
    if (is_primary) {
      await supabase
        .from('merchant_bank_accounts')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId);
    }

    // إضافة الحساب البنكي
    const { data: account, error } = await supabase
      .from('merchant_bank_accounts')
      .insert({
        tenant_id: tenantId,
        bank_name,
        account_holder,
        account_number,
        iban,
        swift_code,
        is_primary,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('[Bank Accounts POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET - جلب الحسابات البنكية للتاجر
// ───────────────────────────────────────────────────────────────────────────────

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
    const verified = searchParams.get('verified');

    let query = supabase
      .from('merchant_bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (verified !== null && verified !== undefined) {
      query = query.eq('is_verified', verified === 'true');
    }

    const { data: accounts, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('[Bank Accounts GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PUT - تحديث حساب بنكي
// ───────────────────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
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
      id,
      bank_name,
      account_holder,
      account_number,
      iban,
      swift_code,
      is_primary,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID required' },
        { status: 400 }
      );
    }

    // التحقق من أن الحساب يخص التاجر
    const { data: existingAccount } = await supabase
      .from('merchant_bank_accounts')
      .select('id, tenant_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // إذا كان primary، نلغي primary من الحسابات الأخرى
    if (is_primary) {
      await supabase
        .from('merchant_bank_accounts')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId)
        .neq('id', id);
    }

    const updateData: any = {
      bank_name,
      account_holder,
      account_number,
      iban,
      swift_code,
      is_primary,
      updated_at: new Date().toISOString(),
    };

    const { data: account, error } = await supabase
      .from('merchant_bank_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('[Bank Accounts PUT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE - حذف حساب بنكي
// ───────────────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID required' },
        { status: 400 }
      );
    }

    // التحقق من أن الحساب يخص التاجر
    const { data: existingAccount } = await supabase
      .from('merchant_bank_accounts')
      .select('id, tenant_id, is_primary')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // لا يمكن حذف الحساب الأساسي إذا كان الوحيد
    if (existingAccount.is_primary) {
      const { count } = await supabase
        .from('merchant_bank_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (count === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only bank account' },
          { status: 400 }
        );
      }
    }

    await supabase
      .from('merchant_bank_accounts')
      .delete()
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('[Bank Accounts DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * التحقق من صحة IBAN سعودي
 * IBAN السعودي: SA + 22 رقم (الإجمالي 24 خانة)
 */
function validateIBAN(iban: string): boolean {
  // إزالة المسافات والأحرف الخاصة
  const cleanIban = iban.replace(/[\s-]/g, '').toUpperCase();

  // التحقق من الطول (SA + 22 = 24)
  if (cleanIban.length !== 24) {
    return false;
  }

  // التحقق من البدء بـ SA
  if (!cleanIban.startsWith('SA')) {
    return false;
  }

  // التحقق من أن الباقي أرقام فقط
  const numericPart = cleanIban.substring(2);
  if (!/^\d+$/.test(numericPart)) {
    return false;
  }

  return true;
}
