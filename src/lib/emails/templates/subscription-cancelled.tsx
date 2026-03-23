import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from '@react-email/components';

interface SubscriptionCancelledEmailProps {
  tenantName?: string;
  planName?: string;
  cancellationDate?: string;
  accessUntil?: string;
}

export const SubscriptionCancelledEmail = ({
  tenantName = 'عميلنا الكريم',
  planName = 'الخطة الأساسية',
  cancellationDate = 'اليوم',
  accessUntil = 'نهاية الفترة الحالية',
}: SubscriptionCancelledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>تم إلغاء الاشتراك</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>تم إلغاء الاشتراك</Heading>
          
          <Text style={text}>
            مرحباً {tenantName}،
          </Text>
          
          <Text style={text}>
            نود تأكيد إلغاء اشتراكك في {planName} في {cancellationDate}.
          </Text>

          <Text style={infoText}>
            سيظل بإمكانك الوصول إلى حسابك حتى {accessUntil}. بعد هذا التاريخ، لن تتمكن من الوصول إلى الميزات المميزة.
          </Text>

          <Hr style={hr} />

          <Text style={text}>
            نشكرك على استخدامك منصتنا ونأسف لرحيلك. إذا كان لديك أي ملاحظات، نود سماعها.
          </Text>

          <Text style={footer}>
            نتمنى لك التوفيق في مشاريعك المستقبلية!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionCancelledEmail;

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
  color: '#6b7280',
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

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '16px 48px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  margin: '20px 48px',
  direction: 'rtl' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '0 48px',
  marginTop: '32px',
};
