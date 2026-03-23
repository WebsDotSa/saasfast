// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/loyalty/earn - Award points
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as loyalty from '@/lib/marketing/loyalty';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/loyalty/earn
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

    const { customerId, orderAmount, orderId } = body;

    if (!customerId || !orderAmount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await loyalty.awardPoints(
      tenant.id,
      customerId,
      parseFloat(orderAmount),
      orderId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `تم كسب ${result.points} نقطة بنجاح`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'فشل كسب النقاط',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[API] Error awarding points:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل كسب النقاط',
      },
      { status: 500 }
    );
  }
}
