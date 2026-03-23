// ═══════════════════════════════════════════════════════════════════════════════
// Marketing Module - Discounts Engine
// ═══════════════════════════════════════════════════════════════════════════════
// محرك الخصومات المتقدم - دعم 6 أنواع من الخصومات مع تحقق شامل
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { discounts, discountUsageLogs, customerDiscountUsage } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, gt, lt, or, inArray } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping' 
  | 'buy_x_get_y' 
  | 'bundle' 
  | 'tiered';

export type ApplyingMethod = 'automatic' | 'coupon_code';

export type AppliesTo = 
  | 'all' 
  | 'specific_products' 
  | 'specific_categories' 
  | 'specific_customers' 
  | 'specific_regions';

export interface Discount {
  id: string;
  tenantId: string;
  discountType: DiscountType;
  applyingMethod: ApplyingMethod;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  code?: string;
  value: number;
  maxUses?: number;
  usedCount: number;
  usesPerCustomer?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  appliesTo: AppliesTo;
  productIds: string[];
  categoryIds: string[];
  customerIds: string[];
  regionIds: string[];
  collectionIds: string[];
  paymentMethod?: string;
  startsAt: Date;
  endsAt?: Date;
  isActive: boolean;
  priority: number;
  isCombinable: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface OrderContext {
  subtotal: number;
  products: Array<{
    id: string;
    categoryId?: string;
    collectionId?: string;
    price: number;
    quantity: number;
  }>;
  customerId?: string;
  customerEmail?: string;
  regionId?: string;
  paymentMethod?: string;
  shippingAmount?: number;
}

export interface ValidationResult {
  valid: boolean;
  discount?: Discount;
  savings?: number;
  finalAmount?: number;
  errors: string[];
  warnings: string[];
  appliedDiscounts?: Array<{
    discountId: string;
    discountName: string;
    discountType: DiscountType;
    amount: number;
  }>;
}

export interface CreateDiscountInput {
  tenantId: string;
  discountType: DiscountType;
  applyingMethod: ApplyingMethod;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  code?: string;
  value: number;
  maxUses?: number;
  usesPerCustomer?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  appliesTo: AppliesTo;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
  regionIds?: string[];
  collectionIds?: string[];
  paymentMethod?: string;
  startsAt?: Date;
  endsAt?: Date;
  isCombinable?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface ApplyDiscountResult {
  success: boolean;
  discountId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  savings: number;
  message: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Discount Validation Engine
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Validate a discount coupon code
 */
export async function validateCoupon(
  code: string,
  tenantId: string,
  orderContext: OrderContext
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Find the discount by code
    const discount = await db.query.discounts.findFirst({
      where: and(
        eq(discounts.code, code.toUpperCase()),
        eq(discounts.tenantId, tenantId),
        eq(discounts.isActive, true),
        isNull(discounts.deletedAt)
      ),
    });

    if (!discount) {
      return {
        valid: false,
        errors: ['كود الخصم غير صحيح أو غير موجود'],
        warnings: [],
      };
    }

    // 2. Validate time constraints
    const now = new Date();
    
    if (discount.startsAt && now < discount.startsAt) {
      errors.push(`الخصم سيبدأ في ${formatDate(discount.startsAt)}`);
    }

    if (discount.endsAt && now > discount.endsAt) {
      errors.push('انتهت صلاحية هذا الخصم');
    }

    // 3. Validate usage limits
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      errors.push('تم استهلاك الحد الأقصى لاستخدامات هذا الخصم');
    }

    // 4. Validate per-customer usage
    if (discount.usesPerCustomer && orderContext.customerId) {
      const customerUsage = await db.query.customerDiscountUsage.findFirst({
        where: and(
          eq(customerDiscountUsage.discountId, discount.id),
          eq(customerDiscountUsage.customerId, orderContext.customerId)
        ),
      });

      if (customerUsage && customerUsage.usageCount >= discount.usesPerCustomer) {
        errors.push(`لقد استخدمت هذا الخصم ${discount.usesPerCustomer} مرات بالفعل`);
      }
    }

    // 5. Validate minimum order amount
    if (discount.minOrderAmount && orderContext.subtotal < Number(discount.minOrderAmount)) {
      errors.push(`الحد الأدنى للطلب هو ${discount.minOrderAmount} ريال لتطبيق هذا الخصم`);
    }

    // 6. Validate product/category restrictions
    if (discount.appliesTo === 'specific_products' && discount.productIds?.length) {
      const hasProduct = orderContext.products.some(p =>
        discount.productIds!.includes(p.id)
      );

      if (!hasProduct) {
        errors.push('هذا الخصم لا ينطبق على المنتجات في سلتك');
        warnings.push('الخصم متاح لمنتجات محددة فقط');
      }
    }

    if (discount.appliesTo === 'specific_categories' && discount.categoryIds?.length) {
      const hasCategory = orderContext.products.some(p =>
        p.categoryId && discount.categoryIds!.includes(p.categoryId)
      );

      if (!hasCategory) {
        errors.push('هذا الخصم لا ينطبق على تصنيفات المنتجات في سلتك');
      }
    }

    // 7. Validate customer restrictions
    if (discount.appliesTo === 'specific_customers' && discount.customerIds?.length) {
      if (!orderContext.customerId || !discount.customerIds.includes(orderContext.customerId)) {
        errors.push('هذا الخصم متاح لعملاء محددين فقط');
      }
    }

    // 8. Validate region restrictions
    if (discount.regionIds?.length && orderContext.regionId) {
      if (!discount.regionIds.includes(orderContext.regionId)) {
        errors.push('هذا الخصم غير متاح في منطقتك الجغرافية');
      }
    }

    // 9. Validate payment method
    if (discount.paymentMethod && orderContext.paymentMethod) {
      if (discount.paymentMethod !== orderContext.paymentMethod) {
        errors.push(`هذا الخصم متاح فقط عند الدفع بـ ${getPaymentMethodName(discount.paymentMethod)}`);
      }
    }

    // If there are errors, return invalid result
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
      };
    }

