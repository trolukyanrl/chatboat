// services/rag.js — RAG pipeline with Smart Link injection + ticket suggestion
import { queryDocuments } from './vectorStore.js';
import { generateAnswer } from './llm.js';
import { findLinks } from './linkNavigator.js';

const DEPARTMENT_PERSONAS = {
  it: 'IT Department assistant for Numaligarh Refinery Limited. You help employees with IT issues, VPN setup, software access, network problems, and internal IT portals.',
  hr: 'HR Department assistant for Numaligarh Refinery Limited. You help employees with leave policies, payroll, recruitment, onboarding, benefits, and HR forms.',
  'fire & safety': 'Fire & Safety Department assistant for Numaligarh Refinery Limited. You help with safety procedures, emergency protocols, SOPs, PPE requirements, and incident reporting.',
  marketing: 'Marketing Department assistant for Numaligarh Refinery Limited. You assist with brand guidelines, internal communications, event information, and marketing resources.',
  general: 'Internal assistant for Numaligarh Refinery Limited. You help employees find information, navigate internal portals, and resolve common queries.',
};

// Keywords that indicate the bot cannot help and a ticket should be suggested
const TICKET_TRIGGERS = [
  'not working', 'broken', 'error', 'issue', 'problem', 'can\'t access',
  'unable to', 'failed', 'not able', 'laptop', 'computer', 'printer',
  'account locked', 'permission', 'access denied', 'slow', 'crash',
];

function shouldSuggestTicket(message, answer) {
  const msgLower = message.toLowerCase();
  const ansLower = answer.toLowerCase();
  const hasIssueKeyword = TICKET_TRIGGERS.some(t => msgLower.includes(t));
  const botUnsure = ansLower.includes("don't have") || ansLower.includes('not sure') ||
    ansLower.includes('no information') || ansLower.includes('contact') ||
    ansLower.includes('reach out') || ansLower.includes('helpdesk');
  return hasIssueKeyword || botUnsure;
}

function buildSystemPrompt(department, context, links) {
  const persona = DEPARTMENT_PERSONAS[department.toLowerCase()] || DEPARTMENT_PERSONAS.general;
  const contextSection = context.length
    ? `\n\nRELEVANT DOCUMENTS:\n${context.map((c,i) => `[Doc ${i+1}: ${c.source}]\n${c.text}`).join('\n\n---\n\n')}`
    : '\n\n(No specific documents found in the knowledge base for this query.)';
  const linksSection = links.length
    ? `\n\nRELEVANT INTERNAL LINKS:\n${links.map(l=>`- ${l.title}: ${l.url} — ${l.desc}`).join('\n')}\nWhen relevant, include these links in your answer so the employee can navigate directly.`
    : '';
  return `You are a helpful ${persona}
GUIDELINES:
- Answer based on provided documents when available.
- Be concise and direct. Use bullet points for multi-step answers.
- When you mention an internal portal or system, include the direct link from RELEVANT INTERNAL LINKS.
- Format links as: [Link Title](URL)
- If knowledge base has no relevant info, say so honestly and provide general guidance.
- Never make up policy numbers, dates, or procedures not in the context.
- Keep answers professional and suitable for an enterprise environment.
${contextSection}${linksSection}`;
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

export async function chat(department, message, history = []) {
  const [context, links] = await Promise.all([
    queryDocuments(department, message, 5),
    Promise.resolve(findLinks(department, message, 3)),
  ]);

  const historyText = history.slice(-4)
    .map(h => `${h.role==='user' ? 'Employee' : 'Assistant'}: ${h.content}`).join('\n');
  const userMessage = history.length
    ? `Previous conversation:\n${historyText}\n\nNew question: ${message}` : message;

  const systemPrompt = buildSystemPrompt(department, context, links);
  const answer = await generateAnswer(systemPrompt, userMessage);

  // Detect if ticket should be suggested
  const suggestTicket = shouldSuggestTicket(message, answer);

  return {
    answer,
    sources: context.map(c => ({ source: c.source, score: Math.round(c.score * 100) })),
    links:   links.map(l => ({ title: l.title, url: l.url, desc: l.desc })),
    suggestTicket,
    department,
  };
}

export { chunkText };
