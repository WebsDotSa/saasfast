// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/discounts/validate - Validate coupon code
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as discounts from '@/lib/marketing/discounts';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/discounts/validate
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional for cart checkout)
    const session = await getServerSession(authOptions);

    // Get tenant ID
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.code) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: ['كود الخصم مطلوب'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    if (!body.order) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: ['معلومات الطلب مطلوبة'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Build order context
    const orderContext = {
      subtotal: parseFloat(body.order.subtotal) || 0,
      products: body.order.products || [],
      customerId: body.order.customerId,
      customerEmail: body.order.customerEmail,
      regionId: body.order.regionId,
      paymentMethod: body.order.paymentMethod,
      shippingAmount: parseFloat(body.order.shippingAmount) || 0,
    };

    // Validate order subtotal
    if (orderContext.subtotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: ['مبلغ الطلب يجب أن يكون أكبر من صفر'],
          warnings: [],
        },
        { status: 400 }
      );
    }

    // Validate coupon
    const result = await discounts.validateCoupon(
      body.code.toUpperCase(),
      tenant.id,
      orderContext
    );

    // Return validation result
    if (result.valid) {
      return NextResponse.json({
        success: true,
        valid: true,
        data: {
          discount: result.discount,
          savings: result.savings,
          finalAmount: result.finalAmount,
        },
        warnings: result.warnings,
        message: 'تم تطبيق الخصم بنجاح',
      });
    } else {
      return NextResponse.json({
        success: false,
        valid: false,
        errors: result.errors,
        warnings: result.warnings,
        message: 'لا يمكن تطبيق هذا الخصم',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[API] Error validating coupon:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        errors: ['حدث خطأ أثناء التحقق من الخصم'],
        warnings: [],
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// OPTIONS /api/marketing/discounts/validate (CORS preflight)
// ───────────────────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
    },
  });
}