    // 10. Calculate savings
    const savings = calculateDiscountSavings(discount as unknown as Discount, orderContext);

    // 11. Apply max discount cap if set
    let finalSavings = savings;
    if (discount.maxDiscountAmount && savings > Number(discount.maxDiscountAmount)) {
      finalSavings = Number(discount.maxDiscountAmount);
      warnings.push(`الخصم محدود بحد أقصى ${discount.maxDiscountAmount} ريال`);
    }

    const finalAmount = orderContext.subtotal - finalSavings;

    return {
      valid: true,
      discount: discount as unknown as Discount,
      savings: finalSavings,
      finalAmount: Math.max(0, finalAmount),
      errors: [],
      warnings,
    };

  } catch (error) {
    console.error('[Discounts] Error validating coupon:', error);
    return {
      valid: false,
      errors: ['حدث خطأ أثناء التحقق من الخصم'],
      warnings: [],
    };
  }
}

/**
 * Validate automatic discounts for an order
 */
export async function validateAutomaticDiscounts(
  tenantId: string,
  orderContext: OrderContext
): Promise<ValidationResult[]> {
  try {
    const now = new Date();

    // Get all active automatic discounts
    const automaticDiscounts = await db.query.discounts.findMany({
      where: and(
        eq(discounts.applyingMethod, 'automatic'),
        eq(discounts.isActive, true),
        eq(discounts.tenantId, tenantId),
        isNull(discounts.deletedAt),
        or(
          isNull(discounts.startsAt),
          lte(discounts.startsAt, now)
        ),
        or(
          isNull(discounts.endsAt),
          gte(discounts.endsAt, now)
        )
      ),
      orderBy: (discounts, { desc }) => [desc(discounts.priority)],
    });

    const results: ValidationResult[] = [];

    for (const discount of automaticDiscounts) {
      // Check usage limits
      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        continue;
      }

      // Check minimum order amount
      if (discount.minOrderAmount && orderContext.subtotal < Number(discount.minOrderAmount)) {
        continue;
      }

      // Check product/category restrictions
      if (discount.appliesTo === 'specific_products' && discount.productIds?.length) {
        const hasProduct = orderContext.products.some(p =>
          discount.productIds!.includes(p.id)
        );
        if (!hasProduct) continue;
      }

      if (discount.appliesTo === 'specific_categories' && discount.categoryIds?.length) {
        const hasCategory = orderContext.products.some(p =>
          p.categoryId && discount.categoryIds!.includes(p.categoryId)
        );
        if (!hasCategory) continue;
      }

      // Check customer restrictions
      if (discount.appliesTo === 'specific_customers' && discount.customerIds?.length) {
        if (!orderContext.customerId || !discount.customerIds.includes(orderContext.customerId)) {
          continue;
        }
      }

      // Check payment method
      if (discount.paymentMethod && orderContext.paymentMethod) {
        if (discount.paymentMethod !== orderContext.paymentMethod) {
          continue;
        }
      }

      // Calculate savings
      const savings = calculateDiscountSavings(discount as unknown as Discount, orderContext);
      const finalSavings = discount.maxDiscountAmount
        ? Math.min(savings, Number(discount.maxDiscountAmount))
        : savings;

      results.push({
        valid: true,
        discount: discount as unknown as Discount,
        savings: finalSavings,
        finalAmount: orderContext.subtotal - finalSavings,
        errors: [],
        warnings: [],
      });
    }

    return results;

  } catch (error) {
    console.error('[Discounts] Error validating automatic discounts:', error);
    return [];
  }
}

