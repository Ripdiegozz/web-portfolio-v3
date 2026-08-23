import { useState, type SubmitEvent } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const inputClass =
  'w-full rounded-md border border-border-subtle bg-bg-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setStatus('sending');
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          message: payload.message,
          company: payload.company, // honeypot passthrough
          turnstileToken:
            import.meta.env.PUBLIC_E2E_MOCKS === '1'
              ? 'e2e'
              : (window as unknown as { turnstile?: { getResponse?: () => string } }).turnstile?.getResponse?.() ??
                payload['cf-turnstile-response'] ??
                '',
        }),
      });
      const body = await res.json().catch(() => ({}));
      setStatus(res.ok && body.ok ? 'sent' : 'error');
      if (res.ok && body.ok) form.reset();
    } catch {
      setStatus('error'); // failures are shown, never faked (v2 bug fix)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 space-y-4">
      {/* honeypot: visually hidden */}
      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <label htmlFor="contact-name" className="sr-only">
        Name
      </label>
      <input id="contact-name" name="name" required maxLength={100} placeholder="Your name" className={inputClass} />
      <label htmlFor="contact-email" className="sr-only">
        Email
      </label>
      <input
        id="contact-email"
        name="email"
        type="email"
        required
        maxLength={200}
        placeholder="you@example.com"
        className={inputClass}
      />
      <label htmlFor="contact-message" className="sr-only">
        Message
      </label>
      <textarea
        id="contact-message"
        name="message"
        required
        minLength={10}
        maxLength={5000}
        placeholder="What can I help you with?"
        className={`${inputClass} min-h-36 resize-y`}
      />
      {import.meta.env.PUBLIC_E2E_MOCKS !== '1' && (
        <div className="cf-turnstile" data-sitekey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY} />
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:pointer-events-none disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {status === 'sent' && <p role="status">Message sent. I will reply soon.</p>}
      {status === 'error' && <p role="alert">Something went wrong. Try again or reach me on LinkedIn.</p>}
    </form>
  );
}
