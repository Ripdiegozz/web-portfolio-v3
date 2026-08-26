import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';
import { Bot, User, Sparkles, Send, X, RotateCcw, Loader2, AlertCircle } from '@portfolio/ui';
import type { ChatAssistantTranslations, Locale } from '../../i18n/types';

export interface ChatAssistantProps {
  locale?: Locale | undefined;
  labels?: ChatAssistantTranslations | undefined;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function renderFormattedText(text: string) {
  // Simple, safe inline parser for markdown links, bold text, and line breaks
  const parts = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {parts.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;

        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        // Parse **bold** and [links](url)
        const tokens: Array<{ type: 'text' | 'bold' | 'link'; text: string; href?: string }> = [];
        let cursor = 0;
        const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(cleanLine)) !== null) {
          if (match.index > cursor) {
            tokens.push({ type: 'text', text: cleanLine.substring(cursor, match.index) });
          }
          if (match[2]) {
            tokens.push({ type: 'bold', text: match[2] });
          } else if (match[3] && match[4]) {
            tokens.push({ type: 'link', text: match[3], href: match[4] });
          }
          cursor = regex.lastIndex;
        }

        if (cursor < cleanLine.length) {
          tokens.push({ type: 'text', text: cleanLine.substring(cursor) });
        }

        const content = tokens.map((token, tIdx) => {
          if (token.type === 'bold') {
            return (
              <strong key={tIdx} className="font-semibold text-text-primary">
                {token.text}
              </strong>
            );
          }
          if (token.type === 'link') {
            return (
              <a
                key={tIdx}
                href={token.href}
                target={token.href?.startsWith('http') ? '_blank' : undefined}
                rel={token.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                {token.text}
              </a>
            );
          }
          return <span key={tIdx}>{token.text}</span>;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="text-accent select-none">•</span>
              <div>{content}</div>
            </div>
          );
        }

        return <p key={idx}>{content}</p>;
      })}
    </div>
  );
}

export default function ChatAssistant({ locale = 'en', labels }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const defaultInitial =
    locale === 'es'
      ? '¡Hola! Soy el asistente de IA de Diego. Pregúntame sobre su trabajo en Wazuh, su stack full-stack, experiencia con IA o cómo ponerte en contacto.'
      : "Hi! I'm Diego's AI Assistant. Ask me about his work at Wazuh, full-stack tech stack, AI tooling experience, or how to get in touch.";

  const initialMsg = labels?.initialMessage ?? defaultInitial;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-0',
      role: 'assistant',
      content: initialMsg,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const title = labels?.title ?? 'Diego AI Assistant';
  const subtitle = labels?.subtitle ?? 'Ask anything about Diego';
  const placeholder = labels?.placeholder ?? (locale === 'es' ? 'Pregunta algo sobre Diego...' : 'Ask a question about Diego...');
  const sendLabel = labels?.sendAriaLabel ?? 'Send';
  const clearLabel = labels?.clearAriaLabel ?? 'Clear';
  const closeLabel = labels?.closeAriaLabel ?? 'Close';
  const disclaimer =
    labels?.disclaimer ??
    (locale === 'es'
      ? 'Respuestas con IA basadas en datos verificados de dagadev.net.'
      : 'AI responses grounded in verified dagadev.net portfolio data.');

  const suggestions = labels?.suggestedQuestions ?? [
    locale === 'es' ? '¿Qué hace Diego en Wazuh?' : 'What is your work at Wazuh?',
    locale === 'es' ? '¿Cuáles son tus tecnologías principales?' : 'What tech stack do you use?',
    locale === 'es' ? '¿Cómo puedo contactar a Diego?' : 'How can I get in touch?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClear = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: initialMsg,
      },
    ]);
    setErrorStatus(null);
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages: Message[] = [...messages, { id: userMessageId, role: 'user', content: text }];

    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setErrorStatus(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.status === 429) {
        setErrorStatus(
          labels?.rateLimitMessage ??
            (locale === 'es'
              ? 'Has alcanzado el límite de preguntas. Por favor intenta de nuevo en unos minutos.'
              : 'You have reached the question limit. Please try again in a few minutes.')
        );
        return;
      }

      if (!res.ok) {
        throw new Error('chat_request_failed');
      }

      const data = (await res.json()) as { ok: boolean; reply?: string; error?: string };
      if (data.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply!,
          },
        ]);
      } else {
        throw new Error(data.error ?? 'unknown_error');
      }
    } catch {
      setErrorStatus(
        labels?.errorMessage ??
          (locale === 'es'
            ? 'Ocurrió un error al procesar tu pregunta. Por favor intenta de nuevo.'
            : 'Sorry, I encountered an issue processing your question. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative flex items-center gap-2.5 rounded-full border border-border-subtle bg-bg-raised/95 px-4 py-2.5 text-sm font-medium text-text-primary shadow-xl backdrop-blur-md transition-all duration-300 hover:border-accent hover:bg-bg-subtle hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={labels?.floatingButtonLabel ?? 'Ask Diego AI'}
          aria-expanded={isOpen}
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-accent transition-transform duration-300 group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          </div>
          <span className="text-xs sm:text-sm font-mono tracking-tight text-text-primary">
            {labels?.floatingButtonLabel ?? (locale === 'es' ? 'Pregunta a Diego AI' : 'Ask Diego AI')}
          </span>
        </button>
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed bottom-20 right-4 sm:right-6 z-50 flex h-[520px] max-h-[82vh] w-[calc(100vw-2rem)] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface/98 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-bg-raised/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-mono text-xs sm:text-sm font-semibold text-text-primary">{title}</h3>
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-mono text-accent">
                    {labels?.badge ?? 'AI'}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                title={clearLabel}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary focus:outline-none"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={closeLabel}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md text-[11px] ${
                      isUser
                        ? 'bg-accent text-bg-base font-bold'
                        : 'border border-border-subtle bg-bg-raised text-accent'
                    }`}
                  >
                    {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 shadow-sm ${
                      isUser
                        ? 'bg-accent text-bg-base font-medium selection:bg-bg-base selection:text-accent'
                        : 'border border-border-subtle bg-bg-raised/70 text-text-primary'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderFormattedText(msg.content)
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md border border-border-subtle bg-bg-raised text-accent">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-raised/70 px-3.5 py-2 text-text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span className="text-xs font-mono">
                    {locale === 'es' ? 'Pensando...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}

            {errorStatus && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (if only initial message) */}
          {messages.length <= 1 && (
            <div className="border-t border-border-subtle/50 bg-bg-surface/50 px-3 py-2">
              <p className="mb-1.5 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                {locale === 'es' ? 'Preguntas sugeridas' : 'Suggested questions'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(sug)}
                    className="rounded-lg border border-border-subtle bg-bg-raised/60 px-2.5 py-1 text-left text-[11px] text-text-primary transition-colors hover:border-accent hover:bg-accent/10 focus:outline-none"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={onSubmit} className="border-t border-border-subtle bg-bg-raised/90 p-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={placeholder}
                maxLength={400}
                disabled={loading}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface py-2.5 pl-3.5 pr-10 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                title={sendLabel}
                className="absolute right-1.5 rounded-lg p-1.5 text-accent transition-opacity hover:opacity-80 disabled:opacity-30 focus:outline-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-muted">
              <span>{disclaimer}</span>
              <span className="font-mono">{input.length}/400</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
