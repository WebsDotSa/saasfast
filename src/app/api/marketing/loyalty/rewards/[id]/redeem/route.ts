// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/loyalty/rewards/[id]/redeem - Redeem reward
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as loyalty from '@/lib/marketing/loyalty';
import { getTenantFromRequest } from '@/lib/tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/loyalty/rewards/[id]/redeem
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(
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
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const result = await loyalty.redeemReward(tenantId, customerId, id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: result.message,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[API] Error redeeming reward:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل استرداد المكافأة',
      },
      { status: 500 }
    );
  }
}
