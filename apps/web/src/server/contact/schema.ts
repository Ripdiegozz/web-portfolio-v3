import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name required')
    .max(100)
    .refine(
      // Control chars would allow header-style injection in email subject/body.
      // eslint-disable-next-line no-control-regex
      (v) => !/[\x00-\x1f\x7f]/.test(v),
      'Name contains control characters'
    ),
  email: z.email().max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Message too short')
    .max(5000)
    .refine(
      // Body-only rendering is escaped by React Email, but strip control chars
      // for defense in depth (same rationale as name).
      // eslint-disable-next-line no-control-regex
      (v) => !/[\x00-\x1f\x7f]/.test(v),
      'Message contains control characters'
    ),
  /** Honeypot: hidden field, must remain empty. Bots fill it. Must parse as a
   * plain string so a filled honeypot classifies as silent_bot instead of
   * rejected - the intent is to pretend success, not to bounce. */
  company: z.string().optional(),
  turnstileToken: z.string().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ClassifiedContact =
  | { kind: 'accepted'; data: Omit<ContactInput, 'company' | 'turnstileToken'> }
  | { kind: 'rejected' }
  | { kind: 'silent_bot' };

export function classifyContactAttempt(
  result: ReturnType<typeof contactSchema.safeParse>
): ClassifiedContact {
  if (!result.success) return { kind: 'rejected' };
  const { company } = result.data;
  if (company) return { kind: 'silent_bot' };
  const { name, email, message } = result.data;
  return { kind: 'accepted', data: { name, email, message } };
}

/**
 * Classifies a raw contact payload. Honeypot wins over validation: a filled
 * company field means a bot, so we fake success even when the rest of the
 * payload (including the Turnstile token) is invalid - we never bounce bots.
 */
export function classifyContactPayload(raw: unknown): {
  classified: ClassifiedContact;
  turnstileToken: string;
} {
  if (
    raw &&
    typeof raw === 'object' &&
    typeof (raw as { company?: unknown }).company === 'string' &&
    (raw as { company: string }).company.length > 0
  ) {
    return { classified: { kind: 'silent_bot' }, turnstileToken: '' };
  }
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[contact/schema] Validation failed:', parsed.error.issues, 'Received payload:', raw);
  }
  return {
    classified: classifyContactAttempt(parsed),
    turnstileToken:
      parsed.success && parsed.data.turnstileToken ? parsed.data.turnstileToken : '',
  };
}
