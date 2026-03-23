// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/links
// Description: إنشاء رابط دفع جديد
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantId } from '@/lib/tenant';
import { createPaymentLink } from '@/lib/myfatoorah';

export async function POST(request: NextRequest) {
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

    // استخراج البيانات من الطلب
    const body = await request.json();
    const {
      title,
      amount,
      currency = 'SAR',
      description,
      customer_name,
      customer_phone,
      customer_email,
      expires_at,
    } = body;

    // التحقق من البيانات المطلوبة
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. إنشاء رابط دفع في MyFatoorah
    // ═══════════════════════════════════════════════════════════════════════════
    
    const mfResult = await createPaymentLink({
      amount,
      displayCurrency: currency,
      customerName: customer_name,
      customerEmail: customer_email,
      customerMobile: customer_phone,
      customerReference: title,
      callBackUrl: process.env.APP_URL || 'http://localhost:3000',
      errorUrl: process.env.APP_URL || 'http://localhost:3000',
      invoiceItems: [{
        ItemName: title,
        Quantity: 1,
        UnitPrice: amount,
      }],
    });

    if (!mfResult.success || !mfResult.data) {
      return NextResponse.json(
        { error: 'Failed to create payment link', details: mfResult.error },
        { status: 500 }
      );
    }

    const mfData = mfResult.data as any;

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. حفظ في قاعدة البيانات
    // ═══════════════════════════════════════════════════════════════════════════
    
    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .insert({
        tenant_id: tenantId,
        title,
        amount,
        currency,
        description,
        customer_name,
        customer_phone,
        customer_email,
        myfatoorah_url: mfData.LinkURL,
        short_url: mfData.ShortURL,
        expires_at: expires_at || null,
        status: 'active',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: paymentLink,
      myfatoorah_url: mfData.LinkURL,
      short_url: mfData.ShortURL,
    });
  } catch (error: any) {
    console.error('[Payment Links] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/links
// Description: جلب قائمة روابط الدفع
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
    const paymentStatus = searchParams.get('payment_status');

    let query = supabase
      .from('payment_links')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    const { data: links, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ links });
  } catch (error: any) {
    console.error('[Payment Links GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
