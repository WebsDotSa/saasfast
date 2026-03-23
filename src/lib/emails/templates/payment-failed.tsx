import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface PaymentFailedEmailProps {
  tenantName?: string;
  amount?: string;
  currency?: string;
  invoiceNumber?: string;
  planName?: string;
}

export const PaymentFailedEmail = ({
  tenantName = 'عميلنا الكريم',
  amount = '0.00',
  currency = 'SAR',
  invoiceNumber = 'INV-000',
  planName = 'الخطة الأساسية',
}: PaymentFailedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>فشل عملية الدفع</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>❌ فشل الدفع</Heading>
          
          <Text style={text}>
            مرحباً {tenantName}،
          </Text>
          
          <Text style={text}>
            للأسف، لم نتمكن من معالجة دفعتك. يرجى تحديث معلومات الدفع الخاصة بك.
          </Text>

          <Section style={section}>
            <Text style={label}>المبلغ المطلوب:</Text>
            <Text style={value}>{amount} {currency}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>رقم الفاتورة:</Text>
            <Text style={value}>{invoiceNumber}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>الخطة:</Text>
            <Text style={value}>{planName}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            يرجى تحديث معلومات الدفع في أسرع وقت ممكن للحفاظ على وصولك إلى المنصة.
          </Text>

          <Button style={button} href="/dashboard/billing">
            تحديث الدفع
          </Button>

          <Text style={footer}>
            إذا كانت لديك أي أسئلة، يرجى الاتصال بدعم العملاء.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentFailedEmail;

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

const section = {
  padding: '12px 48px',
  textAlign: 'right' as const,
  direction: 'rtl' as const,
};

const label = {
  color: '#666',
  fontSize: '14px',
  marginBottom: '4px',
};

const value = {
  color: '#111',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
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
