// components/TicketsPanel.jsx — Admin ticket management panel
import React, { useState, useEffect } from 'react';

const STATUS_COLORS   = { open:'#3b82f6', 'in-progress':'#f97316', resolved:'#22c55e', closed:'#555e74' };
const PRIORITY_COLORS = { low:'#22c55e', medium:'#f97316', high:'#ef4444', critical:'#7f1d1d' };

function Badge({ label, color }) {
  return (
    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:`${color}22`, color, border:`1px solid ${color}44`, fontWeight:500 }}>
      {label}
    </span>
  );
}

export function TicketsPanel({ token }) {
  const [tickets, setTickets]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState({ status:'', priority:'', department:'' });
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);

  const fetchTickets = async () => {
    const params = new URLSearchParams();
    if (filter.status)     params.set('status',     filter.status);
    if (filter.priority)   params.set('priority',   filter.priority);
    if (filter.department) params.set('department', filter.department);
    const res = await fetch(`/api/tickets?${params}`, { headers:{ Authorization:`Bearer ${token}` } });
    setTickets(await res.json());
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const updateTicket = async (id, patch) => {
    setLoading(true);
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'content-type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setSelected(updated);
    setComment('');
    fetchTickets();
    setLoading(false);
  };

  const sel = selected;

  return (
    <div style={{ display:'flex', gap:16, height:'100%' }}>
      {/* List */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Filters */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {[
            { key:'status',     opts:['','open','in-progress','resolved','closed'],           placeholder:'All statuses' },
            { key:'priority',   opts:['','low','medium','high','critical'],                    placeholder:'All priorities' },
            { key:'department', opts:['','general','it','hr','fire & safety','marketing'],     placeholder:'All departments' },
          ].map(({ key, opts }) => (
            <select key={key} value={filter[key]} onChange={e => setFilter(f=>({...f,[key]:e.target.value}))}
              style={{ padding:'7px 12px', borderRadius:8, background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:13, outline:'none', cursor:'pointer' }}>
              {opts.map(o => <option key={o} value={o}>{o || `All ${key}s`}</option>)}
            </select>
          ))}
          <button onClick={fetchTickets} style={{ padding:'7px 14px', borderRadius:8, background:'#1e2535', border:'1px solid rgba(255,255,255,0.08)', color:'#8b92a8', fontSize:13, cursor:'pointer' }}>↻</button>
        </div>

        {tickets.length === 0 && (
          <div style={{ color:'#555e74', fontSize:14, padding:'20px 0', textAlign:'center' }}>
            No tickets found. Employees can raise tickets from the chat!
          </div>
        )}

        {tickets.map(t => (
          <div key={t.id} onClick={() => setSelected(t)}
            style={{ background: selected?.id===t.id ? '#1e2535' : '#161b24', border:`1px solid ${selected?.id===t.id ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'12px 16px', marginBottom:8, cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'#555e74', fontFamily:'monospace' }}>{t.id}</span>
                <Badge label={t.status}   color={STATUS_COLORS[t.status]||'#555e74'} />
                <Badge label={t.priority} color={PRIORITY_COLORS[t.priority]||'#555e74'} />
              </div>
              <span style={{ fontSize:11, color:'#555e74' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:500, color:'#e8eaf0', marginBottom:4 }}>{t.title}</div>
            <div style={{ fontSize:12, color:'#555e74' }}>{t.department} · {t.raisedBy || 'Anonymous'}</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {sel && (
        <div style={{ width:340, background:'#161b24', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px', flexShrink:0, overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#e8eaf0', fontFamily:'monospace' }}>{sel.id}</span>
            <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'#555e74', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>

          <div style={{ fontSize:14, fontWeight:500, color:'#e8eaf0', marginBottom:10 }}>{sel.title}</div>
          <div style={{ fontSize:13, color:'#8b92a8', marginBottom:14, lineHeight:1.6 }}>{sel.description}</div>

          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            <Badge label={sel.status}   color={STATUS_COLORS[sel.status]||'#555e74'} />
            <Badge label={sel.priority} color={PRIORITY_COLORS[sel.priority]||'#555e74'} />
            <Badge label={sel.department} color='#555e74' />
          </div>

          <div style={{ fontSize:12, color:'#555e74', marginBottom:14 }}>
            Raised by: {sel.raisedBy || 'Anonymous'}<br/>
            Created: {new Date(sel.createdAt).toLocaleString()}
          </div>

          {/* Update status */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Update Status</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['open','in-progress','resolved','closed'].map(s => (
                <button key={s} onClick={() => updateTicket(sel.id, { status:s })} disabled={loading}
                  style={{ padding:'5px 10px', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'var(--font)',
                    background: sel.status===s ? STATUS_COLORS[s]+'33' : 'transparent',
                    border:`1px solid ${sel.status===s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.08)'}`,
                    color: sel.status===s ? STATUS_COLORS[s] : '#555e74',
                  }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Add comment */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Add Comment</div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Type a comment or resolution note…" rows={3}
              style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.08)', color:'#e8eaf0', fontSize:12, resize:'vertical', boxSizing:'border-box', outline:'none', fontFamily:'var(--font)' }} />
            <button onClick={() => comment && updateTicket(sel.id, { comment })} disabled={!comment||loading}
              style={{ marginTop:6, padding:'6px 14px', borderRadius:8, background:comment?'#f97316':'#1e2535', border:'none', color:'#fff', fontSize:12, cursor:comment?'pointer':'default' }}>
              Add Comment
            </button>
          </div>

          {/* Comments history */}
          {sel.comments?.length > 0 && (
            <div>
              <div style={{ fontSize:12, color:'#555e74', marginBottom:8 }}>Comments</div>
              {sel.comments.map((c,i) => (
                <div key={i} style={{ background:'#0f1117', borderRadius:8, padding:'8px 10px', marginBottom:6, fontSize:12 }}>
                  <div style={{ color:'#8b92a8', marginBottom:4 }}>{c.text}</div>
                  <div style={{ color:'#555e74' }}>{c.by} · {new Date(c.at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
