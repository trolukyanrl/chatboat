// components/Sidebar.jsx
import React from 'react';

const DEPARTMENTS = [
  { id: 'general',     label: 'General',      icon: '⬡', color: '#8b92a8' },
  { id: 'it',          label: 'IT',           icon: '⬡', color: '#3b82f6' },
  { id: 'hr',          label: 'HR',           icon: '⬡', color: '#14b8a6' },
  { id: 'fire & safety', label: 'Fire & Safety', icon: '⬡', color: '#ef4444' },
  { id: 'marketing',   label: 'Marketing',    icon: '⬡', color: '#a855f7' },
];

const SUGGESTED = {
  it:          ['VPN setup guide', 'Reset my password', 'Request software access', 'Network troubleshooting'],
  hr:          ['Leave application process', 'Payroll query', 'New employee onboarding', 'Attendance policy'],
  'fire & safety': ['Emergency evacuation procedure', 'PPE requirements', 'Incident reporting', 'Fire drill schedule'],
  marketing:   ['Brand guidelines', 'Internal event details', 'Communication templates', 'Media contacts'],
  general:     ['Find internal portal', 'Who do I contact for X?', 'Company policies', 'Org chart'],
};

export function Sidebar({ active, onSelect, onSuggest, onUpload, onClear }) {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 600, color: '#fff',
          }}>N</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>NRL Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Internal AI</div>
          </div>
        </div>
      </div>

      {/* Departments */}
      <div style={{ padding: '12px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', padding: '0 8px 8px', textTransform: 'uppercase' }}>
          Departments
        </div>
        {DEPARTMENTS.map(dept => (
          <button
            key={dept.id}
            onClick={() => onSelect(dept.id)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              background: active === dept.id ? 'var(--bg3)' : 'transparent',
              border: active === dept.id ? '1px solid var(--border2)' : '1px solid transparent',
              color: active === dept.id ? 'var(--text)' : 'var(--text2)',
              fontSize: 13, fontWeight: active === dept.id ? 500 : 400,
              marginBottom: 2, transition: 'all 0.15s',
              cursor: 'pointer',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: active === dept.id ? dept.color : 'var(--border2)',
              flexShrink: 0, transition: 'background 0.15s',
            }} />
            {dept.label}
          </button>
        ))}
      </div>

      {/* Suggested questions */}
      {SUGGESTED[active] && (
        <div style={{ padding: '16px 8px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', padding: '0 8px 8px', textTransform: 'uppercase' }}>
            Try asking
          </div>
          {SUGGESTED[active].map(q => (
            <button
              key={q}
              onClick={() => onSuggest(q)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 10px', borderRadius: 6,
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text3)', fontSize: 12,
                marginBottom: 2, cursor: 'pointer',
                lineHeight: 1.4, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.color = 'var(--text2)'; e.target.style.background = 'var(--bg3)'; }}
              onMouseLeave={e => { e.target.style.color = 'var(--text3)'; e.target.style.background = 'transparent'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          color: 'var(--text2)', fontSize: 12, fontWeight: 500,
          border: '1px solid var(--border)', background: 'transparent',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          <span style={{ fontSize: 14 }}>↑</span> Upload Document
          <input type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ''; }} />
        </label>
        <button onClick={onClear} style={{
          padding: '7px 10px', borderRadius: 8,
          color: 'var(--text3)', fontSize: 12, fontWeight: 500,
          border: '1px solid transparent', background: 'transparent',
          textAlign: 'left', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.target.style.color = 'var(--text2)'; }}
          onMouseLeave={e => { e.target.style.color = 'var(--text3)'; }}
        >
          ✕ Clear chat
        </button>
      </div>
    </aside>
  );
}

export { DEPARTMENTS };
