export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestPayload {
  messages: ChatMessage[];
  locale?: 'en' | 'es';
}

export interface ChatEngineOptions {
  workersAi?: { run(model: string, input: unknown): Promise<unknown> } | undefined;
  geminiApiKey?: string | undefined;
  openaiApiKey?: string | undefined;
}

export const PORTFOLIO_KNOWLEDGE_BASE = `
Identity & Background:
- Full Name: Diego Alonso García Guerrero (dagadev)
- Professional Title: Full-Stack Software Engineer & AI Tooling Developer
- Location: Colombia (Remote)
- Portfolio Website: https://dagadev.net (English) and https://dagadev.net/es (Spanish)
- LinkedIn: https://www.linkedin.com/in/dagadev
- GitHub: https://github.com/Ripdiegozz

Current Role:
- Company: Wazuh (Current)
- Role: Full-Stack Engineer
- Responsibilities & Achievements:
  - Developing the Wazuh AI Assistant: backend tooling enabling security analysts to query complex SIEM/XDR security data using natural language.
  - Full-stack features, OpenSearch / Elasticsearch integrations, and releases for the Wazuh web dashboard.
  - Automating CI/CD pipelines with GitHub Actions to test and build Linux packages for 90,000+ deployments.

Previous Roles & Impact:
- Company: Tres Pi Medios (Client: Stanley Black & Decker) | Jul 2024 – Jan 2026
  - Built an internal tool loan and repair app for Stanley Black & Decker Italy, cutting task completion time by 50%.
  - Developed an Azure Function with Generative AI automating Zendesk customer support replies for Stanley Black & Decker US & Canada.
  - Built real-time data feeds for Power BI operational dashboards with i18n support for Italian and English.

Technical Stack & Core Skills:
- Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
- Frontend: React 19, Astro 5, Next.js, Tailwind CSS v4, Three.js, Lucide Icons
- Backend & APIs: Node.js, Express.js, Hono, REST, GraphQL, Server-Sent Events, WebSockets
- Cloud & Infrastructure: Cloudflare Workers & Pages, AWS, Azure Functions, Docker, Linux, CI/CD (GitHub Actions)
- AI & Search: LLMs, OpenAI API, Cloudflare Workers AI, OpenSearch, Elasticsearch, RAG architecture
- Databases: PostgreSQL, MongoDB, Cloudflare KV, SQLite

Featured Projects:
- wazuh-dashboard: Open-source web interface for Wazuh security platform (TypeScript, React, OpenSearch, Docker).
- NatGPT: AI chat platform with voice recording, transcription, and real-time streaming (React, Next.js, Convex, OpenAI, Clerk).
- Notewave: Note-taking app with markdown editing and task management.

Contact & Availability:
- How to get in touch: Through the contact form on https://dagadev.net/#contact (or /es/#contact) or via LinkedIn at https://www.linkedin.com/in/dagadev.
`;

export function buildSystemPrompt(locale: 'en' | 'es' = 'en'): string {
  const languageDirective =
    locale === 'es'
      ? 'Responde SIEMPRE en español de forma profesional, clara, concisa y amigable.'
      : 'ALWAYS respond in English in a professional, clear, concise, and friendly tone.';

  return `You are "Diego AI", the personal portfolio assistant for Diego Alonso García Guerrero (dagadev).
Your mission is to represent Diego, answer questions from recruiters, engineers, and clients about his experience, technical stack, projects, and how to get in touch with him.

${languageDirective}

Guidelines:
1. Ground all your answers strictly in the knowledge base provided below.
2. If asked about contact or hiring, invite them to use the contact form at https://dagadev.net/#contact or connect via LinkedIn (https://www.linkedin.com/in/dagadev).
3. Be concise (usually 2 to 4 sentences or a clean bulleted list).
4. Never invent experience, companies, or personal details not in the knowledge base.
5. If asked something completely unrelated to Diego or software engineering, politely redirect back to Diego's engineering work.

--- Knowledge Base ---
${PORTFOLIO_KNOWLEDGE_BASE}
`;
}

