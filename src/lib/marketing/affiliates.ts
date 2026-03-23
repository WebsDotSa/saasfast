// ═══════════════════════════════════════════════════════════════════════════════
// Marketing Module - Affiliate Marketing Engine
// ═══════════════════════════════════════════════════════════════════════════════
// نظام التسويق بالعمولة - مسوقين، إحالات، وعمولات
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import {
  affiliates,
  affiliateClicks,
  affiliateConversions,
  affiliatePayouts,
  affiliateBanners,
} from '@/lib/db/schema';
import { eq, and, isNull, desc, or, sum } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxNumber?: string;
  country: string;
  referralCode: string;
  referralLink?: string;
  commissionRate: number;
  commissionType: string;
  commissionValue?: number;
  tieredCommission: any[];
  status: string;
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
  payoutMethod?: string;
  payoutDetails: Record<string, any>;
  minPayoutAmount: number;
  adminNotes?: string;
  rejectionReason?: string;
  metadata: Record<string, any>;
  approvedAt?: Date;
  approvedBy?: string;
  lastPayoutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AffiliateClick {
  id: string;
  tenantId: string;
  affiliateId: string;
  visitorId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  landingUrl?: string;
  referringUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  converted: boolean;
  conversionId?: string;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface AffiliateConversion {
  id: string;
  tenantId: string;
  affiliateId: string;
  orderId: string;
  orderAmount: number;
  customerId?: string;
  customerEmail?: string;
  commissionAmount: number;
  commissionRate?: number;
  status: string;
  clickedAt?: Date;
  convertedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  paymentReference?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  refundedAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliatePayout {
  id: string;
  tenantId: string;
  affiliateId: string;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  conversionsCount: number;
  status: string;
  payoutMethod: string;
  paymentReference?: string;
  paymentProof?: string;
  bankDetails?: Record<string, any>;
  notes?: string;
  adminNotes?: string;
  requestedAt?: Date;
  processedAt?: Date;
  processedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────────────────────────────────────────
// Affiliate Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create affiliate
 */
export async function createAffiliate(input: {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  commissionRate?: number;
  commissionType?: string;
  payoutMethod?: string;
}): Promise<Affiliate | null> {
  try {
    // Generate referral code if not provided
    let referralCode = input.referralCode;
    if (!referralCode) {
      referralCode = await generateReferralCode(input.name, input.tenantId);
    }

    // Build referral link (will be updated with actual domain later)
    const referralLink = `https://store.saasfast.com/?ref=${referralCode}`;

    const [affiliate] = await db.insert(affiliates).values({
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      referralCode,
      referralLink,
      commissionRate: input.commissionRate || 10,
      commissionType: input.commissionType || 'percentage',
      status: 'pending',
      payoutMethod: input.payoutMethod,
      payoutDetails: {},
      minPayoutAmount: 100,
    }).returning();

    return affiliate as unknown as Affiliate;

  } catch (error) {
    console.error('[Affiliates] Error creating affiliate:', error);
    return null;
  }
}

/**
 * Get affiliate by ID
 */
export async function getAffiliateById(
  id: string,
  tenantId: string
): Promise<Affiliate | null> {
  try {
    const affiliate = await db.query.affiliates.findFirst({
      where: and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId),
        isNull(affiliates.deletedAt)
      ),
    });

    return affiliate as unknown as Affiliate | null;

  } catch (error) {
    console.error('[Affiliates] Error getting affiliate:', error);
    return null;
  }
}

/**
 * Get affiliate by referral code
 */
export async function getAffiliateByCode(
  code: string,
  tenantId: string
): Promise<Affiliate | null> {
  try {
    const affiliate = await db.query.affiliates.findFirst({
      where: and(
        eq(affiliates.referralCode, code),
        eq(affiliates.tenantId, tenantId),
        eq(affiliates.status, 'active'),
        isNull(affiliates.deletedAt)
      ),
    });

    return affiliate as unknown as Affiliate | null;

  } catch (error) {
    console.error('[Affiliates] Error getting affiliate by code:', error);
    return null;
  }
}

/**
 * List affiliates
 */
export async function listAffiliates(
  tenantId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ affiliates: Affiliate[]; total: number }> {
  try {
    const conditions = [
      eq(affiliates.tenantId, tenantId),
      isNull(affiliates.deletedAt),
    ];

    if (options?.status) {
      conditions.push(eq(affiliates.status, options.status));
    }

    const [affiliateList, total] = await Promise.all([
      db.query.affiliates.findMany({
        where: and(...conditions),
        orderBy: [desc(affiliates.createdAt)],
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      }),
      db.$count(affiliates, and(...conditions)),
    ]);

    return {
      affiliates: affiliateList as unknown as Affiliate[],
      total,
    };

  } catch (error) {
    console.error('[Affiliates] Error listing affiliates:', error);
    return { affiliates: [], total: 0 };
  }
}

/**
 * Update affiliate
 */
export async function updateAffiliate(
  id: string,
  tenantId: string,
  input: Partial<Affiliate>
): Promise<Affiliate | null> {
  try {
    const [affiliate] = await db.update(affiliates)
      .set({
        name: input.name,
        email: input.email,
        phone: input.phone,
        companyName: input.companyName,
        taxNumber: input.taxNumber,
        commissionRate: input.commissionRate,
        commissionType: input.commissionType,
        commissionValue: input.commissionValue,
        tieredCommission: input.tieredCommission,
        status: input.status,
        payoutMethod: input.payoutMethod,
        payoutDetails: input.payoutDetails,
        minPayoutAmount: input.minPayoutAmount,
        adminNotes: input.adminNotes,
        rejectionReason: input.rejectionReason,
        approvedAt: input.approvedAt,
        approvedBy: input.approvedBy,
        updatedAt: new Date(),
      })
      .where(and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId),
        isNull(affiliates.deletedAt)
      ))
      .returning();

    return affiliate as unknown as Affiliate | null;

  } catch (error) {
    console.error('[Affiliates] Error updating affiliate:', error);
    return null;
  }
}

