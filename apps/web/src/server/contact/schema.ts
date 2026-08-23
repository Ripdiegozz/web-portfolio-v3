import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(100),
  email: z.email().max(200),
  message: z.string().trim().min(10, 'Message too short').max(5000),
  /** Honeypot: hidden field, must remain empty. Bots fill it. Must parse as a
   * plain string so a filled honeypot classifies as silent_bot instead of
   * rejected — the intent is to pretend success, not to bounce. */
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
