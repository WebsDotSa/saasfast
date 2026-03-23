// ═══════════════════════════════════════════════════════════════════════════════
// AI Analytics API — إحصاءات وتحليلات الذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/ai/analytics — Get analytics data
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db, aiAgents, aiConversations, aiMessages, aiKnowledgeBase } from '@/lib/db';
import { eq, and, sql, desc } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// GET — Get AI analytics
// ───────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenantId = (session.user as any).tenant_id;
    const agentId = searchParams.get('agentId');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Overall Stats
    const overallStats = await getOverallStats(tenantId, agentId, startDate);

    // 2. Daily Stats (last N days)
    const dailyStats = await getDailyStats(tenantId, agentId, startDate);

    // 3. Top Agents
    const topAgents = await getTopAgents(tenantId, startDate);

    // 4. Knowledge Base Stats
    const knowledgeStats = await getKnowledgeStats(tenantId);

    // 5. Recent Conversations
    const recentConversations = await getRecentConversations(tenantId, agentId);

    return NextResponse.json({
      overall: overallStats,
      daily: dailyStats,
      topAgents,
      knowledge: knowledgeStats,
      recentConversations,
    });

  } catch (error) {
    console.error('[AI Analytics API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

async function getOverallStats(
  tenantId: string,
  agentId: string | null,
  startDate: Date
) {
  const conditions = [
    eq(aiConversations.tenantId, tenantId),
    sql`${aiConversations.startedAt} >= ${startDate}`,
  ];

  if (agentId) {
    conditions.push(eq(aiConversations.agentId, agentId));
  }

  let whereClause: any = conditions[0];
  for (let i = 1; i < conditions.length; i++) {
    whereClause = and(whereClause, conditions[i]);
  }

  const [stats] = await db.select({
    totalConversations: sql<number>`COUNT(DISTINCT ${aiConversations.id})`,
    activeConversations: sql<number>`COUNT(DISTINCT ${aiConversations.id}) FILTER (WHERE ${aiConversations.status} = 'active')`,
    closedConversations: sql<number>`COUNT(DISTINCT ${aiConversations.id}) FILTER (WHERE ${aiConversations.status} = 'closed')`,
    escalatedConversations: sql<number>`COUNT(DISTINCT ${aiConversations.id}) FILTER (WHERE ${aiConversations.status} = 'escalated')`,
    totalMessages: sql<number>`COUNT(${aiMessages.id})`,
    totalUsers: sql<number>`COUNT(DISTINCT ${aiConversations.customerId})`,
    avgRating: sql<number>`AVG(${aiConversations.rating})`,
    totalRatings: sql<number>`COUNT(${aiConversations.rating})`,
    avgResponseTime: sql<number>`AVG(${aiConversations.avgResponseTimeMs})`,
  })
    .from(aiConversations)
    .leftJoin(aiMessages, eq(aiMessages.conversationId, aiConversations.id))
    .where(whereClause);

  return {
    totalConversations: stats?.totalConversations || 0,
    activeConversations: stats?.activeConversations || 0,
    closedConversations: stats?.closedConversations || 0,
    escalatedConversations: stats?.escalatedConversations || 0,
    totalMessages: stats?.totalMessages || 0,
    totalUsers: stats?.totalUsers || 0,
    avgRating: Number(stats?.avgRating) || 0,
    totalRatings: stats?.totalRatings || 0,
    avgResponseTime: Math.round(stats?.avgResponseTime || 0),
  };
}

async function getDailyStats(
  tenantId: string,
  agentId: string | null,
  startDate: Date
) {
  const conditions = [
    eq(aiConversations.tenantId, tenantId),
    sql`${aiConversations.startedAt} >= ${startDate}`,
  ];

  if (agentId) {
    conditions.push(eq(aiConversations.agentId, agentId));
  }

  let whereClause: any = conditions[0];
  for (let i = 1; i < conditions.length; i++) {
    whereClause = and(whereClause, conditions[i]);
  }

  const results = await db.execute(sql`
    SELECT
      DATE(${aiConversations.startedAt}) as date,
      COUNT(DISTINCT ${aiConversations.id}) as conversations,
      COUNT(${aiMessages.id}) as messages,
      COUNT(DISTINCT ${aiConversations.customerId}) as users,
      AVG(${aiConversations.rating}) as avg_rating,
      COUNT(DISTINCT ${aiConversations.id}) FILTER (WHERE ${aiConversations.status} = 'closed') as closed
    FROM ${aiConversations}
    LEFT JOIN ${aiMessages} ON ${aiMessages.conversationId} = ${aiConversations.id}
    WHERE ${whereClause}
    GROUP BY DATE(${aiConversations.startedAt})
    ORDER BY date DESC
    LIMIT 30
  `);

  return (results as any).map((row: any) => ({
    date: row.date,
    conversations: Number(row.conversations),
    messages: Number(row.messages),
    users: Number(row.users),
    avgRating: parseFloat(row.avg_rating) || 0,
    closed: Number(row.closed),
  }));
}

async function getTopAgents(
  tenantId: string,
  startDate: Date
) {
  const results = await db.select({
    id: aiAgents.id,
    name: aiAgents.name,
    agentType: aiAgents.agentType,
    totalConversations: sql<number>`COUNT(DISTINCT ${aiConversations.id})`,
    totalMessages: sql<number>`COUNT(${aiMessages.id})`,
    avgRating: sql<number>`AVG(${aiConversations.rating})`,
  })
    .from(aiAgents)
    .leftJoin(aiConversations, and(
      eq(aiConversations.agentId, aiAgents.id),
      sql`${aiConversations.startedAt} >= ${startDate}`
    ))
    .leftJoin(aiMessages, eq(aiMessages.conversationId, aiConversations.id))
    .where(eq(aiAgents.tenantId, tenantId))
    .groupBy(aiAgents.id, aiAgents.name, aiAgents.agentType)
    .orderBy(desc(sql`COUNT(DISTINCT ${aiConversations.id})`))
    .limit(10);

  return results.map(row => ({
    id: row.id,
    name: row.name,
    agentType: row.agentType,
    totalConversations: row.totalConversations,
    totalMessages: row.totalMessages,
    avgRating: Number(row.avgRating) || 0,
  }));
}

async function getKnowledgeStats(tenantId: string) {
  const [stats] = await db.select({
    totalDocuments: sql<number>`COUNT(*)`,
    totalUsage: sql<number>`SUM(${aiKnowledgeBase.usageCount})`,
    totalHelpful: sql<number>`SUM(${aiKnowledgeBase.helpfulCount})`,
    totalNotHelpful: sql<number>`SUM(${aiKnowledgeBase.notHelpfulCount})`,
  })
    .from(aiKnowledgeBase)
    .where(eq(aiKnowledgeBase.tenantId, tenantId));

  return {
    totalDocuments: stats?.totalDocuments || 0,
    totalUsage: stats?.totalUsage || 0,
    totalHelpful: stats?.totalHelpful || 0,
    totalNotHelpful: stats?.totalNotHelpful || 0,
    helpfulRate: stats?.totalHelpful && stats?.totalHelpful > 0
      ? Math.round((stats.totalHelpful / (stats.totalHelpful + stats.totalNotHelpful)) * 100)
      : 0,
  };
}

async function getRecentConversations(
  tenantId: string,
  agentId: string | null
) {
  const conditions = [eq(aiConversations.tenantId, tenantId)];

  if (agentId) {
    conditions.push(eq(aiConversations.agentId, agentId));
  }

  let whereClause: any = conditions[0];
  for (let i = 1; i < conditions.length; i++) {
    whereClause = and(whereClause, conditions[i]);
  }

  const conversations = await db.select({
    id: aiConversations.id,
    agentId: aiConversations.agentId,
    customerName: aiConversations.customerName,
    customerEmail: aiConversations.customerEmail,
    channel: aiConversations.channel,
    status: aiConversations.status,
    messageCount: aiConversations.messageCount,
    rating: aiConversations.rating,
    startedAt: aiConversations.startedAt,
    lastMessageAt: aiConversations.lastMessageAt,
    agentName: aiAgents.name,
  })
    .from(aiConversations)
    .leftJoin(aiAgents, eq(aiAgents.id, aiConversations.agentId))
    .where(whereClause)
    .orderBy(desc(aiConversations.lastMessageAt))
    .limit(10);

  return conversations.map(c => ({
    id: c.id,
    agentId: c.agentId,
    agentName: c.agentName,
    customerName: c.customerName,
    customerEmail: c.customerEmail,
    channel: c.channel,
    status: c.status,
    messageCount: c.messageCount,
    rating: c.rating,
    startedAt: c.startedAt,
    lastMessageAt: c.lastMessageAt,
  }));
}
