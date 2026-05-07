// services/crawler.js — Web crawler for indexing internal websites
import { addDocuments } from './vectorStore.js';
import { chunkText } from './rag.js';

// Crawl job store
const crawlJobs = [];
let jobCounter = 0;

function createJob(url, department, depth) {
  const job = {
    id:         `CRAWL-${++jobCounter}`,
    url,
    department,
    depth,
    status:     'running',  // running | done | failed
    pages:      0,
    chunks:     0,
    error:      null,
    startedAt:  new Date().toISOString(),
    finishedAt: null,
  };
  crawlJobs.unshift(job);
  return job;
}

// Extract clean text from HTML
function extractText(html, baseUrl) {
  // Remove scripts, styles, nav, footer
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')           // strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')               // collapse whitespace
    .trim();
  return text;
}

// Extract internal links from HTML
function extractLinks(html, baseUrl) {
  const links = new Set();
  const base  = new URL(baseUrl);
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl);
      // Only follow same-origin links
      if (url.hostname === base.hostname && !url.pathname.match(/\.(pdf|jpg|png|gif|zip|doc|xls)$/i)) {
        url.hash = '';
        links.add(url.href);
      }
    } catch { /* invalid URL, skip */ }
  }
  return [...links];
}

// Fetch a single page with timeout
async function fetchPage(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NRL-Internal-Bot/1.0' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    return await res.text();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// Main crawl function
export async function crawlUrl(url, department, maxDepth = 1, maxPages = 20) {
  const job     = createJob(url, department, maxDepth);
  const visited = new Set();
  const queue   = [{ url, depth: 0 }];
  let totalChunks = 0;

  // Run async so the API response returns immediately
  (async () => {
    try {
      while (queue.length > 0 && visited.size < maxPages) {
        const { url: currentUrl, depth } = queue.shift();
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        try {
          console.log(`[Crawler] Fetching: ${currentUrl}`);
          const html = await fetchPage(currentUrl);
          const text = extractText(html, currentUrl);

          if (text.length > 100) {
            const source = `Web: ${new URL(currentUrl).hostname}${new URL(currentUrl).pathname}`;
            const chunks = chunkText(`[Source: ${currentUrl}]\n\n${text}`, 400, 40);
            if (chunks.length) {
              await addDocuments(department, chunks, source);
              totalChunks += chunks.length;
              job.pages++;
              job.chunks = totalChunks;
            }
          }

          // Follow links if depth allows
          if (depth < maxDepth) {
            const links = extractLinks(html, currentUrl);
            for (const link of links) {
              if (!visited.has(link)) queue.push({ url: link, depth: depth + 1 });
            }
          }

          // Small delay to be polite
          await new Promise(r => setTimeout(r, 300));

        } catch (pageErr) {
          console.warn(`[Crawler] Failed ${currentUrl}: ${pageErr.message}`);
        }
      }

      job.status     = 'done';
      job.finishedAt = new Date().toISOString();
      console.log(`[Crawler] Job ${job.id} done — ${job.pages} pages, ${job.chunks} chunks`);
    } catch (err) {
      job.status     = 'failed';
      job.error      = err.message;
      job.finishedAt = new Date().toISOString();
      console.error(`[Crawler] Job ${job.id} failed:`, err.message);
    }
  })();

  return job;
}

export function getCrawlJobs() { return crawlJobs; }
export function getCrawlJob(id) { return crawlJobs.find(j => j.id === id) || null; }
