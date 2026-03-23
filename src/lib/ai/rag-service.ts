// ═══════════════════════════════════════════════════════════════════════════════
// RAG Service — Retrieval-Augmented Generation
// ═══════════════════════════════════════════════════════════════════════════════
// Service for searching and retrieving knowledge base documents using vectors
// ═══════════════════════════════════════════════════════════════════════════════

import { db, aiKnowledgeBase, type AIKnowledgeBase } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export interface RAGSearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  category: string | null;
  tags: string[];
  usageCount: number;
}

export interface RAGContext {
  documents: RAGSearchResult[];
  formattedContext: string;
  totalTokens: number;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// RAG Service Class
// ───────────────────────────────────────────────────────────────────────────────

class RAGService {
  private embeddingModel: string = 'text-embedding-3-large';
  private defaultDimensions: number = 1536;
  private defaultLimit: number = 5;
  private defaultSimilarityThreshold: number = 0.6;

  /**
   * Search knowledge base using vector similarity
   */
  async searchKnowledge(
    tenantId: string,
    query: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
      categories?: string[];
      language?: string;
    }
  ): Promise<RAGSearchResult[]> {
    const {
      limit = this.defaultLimit,
      similarityThreshold = this.defaultSimilarityThreshold,
      categories,
      language = 'ar',
    } = options || {};

    try {
      // 1. Generate embedding for query
      const embedding = await this.generateEmbedding(query);
      
      // 2. Convert to string format for PostgreSQL
      const embeddingString = `[${embedding.join(',')}]`;
      
      // 3. Search using SQL function
      const results = await db.execute(sql`
        SELECT 
          kb.id,
          kb.title,
          kb.content,
          1 - (kb.embedding <=> ${embeddingString}::vector) AS similarity,
          kb.category,
          kb.tags,
          kb.usage_count
        FROM ai_knowledge_base kb
        WHERE kb.tenant_id = ${tenantId}
          AND kb.is_active = true
          AND kb.processing_status = 'completed'
          ${categories ? sql`AND kb.category = ANY(${categories})` : sql``}
          AND 1 - (kb.embedding <=> ${embeddingString}::vector) >= ${similarityThreshold}
        ORDER BY kb.embedding <=> ${embeddingString}::vector
        LIMIT ${limit}
      `);

      return ((results as any) || []).map((row: any) => ({
        id: row.id as string,
        title: row.title as string,
        content: row.content as string,
        similarity: Number(row.similarity),
        category: row.category as string | null,
        tags: (row.tags as string[]) || [],
        usageCount: Number(row.usage_count) || 0,
      }));
      
    } catch (error) {
      console.error('[RAG Service] Search error:', error);
      return [];
    }
  }

