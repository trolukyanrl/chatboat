// App.jsx v3 — with Ticket System
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar, DEPARTMENTS } from './components/Sidebar.jsx';
import { Message, TypingIndicator, MessageLinks } from './components/Message.jsx';
import { useChat } from './hooks/useChat.js';
import { TicketForm, TicketSuccess } from './components/TicketForm.jsx';
import { TicketsPanel } from './components/TicketsPanel.jsx';
import { CrawlerPanel } from './components/CrawlerPanel.jsx';

// ── Admin Login ─────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ username, password }) });
      const data = await res.json();
      if (data.success) { localStorage.setItem('nrl_admin_token', data.token); localStorage.setItem('nrl_admin_user', data.username); onSuccess(data.token, data.username); }
      else setError('Invalid username or password');
    } catch (e) { setError('Cannot connect to backend: ' + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'32px', width:340, fontFamily:'var(--font)', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', color:'#555e74', fontSize:20, cursor:'pointer' }}>✕</button>
        <div style={{ fontSize:16, fontWeight:600, color:'#e8eaf0', marginBottom:24 }}>Admin Login — NRL</div>
        {error && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:14, background:'rgba(239,68,68,0.15)', color:'#fca5a5', fontSize:13 }}>{error}</div>}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Username</div>
          <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="admin"
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:14, boxSizing:'border-box', outline:'none' }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Password</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="••••••••"
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:14, boxSizing:'border-box', outline:'none' }} />
        </div>
        <button onClick={handleLogin} disabled={loading} style={{ width:'100%', padding:'10px', borderRadius:8, background:loading?'#1e2535':'#f97316', border:'none', color:'#fff', fontSize:14, fontWeight:500, cursor:loading?'default':'pointer' }}>
          {loading?'Signing in…':'Sign in'}
        </button>
      </div>
    </div>
  );
}

// ── Admin Dashboard ─────────────────────────────────────────────────────────
const DEPT_LIST = ['general','it','hr','fire & safety','marketing'];
const DEPT_COLORS = { general:'#888780', it:'#3b82f6', hr:'#14b8a6', 'fire & safety':'#ef4444', marketing:'#a855f7' };
const PRIORITY_COLORS = { low:'#22c55e', medium:'#f97316', high:'#ef4444', critical:'#7f1d1d' };

