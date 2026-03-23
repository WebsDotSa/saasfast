// ═══════════════════════════════════════════════════════════════════════════════
// AI Chat API — Streaming Support
// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ai/chat — Send message and stream response
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { aiAgentService } from "@/lib/ai/agent-service";
import { aiGateway } from "@/lib/ai/gateway";
import { ragService } from "@/lib/ai/rag-service";
import { db, aiConversations, aiMessages, aiAgents } from "@/lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ───────────────────────────────────────────────────────────────────────────────
// POST Handler — Send message & stream response
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request
    const body = await req.json();
    const {
      conversationId,
      agentId,
      message,
      sessionId,
      channel = "website",
      useRAG = true,
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const tenantId = (session.user as any).tenant_id;
    const userId = (session.user as any).id;

    // 3. Get or create conversation
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      // Create new conversation
      const newConversation = await db
        .insert(aiConversations)
        .values({
          tenantId,
          agentId,
          sessionId: sessionId || `session_${Date.now()}`,
          channel,
          customerId: userId,
          status: "active",
          startedAt: new Date(),
        })
        .returning();

      currentConversationId = newConversation[0].id;
    }

    // 4. Get agent
    const agent = await db.query.aiAgents.findFirst({
      where: and(eq(aiAgents.id, agentId), eq(aiAgents.tenantId, tenantId)),
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // 5. Save user message
    await db.insert(aiMessages).values({
      conversationId: currentConversationId,
      tenantId,
      role: "user",
      content: message,
      messageType: "text",
    });

    // 6. Get conversation history
    const recentMessages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, currentConversationId),
      orderBy: [desc(aiMessages.createdAt)],
      limit: 20,
    });

    const messages = recentMessages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 7. Get RAG context if enabled
    let knowledgeContext = "";
    let ragContext: any[] = [];

    if (useRAG && agent.settings) {
      const ragLimit = (agent.settings as any)?.maxContextDocs || 5;
      const ragResult = await ragService.getContextForPrompt(
        tenantId,
        message,
        {
          limit: ragLimit,
        },
      );

      knowledgeContext = ragResult.formattedContext;
      ragContext = ragResult.documents;
    }

    // 8. Create system prompt
    const systemPrompt = `أنت ${agent.name}، ${agent.description || "مساعد ذكي"}.

${agent.systemPrompt}

${knowledgeContext ? `استخدم المعلومات التالية من قاعدة المعرفة للإجابة:\n${knowledgeContext}` : ""}

تحدث باللهجة السعودية المهذبة.
كن مختصراً ومفيداً.
إذا لم تجد الإجابة، اعتذر بلباقة.`;

    // 9. Stream response using Vercel AI SDK
    const result = await streamText({
      model: anthropic(agent.modelName || "claude-sonnet-4-5"),
      messages: [{ role: "system" as const, content: systemPrompt }, ...(messages as any)],
      temperature: Number(agent.temperature) || 0.7,
      maxTokens: Number(agent.maxTokens) || 1000,
      onFinish: async ({ text, usage, finishReason }) => {
        // Save AI response to database
        await db.insert(aiMessages).values({
          conversationId: currentConversationId,
          tenantId,
          role: "assistant",
          content: text,
          messageType: "text",
          modelUsed: agent.modelName,
          promptTokens: usage?.promptTokens || 0,
          completionTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0,
        });

        // Update conversation stats
        const messageCountResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(aiMessages)
          .where(eq(aiMessages.conversationId, currentConversationId));

        await db
          .update(aiConversations)
          .set({
            messageCount: messageCountResult[0]?.count || 0,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(aiConversations.id, currentConversationId));

        // Update agent stats
        await db
          .update(aiAgents)
          .set({
            totalMessages: sql`${aiAgents.totalMessages} + 1`,
          })
          .where(eq(aiAgents.id, agentId));
      },
    });

    // 10. Return stream
    return result.toDataStreamResponse({
      headers: {
        "x-conversation-id": currentConversationId,
        "x-agent-id": agentId,
      },
    });
  } catch (error) {
    console.error("[AI Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET Handler — Get conversation history
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const tenantId = (session.user as any).tenant_id;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    // Get messages
    const messages = await db.query.aiMessages.findMany({
      where: and(
        eq(aiMessages.conversationId, conversationId),
        eq(aiMessages.tenantId, tenantId),
      ),
      orderBy: [aiMessages.createdAt],
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[AI Chat API] GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
