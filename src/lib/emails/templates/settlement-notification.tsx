// ═══════════════════════════════════════════════════════════════════════════════
// Settlement Notification Email Template
// Description: إرسال إشعار بالتحويل للتاجر
// ═══════════════════════════════════════════════════════════════════════════════

interface SettlementEmailData {
  tenantName?: string;
  amount?: string;
  currency?: string;
  bankReference?: string;
  settlementNumber?: string;
  settlementDate?: string;
}

export function SettlementNotification(data: SettlementEmailData) {
  const {
    tenantName,
    amount,
    currency,
    bankReference,
    settlementNumber,
    settlementDate,
  } = data;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إشعار تحويل رصيد</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin-bottom: 8px; }
    .header p { color: rgba(255,255,255,0.9); font-size: 14px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .message { font-size: 15px; color: #666; line-height: 1.6; margin-bottom: 25px; }
    .details-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #333; font-weight: 600; font-size: 14px; }
    .detail-value.highlight { color: #10b981; font-size: 18px; }
    .success-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #666; font-size: 13px; margin-bottom: 10px; }
    .footer-links { margin-top: 15px; }
    .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>💰 إشعار تحويل رصيد</h1>
      <p>تم تحويل المبلغ بنجاح إلى حسابك البنكي</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="success-badge">✓ تم التحويل بنجاح</div>
      
      <div class="greeting">
        أهلاً ${tenantName}،
      </div>

      <div class="message">
        نود إعلامكم بأنه قد تم تحويل المبلغ المستحق إلى حسابكم البنكي بنجاح. 
        يمكنكم متابعة تفاصيل التحويل من خلال لوحة التحكم.
      </div>

      <!-- Settlement Details -->
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">رقم التسوية</span>
          <span class="detail-value">${settlementNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">تاريخ التحويل</span>
          <span class="detail-value">${new Date(settlementDate || Date.now()).toLocaleDateString('ar-SA')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">رقم التحويل البنكي</span>
          <span class="detail-value">${bankReference}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">العملة</span>
          <span class="detail-value">${currency}</span>
        </div>
        <div class="detail-row" style="background: #f0fdf4; padding: 15px; margin: 10px -20px -20px -20px; border-radius: 8px;">
          <span class="detail-label">المبلغ المحوّل</span>
          <span class="detail-value highlight">${Number(amount).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ${currency}</span>
        </div>
      </div>

      <div class="message">
        <strong>ملاحظة:</strong> قد يستغرق وصول المبلغ إلى حسابكم البنكي من 1-3 أيام عمل حسب البنك.
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="/dashboard/payments" class="cta-button">
          عرض التفاصيل في لوحة التحكم
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        شكرًا لاستخدامكم منصتنا
      </div>
      <div class="footer-links">
        <a href="/dashboard/payments">المدفوعات</a>
        <a href="/dashboard/settings">الإعدادات</a>
        <a href="/support">الدعم الفني</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ───────────────────────────────────────────────────────────────────────────────
// Send Settlement Email Function
// ───────────────────────────────────────────────────────────────────────────────

export async function sendSettlementEmail(
  to: string,
  data: SettlementEmailData
) {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const html = SettlementNotification(data);

    await transporter.sendMail({
      from: `"SaaS Fast Payments" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject: `✅ تم تحويل رصيد بنجاح - ${data.settlementNumber}`,
      html,
      text: `
تم تحويل رصيدك بنجاح!

رقم التسوية: ${data.settlementNumber}
المبلغ: ${data.amount} ${data.currency}
رقم التحويل البنكي: ${data.bankReference}
تاريخ التحويل: ${new Date(data.settlementDate || Date.now()).toLocaleDateString('ar-SA')}

شكرًا لاستخدامكم منصتنا.
      `,
    });

    console.log('[Settlement Email] Sent successfully to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('[Settlement Email] Error:', error);
    return { success: false, error: error.message };
  }
}
