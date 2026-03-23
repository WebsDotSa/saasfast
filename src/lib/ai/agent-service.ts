// ═══════════════════════════════════════════════════════════════════════════════
// AI Agent Service — إدارة وكلاء الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════════════════════
// Service layer for AI Agent operations
// ═══════════════════════════════════════════════════════════════════════════════

import { db, aiAgents, aiConversations, aiMessages, aiKnowledgeBase, aiAnalytics, type NewAIAgent } from "@/lib/db";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import {
  aiGateway,
  createAgentSystemPrompt,
  formatMessagesForAI,
} from "./gateway";
import { ragService, type RAGSearchResult } from "./rag-service";
import { v4 as uuidv4 } from "uuid";

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export interface CreateAgentData {
  tenantId: string;
  name: string;
  description?: string;
  agentType?: string;
  modelProvider?: string;
  modelName?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  channels?: string[];
  avatarUrl?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  settings?: Record<string, any>;
}

export interface CreateConversationData {
  tenantId: string;
  agentId: string;
  sessionId: string;
  channel?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  context?: Record<string, any>;
}

export interface SendMessageData {
  conversationId: string;
  tenantId: string;
  userId?: string;
  content: string;
  channel?: string;
  useRAG?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  messageId: string;
  conversationId: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    usd: number;
    sar: number;
  };
  latency: number;
  ragContext?: RAGSearchResult[];
}

// ───────────────────────────────────────────────────────────────────────────────
// AI Agent Service Class
// ───────────────────────────────────────────────────────────────────────────────

class AIAgentService {
  // ─────────────────────────────────────────────────────────────────────────────
  // Agent Management
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create new AI Agent
   */
  async createAgent(data: CreateAgentData): Promise<string> {
    const {
      tenantId,
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
    } = data;

    const [result] = await db
      .insert(aiAgents)
      .values({
        tenantId,
        name,
        description,
        agentType,
        modelProvider,
        modelName,
        systemPrompt: systemPrompt || this.getDefaultSystemPrompt(agentType),
        temperature: String(temperature),
        maxTokens,
        channels: channels as any,
        avatarUrl,
        primaryColor,
        welcomeMessage,
        settings,
        isActive: true,
      } as any)
      .returning();

    return result.id;
  }

