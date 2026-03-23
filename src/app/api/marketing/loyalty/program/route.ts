// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/loyalty/program - Get loyalty program
//            PATCH /api/marketing/loyalty/program - Update loyalty program
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as loyalty from '@/lib/marketing/loyalty';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/loyalty/program
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
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

    const program = await loyalty.getOrCreateLoyaltyProgram(tenant.id);

    return NextResponse.json({
      success: true,
      data: program,
    });

  } catch (error) {
    console.error('[API] Error getting loyalty program:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get loyalty program',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketing/loyalty/program
// ───────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
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

    const program = await loyalty.updateLoyaltyProgram(tenant.id, {
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      descriptionAr: body.descriptionAr,
      pointsPerSar: body.pointsPerSar,
      sarPerPoint: body.sarPerPoint,
      minPointsToRedeem: body.minPointsToRedeem,
      pointsExpiryMonths: body.pointsExpiryMonths,
      tiersEnabled: body.tiersEnabled,
      tiersConfig: body.tiersConfig,
      rewardsEnabled: body.rewardsEnabled,
      rewardsConfig: body.rewardsConfig,
      isActive: body.isActive,
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Failed to update program' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: program,
      message: 'تم تحديث برنامج الولاء بنجاح',
    });

  } catch (error) {
    console.error('[API] Error updating loyalty program:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل تحديث برنامج الولاء',
      },
      { status: 500 }
    );
  }
}
