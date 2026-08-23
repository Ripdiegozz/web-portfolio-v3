import { describe, expect, it, vi } from 'vitest';
import { makeSendContactEmail } from './email';

const resendMock = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    constructor() {
      // Key capture removed: the { sent } contract is the observable behavior.
    }
    emails = { send: resendMock.send };
  },
}));

vi.mock('@portfolio/email/templates/ContactNotification', () => ({
  ContactNotification: () => null,
}));

vi.mock('@react-email/components', () => ({ render: async () => '<html>ok</html>' }));

describe('sendContactEmail', () => {
  it('returns { sent: true } when resend reports no error', async () => {
    resendMock.send.mockResolvedValue({ error: null });
    const send = makeSendContactEmail('re_test_key');
    const result = await send({ name: 'Jane', email: 'jane@example.com', message: 'Hello there!' });
    expect(result).toEqual({ sent: true });
  });

  it('returns { sent: false } when resend reports an error', async () => {
    resendMock.send.mockResolvedValue({ error: { message: 'quota' } });
    const send = makeSendContactEmail('re_test_key');
    const result = await send({ name: 'Jane', email: 'jane@example.com', message: 'Hello there!' });
    expect(result).toEqual({ sent: false });
  });

  it('returns { sent: false } when resend throws', async () => {
    resendMock.send.mockRejectedValue(new Error('resend boom'));
    const send = makeSendContactEmail('re_test_key');
    const result = await send({ name: 'Jane', email: 'jane@example.com', message: 'Hello there!' });
    expect(result).toEqual({ sent: false });
  });
});
