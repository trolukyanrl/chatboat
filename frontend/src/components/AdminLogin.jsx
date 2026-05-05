// components/AdminLogin.jsx
import React, { useState } from 'react';

export function AdminLogin({ onSuccess, onCancel }) {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('nrl_admin_token', data.token);
        localStorage.setItem('nrl_admin_user', data.username);
        onSuccess(data.token, data.username);
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Could not connect to backend');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font)',
    }} onClick={e => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '32px 36px', width: 360,
        position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onCancel} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'transparent', border: 'none',
          color: 'var(--text3)', fontSize: 18, cursor: 'pointer', lineHeight: 1,
        }}>✕</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 18,
          }}>N</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Admin Login</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>NRL AI Assistant</div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', fontSize: 13,
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>Username</div>
          <input
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="admin"
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>Password</div>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font)',
            }}
          />
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: '10px', borderRadius: 8,
          background: loading ? 'var(--bg3)' : 'var(--accent)',
          border: 'none', color: '#fff', fontSize: 14,
          fontWeight: 500, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'var(--font)',
        }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
          Only NRL admins can access this area
        </div>
      </div>
    </div>
  );
}
