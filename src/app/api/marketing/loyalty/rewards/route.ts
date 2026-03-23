// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/loyalty/rewards - List rewards
//            POST /api/marketing/loyalty/rewards - Create reward
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as loyalty from '@/lib/marketing/loyalty';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/loyalty/rewards
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

    const rewards = await loyalty.listRewards(tenant.id);

    return NextResponse.json({
      success: true,
      data: rewards,
    });

  } catch (error) {
    console.error('[API] Error listing rewards:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list rewards',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/loyalty/rewards
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

    const reward = await loyalty.createReward({
      tenantId: tenant.id,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      descriptionAr: body.descriptionAr,
      rewardType: body.rewardType,
      pointsCost: parseInt(body.pointsCost),
      discountType: body.discountType,
      discountValue: body.discountValue ? parseFloat(body.discountValue) : undefined,
      minOrderAmount: body.minOrderAmount ? parseFloat(body.minOrderAmount) : undefined,
      validityDays: body.validityDays ? parseInt(body.validityDays) : 30,
      imageUrl: body.imageUrl,
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Failed to create reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reward,
      message: 'تم إنشاء المكافأة بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Error creating reward:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل إنشاء المكافأة',
      },
      { status: 500 }
    );
  }
}
