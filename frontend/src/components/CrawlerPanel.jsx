// components/CrawlerPanel.jsx — Web Crawler admin panel
import React, { useState, useEffect, useRef } from 'react';

const DEPT_LIST = ['general','it','hr','fire & safety','marketing'];
const STATUS_COLORS = { running:'#f97316', done:'#22c55e', failed:'#ef4444' };

export function CrawlerPanel({ token }) {
  const [jobs, setJobs]       = useState([]);
  const [form, setForm]       = useState({ url:'', department:'general', depth:'1', maxPages:'20' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const pollRef = useRef(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/crawler', { headers:{ Authorization:`Bearer ${token}` } });
      setJobs(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 3000); // poll every 3s for live status
    return () => clearInterval(pollRef.current);
  }, [token]);

  const handleCrawl = async () => {
    setError(''); setSuccess('');
    if (!form.url) return setError('Please enter a URL');
    try { new URL(form.url); } catch { return setError('Please enter a valid URL (include http:// or https://)'); }

    setLoading(true);
    try {
      const res  = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'content-type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ url:form.url, department:form.department, depth:parseInt(form.depth), maxPages:parseInt(form.maxPages) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Crawl started! Job ${data.id} — indexing ${form.url} into ${form.department} knowledge base…`);
      setForm(f => ({...f, url:''}));
      fetchJobs();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      {/* Start crawl form */}
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'20px', marginBottom:24 }}>
        <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:4 }}>🕷️ Crawl a Website</div>
        <div style={{ fontSize:12, color:'#555e74', marginBottom:16 }}>
          Enter any internal URL — the crawler will fetch the page, extract text, and add it to the knowledge base automatically.
        </div>

        {error   && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:12, background:'rgba(239,68,68,0.1)', color:'#fca5a5', fontSize:13 }}>{error}</div>}
        {success && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:12, background:'rgba(34,197,94,0.1)', color:'#22c55e', fontSize:13 }}>{success}</div>}

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>URL to crawl</div>
          <input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))}
            onKeyDown={e=>e.key==='Enter'&&handleCrawl()}
            placeholder="https://www.nrl.co.in or http://intranet.nrl.co.in/hr/policies"
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, boxSizing:'border-box', outline:'none' }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Department</div>
            <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, outline:'none' }}>
              {DEPT_LIST.map(d=><option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Crawl Depth</div>
            <select value={form.depth} onChange={e=>setForm(f=>({...f,depth:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, outline:'none' }}>
              <option value="0">0 — This page only</option>
              <option value="1">1 — Page + linked pages</option>
              <option value="2">2 — Go 2 levels deep</option>
              <option value="3">3 — Go 3 levels deep</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Max Pages</div>
            <select value={form.maxPages} onChange={e=>setForm(f=>({...f,maxPages:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, outline:'none' }}>
              {[5,10,20,30,50].map(n=><option key={n} value={n}>{n} pages</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleCrawl} disabled={loading}
          style={{ padding:'9px 22px', borderRadius:8, background:loading?'#1e2535':'#f97316', border:'none', color:'#fff', fontSize:14, fontWeight:500, cursor:loading?'default':'pointer' }}>
          {loading ? 'Starting crawl…' : '🕷️ Start Crawling'}
        </button>
      </div>

      {/* Quick links to crawl */}
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px', marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'#e8eaf0', marginBottom:12 }}>Quick crawl — NRL public pages</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {[
            { label:'NRL Official Site', url:'https://www.nrl.co.in', dept:'general' },
            { label:'NRL About', url:'https://www.nrl.co.in/about', dept:'general' },
            { label:'NRL Products', url:'https://www.nrl.co.in/products', dept:'general' },
            { label:'NRL CSR', url:'https://www.nrl.co.in/csr', dept:'general' },
          ].map(q=>(
            <button key={q.url} onClick={()=>setForm(f=>({...f,url:q.url,department:q.dept}))}
              style={{ padding:'6px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:12, cursor:'pointer' }}>
              ↗ {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Crawl jobs list */}
      <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:12 }}>
        Crawl History
        <span style={{ fontSize:12, color:'#555e74', fontWeight:400, marginLeft:8 }}>auto-refreshes every 3s</span>
      </div>

      {jobs.length === 0 && <div style={{ color:'#555e74', fontSize:13 }}>No crawl jobs yet — enter a URL above to start.</div>}

      {jobs.map(job => (
        <div key={job.id} style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'14px 16px', marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:'#555e74', fontFamily:'monospace' }}>{job.id}</span>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:`${STATUS_COLORS[job.status]}22`, color:STATUS_COLORS[job.status], border:`1px solid ${STATUS_COLORS[job.status]}44` }}>
                {job.status === 'running' ? '⏳ running' : job.status === 'done' ? '✓ done' : '✕ failed'}
              </span>
              <span style={{ fontSize:12, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'#555e74' }}>{job.department}</span>
            </div>
            <span style={{ fontSize:11, color:'#555e74' }}>{new Date(job.startedAt).toLocaleString()}</span>
          </div>

          <div style={{ fontSize:12, color:'#8b92a8', wordBreak:'break-all', marginBottom:8 }}>🔗 {job.url}</div>

          <div style={{ display:'flex', gap:16, fontSize:12, color:'#555e74' }}>
            <span>📄 {job.pages} pages crawled</span>
            <span>🧩 {job.chunks} chunks indexed</span>
            <span>🔍 depth: {job.depth}</span>
            {job.finishedAt && <span>⏱ {Math.round((new Date(job.finishedAt)-new Date(job.startedAt))/1000)}s</span>}
          </div>

          {job.error && <div style={{ marginTop:8, fontSize:12, color:'#fca5a5' }}>Error: {job.error}</div>}

          {/* Progress bar for running jobs */}
          {job.status === 'running' && (
            <div style={{ marginTop:10, height:3, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'#f97316', borderRadius:2, animation:'crawlProgress 2s ease-in-out infinite' }} />
              <style>{`@keyframes crawlProgress { 0%{width:10%} 50%{width:80%} 100%{width:10%} }`}</style>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
