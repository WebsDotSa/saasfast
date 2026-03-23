// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/campaigns/[id] - Get campaign
//            PATCH /api/marketing/campaigns/[id] - Update campaign
//            DELETE /api/marketing/campaigns/[id] - Delete campaign
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as campaigns from '@/lib/marketing/campaigns';
import { getTenantFromRequest } from '@/lib/tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/campaigns/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(
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
    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const campaign = await campaigns.getCampaignById(id, tenant.id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get analytics
    const analytics = await campaigns.getCampaignAnalytics(id);

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        analytics,
      },
    });

  } catch (error) {
    console.error('[API] Error getting campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get campaign',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/marketing/campaigns/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function PATCH(
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
    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const existingCampaign = await campaigns.getCampaignById(id, tenant.id);
    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateInput: Partial<typeof body> = {};

    // String fields
    if (body.title !== undefined) updateInput.title = body.title;
    if (body.description !== undefined) updateInput.description = body.description;
    if (body.messageAr !== undefined) updateInput.messageAr = body.messageAr;
    if (body.messageEn !== undefined) updateInput.messageEn = body.messageEn;
    if (body.subjectLine !== undefined) updateInput.subjectLine = body.subjectLine;
    if (body.senderName !== undefined) updateInput.senderName = body.senderName;

    // Other fields
    if (body.channel !== undefined) updateInput.channel = body.channel;
    if (body.goal !== undefined) updateInput.goal = body.goal;
    if (body.status !== undefined) updateInput.status = body.status;
    if (body.audienceFilter !== undefined) updateInput.audienceFilter = body.audienceFilter;
    if (body.templateId !== undefined) updateInput.templateId = body.templateId;
    if (body.templateVars !== undefined) updateInput.templateVars = body.templateVars;
    if (body.timezone !== undefined) updateInput.timezone = body.timezone;
    if (body.isAbTest !== undefined) updateInput.isAbTest = body.isAbTest;
    if (body.metadata !== undefined) updateInput.metadata = body.metadata;

    // Dates
    if (body.scheduledAt !== undefined) {
      const scheduledAt = new Date(body.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduledAt date' },
          { status: 400 }
        );
      }
      updateInput.scheduledAt = scheduledAt;
    }

    const updatedCampaign = await campaigns.updateCampaign(id, tenant.id, updateInput);

    if (!updatedCampaign) {
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
      message: 'تم تحديث الحملة بنجاح',
    });

  } catch (error) {
    console.error('[API] Error updating campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل تحديث الحملة',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE /api/marketing/campaigns/[id]
// ───────────────────────────────────────────────────────────────────────────────

export async function DELETE(
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
    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const existingCampaign = await campaigns.getCampaignById(id, tenant.id);
    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const deleted = await campaigns.deleteCampaign(id, tenant.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الحملة بنجاح',
    });

  } catch (error) {
    console.error('[API] Error deleting campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل حذف الحملة',
      },
      { status: 500 }
    );
  }
}
