// ═══════════════════════════════════════════════════════════════════════════════
// Marketing Module - Loyalty Program Engine
// ═══════════════════════════════════════════════════════════════════════════════
// نظام ولاء العملاء - نقاط، مستويات، ومكافآت
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import {
  loyaltyPrograms,
  loyaltyAccounts,
  loyaltyTransactions,
  loyaltyRewards,
  loyaltyRedemptions,
  loyaltyTierHistory,
} from '@/lib/db/schema';
import { eq, and, isNull, desc, or } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export interface LoyaltyProgram {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  pointsPerSar: number;
  sarPerPoint: number;
  minPointsToRedeem: number;
  pointsExpiryMonths?: number;
  tiersEnabled: boolean;
  tiersConfig: any[];
  rewardsEnabled: boolean;
  rewardsConfig: any[];
  isActive: boolean;
  totalMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyAccount {
  id: string;
  tenantId: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lifetimeExpired: number;
  currentTier: string;
  tierUpdatedAt?: Date;
  nextTier?: string;
  pointsToNextTier?: number;
  pointsExpiringAt?: Date;
  pointsExpiringAmount?: number;
  status: string;
  notifyOnEarn: boolean;
  notifyOnRedeem: boolean;
  notifyOnTier: boolean;
  notifyOnExpiry: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  tenantId: string;
  accountId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'refund';
  points: number;
  balanceAfter: number;
  monetaryValue?: number;
  referenceType?: string;
  referenceId?: string;
  orderAmount?: number;
  description?: string;
  notes?: string;
  expiresAt?: Date;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface LoyaltyReward {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  rewardType: string;
  pointsCost: number;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  validityDays: number;
  totalQuantity?: number;
  redeemedCount: number;
  perCustomerLimit: number;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────────────────────────────────────────
// Loyalty Program Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get or create loyalty program for tenant
 */
export async function getOrCreateLoyaltyProgram(tenantId: string): Promise<LoyaltyProgram> {
  try {
    let program = await db.query.loyaltyPrograms.findFirst({
      where: eq(loyaltyPrograms.tenantId, tenantId),
    });

    if (!program) {
      // Create default program
      const [newProgram] = await db.insert(loyaltyPrograms).values({
        tenantId,
        nameAr: 'برنامج الولاء',
        nameEn: 'Loyalty Program',
        pointsPerSar: 1.0,
        sarPerPoint: 0.05,
        minPointsToRedeem: 100,
        tiersEnabled: true,
        tiersConfig: [
          {
            id: 'bronze',
            name_ar: 'برونزي',
            name_en: 'Bronze',
            icon: '🥉',
            min_points: 0,
            min_spent: 0,
            points_multiplier: 1.0,
            benefits: ['نقطة واحدة لكل ريال'],
            color: '#cd7f32',
          },
          {
            id: 'silver',
            name_ar: 'فضي',
            name_en: 'Silver',
            icon: '🥈',
            min_points: 500,
            min_spent: 500,
            points_multiplier: 1.25,
            benefits: ['1.25 نقطة لكل ريال', 'خصم 5% إضافي'],
            color: '#c0c0c0',
          },
          {
            id: 'gold',
            name_ar: 'ذهبي',
            name_en: 'Gold',
            icon: '🥇',
            min_points: 2000,
            min_spent: 2000,
            points_multiplier: 1.5,
            benefits: ['1.5 نقطة لكل ريال', 'خصم 10% إضافي', 'شحن مجاني'],
            color: '#ffd700',
          },
          {
            id: 'platinum',
            name_ar: 'بلاتيني',
            name_en: 'Platinum',
            icon: '💎',
            min_points: 5000,
            min_spent: 5000,
            points_multiplier: 2.0,
            benefits: ['2 نقطة لكل ريال', 'خصم 15% إضافي', 'دعم VIP'],
            color: '#e5e4e2',
          },
        ],
        rewardsEnabled: true,
        isActive: true,
      }).returning();

      program = newProgram as unknown as LoyaltyProgram;
    }

    return program as unknown as LoyaltyProgram;

  } catch (error) {
    console.error('[Loyalty] Error getting/creating program:', error);
    throw new Error('فشل تحميل برنامج الولاء');
  }
}

/**
 * Update loyalty program settings
 */
export async function updateLoyaltyProgram(
  tenantId: string,
  input: Partial<LoyaltyProgram>
): Promise<LoyaltyProgram | null> {
  try {
    const [program] = await db.update(loyaltyPrograms)
      .set({
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        descriptionAr: input.descriptionAr,
        pointsPerSar: input.pointsPerSar,
        sarPerPoint: input.sarPerPoint,
        minPointsToRedeem: input.minPointsToRedeem,
        pointsExpiryMonths: input.pointsExpiryMonths,
        tiersEnabled: input.tiersEnabled,
        tiersConfig: input.tiersConfig,
        rewardsEnabled: input.rewardsEnabled,
        rewardsConfig: input.rewardsConfig,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyPrograms.tenantId, tenantId))
      .returning();

    return program as unknown as LoyaltyProgram | null;

  } catch (error) {
    console.error('[Loyalty] Error updating program:', error);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Loyalty Account Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get or create loyalty account for customer
 */
export async function getOrCreateLoyaltyAccount(
  tenantId: string,
  customerId: string,
  customerData?: {
    email?: string;
    name?: string;
    phone?: string;
  }
): Promise<LoyaltyAccount> {
  try {
    let account = await db.query.loyaltyAccounts.findFirst({
      where: and(
        eq(loyaltyAccounts.tenantId, tenantId),
        eq(loyaltyAccounts.customerId, customerId)
      ),
    });

    if (!account) {
      // Create new account
      const [newAccount] = await db.insert(loyaltyAccounts).values({
        tenantId,
        customerId,
        customerEmail: customerData?.email,
        customerName: customerData?.name,
        customerPhone: customerData?.phone,
        currentBalance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        lifetimeExpired: 0,
        currentTier: 'bronze',
        status: 'active',
      }).returning();

      account = newAccount as unknown as LoyaltyAccount;
    }

    return account as unknown as LoyaltyAccount;

  } catch (error) {
    console.error('[Loyalty] Error getting/creating account:', error);
    throw new Error('فشل تحميل حساب الولاء');
  }
}

/**
 * Get customer loyalty account
 */
export async function getLoyaltyAccount(
  tenantId: string,
  customerId: string
): Promise<LoyaltyAccount | null> {
  try {
    const account = await db.query.loyaltyAccounts.findFirst({
      where: and(
        eq(loyaltyAccounts.tenantId, tenantId),
        eq(loyaltyAccounts.customerId, customerId)
      ),
    });

    return account as unknown as LoyaltyAccount | null;

  } catch (error) {
    console.error('[Loyalty] Error getting account:', error);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Points Operations
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Award points to customer
 */
export async function awardPoints(
  tenantId: string,
  customerId: string,
  orderAmount: number,
  orderId: string
): Promise<{ success: boolean; points: number; newBalance: number; newTier?: string }> {
  try {
    // Get loyalty program
    const program = await getOrCreateLoyaltyProgram(tenantId);
    if (!program.isActive) {
      return { success: false, points: 0, newBalance: 0 };
    }

    // Get or create account
    const account = await getOrCreateLoyaltyAccount(tenantId, customerId);

    // Calculate tier multiplier
    const tier = getTierById(account.currentTier, program.tiersConfig);
    const multiplier = tier?.points_multiplier || 1.0;

    // Calculate points
    const basePoints = Math.floor(orderAmount * program.pointsPerSar);
    const totalPoints = Math.floor(basePoints * multiplier);

    if (totalPoints <= 0) {
      return { success: false, points: 0, newBalance: account.currentBalance };
    }

    // Calculate new balance
    const newBalance = account.currentBalance + totalPoints;

    // Create transaction
    await db.insert(loyaltyTransactions).values({
      tenantId,
      accountId: account.id,
      type: 'earn',
      points: totalPoints,
      balanceAfter: newBalance,
      referenceType: 'order',
      referenceId: orderId,
      orderAmount,
      description: `كسب ${totalPoints} نقطة من طلب بقيمة ${orderAmount} ريال`,
      metadata: {
        basePoints,
        tierMultiplier: multiplier,
        tier: account.currentTier,
      },
    });

    // Update account
    await db.update(loyaltyAccounts)
      .set({
        currentBalance: newBalance,
        lifetimeEarned: account.lifetimeEarned + totalPoints,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    // Check for tier upgrade
    const newTier = calculateTier(newBalance, program.tiersConfig);
    let tierChanged = false;

    if (newTier !== account.currentTier) {
      await updateCustomerTier(tenantId, account.id, newTier);
      tierChanged = true;
    }

    return {
      success: true,
      points: totalPoints,
      newBalance,
      newTier: tierChanged ? newTier : undefined,
    };

  } catch (error) {
    console.error('[Loyalty] Error awarding points:', error);
    return { success: false, points: 0, newBalance: 0 };
  }
}

/**
 * Redeem points for discount
 */
export async function redeemPoints(
  tenantId: string,
  customerId: string,
  pointsToRedeem: number
): Promise<{ success: boolean; discount: number; message: string }> {
  try {
    // Get program
    const program = await getOrCreateLoyaltyProgram(tenantId);

    // Get account
    const account = await getLoyaltyAccount(tenantId, customerId);
    if (!account) {
      return { success: false, discount: 0, message: 'حساب الولاء غير موجود' };
    }

    // Check minimum redemption
    if (pointsToRedeem < program.minPointsToRedeem) {
      return {
        success: false,
        discount: 0,
        message: `الحد الأدنى للاسترداد هو ${program.minPointsToRedeem} نقطة`,
      };
    }

    // Check balance
    if (account.currentBalance < pointsToRedeem) {
      return {
        success: false,
        discount: 0,
        message: 'رصيد النقاط غير كافٍ',
      };
    }

    // Calculate discount value
    const discount = pointsToRedeem * program.sarPerPoint;

    // Calculate new balance
    const newBalance = account.currentBalance - pointsToRedeem;

    // Create transaction
    await db.insert(loyaltyTransactions).values({
      tenantId,
      accountId: account.id,
      type: 'redeem',
      points: -pointsToRedeem,
      balanceAfter: newBalance,
      monetaryValue: discount,
      description: `استرداد ${pointsToRedeem} نقطة بخصم ${discount} ريال`,
    });

    // Update account
    await db.update(loyaltyAccounts)
      .set({
        currentBalance: newBalance,
        lifetimeRedeemed: account.lifetimeRedeemed + pointsToRedeem,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    return {
      success: true,
      discount,
      message: `تم استرداد ${pointsToRedeem} نقطة بخصم ${discount} ريال`,
    };

  } catch (error) {
    console.error('[Loyalty] Error redeeming points:', error);
    return { success: false, discount: 0, message: 'فشل استرداد النقاط' };
  }
}

/**
 * Get customer points balance
 */
export async function getPointsBalance(
  tenantId: string,
  customerId: string
): Promise<{ balance: number; lifetimeEarned: number; lifetimeRedeemed: number }> {
  const account = await getLoyaltyAccount(tenantId, customerId);

  if (!account) {
    return { balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0 };
  }

  return {
    balance: account.currentBalance,
    lifetimeEarned: account.lifetimeEarned,
    lifetimeRedeemed: account.lifetimeRedeemed,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Tier Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Calculate tier based on points
 */
export function calculateTier(lifetimePoints: number, tiersConfig: any[]): string {
  if (!tiersConfig || tiersConfig.length === 0) {
    return 'bronze';
  }

  // Sort tiers by min_points descending
  const sortedTiers = [...tiersConfig].sort(
    (a, b) => (b.min_points || 0) - (a.min_points || 0)
  );

  // Find highest tier customer qualifies for
  for (const tier of sortedTiers) {
    if (lifetimePoints >= (tier.min_points || 0)) {
      return tier.id;
    }
  }

  return 'bronze';
}

/**
 * Get tier by ID
 */
export function getTierById(tierId: string, tiersConfig: any[]): any {
  return tiersConfig?.find((t) => t.id === tierId);
}

/**
 * Update customer tier
 */
export async function updateCustomerTier(
  tenantId: string,
  accountId: string,
  newTier: string
): Promise<void> {
  try {
    const account = await db.query.loyaltyAccounts.findFirst({
      where: eq(loyaltyAccounts.id, accountId),
    });

    if (!account) return;

    // Update account tier
    await db.update(loyaltyAccounts)
      .set({
        currentTier: newTier,
        tierUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, accountId));

    // Record tier change
    await db.insert(loyaltyTierHistory).values({
      tenantId,
      accountId,
      fromTier: account.currentTier,
      toTier: newTier,
      reason: 'points_threshold',
      pointsAtChange: account.currentBalance,
    });

  } catch (error) {
    console.error('[Loyalty] Error updating tier:', error);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Rewards Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * List loyalty rewards
 */
export async function listRewards(tenantId: string): Promise<LoyaltyReward[]> {
  try {
    const rewards = await db.query.loyaltyRewards.findMany({
      where: and(
        eq(loyaltyRewards.tenantId, tenantId),
        eq(loyaltyRewards.isActive, true)
      ),
      orderBy: [desc(loyaltyRewards.sortOrder)],
    });

    return rewards as unknown as LoyaltyReward[];

  } catch (error) {
    console.error('[Loyalty] Error listing rewards:', error);
    return [];
  }
}

/**
 * Create reward
 */
export async function createReward(input: {
  tenantId: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  rewardType: string;
  pointsCost: number;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  validityDays?: number;
  imageUrl?: string;
}): Promise<LoyaltyReward | null> {
  try {
    const [reward] = await db.insert(loyaltyRewards).values({
      tenantId: input.tenantId,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      rewardType: input.rewardType,
      pointsCost: input.pointsCost,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      validityDays: input.validityDays || 30,
      imageUrl: input.imageUrl,
      isActive: true,
      redeemedCount: 0,
      perCustomerLimit: 1,
      sortOrder: 0,
    }).returning();

    return reward as unknown as LoyaltyReward;

  } catch (error) {
    console.error('[Loyalty] Error creating reward:', error);
    return null;
  }
}

/**
 * Redeem reward
 */
export async function redeemReward(
  tenantId: string,
  customerId: string,
  rewardId: string
): Promise<{ success: boolean; rewardCode?: string; message: string }> {
  try {
    // Get reward
    const reward = await db.query.loyaltyRewards.findFirst({
      where: and(
        eq(loyaltyRewards.id, rewardId),
        eq(loyaltyRewards.tenantId, tenantId)
      ),
    });

    if (!reward) {
      return { success: false, message: 'المكافأة غير موجودة' };
    }

    // Get account
    const account = await getLoyaltyAccount(tenantId, customerId);
    if (!account) {
      return { success: false, message: 'حساب الولاء غير موجود' };
    }

    // Check balance
    if (account.currentBalance < reward.pointsCost) {
      return {
        success: false,
        message: 'رصيد النقاط غير كافٍ لاسترداد هذه المكافأة',
      };
    }

    // Deduct points
    const newBalance = account.currentBalance - reward.pointsCost;

    await db.update(loyaltyAccounts)
      .set({
        currentBalance: newBalance,
        lifetimeRedeemed: account.lifetimeRedeemed + reward.pointsCost,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    // Create transaction
    await db.insert(loyaltyTransactions).values({
      tenantId,
      accountId: account.id,
      type: 'redeem',
      points: -reward.pointsCost,
      balanceAfter: newBalance,
      referenceType: 'reward',
      referenceId: rewardId,
      description: `استرداد مكافأة: ${reward.nameAr}`,
    });

    // Generate reward code
    const rewardCode = `RWD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create redemption record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reward.validityDays);

    await db.insert(loyaltyRedemptions).values({
      tenantId,
      accountId: account.id,
      rewardId,
      customerId,
      customerEmail: account.customerEmail,
      pointsUsed: reward.pointsCost,
      rewardCode,
      discountCode: reward.discountType ? `LOYALTY${reward.discountValue}` : undefined,
      status: 'active',
      expiresAt,
    });

    // Update reward redeemed count
    await db.update(loyaltyRewards)
      .set({
        redeemedCount: reward.redeemedCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyRewards.id, rewardId));

    return {
      success: true,
      rewardCode,
      message: `تم استرداد المكافأة بنجاح! رمز الاستخدام: ${rewardCode}`,
    };

  } catch (error) {
    console.error('[Loyalty] Error redeeming reward:', error);
    return { success: false, message: 'فشل استرداد المكافأة' };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Transaction History
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get transaction history for account
 */
export async function getTransactionHistory(
  accountId: string,
  limit: number = 50
): Promise<LoyaltyTransaction[]> {
  try {
    const transactions = await db.query.loyaltyTransactions.findMany({
      where: eq(loyaltyTransactions.accountId, accountId),
      orderBy: [desc(loyaltyTransactions.createdAt)],
      limit,
    });

    return transactions as unknown as LoyaltyTransaction[];

  } catch (error) {
    console.error('[Loyalty] Error getting transaction history:', error);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get tier progress
 */
export function getTierProgress(
  currentTier: string,
  lifetimePoints: number,
  tiersConfig: any[]
): { currentTier: string; nextTier?: string; pointsToNext: number; progress: number } {
  if (!tiersConfig || tiersConfig.length === 0) {
    return { currentTier, progress: 100 };
  }

  const currentTierData = getTierById(currentTier, tiersConfig);
  const sortedTiers = [...tiersConfig].sort(
    (a, b) => (a.min_points || 0) - (b.min_points || 0)
  );

  const currentIndex = sortedTiers.findIndex((t) => t.id === currentTier);
  const nextTier = sortedTiers[currentIndex + 1];

  if (!nextTier) {
    return { currentTier, progress: 100 };
  }

  const pointsToNext = (nextTier.min_points || 0) - lifetimePoints;
  const prevTierMin = currentTierData?.min_points || 0;
  const nextTierMin = nextTier.min_points || 0;
  const progress = ((lifetimePoints - prevTierMin) / (nextTierMin - prevTierMin)) * 100;

  return {
    currentTier,
    nextTier: nextTier.id,
    pointsToNext: Math.max(0, pointsToNext),
    progress: Math.min(100, Math.max(0, progress)),
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Export all functions
// ───────────────────────────────────────────────────────────────────────────────

export default {
  // Program
  getOrCreateLoyaltyProgram,
  updateLoyaltyProgram,

  // Account
  getOrCreateLoyaltyAccount,
  getLoyaltyAccount,

  // Points
  awardPoints,
  redeemPoints,
  getPointsBalance,

  // Tier
  calculateTier,
  getTierById,
  updateCustomerTier,
  getTierProgress,

  // Rewards
  listRewards,
  createReward,
  redeemReward,

  // History
  getTransactionHistory,
};
