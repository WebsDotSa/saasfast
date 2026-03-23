// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/discounts/[id] - Get discount by ID
//            PATCH /api/marketing/discounts/[id] - Update discount
//            DELETE /api/marketing/discounts/[id] - Delete discount
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as discounts from '@/lib/marketing/discounts';
import { getTenantFromRequest } from '@/lib/tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/discounts/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    // Get discount ID from params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    // Get discount
    const discount = await discounts.getDiscountById(id, tenant.id);

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: discount,
    });

  } catch (error) {
    console.error('[API] Error getting discount:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get discount',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketing/discounts/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
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

    // Get discount ID from params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    // Check if discount exists
    const existingDiscount = await discounts.getDiscountById(id, tenant.id);
    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update input (only include provided fields)
    const updateInput: Partial<typeof body> = {};

    // String fields
    if (body.nameAr !== undefined) updateInput.nameAr = body.nameAr;
    if (body.nameEn !== undefined) updateInput.nameEn = body.nameEn;
    if (body.descriptionAr !== undefined) updateInput.descriptionAr = body.descriptionAr;
    if (body.descriptionEn !== undefined) updateInput.descriptionEn = body.descriptionEn;

    // Code (convert to uppercase)
    if (body.code !== undefined) {
      if (body.code) {
        const codeRegex = /^[A-Z0-9_-]+$/;
        if (!codeRegex.test(body.code)) {
          return NextResponse.json(
            { error: 'Code must contain only uppercase letters, numbers, hyphens, and underscores' },
            { status: 400 }
          );
        }
      }
      updateInput.code = body.code?.toUpperCase();
    }

    // Numeric fields
    if (body.value !== undefined) {
      const value = parseFloat(body.value);
      if (isNaN(value) || value <= 0) {
        return NextResponse.json(
          { error: 'Value must be a positive number' },
          { status: 400 }
        );
      }

      // Validate percentage
      if (body.discountType === 'percentage' && value > 100) {
        return NextResponse.json(
          { error: 'Percentage discount cannot exceed 100%' },
          { status: 400 }
        );
      }

      updateInput.value = value;
    }

    if (body.maxUses !== undefined) {
      updateInput.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
    }

    if (body.usesPerCustomer !== undefined) {
      updateInput.usesPerCustomer = body.usesPerCustomer ? parseInt(body.usesPerCustomer) : null;
    }

    if (body.minOrderAmount !== undefined) {
      updateInput.minOrderAmount = body.minOrderAmount ? parseFloat(body.minOrderAmount) : null;
    }

    if (body.maxDiscountAmount !== undefined) {
      updateInput.maxDiscountAmount = body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null;
    }

    // Array fields
    if (body.productIds !== undefined) updateInput.productIds = body.productIds;
    if (body.categoryIds !== undefined) updateInput.categoryIds = body.categoryIds;
    if (body.customerIds !== undefined) updateInput.customerIds = body.customerIds;
    if (body.regionIds !== undefined) updateInput.regionIds = body.regionIds;
    if (body.collectionIds !== undefined) updateInput.collectionIds = body.collectionIds;

    // Boolean fields
    if (body.isActive !== undefined) updateInput.isActive = body.isActive;
    if (body.isCombinable !== undefined) updateInput.isCombinable = body.isCombinable;

    // Other fields
    if (body.appliesTo !== undefined) updateInput.appliesTo = body.appliesTo;
    if (body.paymentMethod !== undefined) updateInput.paymentMethod = body.paymentMethod;
    if (body.priority !== undefined) updateInput.priority = parseInt(body.priority);
    if (body.metadata !== undefined) updateInput.metadata = body.metadata;

    // Dates
    if (body.startsAt !== undefined) {
      const startsAt = new Date(body.startsAt);
      if (isNaN(startsAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startsAt date' },
          { status: 400 }
        );
      }
      updateInput.startsAt = startsAt;
    }

    if (body.endsAt !== undefined) {
      const endsAt = new Date(body.endsAt);
      if (isNaN(endsAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endsAt date' },
          { status: 400 }
        );
      }

      // Check if endsAt is after startsAt
      const newStartsAt = updateInput.startsAt || existingDiscount.startsAt;
      if (endsAt < newStartsAt) {
        return NextResponse.json(
          { error: 'endsAt must be after startsAt' },
          { status: 400 }
        );
      }

      updateInput.endsAt = endsAt;
    }

    // Update discount
    const updatedDiscount = await discounts.updateDiscount(id, tenant.id, updateInput);

    if (!updatedDiscount) {
      return NextResponse.json(
        { error: 'Failed to update discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDiscount,
      message: 'تم تحديث الخصم بنجاح',
    });

  } catch (error) {
    console.error('[API] Error updating discount:', error);

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
        error: 'فشل تحديث الخصم',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE /api/marketing/discounts/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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

    // Get discount ID from params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    // Check if discount exists
    const existingDiscount = await discounts.getDiscountById(id, tenant.id);
    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // Soft delete discount
    const deleted = await discounts.deleteDiscount(id, tenant.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخصم بنجاح',
    });

  } catch (error) {
    console.error('[API] Error deleting discount:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل حذف الخصم',
      },
      { status: 500 }
    );
  }
}
