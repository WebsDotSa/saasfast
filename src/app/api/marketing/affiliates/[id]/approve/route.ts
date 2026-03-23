// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/affiliates/[id]/approve - Approve affiliate
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
// POST /api/marketing/affiliates/[id]/approve
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const approvedBy = (session.user as any).id || session.user.email;

    const affiliate = await affiliates.approveAffiliate(id, tenant.id, approvedBy);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Failed to approve affiliate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: affiliate,
      message: 'تم الموافقة على المسوق بنجاح',
    });

  } catch (error) {
    console.error('[API] Error approving affiliate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل الموافقة على المسوق',
      },
      { status: 500 }
    );
  }
}
