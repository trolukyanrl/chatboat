// components/TicketForm.jsx — Raise a ticket modal
import React, { useState } from 'react';

const PRIORITIES = ['low','medium','high','critical'];
const PRIORITY_COLORS = { low:'#22c55e', medium:'#f97316', high:'#ef4444', critical:'#7f1d1d' };

export function TicketForm({ department, prefillTitle, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title:       prefillTitle || '',
    description: '',
    department:  department || 'it',
    priority:    'medium',
    raisedBy:    '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!form.title || !form.description) return setError('Title and description are required');
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to raise ticket');
      onSuccess(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const field = (label, key, type='text', placeholder='') => (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>{label}</div>
      {type === 'textarea'
        ? <textarea value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} rows={4}
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, resize:'vertical', boxSizing:'border-box', outline:'none', fontFamily:'var(--font)' }} />
        : <input value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} type={type}
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, boxSizing:'border-box', outline:'none' }} />
      }
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#161b24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'28px', width:'100%', maxWidth:480, fontFamily:'var(--font)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:'#e8eaf0' }}>🎫 Raise a Support Ticket</div>
            <div style={{ fontSize:12, color:'#555e74', marginTop:2 }}>Our team will respond shortly</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555e74', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>

        {error && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:14, background:'rgba(239,68,68,0.15)', color:'#fca5a5', fontSize:13 }}>{error}</div>}

        {field('Issue Title', 'title', 'text', 'e.g. Cannot access VPN from home')}
        {field('Description', 'description', 'textarea', 'Describe your issue in detail — what happened, what you expected, any error messages…')}
        {field('Your Name (optional)', 'raisedBy', 'text', 'e.g. Rahul Sharma')}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Department</div>
            <select value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color:'#e8eaf0', fontSize:13, outline:'none' }}>
              {['general','it','hr','fire & safety','marketing'].map(d =>
                <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#555e74', marginBottom:5 }}>Priority</div>
            <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', color: PRIORITY_COLORS[form.priority], fontSize:13, outline:'none' }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'11px', borderRadius:8, background:loading?'#1e2535':'#f97316', border:'none', color:'#fff', fontSize:14, fontWeight:500, cursor:loading?'default':'pointer' }}>
          {loading ? 'Submitting…' : 'Submit Ticket'}
        </button>
      </div>
    </div>
  );
}

export function TicketSuccess({ ticket, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#161b24', border:'1px solid rgba(34,197,94,0.3)', borderRadius:16, padding:'32px', width:360, textAlign:'center', fontFamily:'var(--font)' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={{ fontSize:18, fontWeight:600, color:'#e8eaf0', marginBottom:8 }}>Ticket Raised!</div>
        <div style={{ fontSize:28, fontWeight:700, color:'#22c55e', marginBottom:12 }}>{ticket.id}</div>
        <div style={{ fontSize:13, color:'#555e74', marginBottom:8 }}>{ticket.title}</div>
        <div style={{ fontSize:12, color:'#555e74', marginBottom:24 }}>
          Our {ticket.department.toUpperCase()} team will review and respond to your ticket shortly.
        </div>
        <button onClick={onClose} style={{ padding:'9px 24px', borderRadius:8, background:'#f97316', border:'none', color:'#fff', fontSize:14, cursor:'pointer' }}>Done</button>
      </div>
    </div>
  );
}