/** Fallback rule-based answering for offline / local dev when no LLM API key is present. */
export function generateLocalFallbackResponse(userMessage: string, locale: 'en' | 'es' = 'en'): string {
  const query = userMessage.toLowerCase();

  if (locale === 'es') {
    if (query.includes('wazuh') || query.includes('trabajo') || query.includes('actual')) {
      return 'Actualmente Diego es Ingeniero Full-Stack en Wazuh, donde construye el **Wazuh AI Assistant** (herramientas de IA para consultar datos de seguridad con lenguaje natural), integraciones con OpenSearch y pipelines de CI/CD para más de 90.000 despliegues.';
    }
    if (query.includes('stack') || query.includes('tecnolog') || query.includes('skills') || query.includes('react') || query.includes('node') || query.includes('ia') || query.includes('ai')) {
      return 'El stack principal de Diego incluye **TypeScript, React 19, Astro, Node.js, Python, OpenSearch, Tailwind CSS, Cloudflare Workers y Docker**, con especialización en tooling de IA y sistemas escalables.';
    }
    if (query.includes('contact') || query.includes('email') || query.includes('contrat') || query.includes('linkedin') || query.includes('escribir')) {
      return 'Puedes contactar a Diego directamente usando el [formulario de contacto](https://dagadev.net/es/#contact) de esta web o a través de su [LinkedIn](https://www.linkedin.com/in/dagadev).';
    }
    if (query.includes('proyect') || query.includes('natgpt') || query.includes('notewave')) {
      return 'Entre sus proyectos destacados están el **Wazuh Dashboard** (SIEM/XDR de código abierto), **NatGPT** (plataforma de IA con voz y streaming) y **Notewave** (gestor de notas en markdown).';
    }
    return '¡Hola! Soy el asistente de Diego. Puedo contarte sobre su experiencia en Wazuh con IA, su stack técnico full-stack o cómo ponerte en contacto con él.';
  }

  // English fallback
  if (query.includes('wazuh') || query.includes('work') || query.includes('current') || query.includes('role')) {
    return "Diego is currently a Full-Stack Engineer at Wazuh, where he builds the **Wazuh AI Assistant** (enabling security analysts to query SIEM data using natural language), OpenSearch integrations, and CI/CD automation for 90,000+ deployments.";
  }
  if (query.includes('stack') || query.includes('tech') || query.includes('skills') || query.includes('react') || query.includes('node') || query.includes('ai') || query.includes('llm')) {
    return "Diego's primary stack includes **TypeScript, React 19, Astro, Node.js, Python, OpenSearch, Cloudflare Workers, Tailwind CSS, and Docker**, specializing in AI tooling and scalable web applications.";
  }
  if (query.includes('contact') || query.includes('hire') || query.includes('email') || query.includes('linkedin') || query.includes('reach')) {
    return "You can get in touch with Diego via the [contact form](https://dagadev.net/#contact) on this portfolio or through his [LinkedIn](https://www.linkedin.com/in/dagadev).";
  }
  if (query.includes('project') || query.includes('natgpt') || query.includes('notewave')) {
    return "Key highlighted projects include **Wazuh Dashboard** (open-source SIEM/XDR web UI), **NatGPT** (AI voice & streaming platform), and **Notewave** (rich-text markdown app).";
  }
  return "Hello! I'm Diego's AI Assistant. Ask me anything about his work at Wazuh, full-stack tech stack, AI tooling experience, or how to get in touch.";
}

export async function processChatRequest(
  payload: ChatRequestPayload,
  options: ChatEngineOptions
): Promise<string> {
  const locale = payload.locale === 'es' ? 'es' : 'en';
  const systemPrompt = buildSystemPrompt(locale);

  const cleanMessages = (payload.messages || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-6); // Keep last 6 turns for context efficiency

  if (cleanMessages.length === 0) {
    return generateLocalFallbackResponse('', locale);
  }

  const lastMessage = cleanMessages[cleanMessages.length - 1];
  const latestUserMessage = lastMessage ? lastMessage.content : '';

  // 1. Try Cloudflare Workers AI if available
  if (options.workersAi) {
    try {
      const response = (await options.workersAi.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          ...cleanMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 512,
        temperature: 0.3,
      })) as { response?: string };

      if (response && typeof response.response === 'string' && response.response.trim().length > 0) {
        return response.response.trim();
      }
    } catch (err) {
      console.warn('[chat/workers-ai] fallback after error:', err);
    }
  }

  // 2. Try Gemini API Key if available
  if (options.geminiApiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${options.geminiApiKey}`;
      const geminiBody = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: cleanMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
      };

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('[chat/gemini] fallback after error:', err);
    }
  }

  // 3. Fallback to smart grounded local response
  return generateLocalFallbackResponse(latestUserMessage, locale);
}