/**
 * Approve affiliate
 */
export async function approveAffiliate(
  id: string,
  tenantId: string,
  approvedBy: string
): Promise<Affiliate | null> {
  return updateAffiliate(id, tenantId, {
    status: 'active',
    approvedAt: new Date(),
    approvedBy,
  });
}

/**
 * Reject affiliate
 */
export async function rejectAffiliate(
  id: string,
  tenantId: string,
  reason: string,
  rejectedBy: string
): Promise<Affiliate | null> {
  return updateAffiliate(id, tenantId, {
    status: 'rejected',
    rejectionReason: reason,
    rejectedAt: new Date(),
    rejectedBy,
  });
}

/**
 * Delete affiliate (soft delete)
 */
export async function deleteAffiliate(
  id: string,
  tenantId: string
): Promise<boolean> {
  try {
    await db.update(affiliates)
      .set({
        deletedAt: new Date(),
        status: 'banned',
        updatedAt: new Date(),
      })
      .where(and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId)
      ));

    return true;

  } catch (error) {
    console.error('[Affiliates] Error deleting affiliate:', error);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Click Tracking
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(
  tenantId: string,
  affiliateId: string,
  data: {
    visitorId?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    city?: string;
    landingUrl?: string;
    referringUrl?: string;
    utmSource?: string;
    utmCampaign?: string;
  }
): Promise<string> {
  try {
    const [click] = await db.insert(affiliateClicks).values({
      tenantId,
      affiliateId,
      visitorId: data.visitorId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceType: data.deviceType,
      browser: data.browser,
      os: data.os,
      country: data.country,
      region: data.region,
      city: data.city,
      landingUrl: data.landingUrl,
      referringUrl: data.referringUrl,
      utmSource: data.utmSource,
      utmCampaign: data.utmCampaign,
      converted: false,
    }).returning();

    // Update affiliate total clicks
    await db.update(affiliates)
      .set({
        totalClicks: affiliates.totalClicks + 1,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId));

    return click.id;

  } catch (error) {
    console.error('[Affiliates] Error tracking click:', error);
    return '';
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Conversion Tracking
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Track affiliate conversion
 */
export async function trackAffiliateConversion(
  tenantId: string,
  affiliateId: string,
  data: {
    orderId: string;
    orderAmount: number;
    customerId?: string;
    customerEmail?: string;
    clickedAt?: Date;
  }
): Promise<{ success: boolean; commission: number; message: string }> {
  try {
    // Get affiliate
    const affiliate = await getAffiliateById(affiliateId, tenantId);
    if (!affiliate) {
      return { success: false, commission: 0, message: 'المسوق غير موجود' };
    }

    if (affiliate.status !== 'active') {
      return { success: false, commission: 0, message: 'المسوق غير نشط' };
    }

    // Calculate commission
    const commission = calculateCommission(
      affiliate.commissionType,
      affiliate.commissionRate,
      affiliate.commissionValue,
      affiliate.tieredCommission,
      data.orderAmount,
      affiliate.totalSales
    );

    // Create conversion
    const [conversion] = await db.insert(affiliateConversions).values({
      tenantId,
      affiliateId,
      orderId: data.orderId,
      orderAmount: data.orderAmount,
      customerId: data.customerId,
      customerEmail: data.customerEmail,
      commissionAmount: commission,
      commissionRate: affiliate.commissionRate,
      status: 'pending',
      clickedAt: data.clickedAt,
    }).returning();

    // Update affiliate stats
    await db.update(affiliates)
      .set({
        totalConversions: affiliates.totalConversions + 1,
        totalSales: affiliates.totalSales + data.orderAmount,
        pendingPayout: affiliates.pendingPayout + commission,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId));

    // Update click as converted
    if (data.clickedAt) {
      await db.update(affiliateClicks)
        .set({
          converted: true,
          conversionId: conversion.id,
        })
        .where(eq(affiliateClicks.id, conversion.id));
    }

    return {
      success: true,
      commission,
      message: `تم تسجيل التحويل بنجاح! العمولة: ${commission} ريال`,
    };

  } catch (error) {
    console.error('[Affiliates] Error tracking conversion:', error);
    return { success: false, commission: 0, message: 'فشل تسجيل التحويل' };
  }
}

/**
 * Calculate commission based on type
 */
export function calculateCommission(
  commissionType: string,
  commissionRate: number,
  commissionValue?: number,
  tieredCommission?: any[],
  orderAmount?: number,
  totalSales?: number
): number {
  if (commissionType === 'fixed') {
    return commissionValue || 0;
  }

  if (commissionType === 'tiered' && tieredCommission && orderAmount) {
    // Find applicable tier
    const applicableTier = tieredCommission
      .filter((tier) => {
        const minSales = tier.min_sales || 0;
        const maxSales = tier.max_sales;
        return totalSales! >= minSales && (!maxSales || totalSales! <= maxSales);
      })
      .sort((a, b) => (b.min_sales || 0) - (a.min_sales || 0))[0];

    if (applicableTier) {
      return orderAmount * (applicableTier.rate / 100);
    }
  }

  // Default: percentage
  return orderAmount ? orderAmount * (commissionRate / 100) : 0;
}

/**
 * Approve conversion
 */
export async function approveConversion(
  conversionId: string,
  tenantId: string,
  approvedBy: string
): Promise<boolean> {
  try {
    const conversion = await db.query.affiliateConversions.findFirst({
      where: eq(affiliateConversions.id, conversionId),
    });

    if (!conversion || conversion.tenantId !== tenantId) {
      return false;
    }

    await db.update(affiliateConversions)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
      })
      .where(eq(affiliateConversions.id, conversionId));

    // Update affiliate pending payout
    await db.update(affiliates)
      .set({
        pendingPayout: affiliates.pendingPayout - conversion.commissionAmount,
        totalEarned: affiliates.totalEarned + conversion.commissionAmount,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, conversion.affiliateId));

    return true;

  } catch (error) {
    console.error('[Affiliates] Error approving conversion:', error);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Payout Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create payout request
 */
export async function createPayoutRequest(
  tenantId: string,
  affiliateId: string
): Promise<AffiliatePayout | null> {
  try {
    const affiliate = await getAffiliateById(affiliateId, tenantId);
    if (!affiliate) {
      return null;
    }

    if (affiliate.pendingPayout < affiliate.minPayoutAmount) {
      throw new Error(`الحد الأدنى للسحب هو ${affiliate.minPayoutAmount} ريال`);
    }

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 1);

    const [payout] = await db.insert(affiliatePayouts).values({
      tenantId,
      affiliateId,
      amount: affiliate.pendingPayout,
      periodStart,
      periodEnd,
      status: 'pending',
      payoutMethod: affiliate.payoutMethod || 'bank_transfer',
      bankDetails: affiliate.payoutDetails,
    }).returning();

    return payout as unknown as AffiliatePayout;

  } catch (error) {
    console.error('[Affiliates] Error creating payout:', error);
    return null;
  }
}

/**
 * List payouts
 */
export async function listPayouts(
  tenantId: string,
  options?: {
    status?: string;
    affiliateId?: string;
  }
): Promise<AffiliatePayout[]> {
  try {
    const conditions = [eq(affiliatePayouts.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(affiliatePayouts.status, options.status));
    }

    if (options?.affiliateId) {
      conditions.push(eq(affiliatePayouts.affiliateId, options.affiliateId));
    }

    const payouts = await db.query.affiliatePayouts.findMany({
      where: and(...conditions),
      orderBy: [desc(affiliatePayouts.createdAt)],
    });

    return payouts as unknown as AffiliatePayout[];

  } catch (error) {
    console.error('[Affiliates] Error listing payouts:', error);
    return [];
  }
}

/**
 * Process payout
 */
export async function processPayout(
  payoutId: string,
  tenantId: string,
  paymentReference: string,
  processedBy: string
): Promise<boolean> {
  try {
    const payout = await db.query.affiliatePayouts.findFirst({
      where: eq(affiliatePayouts.id, payoutId),
    });

    if (!payout || payout.tenantId !== tenantId) {
      return false;
    }

    await db.update(affiliatePayouts)
      .set({
        status: 'completed',
        paymentReference,
        processedAt: new Date(),
        processedBy,
        updatedAt: new Date(),
      })
      .where(eq(affiliatePayouts.id, payoutId));

    // Update affiliate
    await db.update(affiliates)
      .set({
        totalPaid: affiliates.totalPaid + payout.amount,
        lastPayoutAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, payout.affiliateId));

    return true;

  } catch (error) {
    console.error('[Affiliates] Error processing payout:', error);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Banners
// ───────────────────────────────────────────────────────────────────────────────

/**
 * List affiliate banners
 */
export async function listBanners(tenantId: string): Promise<any[]> {
  try {
    const banners = await db.query.affiliateBanners.findMany({
      where: and(
        eq(affiliateBanners.tenantId, tenantId),
        eq(affiliateBanners.isActive, true)
      ),
      orderBy: [desc(affiliateBanners.createdAt)],
    });

    return banners;

  } catch (error) {
    console.error('[Affiliates] Error listing banners:', error);
    return [];
  }
}

/**
 * Create banner
 */
export async function createBanner(input: {
  tenantId: string;
  name: string;
  description?: string;
  bannerType?: string;
  imageUrl?: string;
  textContent?: string;
  linkUrl?: string;
  width?: number;
  height?: number;
}): Promise<any> {
  try {
    const [banner] = await db.insert(affiliateBanners).values({
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      bannerType: input.bannerType || 'image',
      imageUrl: input.imageUrl,
      textContent: input.textContent,
      linkUrl: input.linkUrl,
      width: input.width,
      height: input.height,
      isActive: true,
    }).returning();

    return banner;

  } catch (error) {
    console.error('[Affiliates] Error creating banner:', error);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Generate unique referral code
 */
export async function generateReferralCode(
  name: string,
  tenantId: string
): Promise<string> {
  // Extract letters from name
  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 6);

  // Generate random suffix
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  let code = `${namePart}${randomPart}`;

  // Check uniqueness
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const existing = await db.query.affiliates.findFirst({
      where: and(
        eq(affiliates.referralCode, code),
        eq(affiliates.tenantId, tenantId)
      ),
    });

    if (!existing) {
      exists = false;
    } else {
      code = `${namePart}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      attempts++;
    }
  }

  return code;
}

/**
 * Get affiliate stats
 */
export async function getAffiliateStats(
  affiliateId: string,
  tenantId: string
): Promise<{
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  totalEarned: number;
  conversionRate: number;
  averageOrderValue: number;
}> {
  const affiliate = await getAffiliateById(affiliateId, tenantId);

  if (!affiliate) {
    return {
      totalClicks: 0,
      totalConversions: 0,
      totalSales: 0,
      totalEarned: 0,
      conversionRate: 0,
      averageOrderValue: 0,
    };
  }

  const conversionRate = affiliate.totalClicks > 0
    ? (affiliate.totalConversions / affiliate.totalClicks) * 100
    : 0;

  const averageOrderValue = affiliate.totalConversions > 0
    ? affiliate.totalSales / affiliate.totalConversions
    : 0;

  return {
    totalClicks: affiliate.totalClicks,
    totalConversions: affiliate.totalConversions,
    totalSales: affiliate.totalSales,
    totalEarned: affiliate.totalEarned,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Export all functions
// ───────────────────────────────────────────────────────────────────────────────

export default {
  // Affiliate CRUD
  createAffiliate,
  getAffiliateById,
  getAffiliateByCode,
  listAffiliates,
  updateAffiliate,
  approveAffiliate,
  rejectAffiliate,
  deleteAffiliate,

  // Click Tracking
  trackAffiliateClick,

  // Conversion Tracking
  trackAffiliateConversion,
  calculateCommission,
  approveConversion,

  // Payouts
  createPayoutRequest,
  listPayouts,
  processPayout,

  // Banners
  listBanners,
  createBanner,

  // Helpers
  generateReferralCode,
  getAffiliateStats,
};
