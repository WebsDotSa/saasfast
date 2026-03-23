// Email System - SaaS Core Platform
// Export all email templates and send functions

// Send functions
export {
  sendEmail,
  sendTemplateEmail,
  sendBatchEmails,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendTrialEndingEmail,
  sendSubscriptionExpiredEmail,
  sendSubscriptionCancelledEmail,
  sendWelcomeEmail,
  sendInvitationEmail,
  sendSettlementEmail,
  type EmailOptions,
  type EmailTemplateProps,
} from './send';

// Templates
export { PaymentSuccessEmail } from './templates/payment-success';
export { PaymentFailedEmail } from './templates/payment-failed';
export { TrialEndingEmail } from './templates/trial-ending';
export { SubscriptionExpiredEmail } from './templates/subscription-expired';
export { SubscriptionCancelledEmail } from './templates/subscription-cancelled';
export { WelcomeEmail } from './templates/welcome';
export { InvitationEmail } from './templates/invitation';
