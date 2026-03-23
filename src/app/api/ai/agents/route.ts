// ═══════════════════════════════════════════════════════════════════════════════
// AI Agents API — إدارة وكلاء الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════════════════════
// GET  /api/ai/agents — List agents
// POST /api/ai/agents — Create agent
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db, aiAgents } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

// ───────────────────────────────────────────────────────────────────────────────
// GET — List all agents for tenant
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenant_id;

    const agents = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.tenantId, tenantId))
      .orderBy(desc(aiAgents.createdAt));

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[AI Agents API] GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST — Create new agent
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      agentType = "support",
      modelProvider = "anthropic",
      modelName = "claude-sonnet-4-5",
      systemPrompt,
      temperature = 0.7,
      maxTokens = 1000,
      channels = [],
      avatarUrl,
      primaryColor,
      welcomeMessage,
      settings = {},
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 },
      );
    }

    const tenantId = (session.user as any).tenant_id;

    // Create agent
    const [newAgent] = await db
      .insert(aiAgents)
      .values({
        tenantId,
        name,
        description,
        agentType,
        modelProvider,
        modelName,
        systemPrompt: systemPrompt || getDefaultSystemPrompt(agentType),
        temperature,
        maxTokens,
        channels,
        avatarUrl,
        primaryColor,
        welcomeMessage,
        settings,
        isActive: true,
      })
      .returning();

    return NextResponse.json(
      {
        agent: newAgent,
        message: "Agent created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[AI Agents API] POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

function getDefaultSystemPrompt(agentType: string): string {
  const prompts: Record<string, string> = {
    support: `أنت مساعد دعم فني محترف لمنصة SaaS.
- تحدث باللهجة السعودية المهذبة
- كن مختصراً ومفيداً
- استخدم المصطلحات التقنية بالعربي
- إذا لم تجد الإجابة، اعتذر بلباقة`,

    sales: `أنت مساعد مبيعات محترف.
- كن ودوداً ومقنعاً
- اذكر الميزات والفوائد
- جاوب على الأسئلة بوضوح`,

    hr: `أنت مساعد موارد بشرية محترف.
- تحدث بأسلوب رسمي ومهذب
- احافظ على السرية
- قدم معلومات دقيقة`,
  };

  return prompts[agentType] || prompts.support;
}
