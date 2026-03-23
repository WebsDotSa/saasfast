# 📧 Email System - SaaS Core Platform

نظام إرسال الإيميلات التشغيلية (Transactional Emails) لمنصة SaaS.

## 📋 المميزات

- ✅ 6 قوالب إيميل جاهزة (Payment Success, Payment Failed, Trial Ending, etc.)
- ✅ دعم Resend و Custom SMTP
- ✅ React Email Templates بتصميم احترافي
- ✅ دعم اللغة العربية (RTL)
- ✅ Easy-to-use API

## 🚀 الإعداد

### 1. تثبيت الحزم

```bash
npm install @react-email/components @react-email/render nodemailer
```

### 2. إضافة متغيرات البيئة

في `.env.local`:

```bash
# خيار 1: Resend (موصى به)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# خيار 2: Custom SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

## 📦 القوالب المتوفرة

| القالب | الاستخدام |
|--------|-----------|
| `PaymentSuccessEmail` | نجاح الدفع |
| `PaymentFailedEmail` | فشل الدفع |
| `TrialEndingEmail` | تنبيه انتهاء الفترة التجريبية |
| `SubscriptionExpiredEmail` | انتهاء الاشتراك |
| `SubscriptionCancelledEmail` | إلغاء الاشتراك |
| `WelcomeEmail` | ترحيب بالمستخدم الجديد |
| `InvitationEmail` | دعوة عضو جديد |

## 💡 الاستخدام

### إرسال إيميل بسيط

```typescript
import { sendEmail } from '@/lib/emails';

await sendEmail({
  to: 'user@example.com',
  subject: 'مرحباً',
  html: '<p>هذا إيميل تجريبي</p>',
});
```

### إرسال باستخدام قالب

```typescript
import { sendPaymentSuccessEmail } from '@/lib/emails';

await sendPaymentSuccessEmail({
  to: 'user@example.com',
  tenantName: 'أحمد محمد',
  amount: '99.00',
  currency: 'SAR',
  invoiceNumber: 'INV-2026-001',
  planName: 'الخطة الاحترافية',
});
```

### إرسال Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/emails';

await sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'أحمد',
  tenantName: 'متجري',
  appName: 'SaaS Core',
});
```

### إرسال Invitation Email

```typescript
import { sendInvitationEmail } from '@/lib/emails';

await sendInvitationEmail({
  to: 'newuser@example.com',
  inviterName: 'أحمد محمد',
  tenantName: 'متجري',
  roleName: 'مدير',
  inviteLink: 'https://myapp.com/invite/abc123',
});
```

## 🎨 تخصيص القوالب

يمكنك تعديل القوالب في:

```
src/lib/emails/templates/
```

كل قالب هو React Component يستخدم @react-email/components.

### مثال: تعديل لون الزر

```typescript
const button = {
  backgroundColor: '#your-color', // غيّر اللون هنا
  borderRadius: '6px',
  // ...
};
```

## 🧪 الاختبار

### Development Mode

في وضع التطوير (بدون SMTP)، سيتم طباعة الإيميل في console:

```bash
📧 Email preview (JSON): {...}
```

### Preview القوالب

يمكنك استخدام [React Email Preview](https://react.email/docs/preview) لمعاينة القوالب:

```bash
npm install -g @react-email/cli
email dev
```

## 🔧 دوال الإرسال المتوفرة

```typescript
// دوال عامة
sendEmail(options: EmailOptions)
sendTemplateEmail(to, subject, template, props)
sendBatchEmails(emails: EmailOptions[])

// دوال محددة لكل قالب
sendPaymentSuccessEmail(to, props)
sendPaymentFailedEmail(to, props)
sendTrialEndingEmail(to, props)
sendSubscriptionExpiredEmail(to, props)
sendSubscriptionCancelledEmail(to, props)
sendWelcomeEmail(to, props)
sendInvitationEmail(to, props)
```

## 📝 ملاحظات مهمة

1. **SMTP Configuration**: تأكد من صحة إعدادات SMTP قبل الانتقال للإنتاج
2. **Domain Verification**: في Resend، يجب التحقق من domain قبل الإرسال
3. **Rate Limits**: انتبه لحدود الإرسال في خطتك
4. **Spam Prevention**: لا ترسل إيميلات غير مرغوب فيها

## 🔗 روابط مفيدة

- [React Email Docs](https://react.email/docs)
- [Resend Docs](https://resend.com/docs)
- [Nodemailer Docs](https://nodemailer.com/about/)

---

**تم التحديث:** 2026-03-20
**الحالة:** ✅ مكتمل
