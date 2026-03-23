// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/loyalty/redeem - Redeem points
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as loyalty from '@/lib/marketing/loyalty';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/loyalty/redeem
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { customerId, pointsToRedeem } = body;

    if (!customerId || !pointsToRedeem) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await loyalty.redeemPoints(
      tenant.id,
      customerId,
      parseInt(pointsToRedeem)
    );

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
    console.error('[API] Error redeeming points:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل استرداد النقاط',
      },
      { status: 500 }
    );
  }
}
