// services/rag.js
// Retrieval-Augmented Generation pipeline
import { queryDocuments } from './vectorStore.js';
import { generateAnswer } from './llm.js';

const DEPARTMENT_PERSONAS = {
  it: 'IT Department assistant for Numaligarh Refinery Limited. You help employees with IT issues, VPN setup, software access, network problems, and internal IT portals.',
  hr: 'HR Department assistant for Numaligarh Refinery Limited. You help employees with leave policies, payroll, recruitment, onboarding, benefits, and HR forms.',
  'fire & safety': 'Fire & Safety Department assistant for Numaligarh Refinery Limited. You help with safety procedures, emergency protocols, SOPs, PPE requirements, and incident reporting.',
  marketing: 'Marketing Department assistant for Numaligarh Refinery Limited. You assist with brand guidelines, internal communications, event information, and marketing resources.',
  general: 'Internal assistant for Numaligarh Refinery Limited. You help employees find information, navigate internal portals, and resolve common queries.',
};

function buildSystemPrompt(department, context) {
  const persona = DEPARTMENT_PERSONAS[department.toLowerCase()] || DEPARTMENT_PERSONAS.general;

  const contextSection = context.length
    ? `\n\nRELEVANT DOCUMENTS FROM KNOWLEDGE BASE:\n${context
        .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`)
        .join('\n\n---\n\n')}`
    : '\n\n(No specific documents found in the knowledge base for this query.)';

  return `You are a helpful ${persona}

GUIDELINES:
- Answer based on the provided documents when available.
- Be concise and direct. Use bullet points for multi-step answers.
- If you reference a document, mention the source name.
- If the knowledge base has no relevant information, say so honestly and provide general guidance.
- For internal links/portals mentioned, format them clearly.
- Never make up policy numbers, dates, or specific procedures not in the context.
- Keep answers professional and suitable for an enterprise environment.
${contextSection}`;
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 50) chunks.push(chunk);
  }
  return chunks;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function chat(department, message, history = []) {
  // 1. Retrieve relevant context
  const context = await queryDocuments(department, message, 5);

  // 2. Build conversation-aware user message
  const historyText = history.slice(-4)
    .map(h => `${h.role === 'user' ? 'Employee' : 'Assistant'}: ${h.content}`)
    .join('\n');

  const userMessage = history.length
    ? `Previous conversation:\n${historyText}\n\nNew question: ${message}`
    : message;

  // 3. Generate answer
  const systemPrompt = buildSystemPrompt(department, context);
  const answer = await generateAnswer(systemPrompt, userMessage);

  return {
    answer,
    sources: context.map(c => ({ source: c.source, score: Math.round(c.score * 100) })),
    department,
  };
}

export { chunkText };
