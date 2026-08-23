import { Container, Head, Html, Preview, Section, Text } from '@react-email/components';

export interface ContactNotificationProps {
  name: string;
  email: string;
  message: string;
  receivedAt: string;
}

export function ContactNotification({ name, email, message, receivedAt }: ContactNotificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New portfolio message from {name}</Preview>
      <Container style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <Section style={{ borderRadius: 8, border: '1px solid #e4e4e7', padding: 24 }}>
          <Text style={{ margin: 0, fontSize: 12, color: '#52525b' }}>{receivedAt}</Text>
          <Text style={{ margin: '8px 0 0' }}>
            <strong>{name}</strong> wrote:
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>
          <Text style={{ color: '#52525b', fontSize: 12 }}>{`Reply-to: ${email}`}</Text>
        </Section>
      </Container>
    </Html>
  );
}
