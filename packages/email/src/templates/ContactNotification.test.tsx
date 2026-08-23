import { describe, expect, it } from 'vitest';
import { render } from '@react-email/components';
import { ContactNotification } from './ContactNotification';

describe('ContactNotification template', () => {
  it('renders sender name, reply address and message body', async () => {
    const html = await render(
      <ContactNotification
        name="Jane"
        email="jane@example.com"
        message="We need a landing page."
        receivedAt="2026-08-22T10:00:00Z"
      />
    );
    expect(html).toContain('Jane');
    expect(html).toContain('We need a landing page.');
    expect(html).toContain('Reply-to: jane@example.com');
  });
});