/**
 * Apply multiple discounts to an order (respecting combinability rules)
 */
export async function applyDiscounts(
  tenantId: string,
  orderContext: OrderContext,
  couponCode?: string
): Promise<ValidationResult> {
  const appliedDiscounts: Array<{
    discountId: string;
    discountName: string;
    discountType: DiscountType;
    amount: number;
    isCombinable: boolean;
  }> = [];

  let totalSavings = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Validate and apply coupon code first if provided
    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, tenantId, orderContext);

      if (!couponResult.valid || !couponResult.discount || !couponResult.savings) {
        return {
          valid: false,
          errors: couponResult.errors,
          warnings: couponResult.warnings,
        };
      }

      appliedDiscounts.push({
        discountId: couponResult.discount.id,
        discountName: couponResult.discount.nameAr,
        discountType: couponResult.discount.discountType,
        amount: couponResult.savings,
        isCombinable: couponResult.discount.isCombinable,
      });

      totalSavings += couponResult.savings;

      // If coupon is not combinable, return immediately
      if (!couponResult.discount.isCombinable) {
        return {
          valid: true,
          discount: couponResult.discount,
          savings: couponResult.savings,
          finalAmount: orderContext.subtotal - couponResult.savings,
          errors: [],
          warnings: [],
          appliedDiscounts: [{
            discountId: couponResult.discount.id,
            discountName: couponResult.discount.nameAr,
            discountType: couponResult.discount.discountType,
            amount: couponResult.savings,
          }],
        };
      }
    }

    // 2. Get automatic discounts
    const automaticResults = await validateAutomaticDiscounts(tenantId, orderContext);

    // 3. Apply combinable automatic discounts
    for (const result of automaticResults) {
      if (result.valid && result.discount && result.savings) {
        // Skip if we already have a non-combinable discount
        const hasNonCombinable = appliedDiscounts.some(d => !d.isCombinable);
        if (hasNonCombinable) continue;

        // Skip if this automatic discount is not combinable and we already have discounts
        if (!result.discount.isCombinable && appliedDiscounts.length > 0) {
          continue;
        }

        appliedDiscounts.push({
          discountId: result.discount.id,
          discountName: result.discount.nameAr,
          discountType: result.discount.discountType,
          amount: result.savings,
          isCombinable: result.discount.isCombinable,
        });

        totalSavings += result.savings;
      }
    }

    // 4. Calculate final amount
    const finalAmount = Math.max(0, orderContext.subtotal - totalSavings);

    return {
      valid: true,
      savings: totalSavings,
      finalAmount,
      errors: [],
      warnings,
      appliedDiscounts: appliedDiscounts.map(d => ({
        discountId: d.discountId,
        discountName: d.discountName,
        discountType: d.discountType,
        amount: d.amount,
      })),
    };

  } catch (error) {
    console.error('[Discounts] Error applying discounts:', error);
    return {
      valid: false,
      errors: ['حدث خطأ أثناء تطبيق الخصومات'],
      warnings: [],
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Discount Calculation Helpers
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the discount amount based on discount type and order context
 */
export function calculateDiscountSavings(
  discount: Discount,
  orderContext: OrderContext
): number {
  let savings = 0;

  switch (discount.discountType) {
    case 'percentage':
      // Apply percentage to subtotal
      savings = orderContext.subtotal * (discount.value / 100);
      break;

    case 'fixed_amount':
      // Fixed amount discount
      savings = discount.value;
      // Don't allow discount to exceed order total
      savings = Math.min(savings, orderContext.subtotal);
      break;

    case 'free_shipping':
      // Free shipping discount
      savings = orderContext.shippingAmount || 0;
      break;

    case 'buy_x_get_y':
      // Buy X get Y free - implemented via metadata
      // Example: { buy: 2, get: 1, applicableProducts: [...] }
      const config = discount.metadata as { buy?: number; get?: number; applicableProducts?: string[] };
      if (config.buy && config.get) {
        const eligibleProducts = orderContext.products.filter(
          p => !config.applicableProducts || config.applicableProducts.includes(p.id)
        );
        
        // Count total quantity
        const totalQuantity = eligibleProducts.reduce((sum, p) => sum + p.quantity, 0);
        
        // Calculate free items
        const freeItems = Math.floor(totalQuantity / config.buy) * config.get;
        
        // Find cheapest product price for free items
        const cheapestPrice = Math.min(...eligibleProducts.map(p => p.price));
        
        savings = freeItems * cheapestPrice;
      }
      break;

    case 'bundle':
      // Bundle discount - fixed price for a set of products
      const bundleConfig = discount.metadata as { products?: string[]; bundlePrice?: number };
      if (bundleConfig.products && bundleConfig.bundlePrice) {
        const bundleProducts = orderContext.products.filter(
          p => bundleConfig.products!.includes(p.id)
        );

        if (bundleProducts.length > 0) {
          const originalPrice = bundleProducts.reduce(
            (sum, p) => sum + (p.price * p.quantity),
            0
          );
          savings = originalPrice - bundleConfig.bundlePrice;
        }
      }
      break;

    case 'tiered':
      // Tiered discount based on order amount
      const tiers = discount.metadata as { minAmount: number; rate: number }[];
      const applicableTier = tiers
        .filter(t => orderContext.subtotal >= t.minAmount)
        .sort((a, b) => b.minAmount - a.minAmount)[0];

      if (applicableTier) {
        savings = orderContext.subtotal * (applicableTier.rate / 100);
      }
      break;

    default:
      savings = 0;
  }

  return Math.max(0, savings);
}

// ───────────────────────────────────────────────────────────────────────────────
// Discount CRUD Operations
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Create a new discount
 */
export async function createDiscount(input: CreateDiscountInput): Promise<Discount> {
  try {
    const [discount] = await db.insert(discounts).values({
      tenant_id: input.tenantId,
      discount_type: input.discountType,
      applying_method: input.applyingMethod,
      name_ar: input.nameAr,
      name_en: input.nameEn,
      description_ar: input.descriptionAr,
      code: input.code?.toUpperCase(),
      value: input.value.toString(),
      max_uses: input.maxUses,
      uses_per_customer: input.usesPerCustomer,
      min_order_amount: input.minOrderAmount?.toString(),
      max_discount_amount: input.maxDiscountAmount?.toString(),
      applies_to: input.appliesTo,
      product_ids: input.productIds || [],
      category_ids: input.categoryIds || [],
      customer_ids: input.customerIds || [],
      region_ids: input.regionIds || [],
      collection_ids: input.collectionIds || [],
      payment_method: input.paymentMethod,
      starts_at: input.startsAt || new Date(),
      ends_at: input.endsAt,
      is_combinable: input.isCombinable ?? false,
      priority: input.priority ?? 0,
      metadata: input.metadata || {},
    } as any).returning();

    return discount as unknown as Discount;

  } catch (error) {
    console.error('[Discounts] Error creating discount:', error);
    throw new Error('فشل إنشاء الخصم');
  }
}

/**
 * Get discount by ID
 */
export async function getDiscountById(id: string, tenantId: string): Promise<Discount | null> {
  try {
    const discount = await db.query.discounts.findFirst({
      where: and(
        eq(discounts.id, id),
        eq(discounts.tenantId, tenantId),
        isNull(discounts.deletedAt)
      ),
    });

    return discount as unknown as Discount | null;

  } catch (error) {
    console.error('[Discounts] Error getting discount:', error);
    return null;
  }
}

/**
 * List all discounts for a tenant
 */
export async function listDiscounts(
  tenantId: string,
  options?: {
    isActive?: boolean;
    discountType?: DiscountType;
    limit?: number;
    offset?: number;
  }
): Promise<{ discounts: Discount[]; total: number }> {
  try {
    const conditions = [
      eq(discounts.tenantId, tenantId),
      isNull(discounts.deletedAt),
    ];

    if (options?.isActive !== undefined) {
      conditions.push(eq(discounts.isActive, options.isActive));
    }

    if (options?.discountType) {
      conditions.push(eq(discounts.discountType, options.discountType));
    }

    const [discountList, totalResult] = await Promise.all([
      db.query.discounts.findMany({
        where: and(...conditions),
        orderBy: (discounts, { desc }) => [desc(discounts.createdAt)],
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      }),
      db.select({ count: discounts.id }).from(discounts).where(and(...conditions)),
    ]);

    return {
      discounts: discountList as unknown as Discount[],
      total: totalResult.length,
    };

  } catch (error) {
    console.error('[Discounts] Error listing discounts:', error);
    return { discounts: [], total: 0 };
  }
}

/**
 * Update a discount
 */
export async function updateDiscount(
  id: string,
  tenantId: string,
  input: Partial<CreateDiscountInput>
): Promise<Discount | null> {
  try {
    const [discount] = await db.update(discounts)
      .set({
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        descriptionAr: input.descriptionAr,
        code: input.code?.toUpperCase(),
        value: input.value?.toString(),
        maxUses: input.maxUses,
        usesPerCustomer: input.usesPerCustomer,
        minOrderAmount: input.minOrderAmount?.toString(),
        maxDiscountAmount: input.maxDiscountAmount?.toString(),
        appliesTo: input.appliesTo,
        productIds: input.productIds,
        categoryIds: input.categoryIds,
        customerIds: input.customerIds,
        regionIds: input.regionIds,
        collectionIds: input.collectionIds,
        paymentMethod: input.paymentMethod,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isCombinable: input.isCombinable,
        priority: input.priority,
        metadata: input.metadata,
        updatedAt: new Date(),
      })
      .where(and(
        eq(discounts.id, id),
        eq(discounts.tenantId, tenantId),
        isNull(discounts.deletedAt)
      ))
      .returning();

    return discount as unknown as Discount | null;

  } catch (error) {
    console.error('[Discounts] Error updating discount:', error);
    return null;
  }
}

/**
 * Delete a discount (soft delete)
 */
export async function deleteDiscount(id: string, tenantId: string): Promise<boolean> {
  try {
    await db.update(discounts)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(discounts.id, id),
        eq(discounts.tenantId, tenantId)
      ));

    return true;

  } catch (error) {
    console.error('[Discounts] Error deleting discount:', error);
    return false;
  }
}

