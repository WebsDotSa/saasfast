// ═══════════════════════════════════════════════════════════════════════════════
// AI Knowledge Base API — إدارة قاعدة المعرفة
// ═══════════════════════════════════════════════════════════════════════════════
// GET    /api/ai/knowledge — List documents
// POST   /api/ai/knowledge — Add document
// DELETE /api/ai/knowledge — Delete document
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db, aiKnowledgeBase } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ragService } from '@/lib/ai/rag-service';

// ───────────────────────────────────────────────────────────────────────────────
// GET — List knowledge base documents
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
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [eq(aiKnowledgeBase.tenantId, tenantId)];
    
    if (category) {
      conditions.push(eq(aiKnowledgeBase.category, category));
    }
    
    if (language) {
      conditions.push(eq(aiKnowledgeBase.language, language));
    }

    let whereClause: any = conditions[0];
    for (let i = 1; i < conditions.length; i++) {
      whereClause = and(whereClause, conditions[i]);
    }

    const documents = await db.select()
      .from(aiKnowledgeBase)
      .where(whereClause)
      .orderBy(desc(aiKnowledgeBase.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.select({ count: sql<number>`COUNT(*)` })
      .from(aiKnowledgeBase)
      .where(whereClause);

    return NextResponse.json({
      documents,
      pagination: {
        total: total[0].count,
        limit,
        offset,
        hasMore: offset + limit < total[0].count,
      },
    });

  } catch (error) {
    console.error('[AI Knowledge API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST — Add document to knowledge base
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      content,
      category,
      tags = [],
      language = 'ar',
      knowledgeType = 'document',
      useChunking = false,
      chunkSize = 1000,
      chunkOverlap = 200,
    } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const tenantId = (session.user as any).tenant_id;

    // Store document with or without chunking
    let documentIds: string[] = [];

    if (useChunking) {
      documentIds = await ragService.storeDocumentWithChunking({
        tenantId,
        title,
        content,
        category,
        tags,
        language,
        chunkSize,
        chunkOverlap,
      });
    } else {
      const id = await ragService.storeDocument({
        tenantId,
        title,
        content,
        category,
        tags,
        language,
        knowledgeType,
      });
      documentIds = [id];
    }

    // Get created documents
    const documents = await db.select()
      .from(aiKnowledgeBase)
      .where(
        and(
          eq(aiKnowledgeBase.tenantId, tenantId),
          sql`${aiKnowledgeBase.id} = ANY(${documentIds})`
        )
      );

    return NextResponse.json({
      documents,
      message: 'Document(s) added successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('[AI Knowledge API] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE — Delete document
// ───────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    const tenantId = (session.user as any).tenant_id;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    const deleted = await ragService.deleteDocument(tenantId, documentId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('[AI Knowledge API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
