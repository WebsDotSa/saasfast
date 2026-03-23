import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';

// Types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateProps {
  [key: string]: string | number | undefined;
}

// Transporter configuration
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    // Use custom SMTP
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else if (process.env.RESEND_API_KEY) {
    // Use Resend SMTP relay
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  } else {
    // Use console logger for development
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailer = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@saascore.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await mailer.sendMail(mailOptions);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email sent:', info.messageId);
      if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
        console.log('📧 Email preview (JSON):', JSON.parse(info.messageId));
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Render a React Email template and send
 */
export async function sendTemplateEmail<T extends EmailTemplateProps>(
  to: string,
  subject: string,
  templateComponent: React.FC<T>,
  props: T
): Promise<boolean> {
  try {
    // Render the template to HTML
    const html = await render(React.createElement(templateComponent, props));

    // Send the email
    return await sendEmail({
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('❌ Error sending template email:', error);
    return false;
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// Convenience functions for common email types
export async function sendPaymentSuccessEmail(
  to: string,
  props: {
    tenantName?: string;
    amount?: string;
    currency?: string;
    invoiceNumber?: string;
    planName?: string;
  }
) {
  const { PaymentSuccessEmail } = await import('./templates/payment-success');
  return sendTemplateEmail(
    to,
    '✅ تم نجاح الدفع',
    PaymentSuccessEmail,
    props
  );
}

export async function sendPaymentFailedEmail(
  to: string,
  props: {
    tenantName?: string;
    amount?: string;
    currency?: string;
    invoiceNumber?: string;
    planName?: string;
  }
) {
  const { PaymentFailedEmail } = await import('./templates/payment-failed');
  return sendTemplateEmail(
    to,
    '❌ فشل الدفع',
    PaymentFailedEmail,
    props
  );
}

export async function sendTrialEndingEmail(
  to: string,
  props: {
    tenantName?: string;
    daysRemaining?: number;
    planName?: string;
  }
) {
  const { TrialEndingEmail } = await import('./templates/trial-ending');
  return sendTemplateEmail(
    to,
    '⏰ فترة تجريبية تنتهي قريباً',
    TrialEndingEmail,
    props
  );
}

export async function sendSubscriptionExpiredEmail(
  to: string,
  props: {
    tenantName?: string;
    planName?: string;
    expiryDate?: string;
  }
) {
  const { SubscriptionExpiredEmail } = await import('./templates/subscription-expired');
  return sendTemplateEmail(
    to,
    '⚠️ انتهى اشتراكك',
    SubscriptionExpiredEmail,
    props
  );
}

export async function sendSubscriptionCancelledEmail(
  to: string,
  props: {
    tenantName?: string;
    planName?: string;
    cancellationDate?: string;
    accessUntil?: string;
  }
) {
  const { SubscriptionCancelledEmail } = await import('./templates/subscription-cancelled');
  return sendTemplateEmail(
    to,
    'تم إلغاء الاشتراك',
    SubscriptionCancelledEmail,
    props
  );
}

export async function sendWelcomeEmail(
  to: string,
  props: {
    userName?: string;
    tenantName?: string;
    appName?: string;
  }
) {
  const { WelcomeEmail } = await import('./templates/welcome');
  return sendTemplateEmail(
    to,
    '🎉 مرحباً بك في المنصة',
    WelcomeEmail,
    props
  );
}

export async function sendInvitationEmail(
  to: string,
  props: {
    inviterName?: string;
    tenantName?: string;
    roleName?: string;
    inviteLink?: string;
  }
) {
  const { InvitationEmail } = await import('./templates/invitation');
  return sendTemplateEmail(
    to,
    '📨 دعوة للانضمام إلى فريق',
    InvitationEmail,
    props
  );
}

export async function sendSettlementEmail(
  to: string,
  props: {
    tenantName?: string;
    amount?: string;
    currency?: string;
    bankReference?: string;
    settlementNumber?: string;
    settlementDate?: string;
  }
) {
  const { SettlementNotification } = await import('./templates/settlement-notification');
  return sendTemplateEmail(
    to,
    '✅ تم تحويل رصيد بنجاح',
    SettlementNotification,
    props
  );
}
