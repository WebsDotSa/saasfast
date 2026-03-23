# 💳 MyFatoorah Payment Integration — دليل الإعداد

## ✅ ما تم إنجازه

تم تكامل منصة **MyFatoorah** بنجاح باستخدام الـ SDK الرسمي:

| الميزة | الحالة |
|--------|--------|
| SDK Installation | ✅ `myfatoorah-sdk` v2.x |
| Payment Link Creation | ✅ `createPaymentLink()` |
| Webhook Handler | ✅ `/api/payments/webhook` |
| Payment Callback | ✅ `/api/payments/callback` |
| Payment Status Check | ✅ `getPaymentStatus()` |
| Refund Support | ✅ `createRefund()` |
| Recurring Payments | ✅ `getRecurringPaymentStatus()` |

---

## 📋 الإعدادات المطلوبة

### 1. المتغيرات البيئية (.env.local)

```bash
# Test Mode (للتطوير)
MYFATOORAH_TEST_MODE=true

# Demo/Sandbox (للاختبار المتقدم)
MYFATOORAH_API_URL=https://apitest.myfatoorah.com
MYFATOORAH_API_KEY=your_demo_api_key_here
MYFATOORAH_WEBHOOK_SECRET=your_demo_webhook_secret_here

# Production (للدول المختلفة)
MYFATOORAH_PRODUCTION_API_URL=https://api-sa.myfatoorah.com
MYFATOORAH_PRODUCTION_API_KEY=your_production_api_key_here
MYFATOORAH_PRODUCTION_WEBHOOK_SECRET=your_production_webhook_secret_here
MYFATOORAH_COUNTRY=SAU
```

### 2. الحصول على المفاتيح

#### Demo Account (للتطوير)
1. اذهب إلى https://demo.myfatoorah.com
2. أنشئ حساب تجريبي
3. Dashboard → Settings → API Keys
4. انسخ API Key و Webhook Secret

#### Production Account (للبث المباشر)
1. اذهب إلى https://app.myfatoorah.com
2. Dashboard → Settings → API Keys
3. انسخ المفاتيح

### 3. إعداد Webhook

```
1. Dashboard → Settings → Webhooks
2. Add New Webhook
3. URL: https://yourdomain.com/api/payments/webhook
4. Events: Transaction Status Changed ✓
5. Copy Webhook Secret إلى .env.local
```

---

## 🚀 الاستخدام

### إنشاء رابط دفع (Hosted Payment Page)

```typescript
import { createPaymentLink } from '@/lib/myfatoorah';

const result = await createPaymentLink({
  amount: 299,
  customerName: 'أحمد محمد',
  customerEmail: 'ahmed@example.com',
  customerMobile: '0501234567',
  customerReference: 'ORDER-12345',
  callBackUrl: 'https://yoursite.com/api/payments/callback',
  errorUrl: 'https://yoursite.com/billing/error',
  displayCurrency: 'SAR',
  language: 'ar',
  invoiceItems: [
    {
      ItemName: 'الخطة الاحترافية',
      Quantity: 1,
      UnitPrice: 299,
    },
  ],
  expiresIn: { value: 24, unit: 'hours' },
});

if (result.success) {
  // Redirect user to result.invoiceUrl
  console.log('Payment URL:', result.invoiceUrl);
} else {
  console.error('Error:', result.error);
}
```

---

### التحقق من حالة الدفع

```typescript
import { getPaymentStatus } from '@/lib/myfatoorah';

const status = await getPaymentStatus({
  invoiceId: '12345',
  // أو
  // paymentId: '67890',
  // customerReference: 'ORDER-12345',
});

if (status.success) {
  console.log('Payment Status:', status.status);
  // "success" | "failed" | "pending" | "canceled" | "expired" | "refunded"
}
```

---

### معالجة Webhook

```typescript
// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhook,
  handleWebhook,
  getPaymentStatus,
} from '@/lib/myfatoorah';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('myfatoorah-signature') || '';
  const payload = await request.json();

  // التحقق من signature
  const isValid = verifyWebhook(payload, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // معالجة webhook
  const result = await handleWebhook(payload);

  if (result.isSuccess) {
    // تحديث الطلب/الاشتراك في قاعدة البيانات
    console.log('Payment successful:', result.customerReference);
  }

  return NextResponse.json({ received: true });
}
```

