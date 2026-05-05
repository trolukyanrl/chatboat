// App.jsx - Simplified with error boundary
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar, DEPARTMENTS } from './components/Sidebar.jsx';
import { Message, TypingIndicator, MessageLinks } from './components/Message.jsx';
import { useChat, uploadDocument } from './hooks/useChat.js';

// Simple admin login modal
function AdminLogin({ onSuccess, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('nrl_admin_token', data.token);
        localStorage.setItem('nrl_admin_user', data.username);
        onSuccess(data.token, data.username);
      } else {
        setError('Invalid username or password');
      }
    } catch (e) {
      setError('Cannot connect to backend: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'32px', width:340, fontFamily:'var(--font)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ fontSize:16, fontWeight:600, color:'#e8eaf0' }}>Admin Login</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555e74', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>

        {error && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:14, background:'rgba(239,68,68,0.15)', color:'#fca5a5', fontSize:13 }}>{error}</div>}

        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Username</div>
          <input value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleLogin()}
            placeholder="admin"
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:14, boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleLogin()}
            placeholder="••••••••"
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:14, boxSizing:'border-box' }} />
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:'10px', borderRadius:8, background: loading ? '#1e2535' : '#f97316', border:'none', color:'#fff', fontSize:14, fontWeight:500, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

