// components/LinkNavigator.jsx
import React, { useState, useEffect } from 'react';

const DEPT_LIST = ['general','it','hr','fire & safety','marketing'];
const DEPT_COLORS = {
  general:'#888780', it:'#378ADD', hr:'#1D9E75',
  'fire & safety':'#E24B4A', marketing:'#7F77DD',
};

export function LinkPanel({ department, links }) {
  if (!links?.length) return null;
  return (
    <div style={{ marginTop:10, paddingLeft:38 }}>
      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Quick links</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {links.map((l, i) => (
          <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{
            display:'inline-flex', alignItems:'center', gap:5,
            padding:'4px 10px', borderRadius:6, fontSize:12,
            background:'var(--bg3)', border:'1px solid var(--border)',
            color:'var(--text2)', textDecoration:'none',
            transition:'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)'; }}
            title={l.desc}
          >
            <span style={{ fontSize:10 }}>↗</span> {l.title}
          </a>
        ))}
      </div>
    </div>
  );
}

export function LinkNavigatorPanel({ department, onClose }) {
  const [links, setLinks] = useState([]);
  const [activeDept, setActiveDept] = useState(department || 'general');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title:'', url:'', keywords:'', desc:'' });
  const [status, setStatus] = useState(null);

  const fetchLinks = async (dept) => {
    try {
      const res = await fetch(`/api/links/${dept}`);
      setLinks(await res.json());
    } catch { setLinks([]); }
  };

  useEffect(() => { fetchLinks(activeDept); }, [activeDept]);

  const filtered = links.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.desc.toLowerCase().includes(search.toLowerCase()) ||
    l.keywords.some(k => k.includes(search.toLowerCase()))
  );

  const handleAdd = async () => {
    if (!form.title || !form.url) return setStatus({ type:'error', msg:'Title and URL are required' });
    try {
      await fetch(`/api/links/${activeDept}`, {
        method:'POST', headers:{ 'content-type':'application/json' },
        body: JSON.stringify({ ...form, keywords: form.keywords.split(',').map(k=>k.trim()) }),
      });
      setStatus({ type:'ok', msg:'Link added!' });
      setForm({ title:'', url:'', keywords:'', desc:'' });
      setAdding(false);
      fetchLinks(activeDept);
    } catch { setStatus({ type:'error', msg:'Failed to add link' }); }
    setTimeout(() => setStatus(null), 3000);
  };

  const handleDelete = async (title) => {
    await fetch(`/api/links/${activeDept}/${encodeURIComponent(title)}`, { method:'DELETE' });
    fetchLinks(activeDept);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'var(--bg)', fontFamily:'var(--font)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16 }}>↗</div>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text)' }}>Smart Link Navigator</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Manage internal portal links by department</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setAdding(a => !a)} style={{ padding:'6px 14px', borderRadius:8, background:'var(--accent)', border:'none', color:'#fff', fontSize:13, cursor:'pointer' }}>+ Add Link</button>
          <button onClick={onClose} style={{ padding:'6px 14px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>✕ Close</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {/* Status */}
        {status && (
          <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:13,
            background: status.type==='ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: status.type==='ok' ? 'var(--green)' : '#fca5a5',
            border: `1px solid ${status.type==='ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {status.msg}
          </div>
        )}

        {/* Add form */}
        {adding && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'20px', marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:14 }}>Add new link to {activeDept.toUpperCase()}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              {[['title','Link Title (e.g. IT Helpdesk)'],['url','URL (e.g. http://helpdesk.nrl.co.in)'],
                ['keywords','Keywords, comma separated'],['desc','Short description']].map(([k,ph]) => (
                <input key={k} placeholder={ph} value={form[k]}
                  onChange={e => setForm(f => ({...f, [k]:e.target.value}))}
                  style={{ padding:'8px 12px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13 }}
                />
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleAdd} style={{ padding:'7px 16px', borderRadius:8, background:'var(--accent)', border:'none', color:'#fff', fontSize:13, cursor:'pointer' }}>Save Link</button>
              <button onClick={() => setAdding(false)} style={{ padding:'7px 16px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Dept tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
          {DEPT_LIST.map(d => (
            <button key={d} onClick={() => { setActiveDept(d); setSearch(''); }}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer',
                background: activeDept===d ? 'var(--bg3)' : 'transparent',
                border: activeDept===d ? `1px solid ${DEPT_COLORS[d]}` : '1px solid var(--border)',
                color: activeDept===d ? 'var(--text)' : 'var(--text2)',
                fontFamily:'var(--font)',
              }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background: DEPT_COLORS[d], display:'inline-block', marginRight:6 }} />
              {d.charAt(0).toUpperCase()+d.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <input placeholder="Search links…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'9px 14px', borderRadius:10, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, marginBottom:16, fontFamily:'var(--font)' }}
        />

        {/* Links grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
          {filtered.map((l, i) => (
            <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', position:'relative' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize:14, fontWeight:500, color:'var(--accent)', textDecoration:'none', lineHeight:1.4 }}>
                  ↗ {l.title}
                </a>
                <button onClick={() => handleDelete(l.title)} style={{ background:'transparent', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, flexShrink:0, padding:0 }} title="Remove">✕</button>
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>{l.desc}</div>
              <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', wordBreak:'break-all', marginBottom:8 }}>{l.url}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {l.keywords.slice(0,5).map(k => (
                  <span key={k} style={{ fontSize:11, padding:'2px 7px', borderRadius:4, background:'var(--bg3)', color:'var(--text3)' }}>{k}</span>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color:'var(--text3)', fontSize:14, gridColumn:'1/-1', padding:'20px 0' }}>
              {search ? `No links found for "${search}"` : 'No links yet for this department'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
