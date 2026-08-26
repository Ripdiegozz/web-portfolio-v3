import { describe, expect, it, vi } from 'vitest';
import {
  buildSystemPrompt,
  generateLocalFallbackResponse,
  processChatRequest,
} from './engine';

describe('Chat Engine & Knowledge Base', () => {
  it('builds system prompt with identity and guidelines', () => {
    const promptEn = buildSystemPrompt('en');
    expect(promptEn).toContain('Diego Alonso García Guerrero');
    expect(promptEn).toContain('Wazuh');
    expect(promptEn).toContain('ALWAYS respond in English');

    const promptEs = buildSystemPrompt('es');
    expect(promptEs).toContain('Diego Alonso García Guerrero');
    expect(promptEs).toContain('Responde SIEMPRE en español');
  });

  it('generates accurate grounded responses in Spanish fallback', () => {
    const wazuhRes = generateLocalFallbackResponse('¿Qué hace en wazuh?', 'es');
    expect(wazuhRes).toContain('Wazuh AI Assistant');

    const stackRes = generateLocalFallbackResponse('¿Cuál es su stack de tecnologías?', 'es');
    expect(stackRes).toContain('TypeScript');
    expect(stackRes).toContain('React 19');

    const contactRes = generateLocalFallbackResponse('¿Cómo puedo contactar a Diego?', 'es');
    expect(contactRes).toContain('formulario de contacto');
  });

  it('generates accurate grounded responses in English fallback', () => {
    const wazuhRes = generateLocalFallbackResponse('tell me about wazuh', 'en');
    expect(wazuhRes).toContain('Wazuh AI Assistant');

    const contactRes = generateLocalFallbackResponse('how to hire or contact?', 'en');
    expect(contactRes).toContain('contact form');
  });

  it('uses Cloudflare Workers AI when available', async () => {
    const mockRun = vi.fn().mockResolvedValue({
      response: 'Diego is a Full-Stack Engineer who specializes in AI tooling.',
    });

    const reply = await processChatRequest(
      {
        locale: 'en',
        messages: [{ role: 'user', content: 'What is your background?' }],
      },
      {
        workersAi: { run: mockRun },
      }
    );

    expect(mockRun).toHaveBeenCalledWith(
      '@cf/meta/llama-3.1-8b-instruct',
      expect.objectContaining({
        max_tokens: 512,
      })
    );
    expect(reply).toBe('Diego is a Full-Stack Engineer who specializes in AI tooling.');
  });
});
