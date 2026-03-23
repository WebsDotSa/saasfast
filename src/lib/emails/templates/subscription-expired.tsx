import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface SubscriptionExpiredEmailProps {
  tenantName?: string;
  planName?: string;
  expiryDate?: string;
}

export const SubscriptionExpiredEmail = ({
  tenantName = 'عميلنا الكريم',
  planName = 'الخطة الأساسية',
  expiryDate = 'اليوم',
}: SubscriptionExpiredEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>انتهاء الاشتراك</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>⚠️ انتهى اشتراكك</Heading>
          
          <Text style={text}>
            مرحباً {tenantName}،
          </Text>
          
          <Text style={text}>
            نود إعلامك بأن اشتراكك في {planName} قد انتهى في {expiryDate}.
          </Text>

          <Text style={warningText}>
            تم تعليق وصولك إلى الميزات المميزة. يرجى تجديد اشتراكك لاستعادة الوصول الكامل.
          </Text>

          <Button style={button} href="/dashboard/billing">
            تجديد الاشتراك
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            إذا كنت تواجه أي مشاكل، يرجى الاتصال بدعم العملاء.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionExpiredEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginTop: '40px',
  marginBottom: '40px',
  padding: '20px 0 48px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const heading = {
  color: '#ef4444',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  padding: '0 48px',
  marginTop: '32px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'right' as const,
  padding: '0 48px',
  direction: 'rtl' as const,
};

const warningText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '16px 48px',
  backgroundColor: '#fee2e2',
  borderRadius: '6px',
  margin: '20px 48px',
  direction: 'rtl' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  margin: '24px auto',
  padding: '12px 24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '0 48px',
  marginTop: '32px',
};