/**
 * Activate/Deactivate a discount
 */
export async function toggleDiscountStatus(
  id: string,
  tenantId: string,
  isActive: boolean
): Promise<Discount | null> {
  try {
    const [discount] = await db.update(discounts)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(and(
        eq(discounts.id, id),
        eq(discounts.tenantId, tenantId),
        isNull(discounts.deletedAt)
      ))
      .returning();

    return discount as unknown as Discount | null;

  } catch (error) {
    console.error('[Discounts] Error toggling discount status:', error);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Discount Usage Tracking
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Record discount usage after successful order
 */
export async function recordDiscountUsage(
  discountId: string,
  tenantId: string,
  data: {
    orderId: string;
    orderAmount: number;
    discountAmount: number;
    customerId?: string;
    customerEmail?: string;
  }
): Promise<boolean> {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // 1. Get current usage count and increment
      const usageCount = await tx.select({ count: discountUsageLogs.id })
        .from(discountUsageLogs)
        .where(eq(discountUsageLogs.discountId, discountId));

      await tx.update(discounts)
        .set({
          usedCount: usageCount.length,
          updatedAt: new Date(),
        })
        .where(eq(discounts.id, discountId));

      // 2. Log the usage
      await tx.insert(discountUsageLogs).values({
        tenant_id: tenantId,
        discount_id: discountId,
        order_id: data.orderId,
        order_amount: data.orderAmount.toString(),
        discount_amount: data.discountAmount.toString(),
        customer_id: data.customerId,
        customer_email: data.customerEmail,
        status: 'applied',
        used_at: new Date(),
      } as any);

      // 3. Update customer usage count
      if (data.customerId) {
        const existingUsage = await tx.query.customerDiscountUsage.findFirst({
          where: and(
            eq(customerDiscountUsage.discountId, discountId),
            eq(customerDiscountUsage.customerId, data.customerId!)
          ),
        });

        if (existingUsage) {
          await tx.update(customerDiscountUsage)
            .set({
              usageCount: existingUsage.usageCount + 1,
              lastUsedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(customerDiscountUsage.id, existingUsage.id));
        } else {
          await tx.insert(customerDiscountUsage).values({
            tenantId,
            discountId,
            customerId: data.customerId,
            usageCount: 1,
            lastUsedAt: new Date(),
          });
        }
      }
    });

    return true;

  } catch (error) {
    console.error('[Discounts] Error recording discount usage:', error);
    return false;
  }
}

