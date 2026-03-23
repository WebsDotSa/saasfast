import {
  MyFatoorahClient,
  type SendPaymentData,
  type ExecutePaymentData,
  type InitiatePaymentData,
  type PaymentStatusData,
  type WebhookPayload,
  verifyWebhookSignature,
  getStatusFromWebhook,
  extractCustomerReference,
  extractInvoiceId,
  isSuccessfulPayment,
} from 'myfatoorah-sdk';

// ═══════════════════════════════════════════════════════════════════════════════
// MyFatoorah Payment Gateway Integration
// ═══════════════════════════════════════════════════════════════════════════════
// SDK: https://github.com/jager-gg/myfatoorah-sdk
// Docs: https://myfatoorah-sdk.vercel.app
// ═══════════════════════════════════════════════════════════════════════════════

// إعدادات العميل
const isTestMode = process.env.MYFATOORAH_TEST_MODE === 'true';
const apiUrl = process.env.MYFATOORAH_API_URL || 'https://api-sa.myfatoorah.com';
const apiKey = process.env.MYFATOORAH_API_KEY || '';
const webhookSecret = process.env.MYFATOORAH_WEBHOOK_SECRET || '';
const country = process.env.MYFATOORAH_COUNTRY || 'SAU';

// إنشاء عميل MyFatoorah
export const myFatoorahClient = new MyFatoorahClient({
  apiUrl: isTestMode ? 'https://apitest.myfatoorah.com' : apiUrl,
  apiKey: apiKey,
  country: country as any,
  webhookSecret: webhookSecret,
});

// ───────────────────────────────────────────────────────────────────────────────
// Payment Methods
// ───────────────────────────────────────────────────────────────────────────────

/**
 * إنشاء رابط دفع (Hosted Payment Page)
 * الطريقة الموصى بها لمعظم الحالات
 */
