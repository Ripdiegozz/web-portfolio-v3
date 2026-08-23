import { render } from '@react-email/components';
import { Resend } from 'resend';
import { ContactNotification } from '@portfolio/email/templates/ContactNotification';

export interface SendResult {
  sent: boolean;
}

export function makeSendContactEmail(apiKey: string, opts?: { to?: string; from?: string }) {
  const resend = new Resend(apiKey);
  return async function sendContactEmail(input: {
    name: string;
    email: string;
    message: string;
  }): Promise<SendResult> {
    try {
      const html = await render(
        <ContactNotification
          name={input.name}
          email={input.email}
          message={input.message}
          receivedAt={new Date().toISOString()}
        />
      );
      const { error } = await resend.emails.send({
        // dagadev.net is the verified Resend domain.
        from: opts?.from ?? 'Portfolio <portfolio@dagadev.net>',
        // Diego's real inbox, from the v2 contact pipeline.
        to: opts?.to ?? 'diegogarciag63@gmail.com',
        subject: `New portfolio message from ${input.name}`,
        html,
        replyTo: input.email,
      });
      return { sent: !error };
    } catch {
      return { sent: false };
    }
  };
}