/**
 * Cancel discount usage (for refunded orders)
 */
export async function cancelDiscountUsage(
  discountId: string,
  orderId: string
): Promise<boolean> {
  try {
    await db.update(discountUsageLogs)
      .set({
        status: 'cancelled',
      })
      .where(and(
        eq(discountUsageLogs.discountId, discountId),
        eq(discountUsageLogs.orderId, orderId)
      ));

    return true;

  } catch (error) {
    console.error('[Discounts] Error cancelling discount usage:', error);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getPaymentMethodName(method: string): string {
  const names: Record<string, string> = {
    mada: 'مدى',
    credit: 'بطاقة ائتمان',
    stc_pay: 'STC Pay',
    apple_pay: 'Apple Pay',
    bank_transfer: 'تحويل بنكي',
  };
  return names[method] || method;
}

/**
 * Check if a discount is currently active
 */
export function isDiscountActive(discount: Discount): boolean {
  if (!discount.isActive) return false;
  
  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) return false;
  if (discount.endsAt && now > discount.endsAt) return false;
  if (discount.maxUses && discount.usedCount >= discount.maxUses) return false;
  
  return true;
}

/**
 * Get discount status label
 */
export function getDiscountStatus(discount: Discount): string {
  if (!discount.isActive) return 'غير نشط';
  
  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) return 'قريباً';
  if (discount.endsAt && now > discount.endsAt) return 'منتهي';
  if (discount.maxUses && discount.usedCount >= discount.maxUses) return 'مستنفذ';
  
  return 'نشط';
}

// ───────────────────────────────────────────────────────────────────────────────
// Export all functions
// ───────────────────────────────────────────────────────────────────────────────

export default {
  validateCoupon,
  validateAutomaticDiscounts,
  applyDiscounts,
  calculateDiscountSavings,
  createDiscount,
  getDiscountById,
  listDiscounts,
  updateDiscount,
  deleteDiscount,
  toggleDiscountStatus,
  recordDiscountUsage,
  cancelDiscountUsage,
  isDiscountActive,
  getDiscountStatus,
};
