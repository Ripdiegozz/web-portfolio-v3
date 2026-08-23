import { describe, expect, it } from 'vitest';
import { classifyContactAttempt, contactSchema } from './schema';

const valid = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Hello, I would like to talk about a project.',
  company: '',
  turnstileToken: 'tok',
};

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty message', () => {
    expect(contactSchema.safeParse({ ...valid, message: '' }).success).toBe(false);
  });
  it('rejects invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
  });
  it('rejects missing turnstile token', () => {
    expect(contactSchema.safeParse({ ...valid, turnstileToken: '' }).success).toBe(false);
  });
});

describe('classifyContactAttempt', () => {
  it('flags honeypot hits as silent-bot regardless of other validity', () => {
    const result = contactSchema.safeParse({ ...valid, company: 'SpamCorp Inc' });
    expect(classifyContactAttempt(result)).toEqual({ kind: 'silent_bot' });
  });
  it('classifies invalid payloads as rejected', () => {
    expect(classifyContactAttempt(contactSchema.safeParse({ ...valid, email: 'x' })))
      .toEqual({ kind: 'rejected' });
  });
  it('classifies valid human payloads as accepted with data', () => {
    const result = classifyContactAttempt(contactSchema.safeParse(valid));
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.data.name).toBe('Jane Doe');
    }
  });
});
