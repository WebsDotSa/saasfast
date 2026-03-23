// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/affiliates - List affiliates
//            POST /api/marketing/affiliates - Create affiliate
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as affiliates from '@/lib/marketing/affiliates';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/affiliates
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const result = await affiliates.listAffiliates(tenantId, { status });

    return NextResponse.json({
      success: true,
      data: result.affiliates,
      meta: {
        total: result.total,
      },
    });

  } catch (error) {
    console.error('[API] Error listing affiliates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list affiliates',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/affiliates
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const affiliate = await affiliates.createAffiliate({
      tenantId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      referralCode: body.referralCode,
      commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : 10,
      commissionType: body.commissionType || 'percentage',
      payoutMethod: body.payoutMethod,
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Failed to create affiliate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: affiliate,
      message: 'تم إضافة المسوق بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Error creating affiliate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل إضافة المسوق',
      },
      { status: 500 }
    );
  }
}
