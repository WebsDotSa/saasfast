// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/discounts - List discounts
//            POST /api/marketing/discounts - Create discount
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as discounts from '@/lib/marketing/discounts';
import { CreateDiscountInput } from '@/lib/marketing/discounts';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/discounts
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant ID
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const discountType = searchParams.get('discountType') as any;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // List discounts
    const result = await discounts.listDiscounts(tenant.id, {
      isActive: isActive ? isActive === 'true' : undefined,
      discountType: discountType || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.discounts,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('[API] Error listing discounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list discounts',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/discounts
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    const requiredFields: (keyof CreateDiscountInput)[] = [
      'discountType',
      'applyingMethod',
      'nameAr',
      'value',
      'appliesTo',
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          fields: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate discount type
    const validDiscountTypes = ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'bundle', 'tiered'];
    if (!validDiscountTypes.includes(body.discountType)) {
      return NextResponse.json(
        { error: 'Invalid discount type' },
        { status: 400 }
      );
    }

    // Validate applying method
    const validApplyingMethods = ['automatic', 'coupon_code'];
    if (!validApplyingMethods.includes(body.applyingMethod)) {
      return NextResponse.json(
        { error: 'Invalid applying method' },
        { status: 400 }
      );
    }

    // Validate value
    const value = parseFloat(body.value);
    if (isNaN(value) || value <= 0) {
      return NextResponse.json(
        { error: 'Value must be a positive number' },
        { status: 400 }
      );
    }

    // Validate percentage value
    if (body.discountType === 'percentage' && value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Validate code format if provided
    if (body.code) {
      const codeRegex = /^[A-Z0-9_-]+$/;
      if (!codeRegex.test(body.code)) {
        return NextResponse.json(
          { error: 'Code must contain only uppercase letters, numbers, hyphens, and underscores' },
          { status: 400 }
        );
      }
    }

    // Validate dates
    let startsAt: Date | undefined;
    let endsAt: Date | undefined;

    if (body.startsAt) {
      startsAt = new Date(body.startsAt);
      if (isNaN(startsAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startsAt date' },
          { status: 400 }
        );
      }
    }

    if (body.endsAt) {
      endsAt = new Date(body.endsAt);
      if (isNaN(endsAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endsAt date' },
          { status: 400 }
        );
      }

      // Check if endsAt is after startsAt
      if (startsAt && endsAt < startsAt) {
        return NextResponse.json(
          { error: 'endsAt must be after startsAt' },
          { status: 400 }
        );
      }
    }

    // Create discount input
    const input: CreateDiscountInput = {
      tenantId: tenant.id,
      discountType: body.discountType,
      applyingMethod: body.applyingMethod,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      descriptionAr: body.descriptionAr,
      code: body.code?.toUpperCase(),
      value,
      maxUses: body.maxUses ? parseInt(body.maxUses) : undefined,
      usesPerCustomer: body.usesPerCustomer ? parseInt(body.usesPerCustomer) : undefined,
      minOrderAmount: body.minOrderAmount ? parseFloat(body.minOrderAmount) : undefined,
      maxDiscountAmount: body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : undefined,
      appliesTo: body.appliesTo,
      productIds: body.productIds || [],
      categoryIds: body.categoryIds || [],
      customerIds: body.customerIds || [],
      regionIds: body.regionIds || [],
      collectionIds: body.collectionIds || [],
      paymentMethod: body.paymentMethod,
      startsAt: startsAt || new Date(),
      endsAt,
      isCombinable: body.isCombinable ?? false,
      priority: body.priority ?? 0,
      metadata: body.metadata || {},
    };

    // Create the discount
    const discount = await discounts.createDiscount(input);

    return NextResponse.json({
      success: true,
      data: discount,
      message: 'تم إنشاء الخصم بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Error creating discount:', error);
    
    // Handle duplicate code error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'كود الخصم مستخدم بالفعل' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'فشل إنشاء الخصم',
      },
      { status: 500 }
    );
  }
}
