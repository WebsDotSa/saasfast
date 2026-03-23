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

interface TrialEndingEmailProps {
  tenantName?: string;
  daysRemaining?: number;
  planName?: string;
}

export const TrialEndingEmail = ({
  tenantName = 'عميلنا الكريم',
  daysRemaining = 3,
  planName = 'الخطة الأساسية',
}: TrialEndingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>فترة تجريبية تنتهي قريباً</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>⏰ فترة تجريبية تنتهي قريباً</Heading>
          
          <Text style={text}>
            مرحباً {tenantName}،
          </Text>
          
          <Text style={text}>
            نود تذكيرك بأن فترة تجريبية المجانية ستنتهي خلال {daysRemaining} أيام.
          </Text>

          <Text style={highlightText}>
            للاستمرار في الوصول إلى جميع الميزات، يرجى الاشتراك في خطة {planName}.
          </Text>

          <Button style={button} href="/dashboard/billing">
            اختر خطتك الآن
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            إذا كانت لديك أي أسئلة، فريق الدعم جاهز لمساعدتك.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TrialEndingEmail;

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
  color: '#f59e0b',
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

const highlightText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '16px 48px',
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
  margin: '20px 48px',
  direction: 'rtl' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const button = {
  backgroundColor: '#f59e0b',
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
