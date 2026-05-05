// services/vectorStore.js
// In-memory vector store — no external database needed.
// Uses TF-IDF cosine similarity (zero dependencies).
// If OPENAI_API_KEY is set, automatically upgrades to OpenAI embeddings.
import 'dotenv/config';

const store = {}; // { [department]: [{ id, text, embedding, source, vocab }] }

// ── TF-IDF (zero-dependency fallback) ──────────────────────────────────────
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}
function buildVocab(texts) {
  const vocab = new Set();
  texts.forEach(t => tokenize(t).forEach(w => vocab.add(w)));
  return [...vocab];
}
function tfidfVector(text, vocab, allTexts) {
  const tokens = tokenize(text);
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  return vocab.map(word => {
    const termFreq = (tf[word] || 0) / Math.max(tokens.length, 1);
    const docsWithWord = allTexts.filter(t => tokenize(t).includes(word)).length;
    const idf = docsWithWord > 0 ? Math.log(allTexts.length / docsWithWord) : 0;
    return termFreq * idf;
  });
}
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Embedding: OpenAI if available, TF-IDF otherwise ──────────────────────
async function getEmbedding(text, allTexts = [], vocab = []) {
  if (process.env.OPENAI_API_KEY && process.env.LLM_PROVIDER === 'openai') {
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
      });
      return { vector: res.data[0].embedding, type: 'openai' };
    } catch (e) {
      console.warn('[VectorStore] OpenAI embedding failed, using TF-IDF:', e.message);
    }
  }
  return { vector: tfidfVector(text, vocab, allTexts), type: 'tfidf' };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function addDocuments(department, chunks, sourceFile) {
  if (!store[department]) store[department] = [];

  const allTexts = [...store[department].map(d => d.text), ...chunks];
  const vocab = buildVocab(allTexts);

  // Re-embed existing docs when vocab grows (TF-IDF vectors must share same vocab)
  for (const doc of store[department]) {
    const { vector } = await getEmbedding(doc.text, allTexts, vocab);
    doc.embedding = vector;
    doc.vocab = vocab;
  }

  for (const chunk of chunks) {
    const { vector, type } = await getEmbedding(chunk, allTexts, vocab);
    store[department].push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: chunk,
      embedding: vector,
      source: sourceFile,
      embType: type,
      vocab,
    });
  }

  console.log(`[VectorStore] "${department}": ${store[department].length} total chunks (${[...new Set(store[department].map(d=>d.source))].length} files)`);
  return { added: chunks.length };
}

export async function queryDocuments(department, query, topK = 5) {
  const docs = store[department];
  if (!docs?.length) return [];

  const allTexts = docs.map(d => d.text);
  const vocab = docs[0]?.vocab || buildVocab([query, ...allTexts]);
  const { vector: queryVec } = await getEmbedding(query, [query, ...allTexts], vocab);

  return docs
    .map(doc => ({ text: doc.text, source: doc.source, score: cosineSim(queryVec, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(d => d.score > 0.01);
}

export async function listDepartments() {
  return Object.entries(store)
    .filter(([, docs]) => docs.length > 0)
    .map(([name, docs]) => ({
      name,
      chunks: docs.length,
      sources: [...new Set(docs.map(d => d.source))],
    }));
}

export async function clearDepartment(department) {
  delete store[department];
  return { cleared: department };
}

export function getStoreStats() {
  return Object.entries(store).map(([dept, docs]) => ({
    department: dept,
    chunks: docs.length,
    sources: [...new Set(docs.map(d => d.source))],
  }));
}