  /**
   * Get agent by ID
   */
  async getAgent(tenantId: string, agentId: string) {
    const results = await db
      .select()
      .from(aiAgents)
      .where(and(eq(aiAgents.id, agentId), eq(aiAgents.tenantId, tenantId)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * List agents for tenant
   */
  async listAgents(tenantId: string) {
    return await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.tenantId, tenantId))
      .orderBy(desc(aiAgents.createdAt));
  }

  /**
   * Update agent
   */
  async updateAgent(
    tenantId: string,
    agentId: string,
    data: Partial<CreateAgentData>,
  ): Promise<boolean> {
    const updated = await db
      .update(aiAgents)
      .set({
        ...data,
        temperature: data.temperature ? String(data.temperature) : undefined,
        updatedAt: new Date(),
      } as any)
      .where(and(eq(aiAgents.id, agentId), eq(aiAgents.tenantId, tenantId)))
      .returning();

    return updated.length > 0;
  }

  /**
   * Delete agent
   */
  async deleteAgent(tenantId: string, agentId: string): Promise<boolean> {
    await db
      .delete(aiAgents)
      .where(and(eq(aiAgents.id, agentId), eq(aiAgents.tenantId, tenantId)));

    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Conversation Management
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create new conversation
   */
  async createConversation(data: CreateConversationData): Promise<string> {
    const {
      tenantId,
      agentId,
      sessionId,
      channel = "website",
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      context = {},
    } = data;

    const [result] = await db
      .insert(aiConversations)
      .values({
        tenantId,
        agentId,
        sessionId,
        channel,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        context,
        status: "active",
        startedAt: new Date(),
      })
      .returning();

    // Update agent stats
    await db
      .update(aiAgents)
      .set({
        totalConversations: sql`${aiAgents.totalConversations} + 1`,
      })
      .where(eq(aiAgents.id, agentId));

    return result.id;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(tenantId: string, conversationId: string) {
    const results = await db
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, conversationId),
          eq(aiConversations.tenantId, tenantId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    tenantId: string,
    conversationId: string,
    limit: number = 50,
  ) {
    return await db
      .select()
      .from(aiMessages)
      .where(
        and(
          eq(aiMessages.conversationId, conversationId),
          eq(aiMessages.tenantId, tenantId),
        ),
      )
      .orderBy(desc(aiMessages.createdAt))
      .limit(limit);
  }

  /**
   * Close conversation
   */
  async closeConversation(
    tenantId: string,
    conversationId: string,
    status: "closed" | "escalated" = "closed",
  ): Promise<boolean> {
    await db
      .update(aiConversations)
      .set({
        status,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiConversations.id, conversationId),
          eq(aiConversations.tenantId, tenantId),
        ),
      );

    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Chat & Messaging
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Send message and get AI response
   */
  async sendMessage(data: SendMessageData): Promise<ChatResponse> {
    const {
      conversationId,
      tenantId,
      userId,
      content,
      channel = "website",
      useRAG = true,
    } = data;

    const startTime = Date.now();

    // 1. Get conversation and agent
    const conversation = await this.getConversation(tenantId, conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const agent = await this.getAgent(tenantId, conversation.agentId!);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // 2. Save user message
    const userMessageId = await this.saveMessage({
      conversationId,
      tenantId,
      role: "user",
      content,
      messageType: "text",
    });

    // 3. Get conversation history
    const messages = await this.getConversationMessages(
      tenantId,
      conversationId,
      20,
    );
    const formattedMessages = formatMessagesForAI(
      messages.reverse().map((m) => ({
        role: m.role,
        content: m.content,
      })),
    );

    // 4. Get RAG context if enabled
    let ragContext: RAGSearchResult[] = [];
    let knowledgeContext = "";

    if (useRAG) {
      const ragLimit = (agent.settings as any)?.maxContextDocs || 5;
      const ragResult = await ragService.getContextForPrompt(
        tenantId,
        content,
        {
          limit: ragLimit,
        },
      );

      ragContext = ragResult.documents;
      knowledgeContext = ragResult.formattedContext;
    }

    // 5. Create system prompt with context
    const systemPrompt = createAgentSystemPrompt({
      agentName: agent.name,
      agentType: agent.agentType,
      systemPrompt: agent.systemPrompt,
      knowledgeContext,
      tone: "professional",
      language: "ar",
    });

    // 6. Call AI Gateway
    const aiResponse = await aiGateway.generate({
      tenantId,
      userId,
      agentId: agent.id,
      conversationId,
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages,
      ],
      model: agent.modelName || undefined,
      temperature: agent.temperature ? Number(agent.temperature) : undefined,
      maxTokens: agent.maxTokens || undefined,
    });

    // 7. Save AI response
    const aiMessageId = await this.saveMessage({
      conversationId,
      tenantId,
      role: "assistant",
      content: aiResponse.text,
      messageType: "text",
      modelUsed: aiResponse.model,
      promptTokens: aiResponse.usage.promptTokens,
      completionTokens: aiResponse.usage.completionTokens,
      totalTokens: aiResponse.usage.totalTokens,
      costUsd: aiResponse.cost.usd,
      latencyMs: Date.now() - startTime,
      ragContext: ragContext.map((d) => d.id),
    });

    // 8. Update conversation stats
    await this.updateConversationStats(conversationId, {
      messageCount: 2,
      totalTokens: aiResponse.usage.totalTokens,
      totalCost: aiResponse.cost.usd,
      avgResponseTimeMs: Date.now() - startTime,
    });

    return {
      messageId: aiMessageId,
      conversationId,
      content: aiResponse.text,
      model: aiResponse.model,
      usage: aiResponse.usage,
      cost: aiResponse.cost,
      latency: Date.now() - startTime,
      ragContext,
    };
  }

  /**
   * Stream message response
   */
  async streamMessage(
    data: SendMessageData,
    callbacks?: {
      onChunk?: (chunk: string) => void;
      onComplete?: (response: ChatResponse) => void;
    },
  ) {
    // Similar to sendMessage but with streaming
    // Implementation would use aiGateway.stream()
    throw new Error("Streaming not yet implemented");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Analytics
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get agent analytics
   */
  async getAnalytics(
    tenantId: string,
    agentId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const results = await db.execute(sql`
      SELECT 
        DATE(c.started_at) as date,
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        COUNT(DISTINCT c.customer_id) as total_users,
        AVG(c.avg_response_time_ms)::INTEGER as avg_response_time_ms,
        COALESCE(SUM(c.total_tokens), 0)::BIGINT as total_tokens,
        COALESCE(SUM(c.total_cost), 0)::NUMERIC as total_cost_usd,
        AVG(c.rating)::NUMERIC as avg_rating,
        (COUNT(*) FILTER (WHERE c.status = 'closed'))::NUMERIC / NULLIF(COUNT(*), 0) as resolution_rate,
        (COUNT(*) FILTER (WHERE c.status = 'escalated'))::NUMERIC / NULLIF(COUNT(*), 0) as escalation_rate
      FROM ai_conversations c
      LEFT JOIN ai_messages m ON m.conversation_id = c.id
      WHERE c.tenant_id = ${tenantId}
        ${agentId ? sql`AND c.agent_id = ${agentId}` : sql``}
        ${startDate ? sql`AND c.started_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND c.started_at <= ${endDate}` : sql``}
      GROUP BY DATE(c.started_at)
      ORDER BY date DESC
    `);

    return (results as any) || [];
  }

  /**
   * Get conversation stats
   */
  async getConversationStats(tenantId: string, agentId: string) {
    const results = await db
      .select({
        totalConversations: sql<number>`COUNT(*)`,
        activeConversations: sql<number>`COUNT(*) FILTER (WHERE status = 'active')`,
        closedConversations: sql<number>`COUNT(*) FILTER (WHERE status = 'closed')`,
        escalatedConversations: sql<number>`COUNT(*) FILTER (WHERE status = 'escalated')`,
        avgRating: sql<number>`AVG(rating)`,
        totalMessages: sql<number>`SUM(message_count)`,
      })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.tenantId, tenantId),
          eq(aiConversations.agentId, agentId),
        ),
      );

    return results[0];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private async saveMessage(data: {
    conversationId: string;
    tenantId: string;
    role: string;
    content: string;
    messageType?: string;
    modelUsed?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    costUsd?: number;
    latencyMs?: number;
    ragContext?: string[];
  }): Promise<string> {
    const [result] = await db
      .insert(aiMessages)
      .values({
        conversationId: data.conversationId,
        tenantId: data.tenantId,
        role: data.role,
        content: data.content,
        messageType: data.messageType || "text",
        modelUsed: data.modelUsed,
        promptTokens: data.promptTokens || 0,
        completionTokens: data.completionTokens || 0,
        totalTokens: data.totalTokens || 0,
        costUsd: data.costUsd || 0,
        latencyMs: data.latencyMs || 0,
        ragContext: data.ragContext || [],
      } as any)
      .returning();

    return result.id;
  }

  private async updateConversationStats(
    conversationId: string,
    stats: {
      messageCount?: number;
      totalTokens?: number;
      totalCost?: number;
      avgResponseTimeMs?: number;
    },
  ) {
    await db
      .update(aiConversations)
      .set({
        messageCount: sql`${aiConversations.messageCount} + ${stats.messageCount || 0}`,
        totalTokens: sql`${aiConversations.totalTokens} + ${stats.totalTokens || 0}`,
        totalCost: sql`${aiConversations.totalCost} + ${stats.totalCost || 0}`,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, conversationId));
  }

  private getDefaultSystemPrompt(agentType: string): string {
    const prompts: Record<string, string> = {
      support: `أنت مساعد دعم فني محترف لمنصة SaaS.
- تحدث باللهجة السعودية المهذبة
- كن مختصراً ومفيداً
- استخدم المصطلحات التقنية بالعربي
- إذا لم تجد الإجابة، اعتذر بلباقة`,

      sales: `أنت مساعد مبيعات محترف.
- كن ودوداً ومقنعاً
- اذكر الميزات والفوائد
- جاوب على الأسئلة بوضوح
- اقترح المنتجات المناسبة`,

      hr: `أنت مساعد موارد بشرية محترف.
- تحدث بأسلوب رسمي ومهذب
- احافظ على السرية
- قدم معلومات دقيقة
- وجه للموظف المختص عند الحاجة`,
    };

    return prompts[agentType] || prompts.support;
  }
}

// Export singleton instance
export const aiAgentService = new AIAgentService();
