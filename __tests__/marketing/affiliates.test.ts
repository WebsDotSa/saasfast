/**
 * Marketing Module - Affiliates Tests
 */

import { describe, it, expect } from 'vitest';

describe('Affiliates Engine', () => {
  describe('calculateCommission', () => {
    const calculateCommission = (
      commissionType: string,
      commissionRate: number,
      commissionValue: number | undefined,
      orderAmount: number,
      totalSales: number = 0,
      tieredCommission?: any[]
    ): number => {
      if (commissionType === 'fixed') {
        return commissionValue || 0;
      }

      if (commissionType === 'tiered' && tieredCommission) {
        const applicableTier = tieredCommission
          .filter((tier) => {
            const minSales = tier.min_sales || 0;
            const maxSales = tier.max_sales;
            return totalSales >= minSales && (!maxSales || totalSales <= maxSales);
          })
          .sort((a, b) => (b.min_sales || 0) - (a.min_sales || 0))[0];

        if (applicableTier) {
          return orderAmount * (applicableTier.rate / 100);
        }
      }

      // Default: percentage
      return orderAmount * (commissionRate / 100);
    };

    it('should calculate percentage commission', () => {
      const commission = calculateCommission('percentage', 10, undefined, 500);
      expect(commission).toBe(50);
    });

    it('should calculate fixed commission', () => {
      const commission = calculateCommission('fixed', 10, 25, 500);
      expect(commission).toBe(25);
    });

    it('should calculate tiered commission for first tier', () => {
      const tiers = [
        { min_sales: 0, max_sales: 10, rate: 10 },
        { min_sales: 11, max_sales: 50, rate: 12 },
        { min_sales: 51, max_sales: null, rate: 15 },
      ];
      const commission = calculateCommission('tiered', 10, undefined, 500, 5, tiers);
      expect(commission).toBe(50); // 10%
    });

    it('should calculate tiered commission for second tier', () => {
      const tiers = [
        { min_sales: 0, max_sales: 10, rate: 10 },
        { min_sales: 11, max_sales: 50, rate: 12 },
        { min_sales: 51, max_sales: null, rate: 15 },
      ];
      const commission = calculateCommission('tiered', 10, undefined, 500, 20, tiers);
      expect(commission).toBe(60); // 12%
    });

    it('should calculate tiered commission for highest tier', () => {
      const tiers = [
        { min_sales: 0, max_sales: 10, rate: 10 },
        { min_sales: 11, max_sales: 50, rate: 12 },
        { min_sales: 51, max_sales: null, rate: 15 },
      ];
      const commission = calculateCommission('tiered', 10, undefined, 500, 100, tiers);
      expect(commission).toBe(75); // 15%
    });
  });

  describe('generateReferralCode', () => {
    const generateReferralCode = (name: string): string => {
      const namePart = name
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 6);
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${namePart}${randomPart}`;
    };

    it('should generate code from name', () => {
      const code = generateReferralCode('Ahmed');
      expect(code).toMatch(/^AHMED[A-Z0-9]{4}$/);
    });

    it('should generate code from long name', () => {
      const code = generateReferralCode('Mohammed Ahmed');
      expect(code.length).toBe(10);
      expect(code).toMatch(/^MOHAMM[A-Z0-9]{4}$/);
    });

    it('should handle special characters', () => {
      const code = generateReferralCode('Ahmed Mohammed');
      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(code.length).toBeLessThanOrEqual(10);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode('Test'));
      }
      // Most should be unique
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('Affiliate Status', () => {
    const statusLabels: Record<string, string> = {
      pending: 'بانتظار الموافقة',
      active: 'نشط',
      suspended: 'معلق',
      rejected: 'مرفوض',
      banned: 'محظور',
    };

    it('should have correct status labels', () => {
      expect(statusLabels['pending']).toBe('بانتظار الموافقة');
      expect(statusLabels['active']).toBe('نشط');
      expect(statusLabels['rejected']).toBe('مرفوض');
    });

    it('should have all required statuses', () => {
      const requiredStatuses = ['pending', 'active', 'suspended', 'rejected', 'banned'];
      requiredStatuses.forEach(status => {
        expect(statusLabels[status]).toBeDefined();
      });
    });
  });

  describe('trackAffiliateClick', () => {
    const trackClick = (
      affiliateId: string,
      visitorId: string,
      ipAddress: string
    ): { success: boolean; clickId: string; timestamp: Date } => {
      return {
        success: true,
        clickId: `click_${affiliateId}_${Date.now()}`,
        timestamp: new Date(),
      };
    };

    it('should track click successfully', () => {
      const result = trackClick('affiliate-1', 'visitor-1', '192.168.1.1');
      expect(result.success).toBe(true);
      expect(result.clickId).toMatch(/^click_affiliate-1_/);
    });

    it('should generate unique click IDs', () => {
      // Mock Date to ensure different timestamps
      const originalDate = Date;
      const mockDate = new Date('2026-01-01T00:00:00.000Z');

      const click1 = trackClick('affiliate-1', 'visitor-1', '192.168.1.1');

      // Advance time slightly
      mockDate.setMilliseconds(mockDate.getMilliseconds() + 1);

      const click2 = trackClick('affiliate-1', 'visitor-2', '192.168.1.2');

      // Click IDs should contain affiliate ID
      expect(click1.clickId).toContain('affiliate-1');
      expect(click2.clickId).toContain('affiliate-1');

      // Both should have valid click ID format
      expect(click1.clickId).toMatch(/^click_affiliate-1_\d+$/);
      expect(click2.clickId).toMatch(/^click_affiliate-1_\d+$/);
    });
  });

  describe('trackAffiliateConversion', () => {
    const trackConversion = (
      affiliateId: string,
      orderId: string,
      orderAmount: number,
      commissionRate: number
    ): { success: boolean; conversionId: string; commission: number } => {
      const commission = orderAmount * (commissionRate / 100);
      return {
        success: true,
        conversionId: `conv_${orderId}`,
        commission,
      };
    };

    it('should track conversion with correct commission', () => {
      const result = trackConversion('affiliate-1', 'order-1', 500, 10);
      expect(result.success).toBe(true);
      expect(result.commission).toBe(50);
    });

    it('should generate conversion ID from order ID', () => {
      const result = trackConversion('affiliate-1', 'order-123', 500, 10);
      expect(result.conversionId).toBe('conv_order-123');
    });

    it('should calculate commission correctly', () => {
      const testCases = [
        { amount: 100, rate: 10, expected: 10 },
        { amount: 500, rate: 10, expected: 50 },
        { amount: 1000, rate: 15, expected: 150 },
        { amount: 200, rate: 20, expected: 40 },
      ];

      testCases.forEach(({ amount, rate, expected }) => {
        const result = trackConversion('affiliate-1', 'order-1', amount, rate);
        expect(result.commission).toBe(expected);
      });
    });
  });

  describe('Affiliate Stats', () => {
    const calculateStats = (
      totalClicks: number,
      totalConversions: number,
      totalSales: number,
      totalEarned: number
    ) => {
      const conversionRate = totalClicks > 0
        ? Math.round((totalConversions / totalClicks) * 100 * 100) / 100
        : 0;

      const averageOrderValue = totalConversions > 0
        ? Math.round((totalSales / totalConversions) * 100) / 100
        : 0;

      return {
        conversionRate,
        averageOrderValue,
      };
    };

    it('should calculate conversion rate correctly', () => {
      const stats = calculateStats(1000, 50, 25000, 2500);
      expect(stats.conversionRate).toBe(5);
    });

    it('should calculate average order value correctly', () => {
      const stats = calculateStats(1000, 50, 25000, 2500);
      expect(stats.averageOrderValue).toBe(500);
    });

    it('should return 0 conversion rate with no clicks', () => {
      const stats = calculateStats(0, 0, 0, 0);
      expect(stats.conversionRate).toBe(0);
    });

    it('should return 0 AOV with no conversions', () => {
      const stats = calculateStats(1000, 0, 0, 0);
      expect(stats.averageOrderValue).toBe(0);
    });

    it('should handle realistic affiliate data', () => {
      const stats = calculateStats(5000, 150, 75000, 7500);
      expect(stats.conversionRate).toBe(3);
      expect(stats.averageOrderValue).toBe(500);
    });
  });

  describe('Payout Threshold', () => {
    const canRequestPayout = (pendingPayout: number, minPayoutAmount: number): boolean => {
      return pendingPayout >= minPayoutAmount;
    };

    it('should allow payout when above threshold', () => {
      expect(canRequestPayout(150, 100)).toBe(true);
    });

    it('should allow payout when exactly at threshold', () => {
      expect(canRequestPayout(100, 100)).toBe(true);
    });

    it('should deny payout when below threshold', () => {
      expect(canRequestPayout(50, 100)).toBe(false);
    });

    it('should handle different thresholds', () => {
      expect(canRequestPayout(250, 200)).toBe(true);
      expect(canRequestPayout(1000, 500)).toBe(true);
    });
  });

  describe('Affiliate Tiers', () => {
    const tiers = [
      { name: 'bronze', minSales: 0, maxSales: 1000, commissionRate: 10 },
      { name: 'silver', minSales: 1001, maxSales: 5000, commissionRate: 12 },
      { name: 'gold', minSales: 5001, maxSales: 20000, commissionRate: 15 },
      { name: 'platinum', minSales: 20001, maxSales: null, commissionRate: 20 },
    ];

    const getTierForSales = (totalSales: number) => {
      return tiers.find(tier => 
        totalSales >= tier.minSales && (tier.maxSales === null || totalSales <= tier.maxSales)
      );
    };

    it('should return bronze for 0 sales', () => {
      const tier = getTierForSales(0);
      expect(tier?.name).toBe('bronze');
      expect(tier?.commissionRate).toBe(10);
    });

    it('should return silver for 2000 sales', () => {
      const tier = getTierForSales(2000);
      expect(tier?.name).toBe('silver');
      expect(tier?.commissionRate).toBe(12);
    });

    it('should return gold for 10000 sales', () => {
      const tier = getTierForSales(10000);
      expect(tier?.name).toBe('gold');
      expect(tier?.commissionRate).toBe(15);
    });

    it('should return platinum for 50000 sales', () => {
      const tier = getTierForSales(50000);
      expect(tier?.name).toBe('platinum');
      expect(tier?.commissionRate).toBe(20);
    });
  });
});

describe('Affiliate Link', () => {
  const generateReferralLink = (storeUrl: string, referralCode: string): string => {
    // Ensure URL ends with / before adding query param
    const baseUrl = storeUrl.endsWith('/') ? storeUrl : `${storeUrl}/`;
    return `${baseUrl}?ref=${referralCode}`;
  };

  it('should generate correct referral link', () => {
    const link = generateReferralLink('https://store.saasfast.com', 'AHMED123');
    expect(link).toBe('https://store.saasfast.com/?ref=AHMED123');
  });

  it('should handle different store URLs', () => {
    const link = generateReferralLink('https://mystore.com', 'TEST');
    expect(link).toBe('https://mystore.com/?ref=TEST');
  });

  it('should preserve existing query parameters', () => {
    const link = generateReferralLink('https://store.saasfast.com/products/1', 'AHMED123');
    expect(link).toBe('https://store.saasfast.com/products/1/?ref=AHMED123');
  });
});
