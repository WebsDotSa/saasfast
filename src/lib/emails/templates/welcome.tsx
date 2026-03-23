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
  Section,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  tenantName?: string;
  appName?: string;
}

export const WelcomeEmail = ({
  userName = 'عميلنا الكريم',
  tenantName = 'منصتك',
  appName = 'SaaS Core',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>مرحباً بك في المنصة</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>🎉 مرحباً بك!</Heading>
          
          <Text style={text}>
            أهلاً {userName}،
          </Text>
          
          <Text style={text}>
            نشكرك لانضمامك إلى {appName}! نحن متحمسون لبدء رحلتك معنا.
          </Text>

          <Section style={features}>
            <Text style={featureTitle}>✨ ما يمكنك فعله الآن:</Text>
            
            <Text style={featureItem}>• إعداد متجرك أو موقعك الإلكتروني</Text>
            <Text style={featureItem}>• إضافة المنتجات والخدمات</Text>
            <Text style={featureItem}>• تخصيص المظهر والهوية</Text>
            <Text style={featureItem}>• دعوة أعضاء الفريق</Text>
            <Text style={featureItem}>• استكشاف جميع الميزات</Text>
          </Section>

          <Button style={button} href="/dashboard">
            ابدأ الآن
          </Button>

          <Hr style={hr} />

          <Text style={text}>
            إذا كانت لديك أي أسئلة أو تحتاج إلى مساعدة، فريق الدعم جاهز لمساعدتك في أي وقت.
          </Text>

          <Text style={footer}>
            فريق {appName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  color: '#6c63ff',
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

const features = {
  backgroundColor: '#f9fafb',
  margin: '20px 48px',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'right' as const,
  direction: 'rtl' as const,
};

const featureTitle = {
  color: '#111',
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '12px',
};

const featureItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '28px',
  margin: '4px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const button = {
  backgroundColor: '#6c63ff',
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
