// components/Message.jsx
import React from 'react';

function SourceBadge({ source, score }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
      color: '#fb923c', fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ opacity: 0.7 }}>↗</span>
      {source}
      {score && <span style={{ opacity: 0.6 }}>· {score}%</span>}
    </span>
  );
}

function renderContent(text) {
  // Simple markdown-lite renderer (bold, code, lists)
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const key = i;

    // Heading
    if (line.startsWith('### ')) return <h4 key={key} style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, margin: '8px 0 4px' }}>{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={key} style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15, margin: '8px 0 4px' }}>{line.slice(3)}</h3>;

    // Bullet
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={key} style={{ display: 'flex', gap: 8, margin: '2px 0', paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>·</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      return (
        <div key={key} style={{ display: 'flex', gap: 8, margin: '2px 0', paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, minWidth: 16, fontFamily: 'var(--mono)', fontSize: 12 }}>{numberedMatch[1]}.</span>
          <span>{inlineFormat(numberedMatch[2])}</span>
        </div>
      );
    }

    // Empty line
    if (!line.trim()) return <div key={key} style={{ height: 6 }} />;

    return <p key={key} style={{ margin: '2px 0' }}>{inlineFormat(line)}</p>;
  });
}

function inlineFormat(text) {
  // bold **text** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 600, color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4 }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function Message({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 10 }}>
        <div style={{
          maxWidth: '70%', padding: '10px 14px',
          background: 'var(--accent)', borderRadius: '14px 14px 4px 14px',
          color: '#fff', fontSize: 14, lineHeight: 1.6,
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{
          padding: '10px 14px', borderRadius: '4px 14px 14px 14px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5', fontSize: 14,
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
      }}>N</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '4px 14px 14px 14px',
          fontSize: 14, lineHeight: 1.7, color: 'var(--text2)',
        }}>
          {renderContent(msg.content)}
        </div>

        {/* Sources */}
        {msg.sources?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 2 }}>
            {msg.sources.map((s, i) => (
              <SourceBadge key={i} source={s.source} score={s.score} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
      }}>N</div>
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '4px 14px 14px 14px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--text3)',
            display: 'inline-block',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
