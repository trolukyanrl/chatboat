// services/crawler.js — sql.js backed web crawler
import { all, get, run, dbReady } from './database.js';
import { addDocuments } from './vectorStore.js';
import { chunkText } from './rag.js';

await dbReady;

let jobCounter = 1000;
const lastJob = get("SELECT id FROM crawl_jobs ORDER BY started_at DESC LIMIT 1");
if (lastJob) {
  const num = parseInt(lastJob.id.replace('CRAWL-',''));
  if (!isNaN(num)) jobCounter = num;
}

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
    .replace(/<nav[\s\S]*?<\/nav>/gi,'').replace(/<footer[\s\S]*?<\/footer>/gi,'')
    .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/\s+/g,' ').trim();
}
function extractLinks(html, baseUrl) {
  const links = new Set();
  const base  = new URL(baseUrl);
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl);
      if (url.hostname===base.hostname && !url.pathname.match(/\.(pdf|jpg|png|gif|zip)$/i)) {
        url.hash=''; links.add(url.href);
      }
    } catch {}
  }
  return [...links];
}
async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal:controller.signal, headers:{ 'User-Agent':'NRL-Internal-Bot/1.0' } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch(e) { clearTimeout(timer); throw e; }
}

export async function crawlUrl(url, department, maxDepth=1, maxPages=20) {
  const id = `CRAWL-${++jobCounter}`;
  run('INSERT INTO crawl_jobs (id,url,department,depth,max_pages,status,pages,chunks) VALUES (?,?,?,?,?,?,?,?)',
    [id, url, department, maxDepth, maxPages, 'running', 0, 0]);

  const visited = new Set();
  const queue   = [{ url, depth:0 }];
  let totalChunks=0, totalPages=0;

  (async () => {
    try {
      while (queue.length>0 && visited.size<maxPages) {
        const { url:cur, depth } = queue.shift();
        if (visited.has(cur)) continue;
        visited.add(cur);
        try {
          const html = await fetchPage(cur);
          const text = extractText(html);
          if (text.length>100) {
            const source = `Web: ${new URL(cur).hostname}${new URL(cur).pathname}`;
            const chunks = chunkText(`[Source: ${cur}]\n\n${text}`, 400, 40);
            if (chunks.length) {
              await addDocuments(department, chunks, source);
              totalChunks += chunks.length; totalPages++;
              run('UPDATE crawl_jobs SET pages=?,chunks=? WHERE id=?', [totalPages, totalChunks, id]);
            }
          }
          if (depth<maxDepth) extractLinks(html, cur).forEach(link => { if (!visited.has(link)) queue.push({url:link,depth:depth+1}); });
          await new Promise(r=>setTimeout(r,300));
        } catch(e) { console.warn(`[Crawler] Failed ${cur}: ${e.message}`); }
      }
      run("UPDATE crawl_jobs SET status='done',finished_at=datetime('now') WHERE id=?", [id]);
      console.log(`[Crawler] ${id} done — ${totalPages} pages, ${totalChunks} chunks → DB`);
    } catch(err) {
      run("UPDATE crawl_jobs SET status='failed',error=?,finished_at=datetime('now') WHERE id=?", [err.message, id]);
    }
  })();

  return get('SELECT * FROM crawl_jobs WHERE id=?', [id]);
}

export function getCrawlJobs() { return all('SELECT * FROM crawl_jobs ORDER BY started_at DESC'); }
export function getCrawlJob(id) { return get('SELECT * FROM crawl_jobs WHERE id=?', [id]) || null; }
