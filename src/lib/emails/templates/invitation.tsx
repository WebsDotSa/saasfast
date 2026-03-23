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

interface InvitationEmailProps {
  inviterName?: string;
  tenantName?: string;
  roleName?: string;
  inviteLink?: string;
}

export const InvitationEmail = ({
  inviterName = 'أحد الأعضاء',
  tenantName = 'منصة',
  roleName = 'مستخدم',
  inviteLink = '#',
}: InvitationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>دعوة للانضمام إلى فريق</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>📨 دعوة للانضمام إلى فريق</Heading>
          
          <Text style={text}>
            مرحباً،
          </Text>
          
          <Text style={text}>
            قام {inviterName} بدعوتك للانضمام إلى فريق <strong>{tenantName}</strong> بمنصب <strong>{roleName}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              انقر على الزر أدناه لقبول الدعوة وإنشاء حسابك.
            </Text>
          </Section>

          <Button style={button} href={inviteLink}>
            قبول الدعوة
          </Button>

          <Hr style={hr} />

          <Text style={text}>
            إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
          </Text>

          <Text style={footer}>
            ملاحظة: رابط الدعوة صالح لمدة 7 أيام فقط.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InvitationEmail;

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
};

const infoBox = {
  backgroundColor: '#eff6ff',
  margin: '20px 48px',
  padding: '16px',
  borderRadius: '6px',
  textAlign: 'center' as const,
};

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
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