// Simple admin dashboard
function AdminDashboard({ onClose, token }) {
  const [stats, setStats] = useState(null);
  const [err, setErr]     = useState('');

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats)
      .catch(e => setErr(e.message));
  }, [token]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#0f1117', fontFamily:'var(--font)', overflowY:'auto' }}>
      <div style={{ padding:'16px 28px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:16, fontWeight:600, color:'#e8eaf0' }}>⬡ Admin Dashboard</div>
        <button onClick={onClose} style={{ padding:'6px 14px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8b92a8', fontSize:13, cursor:'pointer' }}>✕ Close</button>
      </div>
      <div style={{ padding:'24px 28px' }}>
        {err && <div style={{ color:'#fca5a5', marginBottom:16 }}>Error: {err}</div>}
        {!stats && !err && <div style={{ color:'#555e74' }}>Loading stats…</div>}
        {stats && <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'Total Queries', value: stats.totalQueries },
              { label:'Avg Response', value: `${((stats.avgResponseTimeMs||0)/1000).toFixed(1)}s` },
              { label:'LLM', value: stats.llm?.provider?.toUpperCase() },
            ].map(c => (
              <div key={c.label} style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:12, color:'#555e74', marginBottom:6 }}>{c.label}</div>
                <div style={{ fontSize:22, fontWeight:600, color:'#e8eaf0' }}>{c.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:12 }}>Recent queries</div>
            {stats.recentQueries?.length === 0 && <div style={{ color:'#555e74', fontSize:13 }}>No queries yet</div>}
            {stats.recentQueries?.slice(0,10).map((q,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
                <span style={{ color:'#555e74', minWidth:90, textTransform:'capitalize' }}>{q.dept}</span>
                <span style={{ color:'#8b92a8', flex:1 }}>{q.question}</span>
                <span style={{ color:'#555e74' }}>{q.responseTime}ms</span>
              </div>
            ))}
          </div>
          <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:12 }}>Knowledge base</div>
            {stats.knowledgeBase?.length === 0 && <div style={{ color:'#555e74', fontSize:13 }}>No documents uploaded yet</div>}
            {stats.knowledgeBase?.map(k => (
              <div key={k.department} style={{ display:'flex', gap:16, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
                <span style={{ color:'#e8eaf0', width:120, textTransform:'capitalize' }}>{k.department}</span>
                <span style={{ color:'#555e74' }}>{k.chunks} chunks</span>
                <span style={{ color:'#555e74' }}>{k.sources.join(', ') || '—'}</span>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}

function WelcomeScreen({ department, onSuggest }) {
  const dept = DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];
  const suggestions = {
    it:              ['How do I set up VPN?', 'Request new software', 'Reset my network password'],
    hr:              ['What is the leave policy?', 'How to apply for payroll advance?', 'Onboarding checklist'],
    'fire & safety': ['Emergency evacuation steps', 'Where to report an incident?', 'Required PPE for field work'],
    marketing:       ['Brand color guidelines', 'Upcoming company events', 'Internal newsletter contacts'],
    general:         ['Tell me about NRL', 'Find the HR portal', 'Who handles IT requests?'],
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:40, textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:16, marginBottom:20, background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#fff' }}>N</div>
      <h1 style={{ fontSize:22, fontWeight:600, color:'#e8eaf0', marginBottom:8 }}>{dept.label} Assistant</h1>
      <p style={{ fontSize:14, color:'#555e74', maxWidth:360, marginBottom:32, lineHeight:1.7 }}>
        Ask me anything about {dept.label === 'General' ? 'NRL internal resources' : `the ${dept.label} department`}.
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', maxWidth:440 }}>
        {(suggestions[department] || suggestions.general).map(q => (
          <button key={q} onClick={() => onSuggest(q)} style={{ padding:'8px 14px', borderRadius:20, background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:13, cursor:'pointer', fontFamily:'var(--font)' }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [department, setDepartment] = useState('general');
  const [input, setInput]           = useState('');
  const [showLogin, setShowLogin]   = useState(false);
  const [showAdmin, setShowAdmin]   = useState(false);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('nrl_admin_token') || '');
  const [adminUser, setAdminUser]   = useState(() => localStorage.getItem('nrl_admin_user') || '');
  const [uploadStatus, setUploadStatus] = useState(null);

  const { messages, loading, sendMessage, clearChat } = useChat();
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const handleLoginSuccess = (token, user) => {
    setAdminToken(token);
    setAdminUser(user);
    setShowLogin(false);
    setShowAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('nrl_admin_token');
    localStorage.removeItem('nrl_admin_user');
    setAdminToken('');
    setAdminUser('');
    setShowAdmin(false);
  };

  const openAdmin = () => {
    if (adminToken) setShowAdmin(true);
    else setShowLogin(true);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(text, department);
  }, [input, loading, sendMessage, department]);

  const handleKey = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleSuggest = q => { setInput(q); inputRef.current?.focus(); };
  const handleDeptChange = dept => { setDepartment(dept); clearChat(); };

  const handleUpload = async file => {
    if (!adminToken) { setShowLogin(true); return; }
    setUploadStatus({ state:'uploading', name:file.name });
    try {
      const form = new FormData();
      form.append('file', file); form.append('department', department);
      const res  = await fetch('/api/documents/upload', { method:'POST', body:form, headers:{ Authorization:`Bearer ${adminToken}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadStatus({ state:'done', name:file.name, chunks:data.chunks });
    } catch (e) {
      setUploadStatus({ state:'error', name:file.name, error:e.message });
    }
    setTimeout(() => setUploadStatus(null), 4000);
  };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {showLogin && <AdminLogin onSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} token={adminToken} />}

      <Sidebar active={department} onSelect={handleDeptChange} onSuggest={handleSuggest} onUpload={handleUpload} onClear={clearChat} />

      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#0f1117' }}>
        <header style={{ padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: DEPARTMENTS.find(d=>d.id===department)?.color||'#f97316' }} />
            <span style={{ fontSize:14, fontWeight:500, color:'#e8eaf0' }}>{DEPARTMENTS.find(d=>d.id===department)?.label||'General'} Knowledge Base</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
            <span style={{ fontSize:12, color:'#555e74' }}>RAG Active</span>
            <button onClick={openAdmin} style={{ padding:'5px 12px', borderRadius:8, background:'#1e2535', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:12, cursor:'pointer' }}>
              ⬡ Admin
            </button>
            {adminUser && (
              <>
                <span style={{ fontSize:12, color:'#555e74' }}>{adminUser}</span>
                <button onClick={handleLogout} style={{ padding:'4px 8px', borderRadius:6, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#555e74', fontSize:11, cursor:'pointer' }}>Sign out</button>
              </>
            )}
          </div>
        </header>

        {uploadStatus && (
          <div style={{ margin:'12px 24px 0', padding:'10px 14px', borderRadius:8, fontSize:13,
            background: uploadStatus.state==='error' ? 'rgba(239,68,68,0.1)' : 'rgba(20,184,166,0.1)',
            color: uploadStatus.state==='error' ? '#fca5a5' : '#5eead4' }}>
            {uploadStatus.state==='uploading' && `⏳ Processing ${uploadStatus.name}…`}
            {uploadStatus.state==='done'      && `✓ ${uploadStatus.name} indexed — ${uploadStatus.chunks} chunks added`}
            {uploadStatus.state==='error'     && `✕ ${uploadStatus.name}: ${uploadStatus.error}`}
          </div>
        )}

        <div style={{ flex:1, overflowY:'auto', padding:'24px 24px 0' }}>
          {messages.length === 0
            ? <WelcomeScreen department={department} onSuggest={handleSuggest} />
            : <>
                {messages.map(msg => (
                  <div key={msg.id}>
                    <Message msg={msg} />
                    {msg.role==='assistant' && msg.links?.length > 0 && <MessageLinks links={msg.links} />}
                  </div>
                ))}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} style={{ height:24 }} />
              </>
          }
        </div>

        <div style={{ padding:'16px 24px 20px', borderTop:'1px solid rgba(255,255,255,0.08)', background:'#0f1117' }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'10px 12px' }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={`Ask the ${DEPARTMENTS.find(d=>d.id===department)?.label||''} assistant…`}
              rows={1} style={{ flex:1, background:'transparent', border:'none', color:'#e8eaf0', fontSize:14, resize:'none', lineHeight:1.6, padding:0, maxHeight:120, overflowY:'auto', fontFamily:'var(--font)', outline:'none' }}
              onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'; }}
            />
            <button onClick={handleSend} disabled={!input.trim()||loading} style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:input.trim()&&!loading?'#f97316':'#1e2535', border:'none', color:input.trim()&&!loading?'#fff':'#555e74', fontSize:16, cursor:input.trim()&&!loading?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center' }}>↑</button>
          </div>
          <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:'#555e74' }}>
            Enter to send · {adminUser ? 'Admin mode active' : 'Click Admin to manage knowledge base'}
          </div>
        </div>
      </main>
    </div>
  );
}