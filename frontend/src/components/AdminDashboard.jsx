// components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';

const DEPT_COLORS = {
  it: '#378ADD', hr: '#1D9E75', 'fire & safety': '#E24B4A',
  marketing: '#7F77DD', general: '#888780',
};

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background:'var(--bg2)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:600, color:'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color: subColor || 'var(--text3)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export function AdminDashboard({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      setError('Could not connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); const t = setInterval(fetchStats, 15000); return () => clearInterval(t); }, []);

  const maxDeptCount = stats ? Math.max(...Object.values(stats.queriesByDept || {}), 1) : 1;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'var(--bg)', display:'flex', flexDirection:'column',
      fontFamily:'var(--font)',
    }}>
      {/* Header */}
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15 }}>N</div>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text)' }}>Admin Dashboard</div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>NRL AI Assistant · Live analytics</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={fetchStats} style={{ padding:'6px 14px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>↻ Refresh</button>
          <button onClick={onClose} style={{ padding:'6px 14px', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>✕ Close</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {loading && !stats && <div style={{ color:'var(--text3)', textAlign:'center', paddingTop:60 }}>Loading stats…</div>}
        {error && <div style={{ color:'#fca5a5', background:'rgba(239,68,68,0.1)', padding:'12px 16px', borderRadius:8, marginBottom:20 }}>{error}</div>}

        {stats && <>
          {/* Stat Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            <StatCard label="Total Queries" value={stats.totalQueries} sub="since last restart" />
            <StatCard label="Documents Indexed" value={stats.knowledgeBase.reduce((s,k)=>s+k.chunks,0)+' chunks'} sub={`${stats.knowledgeBase.filter(k=>k.chunks>0).length} active departments`} />
            <StatCard label="Avg Response Time" value={`${(stats.avgResponseTimeMs/1000).toFixed(1)}s`} sub="LLM + retrieval" subColor="var(--green)" />
            <StatCard label="LLM Provider" value={stats.llm.provider.toUpperCase()} sub={stats.llm.model} subColor="var(--teal)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            {/* Dept usage chart */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:16 }}>Queries by department</div>
              {Object.entries(stats.queriesByDept).length === 0
                ? <div style={{ color:'var(--text3)', fontSize:13 }}>No queries yet — start chatting!</div>
                : Object.entries(stats.queriesByDept).map(([dept, count]) => (
                  <div key={dept} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:12, color:'var(--text2)', width:90, textTransform:'capitalize' }}>{dept}</span>
                    <div style={{ flex:1, background:'var(--bg3)', borderRadius:4, height:8 }}>
                      <div style={{ width:`${Math.round((count/maxDeptCount)*100)}%`, background: DEPT_COLORS[dept]||'var(--accent)', borderRadius:4, height:8, transition:'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize:12, color:'var(--text3)', minWidth:20, textAlign:'right' }}>{count}</span>
                  </div>
                ))
              }
            </div>

            {/* Recent queries */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:12 }}>Recent queries</div>
              {stats.recentQueries.length === 0
                ? <div style={{ color:'var(--text3)', fontSize:13 }}>No queries yet</div>
                : stats.recentQueries.slice(0,8).map((q, i) => (
                  <div key={i} style={{ display:'flex', gap:8, paddingBottom:8, marginBottom:8, borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                    <span style={{ fontSize:11, padding:'2px 7px', borderRadius:10, background:'var(--bg3)', color:'var(--text3)', whiteSpace:'nowrap', marginTop:1, textTransform:'capitalize' }}>{q.dept}</span>
                    <span style={{ fontSize:13, color:'var(--text2)', flex:1, lineHeight:1.4 }}>{q.question}</span>
                    <span style={{ fontSize:11, color:'var(--text3)', whiteSpace:'nowrap' }}>{q.responseTime}ms</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Knowledge Base table */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:12 }}>Knowledge base</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Department','Files','Chunks','Sources'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 0', color:'var(--text3)', fontWeight:400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.knowledgeBase.map(k => (
                  <tr key={k.department} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 0', color:'var(--text)', textTransform:'capitalize' }}>{k.department}</td>
                    <td style={{ padding:'10px 0', color:'var(--text2)' }}>{k.sources.length}</td>
                    <td style={{ padding:'10px 0', color:'var(--text2)' }}>{k.chunks}</td>
                    <td style={{ padding:'10px 0', color:'var(--text3)', fontSize:12 }}>{k.sources.join(', ') || '—'}</td>
                  </tr>
                ))}
                {stats.knowledgeBase.length === 0 && (
                  <tr><td colSpan="4" style={{ padding:'16px 0', color:'var(--text3)' }}>No documents uploaded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* System status */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:12 }}>System status</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'Backend API', sub:`Node.js · port 3001 · up ${Math.round(stats.uptime/60)}m`, ok:true },
                { label:'RAG Engine', sub:'In-memory · TF-IDF vectors', ok:true },
                { label:`LLM · ${stats.llm.provider}`, sub:stats.llm.model, ok:true },
              ].map(s => (
                <div key={s.label} style={{ padding:'12px 14px', border:'1px solid var(--border)', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: s.ok ? 'var(--green)' : 'var(--red)' }} />
                    <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}
