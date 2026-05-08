// services/vectorStore.js — sql.js backed vector store
import 'dotenv/config';
import { all, get, run, dbReady } from './database.js';
import { v4 as uuidv4 } from 'uuid';

await dbReady;

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
  tokens.forEach(t => { tf[t] = (tf[t]||0) + 1; });
  return vocab.map(word => {
    const termFreq = (tf[word]||0) / Math.max(tokens.length, 1);
    const docsWithWord = allTexts.filter(t => tokenize(t).includes(word)).length;
    const idf = docsWithWord > 0 ? Math.log(allTexts.length / docsWithWord) : 0;
    return termFreq * idf;
  });
}
function cosineSim(a, b) {
  let dot=0, normA=0, normB=0;
  for (let i=0; i<a.length; i++) { dot+=a[i]*b[i]; normA+=a[i]*a[i]; normB+=b[i]*b[i]; }
  const denom = Math.sqrt(normA)*Math.sqrt(normB);
  return denom===0 ? 0 : dot/denom;
}
async function getEmbedding(text, allTexts=[], vocab=[]) {
  if (process.env.OPENAI_API_KEY && process.env.LLM_PROVIDER==='openai') {
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await client.embeddings.create({ model:'text-embedding-3-small', input:text.slice(0,8000) });
      return { vector: res.data[0].embedding };
    } catch {}
  }
  return { vector: tfidfVector(text, vocab, allTexts) };
}

export async function addDocuments(department, chunks, sourceFile) {
  const existing = all('SELECT chunk_text FROM document_chunks WHERE department=?', [department]);
  const allTexts = [...existing.map(r => r.chunk_text), ...chunks];
  const vocab    = buildVocab(allTexts);

  for (const chunk of chunks) {
    const { vector } = await getEmbedding(chunk, allTexts, vocab);
    run('INSERT INTO document_chunks (id,department,source,chunk_text,embedding) VALUES (?,?,?,?,?)',
      [uuidv4(), department, sourceFile, chunk, JSON.stringify(vector)]);
  }
  console.log(`[VectorStore] "${department}": +${chunks.length} chunks → DB`);
  return { added: chunks.length };
}

export async function queryDocuments(department, query, topK=5) {
  const rows = all('SELECT chunk_text, source, embedding FROM document_chunks WHERE department=?', [department]);
  if (!rows.length) return [];

  const allTexts = rows.map(r => r.chunk_text);
  const vocab    = buildVocab([query, ...allTexts]);
  const { vector: queryVec } = await getEmbedding(query, [query, ...allTexts], vocab);

  return rows
    .map(row => {
      let emb = [];
      try { emb = JSON.parse(row.embedding||'[]'); } catch {}
      if (!emb.length) emb = tfidfVector(row.chunk_text, vocab, allTexts);
      return { text:row.chunk_text, source:row.source, score:cosineSim(queryVec, emb) };
    })
    .sort((a,b) => b.score - a.score)
    .slice(0, topK)
    .filter(d => d.score > 0.01);
}

export async function listDepartments() {
  return all('SELECT department AS name, COUNT(*) AS chunks FROM document_chunks GROUP BY department');
}

export async function clearDepartment(department) {
  run('DELETE FROM document_chunks WHERE department=?', [department]);
  return { cleared: department };
}

export function getStoreStats() {
  return all('SELECT department, COUNT(*) AS chunks FROM document_chunks GROUP BY department')
    .map(r => ({
      department: r.department,
      chunks: r.chunks,
      sources: all('SELECT DISTINCT source FROM document_chunks WHERE department=?', [r.department]).map(s => s.source),
    }));
}