function AdminDashboard({ onClose, token, onLogout }) {
  const [tab, setTab]   = useState('stats');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab==='stats') {
      fetch('/api/admin/stats', { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(setStats).catch(()=>{});
    }
  }, [tab, token]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#0f1117', fontFamily:'var(--font)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 28px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontSize:16, fontWeight:600, color:'#e8eaf0' }}>⬡ Admin Panel</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onLogout} style={{ padding:'6px 14px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#555e74', fontSize:13, cursor:'pointer' }}>Sign out</button>
          <button onClick={onClose}  style={{ padding:'6px 14px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8b92a8', fontSize:13, cursor:'pointer' }}>✕ Close</button>
        </div>
      </div>
      <div style={{ display:'flex', gap:4, padding:'12px 28px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
        {[['stats','📊 Analytics'],['links','↗ Links'],['tickets','🎫 Tickets'],['crawler','🕷️ Crawler'],['upload','📄 Upload']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 16px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'var(--font)',
            background:tab===id?'#1e2535':'transparent', border:tab===id?'1px solid rgba(255,255,255,0.14)':'1px solid transparent', color:tab===id?'#e8eaf0':'#555e74' }}>{label}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {tab==='stats'   && <StatsTab stats={stats} />}
        {tab==='links'   && <LinksTab token={token} />}
        {tab==='tickets' && <TicketsPanel token={token} />}
        {tab==='crawler' && <CrawlerPanel token={token} />}
        {tab==='upload'  && <UploadTab token={token} />}
      </div>
    </div>
  );
}

function StatsTab({ stats }) {
  if (!stats) return <div style={{ color:'#555e74' }}>Loading…</div>;
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[{label:'Total Queries',value:stats.totalQueries},{label:'Avg Response',value:`${((stats.avgResponseTimeMs||0)/1000).toFixed(1)}s`},{label:'LLM',value:stats.llm?.provider?.toUpperCase()}].map(c=>(
          <div key={c.label} style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:6 }}>{c.label}</div>
            <div style={{ fontSize:22, fontWeight:600, color:'#e8eaf0' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:12 }}>Recent queries</div>
        {!stats.recentQueries?.length && <div style={{ color:'#555e74', fontSize:13 }}>No queries yet</div>}
        {stats.recentQueries?.slice(0,10).map((q,i)=>(
          <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
            <span style={{ color:'#555e74', minWidth:100, textTransform:'capitalize' }}>{q.dept}</span>
            <span style={{ color:'#8b92a8', flex:1 }}>{q.question}</span>
            <span style={{ color:'#555e74' }}>{q.responseTime}ms</span>
          </div>
        ))}
      </div>
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px' }}>
        <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:12 }}>Knowledge base</div>
        {!stats.knowledgeBase?.length && <div style={{ color:'#555e74', fontSize:13 }}>No documents uploaded yet</div>}
        {stats.knowledgeBase?.map(k=>(
          <div key={k.department} style={{ display:'flex', gap:16, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
            <span style={{ color:'#e8eaf0', width:120, textTransform:'capitalize' }}>{k.department}</span>
            <span style={{ color:'#555e74' }}>{k.chunks} chunks</span>
            <span style={{ color:'#555e74', flex:1 }}>{k.sources.join(', ')||'—'}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function LinksTab({ token }) {
  const [activeDept, setActiveDept] = useState('general');
  const [links, setLinks]   = useState([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ title:'', url:'', keywords:'', desc:'' });
  const [status, setStatus] = useState(null);

  const fetchLinks = async (dept) => {
    try { const res=await fetch(`/api/links/${dept}`,{headers:{Authorization:`Bearer ${token}`}}); setLinks(await res.json()); } catch { setLinks([]); }
  };
  useEffect(()=>{ fetchLinks(activeDept); },[activeDept]);

  const filtered = links.filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.desc||'').toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    if (!form.title||!form.url) return setStatus({type:'error',msg:'Title and URL required'});
    try {
      await fetch(`/api/links/${activeDept}`,{ method:'POST', headers:{'content-type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({...form,keywords:form.keywords.split(',').map(k=>k.trim()).filter(Boolean)}) });
      setStatus({type:'ok',msg:'Link added!'}); setForm({title:'',url:'',keywords:'',desc:''}); setAdding(false); fetchLinks(activeDept);
    } catch { setStatus({type:'error',msg:'Failed'}); }
    setTimeout(()=>setStatus(null),3000);
  };

  const handleDelete = async (title) => {
    await fetch(`/api/links/${activeDept}/${encodeURIComponent(title)}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
    fetchLinks(activeDept);
  };

  return (
    <>
      {status && <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:13, background:status.type==='ok'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:status.type==='ok'?'#22c55e':'#fca5a5' }}>{status.msg}</div>}
      {adding && (
        <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:14 }}>Add link to {activeDept}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {[['title','Link Title'],['url','URL (http://…)'],['keywords','Keywords (comma separated)'],['desc','Description']].map(([k,ph])=>(
              <input key={k} placeholder={ph} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                style={{ padding:'8px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, outline:'none' }} />
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAdd} style={{ padding:'7px 18px', borderRadius:8, background:'#f97316', border:'none', color:'#fff', fontSize:13, cursor:'pointer' }}>Save</button>
            <button onClick={()=>setAdding(false)} style={{ padding:'7px 18px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8b92a8', fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {DEPT_LIST.map(d=>(
            <button key={d} onClick={()=>{setActiveDept(d);setSearch('');}} style={{ padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:'var(--font)', background:activeDept===d?'#1e2535':'transparent', border:activeDept===d?`1px solid ${DEPT_COLORS[d]}`:'1px solid rgba(255,255,255,0.08)', color:activeDept===d?'#e8eaf0':'#555e74' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:DEPT_COLORS[d], display:'inline-block', marginRight:6 }}/>{d.charAt(0).toUpperCase()+d.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={()=>setAdding(a=>!a)} style={{ padding:'7px 16px', borderRadius:8, background:'#f97316', border:'none', color:'#fff', fontSize:13, cursor:'pointer' }}>+ Add Link</button>
      </div>
      <input placeholder="Search links…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{ width:'100%', padding:'9px 14px', borderRadius:10, background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', color:'#e8eaf0', fontSize:14, marginBottom:16, boxSizing:'border-box', outline:'none', fontFamily:'var(--font)' }} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:12 }}>
        {filtered.map((l,i)=>(
          <div key={i} style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize:14, fontWeight:500, color:'#f97316', textDecoration:'none' }}>↗ {l.title}</a>
              <button onClick={()=>handleDelete(l.title)} style={{ background:'transparent', border:'none', color:'#555e74', cursor:'pointer', fontSize:16, padding:0, marginLeft:8 }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:6 }}>{l.desc}</div>
            <div style={{ fontSize:11, color:'#3b4358', fontFamily:'monospace', wordBreak:'break-all', marginBottom:8 }}>{l.url}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {(l.keywords||[]).slice(0,5).map(k=><span key={k} style={{ fontSize:11, padding:'2px 7px', borderRadius:4, background:'#0f1117', color:'#555e74' }}>{k}</span>)}
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{ color:'#555e74', fontSize:14, gridColumn:'1/-1', padding:'20px 0' }}>{search?`No results for "${search}"`:'No links yet — click "+ Add Link"'}</div>}
      </div>
    </>
  );
}

function UploadTab({ token }) {
  const [dept, setDept]     = useState('general');
  const [status, setStatus] = useState(null);
  const handleUpload = async file => {
    setStatus({state:'uploading',name:file.name});
    try {
      const form=new FormData(); form.append('file',file); form.append('department',dept);
      const res=await fetch('/api/documents/upload',{method:'POST',body:form,headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      if (!res.ok) throw new Error(data.error||'Upload failed');
      setStatus({state:'done',name:file.name,chunks:data.chunks});
    } catch(e){ setStatus({state:'error',name:file.name,error:e.message}); }
  };
  return (
    <div style={{ maxWidth:500 }}>
      <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:16 }}>Upload documents to knowledge base</div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, color:'#555e74', marginBottom:6 }}>Department</div>
        <select value={dept} onChange={e=>setDept(e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#161b24', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:14, outline:'none' }}>
          {DEPT_LIST.map(d=><option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
        </select>
      </div>
      <label style={{ display:'block', padding:'32px', borderRadius:12, border:'2px dashed rgba(255,255,255,0.1)', textAlign:'center', cursor:'pointer', background:'#161b24' }}>
        <div style={{ fontSize:32, marginBottom:10 }}>📄</div>
        <div style={{ color:'#8b92a8', fontSize:14, marginBottom:6 }}>Click to upload a document</div>
        <div style={{ color:'#555e74', fontSize:12 }}>PDF, TXT, MD — max 20MB</div>
        <input type="file" accept=".pdf,.txt,.md" style={{ display:'none' }} onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}} />
      </label>
      {status && (
        <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8, fontSize:13,
          background:status.state==='error'?'rgba(239,68,68,0.1)':status.state==='done'?'rgba(34,197,94,0.1)':'rgba(20,184,166,0.1)',
          color:status.state==='error'?'#fca5a5':status.state==='done'?'#22c55e':'#5eead4' }}>
          {status.state==='uploading'&&`⏳ Processing ${status.name}…`}
          {status.state==='done'&&`✓ ${status.name} — ${status.chunks} chunks indexed into ${dept}`}
          {status.state==='error'&&`✕ ${status.name}: ${status.error}`}
        </div>
      )}
    </div>
  );
}

// ── Ticket suggestion banner shown below bot answer ─────────────────────────
function TicketSuggestion({ onRaise }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ marginLeft:38, marginTop:8, marginBottom:8, padding:'10px 14px', borderRadius:10, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
      <span style={{ fontSize:13, color:'#93c5fd' }}>Couldn't find what you need? Raise a support ticket and our team will help.</span>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={onRaise} style={{ padding:'5px 12px', borderRadius:6, background:'#3b82f6', border:'none', color:'#fff', fontSize:12, cursor:'pointer' }}>🎫 Raise Ticket</button>
        <button onClick={()=>setDismissed(true)} style={{ padding:'5px 8px', borderRadius:6, background:'transparent', border:'none', color:'#555e74', fontSize:14, cursor:'pointer' }}>✕</button>
      </div>
    </div>
  );
}

// ── Welcome Screen ──────────────────────────────────────────────────────────
function WelcomeScreen({ department, onSuggest, onRaiseTicket }) {
  const dept = DEPARTMENTS.find(d=>d.id===department)||DEPARTMENTS[0];
  const suggestions = {
    it:['How do I set up VPN?','Request new software','Reset my network password'],
    hr:['What is the leave policy?','How to apply for payroll advance?','Onboarding checklist'],
    'fire & safety':['Emergency evacuation steps','Where to report an incident?','Required PPE for field work'],
    marketing:['Brand color guidelines','Upcoming company events','Internal newsletter contacts'],
    general:['Tell me about NRL','Find the HR portal','Who handles IT requests?'],
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:40, textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:16, marginBottom:20, background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#fff' }}>N</div>
      <h1 style={{ fontSize:22, fontWeight:600, color:'#e8eaf0', marginBottom:8 }}>{dept.label} Assistant</h1>
      <p style={{ fontSize:14, color:'#555e74', maxWidth:360, marginBottom:28, lineHeight:1.7 }}>Ask me anything about {dept.label==='General'?'NRL internal resources':`the ${dept.label} department`}.</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', maxWidth:440, marginBottom:20 }}>
        {(suggestions[department]||suggestions.general).map(q=>(
          <button key={q} onClick={()=>onSuggest(q)} style={{ padding:'8px 14px', borderRadius:20, background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:13, cursor:'pointer', fontFamily:'var(--font)' }}>{q}</button>
        ))}
      </div>
      <button onClick={onRaiseTicket} style={{ padding:'8px 18px', borderRadius:20, background:'transparent', border:'1px solid rgba(59,130,246,0.4)', color:'#93c5fd', fontSize:13, cursor:'pointer' }}>
        🎫 Raise a support ticket
      </button>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [department, setDepartment]     = useState('general');
  const [input, setInput]               = useState('');
  const [showLogin, setShowLogin]       = useState(false);
  const [showAdmin, setShowAdmin]       = useState(false);
  const [adminToken, setAdminToken]     = useState(()=>localStorage.getItem('nrl_admin_token')||'');
  const [adminUser, setAdminUser]       = useState(()=>localStorage.getItem('nrl_admin_user')||'');
  const [ticketForm, setTicketForm]     = useState(null); // { prefillTitle }
  const [ticketSuccess, setTicketSuccess] = useState(null);

  const { messages, loading, sendMessage, clearChat } = useChat();
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,loading]);

  const handleLoginSuccess = (token, user) => { setAdminToken(token); setAdminUser(user); setShowLogin(false); setShowAdmin(true); };
  const handleLogout = () => { localStorage.removeItem('nrl_admin_token'); localStorage.removeItem('nrl_admin_user'); setAdminToken(''); setAdminUser(''); setShowAdmin(false); };
  const openAdmin   = () => adminToken ? setShowAdmin(true) : setShowLogin(true);
  const openTicket  = (prefill='') => setTicketForm({ prefillTitle: prefill });

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text||loading) return;
    setInput('');
    await sendMessage(text, department);
  }, [input, loading, sendMessage, department]);

  const handleKey     = e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} };
  const handleSuggest = q => { setInput(q); inputRef.current?.focus(); };
  const handleDeptChange = dept => { setDepartment(dept); clearChat(); };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {showLogin    && <AdminLogin onSuccess={handleLoginSuccess} onClose={()=>setShowLogin(false)} />}
      {showAdmin    && <AdminDashboard onClose={()=>setShowAdmin(false)} token={adminToken} onLogout={handleLogout} />}
      {ticketForm   && (
        <TicketForm department={department} prefillTitle={ticketForm.prefillTitle}
          onClose={()=>setTicketForm(null)}
          onSuccess={t=>{ setTicketForm(null); setTicketSuccess(t); }} />
      )}
      {ticketSuccess && <TicketSuccess ticket={ticketSuccess} onClose={()=>setTicketSuccess(null)} />}

      <Sidebar active={department} onSelect={handleDeptChange} onSuggest={handleSuggest} onUpload={openAdmin} onClear={clearChat} />

      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#0f1117' }}>
        <header style={{ padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:DEPARTMENTS.find(d=>d.id===department)?.color||'#f97316' }} />
            <span style={{ fontSize:14, fontWeight:500, color:'#e8eaf0' }}>{DEPARTMENTS.find(d=>d.id===department)?.label||'General'} Knowledge Base</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} /><span style={{ fontSize:12, color:'#555e74' }}>RAG Active</span>
            <button onClick={()=>openTicket()} style={{ padding:'5px 12px', borderRadius:8, background:'#1e2535', border:'1px solid rgba(59,130,246,0.3)', color:'#93c5fd', fontSize:12, cursor:'pointer' }}>🎫 Ticket</button>
            <button onClick={openAdmin} style={{ padding:'5px 12px', borderRadius:8, background:'#1e2535', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:12, cursor:'pointer' }}>⬡ Admin</button>
            {adminUser && (<><span style={{ fontSize:12, color:'#555e74' }}>{adminUser}</span><button onClick={handleLogout} style={{ padding:'4px 8px', borderRadius:6, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#555e74', fontSize:11, cursor:'pointer' }}>Sign out</button></>)}
          </div>
        </header>

        <div style={{ flex:1, overflowY:'auto', padding:'24px 24px 0' }}>
          {messages.length===0
            ? <WelcomeScreen department={department} onSuggest={handleSuggest} onRaiseTicket={()=>openTicket()} />
            : <>
                {messages.map(msg=>(
                  <div key={msg.id}>
                    <Message msg={msg} />
                    {msg.role==='assistant' && msg.links?.length>0 && <MessageLinks links={msg.links} />}
                    {msg.role==='assistant' && msg.suggestTicket && <TicketSuggestion onRaise={()=>openTicket()} />}
                  </div>
                ))}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} style={{ height:24 }} />
              </>
          }
        </div>

        <div style={{ padding:'16px 24px 20px', borderTop:'1px solid rgba(255,255,255,0.08)', background:'#0f1117' }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'10px 12px' }}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={`Ask the ${DEPARTMENTS.find(d=>d.id===department)?.label||''} assistant…`}
              rows={1} style={{ flex:1, background:'transparent', border:'none', color:'#e8eaf0', fontSize:14, resize:'none', lineHeight:1.6, padding:0, maxHeight:120, overflowY:'auto', fontFamily:'var(--font)', outline:'none' }}
              onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';}} />
            <button onClick={handleSend} disabled={!input.trim()||loading}
              style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:input.trim()&&!loading?'#f97316':'#1e2535', border:'none', color:input.trim()&&!loading?'#fff':'#555e74', fontSize:16, cursor:input.trim()&&!loading?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center' }}>↑</button>
          </div>
          <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:'#555e74' }}>
            Enter to send · {adminUser?`Admin: ${adminUser}`:'🎫 Ticket button to escalate issues'}
          </div>
        </div>
      </main>
    </div>
  );
}