  /**
   * Get formatted context for AI prompt
   */
  async getContextForPrompt(
    tenantId: string,
    query: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
      maxTokens?: number;
    }
  ): Promise<RAGContext> {
    const results = await this.searchKnowledge(tenantId, query, options);
    
    // Format documents into context string
    const formattedContext = results
      .map(doc => `Source: ${doc.title}\nContent: ${doc.content}`)
      .join('\n\n');
    
    // Estimate total tokens
    const totalTokens = this.estimateTokens(formattedContext);
    
    return {
      documents: results,
      formattedContext,
      totalTokens,
    };
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const embeddingModel = model || this.embeddingModel;
    
    try {
      // Using OpenAI embeddings (most common)
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
      
    } catch (error) {
      console.error('[RAG Service] Embedding generation error:', error);
      // Return zero vector as fallback
      return new Array(this.defaultDimensions).fill(0);
    }
  }

  /**
   * Store document with embedding
   */
  async storeDocument(data: {
    tenantId: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    language?: string;
    knowledgeType?: string;
  }): Promise<string> {
    const {
      tenantId,
      title,
      content,
      category,
      tags = [],
      language = 'ar',
      knowledgeType = 'document',
    } = data;

    try {
      // 1. Generate embedding
      const embedding = await this.generateEmbedding(content);
      
      // 2. Create content hash
      const contentHash = await this.hashContent(content);
      
      // 3. Insert into database
      const [result] = await db.insert(aiKnowledgeBase).values({
        tenantId,
        title,
        content,
        contentHash,
        embedding: embedding as any,
        category,
        tags: tags as any,
        language,
        knowledgeType,
        processingStatus: 'completed',
        isActive: true,
      } as any).returning();

      return result.id;
      
    } catch (error) {
      console.error('[RAG Service] Store document error:', error);
      throw error;
    }
  }

  /**
   * Store document with chunking (for long documents)
   */
  async storeDocumentWithChunking(data: {
    tenantId: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    language?: string;
    chunkSize?: number;
    chunkOverlap?: number;
  }): Promise<string[]> {
    const {
      tenantId,
      title,
      content,
      category,
      tags = [],
      language = 'ar',
      chunkSize = 1000,
      chunkOverlap = 200,
    } = data;

    // 1. Split content into chunks
    const chunks = this.splitIntoChunks(content, chunkSize, chunkOverlap);
    const documentIds: string[] = [];

    // 2. Store each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const chunkTitle = `${title} (Part ${i + 1}/${chunks.length})`;
      
      const id = await this.storeDocument({
        tenantId,
        title: chunkTitle,
        content: chunk,
        category,
        tags,
        language,
        knowledgeType: 'chunk',
      });

      documentIds.push(id);
    }

    return documentIds;
  }

  /**
   * Update document usage statistics
   */
  async updateUsageStats(
    documentId: string,
    wasHelpful: boolean
  ): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE ai_knowledge_base
        SET 
          usage_count = usage_count + 1,
          helpful_count = helpful_count + ${wasHelpful ? 1 : 0},
          not_helpful_count = not_helpful_count + ${wasHelpful ? 0 : 1},
          updated_at = NOW()
        WHERE id = ${documentId}
      `);
    } catch (error) {
      console.error('[RAG Service] Update usage stats error:', error);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(
    tenantId: string,
    documentId: string
  ): Promise<boolean> {
    try {
      await db.delete(aiKnowledgeBase)
        .where(
          and(
            eq(aiKnowledgeBase.id, documentId),
            eq(aiKnowledgeBase.tenantId, tenantId)
          )
        );
      return true;
    } catch (error) {
      console.error('[RAG Service] Delete document error:', error);
      return false;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(
    tenantId: string,
    documentId: string
  ): Promise<AIKnowledgeBase | null> {
    try {
      const results = await db.select()
        .from(aiKnowledgeBase)
        .where(
          and(
            eq(aiKnowledgeBase.id, documentId),
            eq(aiKnowledgeBase.tenantId, tenantId)
          )
        )
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('[RAG Service] Get document error:', error);
      return null;
    }
  }

  /**
   * List documents
   */
  async listDocuments(
    tenantId: string,
    options?: {
      category?: string;
      language?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AIKnowledgeBase[]> {
    try {
      const { category, language, limit = 50, offset = 0 } = options || {};

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

      return await db.select()
        .from(aiKnowledgeBase)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${aiKnowledgeBase.createdAt} DESC`);
        
    } catch (error) {
      console.error('[RAG Service] List documents error:', error);
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Split text into chunks
   */
  private splitIntoChunks(
    text: string,
    chunkSize: number,
    chunkOverlap: number
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at sentence boundary
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > chunkSize * 0.5) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start = end - chunkOverlap;
    }

    return chunks;
  }

  /**
   * Hash content for deduplication
   */
  private async hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Estimate tokens in text
   */
  private estimateTokens(text: string): number {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const otherChars = text.length - arabicChars;
    return Math.round((arabicChars / 1.5) + (otherChars / 4));
  }

  /**
   * Calculate similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Export singleton instance
export const ragService = new RAGService();
