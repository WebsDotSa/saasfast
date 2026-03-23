// ═══════════════════════════════════════════════════════════════════════════════
// API Route: POST /api/marketing/ai/suggest-discount - Suggest discount rate
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as ai from '@/lib/marketing/ai';

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/marketing/ai/suggest-discount
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

    // Check if AI is enabled
    if (!ai.isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      productName,
      productPrice,
      productCategory,
      salesData,
      competitorPrices,
      profitMargin,
      season,
    } = body;

    // Validate required fields
    if (!productName || !productPrice || !salesData) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, productPrice, salesData' },
        { status: 400 }
      );
    }

    // Suggest discount
    const result = await ai.suggestDiscountRate({
      productName,
      productPrice: parseFloat(productPrice),
      productCategory: productCategory || 'عام',
      salesData: {
        avgDailySales: parseFloat(salesData.avgDailySales) || 0,
        lastWeekSales: parseFloat(salesData.lastWeekSales) || 0,
        lastMonthSales: parseFloat(salesData.lastMonthSales) || 0,
      },
      competitorPrices: competitorPrices?.map((p: any) => parseFloat(p)),
      profitMargin: profitMargin ? parseFloat(profitMargin) : undefined,
      season: season || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
      tokens: {
        input: ai.estimateTokens(JSON.stringify(body)),
        output: ai.estimateTokens(result.reasoning),
      },
    });

  } catch (error: any) {
    console.error('[API] Error suggesting discount:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل اقتراح الخصم',
      },
      { status: 500 }
    );
  }
}