export async function createPaymentLink(params: {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  customerReference: string; // Order ID أو Invoice ID
  callBackUrl: string;
  errorUrl: string;
  displayCurrency?: string;
  language?: 'ar' | 'en';
  invoiceItems?: Array<{
    ItemName: string;
    Quantity: number;
    UnitPrice: number;
  }>;
  expiresIn?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  metadata?: Record<string, unknown>;
}) {
  try {
    const paymentParams = {
      invoiceValue: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerReference: params.customerReference,
      callBackUrl: params.callBackUrl,
      errorUrl: params.errorUrl,
      language: params.language || 'ar',
      notificationOption: 'LNK' as const,
    };

    // إضافة اختيارية
    if (params.customerMobile) {
      (paymentParams as any).customerMobile = params.customerMobile;
      (paymentParams as any).mobileCountryCode = country === 'SAU' ? '+966' : '+965';
    }

    if (params.displayCurrency) {
      (paymentParams as any).displayCurrency = params.displayCurrency;
    }

    if (params.invoiceItems && params.invoiceItems.length > 0) {
      (paymentParams as any).invoiceItems = params.invoiceItems;
    }

    if (params.expiresIn) {
      (paymentParams as any).expiresIn = params.expiresIn;
    }

    if (params.metadata) {
      (paymentParams as any).metadata = params.metadata;
    }

    const response = await myFatoorahClient.sendPayment(paymentParams);

    return {
      success: true,
      data: response.Data,
      invoiceId: response.Data.InvoiceId,
      invoiceUrl: response.Data.InvoiceURL,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error creating payment link:', error);
    return {
      success: false,
      error: error.message || 'فشل إنشاء رابط الدفع',
    };
  }
}

/**
 * الحصول على طرق الدفع المتاحة
 */
export async function getAvailablePaymentMethods(amount: number, currency?: string) {
  try {
    const params: any = {
      amount,
    };

    if (currency) {
      params.currency = currency;
    }

    const response = await myFatoorahClient.initiatePayment(params);

    return {
      success: true,
      data: response.Data.PaymentMethods,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error getting payment methods:', error);
    return {
      success: false,
      error: error.message || 'فشل الحصول على طرق الدفع',
    };
  }
}

/**
 * تنفيذ الدفع لبوابة معينة
 * يُستخدم عند وجود UI مخصص لاختيار بوابة الدفع
 */
export async function executePayment(params: {
  paymentMethodId: number;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  customerReference: string;
  callBackUrl: string;
  errorUrl: string;
  displayCurrency?: string;
  language?: 'ar' | 'en';
  invoiceItems?: Array<{
    ItemName: string;
    Quantity: number;
    UnitPrice: number;
  }>;
  customerAddress?: {
    Block: string;
    Street: string;
    HouseBuildingNo: string;
    Address: string;
    AddressInstructions?: string;
  };
  metadata?: Record<string, unknown>;
}) {
  try {
    const paymentParams: any = {
      paymentMethodId: params.paymentMethodId,
      invoiceValue: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerReference: params.customerReference,
      callBackUrl: params.callBackUrl,
      errorUrl: params.errorUrl,
      language: params.language || 'ar',
    };

    // إضافة اختيارية
    if (params.customerMobile) {
      (paymentParams as any).customerMobile = params.customerMobile;
      (paymentParams as any).mobileCountryCode = country === 'SAU' ? '+966' : '+965';
    }

    if (params.displayCurrency) {
      (paymentParams as any).displayCurrency = params.displayCurrency;
    }

    if (params.invoiceItems && params.invoiceItems.length > 0) {
      (paymentParams as any).invoiceItems = params.invoiceItems;
    }

    if (params.customerAddress) {
      (paymentParams as any).customerAddress = params.customerAddress;
    }

    if (params.metadata) {
      (paymentParams as any).metadata = params.metadata;
    }

    const response = await myFatoorahClient.executePayment(paymentParams);

    return {
      success: true,
      data: response.Data,
      paymentUrl: response.Data.PaymentURL,
      invoiceId: response.Data.InvoiceId,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error executing payment:', error);
    return {
      success: false,
      error: error.message || 'فشل تنفيذ الدفع',
    };
  }
}

/**
 * التحقق من حالة الدفع
 */
export async function getPaymentStatus(params: {
  invoiceId?: string;
  paymentId?: string;
  customerReference?: string;
}) {
  try {
    let key: string;
    let keyType: 'InvoiceId' | 'PaymentId' | 'CustomerReference';

    if (params.invoiceId) {
      key = params.invoiceId;
      keyType = 'InvoiceId';
    } else if (params.paymentId) {
      key = params.paymentId;
      keyType = 'PaymentId';
    } else if (params.customerReference) {
      key = params.customerReference;
      keyType = 'CustomerReference';
    } else {
      throw new Error('يجب تقديم أحد: invoiceId، paymentId، أو customerReference');
    }

    const statusParams: any = {
      key,
      keyType,
    };

    const response = await myFatoorahClient.getPaymentStatus(statusParams);

    // الحصول على الحالة الموحدة
    const status = getStatusFromWebhook(response.Data as any);

    return {
      success: true,
      data: response.Data,
      status,
      invoiceId: (response.Data as any).InvoiceId,
      paymentId: (response.Data as any).PaymentId,
      customerReference: (response.Data as any).CustomerReference,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error getting payment status:', error);
    return {
      success: false,
      error: error.message || 'فشل التحقق من حالة الدفع',
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Webhook Handlers
// ───────────────────────────────────────────────────────────────────────────────

/**
 * التحقق من صحة Webhook
 */
export function verifyWebhook(payload: WebhookPayload, signature: string): boolean {
  try {
    return verifyWebhookSignature(payload, signature, webhookSecret);
  } catch (error) {
    console.error('[MyFatoorah] Webhook verification error:', error);
    return false;
  }
}

/**
 * معالجة Webhook
 * يُستخدم في API Route
 */
export async function handleWebhook(payload: WebhookPayload) {
  try {
    const status = getStatusFromWebhook(payload);
    const invoiceId = extractInvoiceId(payload);
    const customerReference = extractCustomerReference(payload);
    const isSuccess = isSuccessfulPayment(payload);

    return {
      success: true,
      status,
      invoiceId,
      customerReference,
      isSuccess,
      raw: payload,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Webhook handling error:', error);
    return {
      success: false,
      error: error.message || 'فشل معالجة Webhook',
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Refund Methods
// ───────────────────────────────────────────────────────────────────────────────

/**
 * إنشاء استرداد
 */
export async function createRefund(params: {
  invoiceId?: string;
  paymentId?: string;
  amount: number;
  comment: string;
  refundChargeOnCustomer?: boolean;
  serviceChargeOnCustomer?: boolean;
}) {
  try {
    if (!params.invoiceId && !params.paymentId) {
      throw new Error('يجب تقديم invoiceId أو paymentId');
    }

    const keyType = params.invoiceId ? 'InvoiceId' : 'PaymentId';
    const key = params.invoiceId || params.paymentId!;

    const response = await myFatoorahClient.makeRefund({
      KeyType: keyType as any,
      Key: key,
      RefundChargeOnCustomer: params.refundChargeOnCustomer || false,
      ServiceChargeOnCustomer: params.serviceChargeOnCustomer || false,
      Amount: params.amount,
      Comment: params.comment,
    });

    return {
      success: true,
      data: response.Data,
      refundId: response.Data.RefundId,
      refundStatus: response.Data.RefundStatus,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error creating refund:', error);
    return {
      success: false,
      error: error.message || 'فشل إنشاء الاسترداد',
    };
  }
}

/**
 * التحقق من حالة الاسترداد
 */
export async function getRefundStatus(refundId: string) {
  try {
    const response = await myFatoorahClient.getRefundStatus({
      key: refundId,
      keyType: 'RefundId',
    });

    return {
      success: true,
      data: response.Data,
      refundStatus: response.Data.RefundStatus,
      refundAmount: response.Data.Amount,
      refundDate: response.Data.RefundDate,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error getting refund status:', error);
    return {
      success: false,
      error: error.message || 'فشل التحقق من حالة الاسترداد',
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Recurring Payment Methods
// ───────────────────────────────────────────────────────────────────────────────

/**
 * الحصول على حالة الدفع الدوري
 */
export async function getRecurringPaymentStatus(recurringId: string) {
  try {
    const response = await myFatoorahClient.getRecurringPayment({
      key: recurringId,
      keyType: 'RecurringId',
    });

    return {
      success: true,
      data: response.Data,
      status: response.Data.RecurringStatus,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error getting recurring payment status:', error);
    return {
      success: false,
      error: error.message || 'فشل الحصول على حالة الدفع الدوري',
    };
  }
}

/**
 * إلغاء الدفع الدوري
 */
export async function cancelRecurringPayment(recurringId: string) {
  try {
    const response = await myFatoorahClient.cancelRecurringPayment(recurringId);

    return {
      success: true,
      data: response.Data,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error canceling recurring payment:', error);
    return {
      success: false,
      error: error.message || 'فشل إلغاء الدفع الدوري',
    };
  }
}

/**
 * استئناف الدفع الدوري
 */
export async function resumeRecurringPayment(recurringId: string) {
  try {
    const response = await myFatoorahClient.resumeRecurringPayment(recurringId);

    return {
      success: true,
      data: response.Data,
    };
  } catch (error: any) {
    console.error('[MyFatoorah] Error resuming recurring payment:', error);
    return {
      success: false,
      error: error.message || 'فشل استئناف الدفع الدوري',
    };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ───────────────────────────────────────────────────────────────────────────────

/**
 * الحصول على العملة الافتراضية للدولة
 */
export function getDefaultCurrency(): string {
  return myFatoorahClient.getDefaultCurrency();
}

/**
 * التحقق من وضع الاختبار
 */
export function isTestModeEnabled(): boolean {
  return myFatoorahClient.isTestMode();
}

// ═══════════════════════════════════════════════════════════════════════════════
// Export Types
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  WebhookPayload,
  SendPaymentData,
  ExecutePaymentData,
  InitiatePaymentData,
  PaymentStatusData,
};
