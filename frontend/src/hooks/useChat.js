// hooks/useChat.js
import { useState, useCallback } from 'react';

const API = '/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text, department) => {
    if (!text.trim()) return;
    setError(null);

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, department, history }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error || 'Unknown error');

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        department: data.department,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'error',
        content: `Error: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat };
}

export async function uploadDocument(file, department, onProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('department', department);

  const res = await fetch(`${API}/documents/upload`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Upload failed');
  return data;
}

export async function fetchStatus() {
  const res = await fetch(`${API}/chat/status`);
  return res.json();
}
