// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/ai/generate-message - Generate campaign message
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as ai from '@/lib/marketing/ai';

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/ai/generate-message
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

    // Check if AI is enabled
    if (!ai.isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { topic, audience, channel, tone, brandName, callToAction, language } = body;

    // Validate required fields
    if (!topic || !audience || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, audience, channel' },
        { status: 400 }
      );
    }

    // Generate campaign message
    const result = await ai.generateCampaignMessage({
      topic,
      audience,
      channel: channel as 'sms' | 'whatsapp' | 'email',
      tone: tone as 'friendly' | 'professional' | 'urgent' | 'exciting' || 'friendly',
      brandName,
      callToAction,
      language: language as 'ar' | 'en' | 'both' || 'ar',
    });

    return NextResponse.json({
      success: true,
      data: result,
      tokens: {
        input: ai.estimateTokens(topic + audience),
        output: ai.estimateTokens(result.message_ar),
      },
    });

  } catch (error: any) {
    console.error('[API] Error generating campaign message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل إنشاء الرسالة',
      },
      { status: 500 }
    );
  }
}
