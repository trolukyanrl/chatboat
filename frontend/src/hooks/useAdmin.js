// hooks/useAdmin.js
import { useState, useCallback } from 'react';

function safeGet(key) {
  try { return localStorage.getItem(key) || null; } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

export function useAdmin() {
  const [token, setToken]       = useState(() => safeGet('nrl_admin_token'));
  const [username, setUsername] = useState(() => safeGet('nrl_admin_user'));

  const login = useCallback((tok, user) => {
    safeSet('nrl_admin_token', tok);
    safeSet('nrl_admin_user', user);
    setToken(tok);
    setUsername(user);
  }, []);

  const logout = useCallback(() => {
    safeRemove('nrl_admin_token');
    safeRemove('nrl_admin_user');
    setToken(null);
    setUsername(null);
  }, []);

  const adminFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token || ''}`,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  }, [token, logout]);

  return {
    token,
    username,
    isAdmin: !!token,
    login,
    logout,
    adminFetch,
  };
}
