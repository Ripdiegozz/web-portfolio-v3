import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from '@portfolio/ui';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const inputClass =
  'w-full rounded-md border border-border-subtle bg-bg-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none';

function getTurnstileToken(form: HTMLFormElement, widgetId: string | null): string {
  if (import.meta.env.PUBLIC_E2E_MOCKS === '1') return 'e2e';

  // 1. Direct form field injected by Cloudflare Turnstile
  const formEntry = new FormData(form).get('cf-turnstile-response');
  if (typeof formEntry === 'string' && formEntry.trim().length > 0) {
    return formEntry.trim();
  }

  // 2. Safe fallback to window.turnstile API with widgetId
  try {
    const t = (window as unknown as { turnstile?: { getResponse?: (id?: string) => string } })?.turnstile;
    const resp = widgetId ? t?.getResponse?.(widgetId) : t?.getResponse?.();
    if (typeof resp === 'string' && resp.trim().length > 0) {
      return resp.trim();
    }
  } catch {
    // ignore Turnstile widget lookup errors
  }

  // 3. In dev mode fallback so local developer testing is never blocked
  if (!import.meta.env.PROD) {
    return 'dev-token';
  }

  return '';
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (import.meta.env.PUBLIC_E2E_MOCKS === '1') return;

    const renderWidget = () => {
      const turnstile = (
        window as unknown as {
          turnstile?: {
            render?: (el: HTMLElement, opts: unknown) => string;
            remove?: (id: string) => void;
          };
        }
      )?.turnstile;

      if (turnstile?.render && turnstileContainerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
            sitekey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
            theme: 'auto',
          });
        } catch (err) {
          console.warn('[turnstile] render warning:', err);
        }
      }
    };

    if ((window as unknown as { turnstile?: unknown }).turnstile) {
      renderWidget();
    } else {
      const timer = setInterval(() => {
        if ((window as unknown as { turnstile?: unknown }).turnstile) {
          clearInterval(timer);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(timer);
    }

    return () => {
      if (widgetIdRef.current) {
        try {
          (
            window as unknown as { turnstile?: { remove?: (id: string) => void } }
          ).turnstile?.remove?.(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // ignore
        }
      }
    };
  }, []);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setStatus('sending');
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const turnstileToken = getTurnstileToken(form, widgetIdRef.current);

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          message: payload.message,
          company: payload.company, // honeypot passthrough
          turnstileToken,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setStatus('sent');
        form.reset();
        if (widgetIdRef.current) {
          try {
            (
              window as unknown as { turnstile?: { reset?: (id: string) => void } }
            ).turnstile?.reset?.(widgetIdRef.current);
          } catch {
            // ignore
          }
        }
      } else {
        console.error('[contact-form] Submission failed:', res.status, body);
        setStatus('error');
      }
    } catch (err) {
      console.error('[contact-form] Network error:', err);
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
        <div ref={turnstileContainerRef} className="my-2 min-h-[65px]" suppressHydrationWarning />
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:pointer-events-none disabled:opacity-50"
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Sending…</span>
          </>
        ) : (
          <>
            <span>Send message</span>
            <Send className="size-3.5" />
          </>
        )}
      </button>
      {status === 'sent' && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Message sent. I will reply soon.</span>
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>Something went wrong. Try again or reach me on LinkedIn.</span>
        </p>
      )}
    </form>
  );
}

