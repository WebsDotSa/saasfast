/**
 * Marketing Module - Loyalty Tests
 */

import { describe, it, expect } from 'vitest';

describe('Loyalty Engine', () => {
  describe('calculateTier', () => {
    const tiersConfig = [
      { id: 'bronze', min_points: 0, points_multiplier: 1.0 },
      { id: 'silver', min_points: 500, points_multiplier: 1.25 },
      { id: 'gold', min_points: 2000, points_multiplier: 1.5 },
      { id: 'platinum', min_points: 5000, points_multiplier: 2.0 },
    ];

    const calculateTier = (lifetimePoints: number, tiers: any[]): string => {
      if (!tiers || tiers.length === 0) return 'bronze';

      const sortedTiers = [...tiers].sort(
        (a, b) => (b.min_points || 0) - (a.min_points || 0)
      );

      for (const tier of sortedTiers) {
        if (lifetimePoints >= (tier.min_points || 0)) {
          return tier.id;
        }
      }

      return 'bronze';
    };

    it('should return bronze for 0 points', () => {
      expect(calculateTier(0, tiersConfig)).toBe('bronze');
    });

    it('should return bronze for 100 points', () => {
      expect(calculateTier(100, tiersConfig)).toBe('bronze');
    });

    it('should return silver for 500 points', () => {
      expect(calculateTier(500, tiersConfig)).toBe('silver');
    });

    it('should return silver for 1000 points', () => {
      expect(calculateTier(1000, tiersConfig)).toBe('silver');
    });

    it('should return gold for 2000 points', () => {
      expect(calculateTier(2000, tiersConfig)).toBe('gold');
    });

    it('should return gold for 4999 points', () => {
      expect(calculateTier(4999, tiersConfig)).toBe('gold');
    });

    it('should return platinum for 5000 points', () => {
      expect(calculateTier(5000, tiersConfig)).toBe('platinum');
    });

    it('should return platinum for 10000 points', () => {
      expect(calculateTier(10000, tiersConfig)).toBe('platinum');
    });
  });

  describe('awardPoints', () => {
    const calculatePoints = (
      orderAmount: number,
      pointsPerSar: number,
      tierMultiplier: number = 1.0
    ): number => {
      const basePoints = Math.floor(orderAmount * pointsPerSar);
      return Math.floor(basePoints * tierMultiplier);
    };

    it('should calculate base points correctly', () => {
      const points = calculatePoints(500, 1.0);
      expect(points).toBe(500);
    });

    it('should calculate points with silver tier multiplier', () => {
      const points = calculatePoints(500, 1.0, 1.25);
      expect(points).toBe(625);
    });

    it('should calculate points with gold tier multiplier', () => {
      const points = calculatePoints(500, 1.0, 1.5);
      expect(points).toBe(750);
    });

    it('should calculate points with platinum tier multiplier', () => {
      const points = calculatePoints(500, 1.0, 2.0);
      expect(points).toBe(1000);
    });

    it('should handle custom points per SAR', () => {
      const points = calculatePoints(500, 2.0);
      expect(points).toBe(1000);
    });
  });

  describe('redeemPoints', () => {
    const calculateRedemption = (
      pointsToRedeem: number,
      sarPerPoint: number,
      minPointsToRedeem: number = 100
    ): { success: boolean; discount?: number; message?: string } => {
      if (pointsToRedeem < minPointsToRedeem) {
        return {
          success: false,
          message: `الحد الأدنى للاسترداد هو ${minPointsToRedeem} نقطة`,
        };
      }

      const discount = pointsToRedeem * sarPerPoint;
      return {
        success: true,
        discount,
        message: `تم استرداد ${pointsToRedeem} نقطة بخصم ${discount} ريال`,
      };
    };

    it('should reject redemption below minimum', () => {
      const result = calculateRedemption(50, 0.05);
      expect(result.success).toBe(false);
      expect(result.message).toContain('الحد الأدنى');
    });

    it('should calculate discount for 100 points', () => {
      const result = calculateRedemption(100, 0.05);
      expect(result.success).toBe(true);
      expect(result.discount).toBe(5);
    });

    it('should calculate discount for 500 points', () => {
      const result = calculateRedemption(500, 0.05);
      expect(result.success).toBe(true);
      expect(result.discount).toBe(25);
    });

    it('should calculate discount for 1000 points', () => {
      const result = calculateRedemption(1000, 0.05);
      expect(result.success).toBe(true);
      expect(result.discount).toBe(50);
    });

    it('should handle custom sarPerPoint value', () => {
      const result = calculateRedemption(100, 0.10);
      expect(result.success).toBe(true);
      expect(result.discount).toBe(10);
    });
  });

  describe('getTierProgress', () => {
    const getTierProgress = (
      currentTier: string,
      lifetimePoints: number,
      tiers: any[]
    ): { currentTier: string; nextTier?: string; pointsToNext: number; progress: number } => {
      const sortedTiers = [...tiers].sort(
        (a, b) => (a.min_points || 0) - (b.min_points || 0)
      );

      const currentIndex = sortedTiers.findIndex((t) => t.id === currentTier);
      const nextTier = sortedTiers[currentIndex + 1];

      if (!nextTier) {
        return { currentTier, progress: 100 };
      }

      const currentTierData = sortedTiers[currentIndex];
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
    };

    const tiersConfig = [
      { id: 'bronze', min_points: 0 },
      { id: 'silver', min_points: 500 },
      { id: 'gold', min_points: 2000 },
      { id: 'platinum', min_points: 5000 },
    ];

    it('should calculate progress from bronze to silver', () => {
      const progress = getTierProgress('bronze', 250, tiersConfig);
      expect(progress.nextTier).toBe('silver');
      expect(progress.pointsToNext).toBe(250);
      expect(progress.progress).toBe(50);
    });

    it('should calculate progress from silver to gold', () => {
      const progress = getTierProgress('silver', 1250, tiersConfig);
      expect(progress.nextTier).toBe('gold');
      expect(progress.pointsToNext).toBe(750);
      expect(progress.progress).toBe(50);
    });

    it('should return no next tier for platinum', () => {
      const progress = getTierProgress('platinum', 10000, tiersConfig);
      expect(progress.nextTier).toBeUndefined();
      expect(progress.progress).toBe(100);
    });
  });

  describe('Loyalty Rewards', () => {
    const rewards = [
      {
        id: 'reward-1',
        nameAr: 'خصم 10 ريال',
        pointsCost: 200,
        rewardType: 'discount',
        discountValue: 10,
        minOrderAmount: 100,
      },
      {
        id: 'reward-2',
        nameAr: 'خصم 25 ريال',
        pointsCost: 450,
        rewardType: 'discount',
        discountValue: 25,
        minOrderAmount: 200,
      },
      {
        id: 'reward-3',
        nameAr: 'خصم 15%',
        pointsCost: 600,
        rewardType: 'discount',
        discountValue: 15,
        minOrderAmount: 150,
      },
      {
        id: 'reward-4',
        nameAr: 'شحن مجاني',
        pointsCost: 150,
        rewardType: 'free_shipping',
        minOrderAmount: 50,
      },
    ];

    it('should have correct rewards list', () => {
      expect(rewards.length).toBe(4);
    });

    it('should have valid points cost', () => {
      rewards.forEach(reward => {
        expect(reward.pointsCost).toBeGreaterThan(0);
      });
    });

    it('should sort rewards by points cost', () => {
      const sorted = [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
      expect(sorted[0].pointsCost).toBe(150);
      expect(sorted[3].pointsCost).toBe(600);
    });
  });

  describe('Points Expiry', () => {
    const calculateExpiringPoints = (
      points: number,
      expiryMonths: number,
      earnedAt: Date,
      now: Date
    ): { expiring: number; remaining: number } => {
      if (expiryMonths === 0) {
        return { expiring: 0, remaining: points };
      }

      const expiryDate = new Date(earnedAt);
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

      if (now > expiryDate) {
        return { expiring: points, remaining: 0 };
      }

      return { expiring: 0, remaining: points };
    };

    it('should not expire points if within expiry period', () => {
      const earnedAt = new Date('2026-01-01');
      const now = new Date('2026-02-01');
      const result = calculateExpiringPoints(1000, 12, earnedAt, now);
      expect(result.expiring).toBe(0);
      expect(result.remaining).toBe(1000);
    });

    it('should expire points after expiry period', () => {
      const earnedAt = new Date('2025-01-01');
      const now = new Date('2026-02-01');
      const result = calculateExpiringPoints(1000, 12, earnedAt, now);
      expect(result.expiring).toBe(1000);
      expect(result.remaining).toBe(0);
    });

    it('should not expire points if expiry is disabled', () => {
      const earnedAt = new Date('2025-01-01');
      const now = new Date('2026-02-01');
      const result = calculateExpiringPoints(1000, 0, earnedAt, now);
      expect(result.expiring).toBe(0);
      expect(result.remaining).toBe(1000);
    });
  });
});

describe('Loyalty Tier Benefits', () => {
  const tierBenefits: Record<string, string[]> = {
    bronze: ['نقطة واحدة لكل ريال'],
    silver: ['1.25 نقطة لكل ريال', 'خصم 5% إضافي', 'دعم ذو أولوية'],
    gold: ['1.5 نقطة لكل ريال', 'خصم 10% إضافي', 'شحن مجاني', 'دعم VIP'],
    platinum: ['2 نقطة لكل ريال', 'خصم 15% إضافي', 'شحن مجاني', 'دعم VIP 24/7', 'عروض حصرية'],
  };

  it('should have benefits for all tiers', () => {
    expect(Object.keys(tierBenefits).length).toBe(4);
  });

  it('should have increasing benefits per tier', () => {
    expect(tierBenefits.bronze.length).toBe(1);
    expect(tierBenefits.silver.length).toBe(3);
    expect(tierBenefits.gold.length).toBe(4);
    expect(tierBenefits.platinum.length).toBe(5);
  });

  it('should have point multiplier in all tiers', () => {
    Object.values(tierBenefits).forEach(benefits => {
      const hasMultiplier = benefits.some(b => b.includes('نقطة'));
      expect(hasMultiplier).toBe(true);
    });
  });
});
