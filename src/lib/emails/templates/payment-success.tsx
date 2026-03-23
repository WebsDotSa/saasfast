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

interface PaymentSuccessEmailProps {
  tenantName?: string;
  amount?: string;
  currency?: string;
  invoiceNumber?: string;
  planName?: string;
}

export const PaymentSuccessEmail = ({
  tenantName = 'عميلنا الكريم',
  amount = '0.00',
  currency = 'SAR',
  invoiceNumber = 'INV-000',
  planName = 'الخطة الأساسية',
}: PaymentSuccessEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>تم نجاح عملية الدفع</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>✅ تم نجاح الدفع</Heading>
          
          <Text style={text}>
            مرحباً {tenantName}،
          </Text>
          
          <Text style={text}>
            نشكرك على اشتراكك! تم معالجة دفعتك بنجاح.
          </Text>

          <Section style={section}>
            <Text style={label}>المبلغ المدفوع:</Text>
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
            يمكنك الوصول إلى فاتورتك الكاملة من لوحة التحكم الخاصة بك.
          </Text>

          <Button style={button} href="/dashboard/billing">
            عرض الفاتورة
          </Button>

          <Text style={footer}>
            شكرًا لاستخدامك منصتنا!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentSuccessEmail;

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
  color: '#10b981',
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
