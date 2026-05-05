// services/llm.js
// Pluggable LLM layer — supports OpenAI, Anthropic, Groq, Ollama
import 'dotenv/config';

const PROVIDER = process.env.LLM_PROVIDER || 'groq';

async function callGroq(systemPrompt, userMessage) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq API error');
  return data.choices[0].message.content;
}

async function callOpenAI(systemPrompt, userMessage) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });
  return res.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Anthropic API error');
  return data.content[0].text;
}

async function callOllama(systemPrompt, userMessage) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || 'llama3',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
    }),
  });
  const data = await res.json();
  return data.message.content;
}

export async function generateAnswer(systemPrompt, userMessage) {
  switch (PROVIDER) {
    case 'groq':       return callGroq(systemPrompt, userMessage);
    case 'openai':     return callOpenAI(systemPrompt, userMessage);
    case 'anthropic':  return callAnthropic(systemPrompt, userMessage);
    case 'ollama':     return callOllama(systemPrompt, userMessage);
    default:
      throw new Error(`Unknown LLM_PROVIDER: "${PROVIDER}". Use groq, openai, anthropic, or ollama.`);
  }
}

export function getProviderInfo() {
  const models = {
    groq:      process.env.GROQ_MODEL      || 'llama3-8b-8192',
    openai:    process.env.OPENAI_MODEL    || 'gpt-4o-mini',
    anthropic: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
    ollama:    process.env.OLLAMA_MODEL    || 'llama3',
  };
  return { provider: PROVIDER, model: models[PROVIDER] || 'unknown' };
}