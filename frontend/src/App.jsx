// App.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar, DEPARTMENTS } from './components/Sidebar.jsx';
import { Message, TypingIndicator } from './components/Message.jsx';
import { useChat, uploadDocument } from './hooks/useChat.js';

function WelcomeScreen({ department, onSuggest }) {
  const dept = DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];
  const suggestions = {
    it:            ['How do I set up VPN?', 'Request new software', 'Reset my network password'],
    hr:            ['What is the leave policy?', 'How to apply for payroll advance?', 'Onboarding checklist'],
    'fire & safety': ['Emergency evacuation steps', 'Where to report an incident?', 'Required PPE for field work'],
    marketing:     ['Brand color guidelines', 'Upcoming company events', 'Internal newsletter contacts'],
    general:       ['Find the HR portal', 'Who handles IT requests?', 'Company org chart'],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, marginBottom: 20,
        background: 'linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, fontWeight: 700, color: '#fff',
      }}>N</div>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        {dept.label} Assistant
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 360, marginBottom: 32, lineHeight: 1.7 }}>
        Ask me anything about {dept.label === 'General' ? 'NRL internal resources' : `the ${dept.label} department`}. I'll search the knowledge base and give you accurate answers.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 440 }}>
        {(suggestions[department] || suggestions.general).map(q => (
          <button key={q} onClick={() => onSuggest(q)} style={{
            padding: '8px 14px', borderRadius: 20,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)'; }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [department, setDepartment] = useState('general');
  const [input, setInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const { messages, loading, sendMessage, clearChat } = useChat();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendMessage(text, department);
  }, [input, loading, sendMessage, department]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggest = (q) => {
    setInput(q);
    inputRef.current?.focus();
  };

  const handleUpload = async (file) => {
    setUploadStatus({ state: 'uploading', name: file.name });
    try {
      const result = await uploadDocument(file, department);
      setUploadStatus({ state: 'done', name: file.name, chunks: result.chunks });
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      setUploadStatus({ state: 'error', name: file.name, error: err.message });
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleDeptChange = (dept) => {
    setDepartment(dept);
    clearChat();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        active={department}
        onSelect={handleDeptChange}
        onSuggest={handleSuggest}
        onUpload={handleUpload}
        onClear={clearChat}
      />

      {/* Main chat area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Top bar */}
        <header style={{
          padding: '14px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: DEPARTMENTS.find(d => d.id === department)?.color || 'var(--accent)',
            }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              {DEPARTMENTS.find(d => d.id === department)?.label || 'General'} Knowledge Base
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>RAG Active</span>
          </div>
        </header>

        {/* Upload status toast */}
        {uploadStatus && (
          <div style={{
            margin: '12px 24px 0',
            padding: '10px 14px', borderRadius: 8,
            background: uploadStatus.state === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(20,184,166,0.1)',
            border: `1px solid ${uploadStatus.state === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(20,184,166,0.2)'}`,
            color: uploadStatus.state === 'error' ? '#fca5a5' : '#5eead4',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {uploadStatus.state === 'uploading' && <span>⏳ Processing {uploadStatus.name}…</span>}
            {uploadStatus.state === 'done' && <span>✓ {uploadStatus.name} indexed — {uploadStatus.chunks} chunks added to {department.toUpperCase()} knowledge base</span>}
            {uploadStatus.state === 'error' && <span>✕ {uploadStatus.name}: {uploadStatus.error}</span>}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>
          {messages.length === 0
            ? <WelcomeScreen department={department} onSuggest={handleSuggest} />
            : <>
                {messages.map(msg => <Message key={msg.id} msg={msg} />)}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} style={{ height: 24 }} />
              </>
          }
        </div>

        {/* Input area */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '10px 12px',
            transition: 'border-color 0.15s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask the ${DEPARTMENTS.find(d => d.id === department)?.label || ''} assistant…`}
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'var(--text)', fontSize: 14, resize: 'none',
                lineHeight: 1.6, padding: 0, maxHeight: 120, overflowY: 'auto',
                fontFamily: 'var(--font)',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg3)',
                color: input.trim() && !loading ? '#fff' : 'var(--text3)',
                fontSize: 16, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ↑
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
            Enter to send · Shift+Enter for new line · Upload PDFs to add knowledge
          </div>
        </div>
      </main>
    </div>
  );
}
