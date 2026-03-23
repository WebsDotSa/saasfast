// ═══════════════════════════════════════════════════════════════════════════════
// API Route: GET /api/marketing/campaigns - List campaigns
//            POST /api/marketing/campaigns - Create campaign
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as campaigns from '@/lib/marketing/campaigns';
import { CreateCampaignInput } from '@/lib/marketing/campaigns';
import { getTenantFromRequest } from '@/lib/tenant';

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/marketing/campaigns
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const channel = searchParams.get('channel') as any;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await campaigns.listCampaigns(tenant.id, {
      status,
      channel,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.campaigns,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('[API] Error listing campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list campaigns',
      },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/campaigns
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

    // Validate required fields
    const requiredFields: (keyof CreateCampaignInput)[] = [
      'title',
      'channel',
      'messageAr',
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          fields: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate channel
    const validChannels = ['sms', 'whatsapp', 'email', 'push', 'all'];
    if (!validChannels.includes(body.channel)) {
      return NextResponse.json(
        { error: 'Invalid channel' },
        { status: 400 }
      );
    }

    // Validate scheduled date
    let scheduledAt: Date | undefined;
    if (body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
      if (isNaN(scheduledAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduledAt date' },
          { status: 400 }
        );
      }
    }

    // Create campaign input
    const input: CreateCampaignInput = {
      tenantId: tenant.id,
      title: body.title,
      description: body.description,
      channel: body.channel,
      goal: body.goal,
      status: body.status || 'draft',
      audienceFilter: body.audienceFilter || {},
      messageAr: body.messageAr,
      messageEn: body.messageEn,
      subjectLine: body.subjectLine,
      senderName: body.senderName,
      templateId: body.templateId,
      templateVars: body.templateVars,
      scheduledAt,
      timezone: body.timezone || 'Asia/Riyadh',
      isAbTest: body.isAbTest ?? false,
      metadata: body.metadata || {},
    };

    const campaign = await campaigns.createCampaign(input);

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'تم إنشاء الحملة بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Error creating campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل إنشاء الحملة',
      },
      { status: 500 }
    );
  }
}