---

## 📁 الملفات المنشأة

```
src/
├── lib/
│   └── myfatoorah.ts           ✅ MyFatoorah Integration
└── app/
    └── api/
        └── payments/
            ├── webhook/
            │   └── route.ts    ✅ Webhook Handler
            ├── initiate/
            │   └── route.ts    ✅ Create Payment
            └── callback/
                └── route.ts    ✅ Payment Callback
```

---

## 🧪 الاختبار

### Test Mode

```typescript
// لا يحتاج API Key
const client = new MyFatoorahClient({ testMode: true });

// سيعمل بشكل طبيعي لكن بدون معالجة webhooks الحقيقية
```

### Demo Mode

1. استخدم مفاتيح demo من .env.local
2. اختبر جميع الميزات بما فيها webhooks
3. انتظر الموافقة على الحساب (24 ساعة)

### Production

1. غيّر `MYFATOORAH_TEST_MODE=false`
2. استخدم مفاتيح production
3. اختبر بمبالغ صغيرة أولاً

---

## 💡 نصائح مهمة

### 1. Webhook Testing

```bash
# استخدم ngrok لاختبار webhooks محلياً
ngrok http 3000

# Webhook URL: https://your-ngrok-url.ngrok.io/api/payments/webhook
```

### 2. Error Handling

```typescript
const result = await createPaymentLink({...});

if (!result.success) {
  // Handle error
  console.error('Payment error:', result.error);
}
```

### 3. Security

- ✅ تحقق دائماً من webhook signature
- ✅ استخدم HTTPS في production
- ✅ لا تشارك API keys في client-side code
- ✅ احفظ المفاتيح في .env.local فقط

### 4. Currencies

| الدولة | العملة | API URL |
|--------|--------|---------|
| Saudi Arabia | SAR | api-sa.myfatoorah.com |
| Kuwait | KWD | api.myfatoorah.com |
| Bahrain | BHD | api.myfatoorah.com |
| UAE | AED | api.myfatoorah.com |
| Qatar | QAR | api-qa.myfatoorah.com |
| Oman | OMR | api.myfatoorah.com |
| Jordan | JOD | api.myfatoorah.com |
| Egypt | EGP | api-eg.myfatoorah.com |

---

## 🔗 روابط مهمة

| المصدر | الرابط |
|--------|--------|
| MyFatoorah SDK | https://github.com/jager-gg/myfatoorah-sdk |
| MyFatoorah Docs | https://myfatoorah-sdk.vercel.app |
| NPM Package | https://www.npmjs.com/package/myfatoorah-sdk |
| MyFatoorah Dashboard | https://app.myfatoorah.com |
| Demo Dashboard | https://demo.myfatoorah.com |

---

## 🐛 استكشاف الأخطاء

### مشكلة: "Invalid API Key"

```bash
# تأكد من:
1. API Key صحيح من dashboard
2. MYFATOORAH_API_URL صحيح (test vs production)
3. MYFATOORAH_TEST_MODE مضبوط بشكل صحيح
```

### مشكلة: "Webhook signature failed"

```bash
# تأكد من:
1. MYFATOORAH_WEBHOOK_SECRET صحيح
2. Header name: myfatoorah-signature أو MyFatoorah-Signature
3. payload لم يتغير قبل التحقق
```

### مشكلة: "Payment not updating"

```bash
# تأكد من:
1. Webhook URL مضبوط في dashboard
2. Webhook events: Transaction Status Changed ✓
3. customerReference يتطابق مع invoice_number
```

---

## ✅ Checklist قبل الإطلاق

- [ ] تغيير `MYFATOORAH_TEST_MODE=false`
- [ ] استخدام مفاتيح production
- [ ] إعداد webhook URL الصحيح
- [ ] اختبار دفعة حقيقية بمبلغ صغير
- [ ] التحقق من webhook يعمل
- [ ] تفعيل HTTPS
- [ ] مراجعة audit logs

---

**الحالة:** ✅ مكتمل  
**آخر تحديث:** 2025-03-20
