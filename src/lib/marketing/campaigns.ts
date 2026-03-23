// ═══════════════════════════════════════════════════════════════════════════════
// Marketing Module - Campaigns Engine
// ═══════════════════════════════════════════════════════════════════════════════
// نظام الحملات التسويقية متعددة القنوات - SMS، WhatsApp، Email
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import {
  marketingCampaigns,
  campaignRecipients,
  campaignClicks,
  emailTemplates,
  smsTemplates,
} from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, desc, inArray } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export type CampaignChannel = 'sms' | 'whatsapp' | 'email' | 'push' | 'all';
export type CampaignGoal = 'promotion' | 'retention' | 're_engagement' | 'welcome' | 'abandoned_cart' | 'post_purchase';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface Campaign {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  channel: CampaignChannel;
  goal?: CampaignGoal;
  status: CampaignStatus;
  audienceFilter: Record<string, any>;
  messageAr: string;
  messageEn?: string;
  subjectLine?: string;
  senderName?: string;
  templateId?: string;
  templateVars?: Record<string, any>;
  scheduledAt?: Date;
  timezone?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  revenueGenerated: number;
  totalCost: number;
  costPerMessage: number;
  isAbTest: boolean;
  abTestVariant?: string;
  abTestWinner?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateCampaignInput {
  tenantId: string;
  title: string;
  description?: string;
  channel: CampaignChannel;
  goal?: CampaignGoal;
  status?: CampaignStatus;
  audienceFilter?: Record<string, any>;
  messageAr: string;
  messageEn?: string;
  subjectLine?: string;
  senderName?: string;
  templateId?: string;
  templateVars?: Record<string, any>;
  scheduledAt?: Date;
  timezone?: string;
  isAbTest?: boolean;
  metadata?: Record<string, any>;
}

export interface CampaignAnalytics {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  revenueGenerated: number;
  totalCost: number;
  roi: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// Campaign CRUD Operations
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create a new campaign
 */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  try {
    const [campaign] = await db.insert(marketingCampaigns).values({
      tenantId: input.tenantId,
      title: input.title,
      description: input.description,
      channel: input.channel,
      goal: input.goal,
      status: input.status || 'draft',
      audienceFilter: input.audienceFilter || {},
      messageAr: input.messageAr,
      messageEn: input.messageEn,
      subjectLine: input.subjectLine,
      senderName: input.senderName,
      templateId: input.templateId,
      templateVars: input.templateVars,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone || 'Asia/Riyadh',
      isAbTest: input.isAbTest || false,
      metadata: input.metadata || {},
    }).returning();

    return campaign as unknown as Campaign;

  } catch (error) {
    console.error('[Campaigns] Error creating campaign:', error);
    throw new Error('فشل إنشاء الحملة');
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: string, tenantId: string): Promise<Campaign | null> {
  try {
    const campaign = await db.query.marketingCampaigns.findFirst({
      where: and(
        eq(marketingCampaigns.id, id),
        eq(marketingCampaigns.tenantId, tenantId),
        isNull(marketingCampaigns.deletedAt)
      ),
    });

    return campaign as unknown as Campaign | null;

  } catch (error) {
    console.error('[Campaigns] Error getting campaign:', error);
    return null;
  }
}

/**
 * List all campaigns for a tenant
 */
export async function listCampaigns(
  tenantId: string,
  options?: {
    status?: CampaignStatus;
    channel?: CampaignChannel;
    limit?: number;
    offset?: number;
  }
): Promise<{ campaigns: Campaign[]; total: number }> {
  try {
    const conditions = [
      eq(marketingCampaigns.tenantId, tenantId),
      isNull(marketingCampaigns.deletedAt),
    ];

    if (options?.status) {
      conditions.push(eq(marketingCampaigns.status, options.status));
    }

    if (options?.channel) {
      conditions.push(eq(marketingCampaigns.channel, options.channel));
    }

    const [campaignList, totalResult] = await Promise.all([
      db.query.marketingCampaigns.findMany({
        where: and(...conditions),
        orderBy: [desc(marketingCampaigns.createdAt)],
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      }),
      db.select({ count: marketingCampaigns.id }).from(marketingCampaigns).where(and(...conditions)),
    ]);

    return {
      campaigns: campaignList as unknown as Campaign[],
      total: totalResult.length,
    };

  } catch (error) {
    console.error('[Campaigns] Error listing campaigns:', error);
    return { campaigns: [], total: 0 };
  }
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  id: string,
  tenantId: string,
  input: Partial<CreateCampaignInput>
): Promise<Campaign | null> {
  try {
    const [campaign] = await db.update(marketingCampaigns)
      .set({
        title: input.title,
        description: input.description,
        channel: input.channel,
        goal: input.goal,
        status: input.status,
        audienceFilter: input.audienceFilter,
        messageAr: input.messageAr,
        messageEn: input.messageEn,
        subjectLine: input.subjectLine,
        senderName: input.senderName,
        templateId: input.templateId,
        templateVars: input.templateVars,
        scheduledAt: input.scheduledAt,
        timezone: input.timezone,
        isAbTest: input.isAbTest,
        metadata: input.metadata,
        updatedAt: new Date(),
      })
      .where(and(
        eq(marketingCampaigns.id, id),
        eq(marketingCampaigns.tenantId, tenantId),
        isNull(marketingCampaigns.deletedAt)
      ))
      .returning();

    return campaign as unknown as Campaign | null;

  } catch (error) {
    console.error('[Campaigns] Error updating campaign:', error);
    return null;
  }
}

/**
 * Delete a campaign (soft delete)
 */
export async function deleteCampaign(id: string, tenantId: string): Promise<boolean> {
  try {
    await db.update(marketingCampaigns)
      .set({
        deletedAt: new Date(),
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(marketingCampaigns.id, id),
        eq(marketingCampaigns.tenantId, tenantId)
      ));

    return true;

  } catch (error) {
    console.error('[Campaigns] Error deleting campaign:', error);
    return false;
  }
}

/**
 * Schedule a campaign
 */
export async function scheduleCampaign(
  id: string,
  tenantId: string,
  scheduledAt: Date
): Promise<Campaign | null> {
  return updateCampaign(id, tenantId, {
    status: 'scheduled',
    scheduledAt,
  });
}

/**
 * Send a campaign immediately
 */
export async function sendCampaign(id: string, tenantId: string): Promise<Campaign | null> {
  return updateCampaign(id, tenantId, {
    status: 'running',
  });
}

/**
 * Pause a running campaign
 */
export async function pauseCampaign(id: string, tenantId: string): Promise<Campaign | null> {
  return updateCampaign(id, tenantId, {
    status: 'paused',
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Campaign Analytics
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  try {
    const campaign = await getCampaignById(campaignId, '');
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const {
      totalRecipients,
      sentCount,
      deliveredCount,
      openedCount,
      clickedCount,
      convertedCount,
      bouncedCount,
      unsubscribedCount,
      revenueGenerated,
      totalCost,
    } = campaign;

    const openRate = sentCount > 0 ? (openedCount / sentCount) * 100 : 0;
    const clickRate = sentCount > 0 ? (clickedCount / sentCount) * 100 : 0;
    const conversionRate = sentCount > 0 ? (convertedCount / sentCount) * 100 : 0;
    const bounceRate = sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0;
    const unsubscribeRate = sentCount > 0 ? (unsubscribedCount / sentCount) * 100 : 0;
    const roi = totalCost > 0 ? ((revenueGenerated - totalCost) / totalCost) * 100 : 0;

    return {
      totalRecipients,
      sentCount,
      deliveredCount,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
      revenueGenerated,
      totalCost,
      roi: Math.round(roi * 100) / 100,
    };

  } catch (error) {
    console.error('[Campaigns] Error getting campaign analytics:', error);
    return {
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
      revenueGenerated: 0,
      totalCost: 0,
      roi: 0,
    };
  }
}

/**
 * Update campaign statistics
 */
export async function updateCampaignStats(
  campaignId: string,
  stats: {
    sentCount?: number;
    deliveredCount?: number;
    openedCount?: number;
    clickedCount?: number;
    convertedCount?: number;
    bouncedCount?: number;
    unsubscribedCount?: number;
    revenueGenerated?: number;
    totalCost?: number;
  }
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (stats.sentCount !== undefined) updateData.sentCount = stats.sentCount;
    if (stats.deliveredCount !== undefined) updateData.deliveredCount = stats.deliveredCount;
    if (stats.openedCount !== undefined) updateData.openedCount = stats.openedCount;
    if (stats.clickedCount !== undefined) updateData.clickedCount = stats.clickedCount;
    if (stats.convertedCount !== undefined) updateData.convertedCount = stats.convertedCount;
    if (stats.bouncedCount !== undefined) updateData.bouncedCount = stats.bouncedCount;
    if (stats.unsubscribedCount !== undefined) updateData.unsubscribedCount = stats.unsubscribedCount;
    if (stats.revenueGenerated !== undefined) updateData.revenueGenerated = stats.revenueGenerated;
    if (stats.totalCost !== undefined) updateData.totalCost = stats.totalCost;

    await db.update(marketingCampaigns)
      .set(updateData)
      .where(eq(marketingCampaigns.id, campaignId));

  } catch (error) {
    console.error('[Campaigns] Error updating campaign stats:', error);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Audience Filtering
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get filtered customers based on audience filter
 */
export async function getFilteredCustomers(
  tenantId: string,
  audienceFilter: Record<string, any>
): Promise<Array<{
  id: string;
  email?: string;
  phone?: string;
  name?: string;
}>> {
  try {
    // This would typically query your customers table
    // For now, return empty array - implement based on your customer data structure
    
    const {
      segment,
      lastPurchaseDays,
      minOrders,
      minSpent,
      maxSpent,
      categories,
      regions,
      customerIds,
      excludeCustomerIds,
    } = audienceFilter;

    // Build query based on filters
    // This is a placeholder - implement based on your actual customer table structure
    
    return [];

  } catch (error) {
    console.error('[Campaigns] Error getting filtered customers:', error);
    return [];
  }
}

/**
 * Count filtered customers
 */
export async function countFilteredCustomers(
  tenantId: string,
  audienceFilter: Record<string, any>
): Promise<number> {
  const customers = await getFilteredCustomers(tenantId, audienceFilter);
  return customers.length;
}

// ───────────────────────────────────────────────────────────────────────────────
// Email Templates
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create email template
 */
export async function createEmailTemplate(input: {
  tenantId?: string;
  name: string;
  description?: string;
  templateType: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  variables?: any[];
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}): Promise<any> {
  try {
    const [template] = await db.insert(emailTemplates).values({
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      templateType: input.templateType,
      subject: input.subject,
      previewText: input.previewText,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
      variables: input.variables,
      category: input.category,
      tags: input.tags,
      isPublic: input.isPublic ?? false,
      isActive: true,
    }).returning();

    return template;

  } catch (error) {
    console.error('[Campaigns] Error creating email template:', error);
    return null;
  }
}

/**
 * List email templates
 */
export async function listEmailTemplates(
  tenantId?: string,
  options?: {
    templateType?: string;
    isActive?: boolean;
  }
): Promise<any[]> {
  try {
    const conditions = [];
    
    if (tenantId) {
      conditions.push(
        or(
          eq(emailTemplates.tenantId, tenantId),
          isNull(emailTemplates.tenantId)
        )
      );
    }

    if (options?.templateType) {
      conditions.push(eq(emailTemplates.templateType, options.templateType));
    }

    if (options?.isActive !== undefined) {
      conditions.push(eq(emailTemplates.isActive, options.isActive));
    }

    const templates = await db.query.emailTemplates.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(emailTemplates.createdAt)],
    });

    return templates;

  } catch (error) {
    console.error('[Campaigns] Error listing email templates:', error);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// SMS Templates
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create SMS template
 */
export async function createSmsTemplate(input: {
  tenantId?: string;
  name: string;
  description?: string;
  content: string;
  variables?: any[];
}): Promise<any> {
  try {
    const [template] = await db.insert(smsTemplates).values({
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      content: input.content,
      variables: input.variables,
      isActive: true,
    }).returning();

    return template;

  } catch (error) {
    console.error('[Campaigns] Error creating SMS template:', error);
    return null;
  }
}

/**
 * List SMS templates
 */
export async function listSmsTemplates(tenantId?: string): Promise<any[]> {
  try {
    const conditions = [];
    
    if (tenantId) {
      conditions.push(
        or(
          eq(smsTemplates.tenantId, tenantId),
          isNull(smsTemplates.tenantId)
        )
      );
    }

    const templates = await db.query.smsTemplates.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(smsTemplates.createdAt)],
    });

    return templates;

  } catch (error) {
    console.error('[Campaigns] Error listing SMS templates:', error);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Campaign Recipients
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Add recipients to campaign
 */
export async function addCampaignRecipients(
  campaignId: string,
  tenantId: string,
  recipients: Array<{
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerName?: string;
  }>
): Promise<number> {
  try {
    const values = recipients.map(r => ({
      tenantId,
      campaignId,
      customerId: r.customerId,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      customerName: r.customerName,
      status: 'pending' as const,
    }));

    await db.insert(campaignRecipients).values(values);

    // Update total recipients count
    await db.update(marketingCampaigns)
      .set({
        totalRecipients: recipients.length,
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, campaignId));

    return recipients.length;

  } catch (error) {
    console.error('[Campaigns] Error adding campaign recipients:', error);
    return 0;
  }
}

/**
 * Update recipient status
 */
export async function updateRecipientStatus(
  recipientId: string,
  status: string,
  extraData?: Record<string, any>
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      status,
    };

    if (status === 'sent') updateData.sentAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();
    if (status === 'opened') updateData.openedAt = new Date();
    if (status === 'clicked') updateData.clickedAt = new Date();
    if (status === 'converted') updateData.convertedAt = new Date();

    if (extraData) {
      updateData.metadata = extraData;
    }

    await db.update(campaignRecipients)
      .set(updateData)
      .where(eq(campaignRecipients.id, recipientId));

  } catch (error) {
    console.error('[Campaigns] Error updating recipient status:', error);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Campaign Clicks Tracking
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Track campaign click
 */
export async function trackCampaignClick(
  campaignId: string,
  tenantId: string,
  data: {
    recipientId?: string;
    url: string;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
  }
): Promise<void> {
  try {
    await db.insert(campaignClicks).values({
      tenantId,
      campaignId,
      recipientId: data.recipientId,
      url: data.url,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceType: data.deviceType,
      browser: data.browser,
      os: data.os,
      country: data.country,
      city: data.city,
      clickedAt: new Date(),
    });

    // Update campaign click count
    const campaign = await getCampaignById(campaignId, tenantId);
    if (campaign) {
      await updateCampaignStats(campaignId, {
        clickedCount: (campaign.clickedCount || 0) + 1,
      });
    }

  } catch (error) {
    console.error('[Campaigns] Error tracking campaign click:', error);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

import { or } from 'drizzle-orm';

/**
 * Get campaign status label
 */
export function getCampaignStatus(status: CampaignStatus): string {
  const labels: Record<CampaignStatus, string> = {
    draft: 'مسودة',
    scheduled: 'مجدولة',
    running: 'جارية',
    paused: 'متوقفة',
    completed: 'مكتملة',
    failed: 'فشلت',
    cancelled: 'ملغاة',
  };
  return labels[status] || status;
}

/**
 * Get channel label
 */
export function getChannelLabel(channel: CampaignChannel): string {
  const labels: Record<CampaignChannel, string> = {
    sms: 'SMS',
    whatsapp: 'واتساب',
    email: 'إيميل',
    push: 'إشعارات',
    all: 'الجميع',
  };
  return labels[channel] || channel;
}

/**
 * Check if campaign is active
 */
export function isCampaignActive(campaign: Campaign): boolean {
  return campaign.status === 'running' || campaign.status === 'scheduled';
}

/**
 * Calculate campaign cost
 */
export function calculateCampaignCost(
  channel: CampaignChannel,
  sentCount: number
): number {
  const costs: Record<CampaignChannel, number> = {
    sms: 0.10, // SAR per SMS
    whatsapp: 0.05, // SAR per WhatsApp message
    email: 0, // Free via Resend (up to 3000/month)
    push: 0, // Free
    all: 0.05, // Average
  };

  return sentCount * (costs[channel] || 0);
}

// ───────────────────────────────────────────────────────────────────────────────
// Export all functions
// ───────────────────────────────────────────────────────────────────────────────

export default {
  // CRUD
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  pauseCampaign,
  
  // Analytics
  getCampaignAnalytics,
  updateCampaignStats,
  
  // Audience
  getFilteredCustomers,
  countFilteredCustomers,
  
  // Templates
  createEmailTemplate,
  listEmailTemplates,
  createSmsTemplate,
  listSmsTemplates,
  
  // Recipients
  addCampaignRecipients,
  updateRecipientStatus,
  
  // Tracking
  trackCampaignClick,
  
  // Helpers
  getCampaignStatus,
  getChannelLabel,
  isCampaignActive,
  calculateCampaignCost,
};
