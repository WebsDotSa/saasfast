// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/affiliates/[id] - Get affiliate
//            PATCH /api/marketing/affiliates/[id] - Update affiliate
//            DELETE /api/marketing/affiliates/[id] - Delete affiliate
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as affiliates from '@/lib/marketing/affiliates';
import { getTenantFromRequest } from '@/lib/tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/affiliates/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = getTenantFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const affiliate = await affiliates.getAffiliateById(id, tenantId);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: affiliate,
    });

  } catch (error) {
    console.error('[API] Error getting affiliate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get affiliate',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketing/affiliates/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = getTenantFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const affiliate = await affiliates.updateAffiliate(id, tenantId, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      companyName: body.companyName,
      taxNumber: body.taxNumber,
      commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : undefined,
      commissionType: body.commissionType,
      payoutMethod: body.payoutMethod,
      payoutDetails: body.payoutDetails,
      minPayoutAmount: body.minPayoutAmount ? parseFloat(body.minPayoutAmount) : undefined,
      status: body.status,
      adminNotes: body.adminNotes,
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Failed to update affiliate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: affiliate,
      message: 'تم تحديث المسوق بنجاح',
    });

  } catch (error) {
    console.error('[API] Error updating affiliate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل تحديث المسوق',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE /api/marketing/affiliates/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = getTenantFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const deleted = await affiliates.deleteAffiliate(id, tenantId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete affiliate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المسوق بنجاح',
    });

  } catch (error) {
    console.error('[API] Error deleting affiliate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل حذف المسوق',
      },
      { status: 500 }
    );
  }
}
