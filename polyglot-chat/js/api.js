// js/api.js — thin fetch wrapper around Netlify Functions.
window.PC = window.PC || {};
PC.api = {
  base: '/.netlify/functions',
  async post(fn, body) {
    const r = await fetch(`${this.base}/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({ success: false, error: 'Network error' }));
    if (!d.success) throw new Error(d.error || 'Request failed');
    return d;
  },
  async get(fn, params = {}) {
    const q = new URLSearchParams(params).toString();
    const r = await fetch(`${this.base}/${fn}${q ? '?' + q : ''}`);
    const d = await r.json().catch(() => ({ success: false, error: 'Network error' }));
    if (!d.success) throw new Error(d.error || 'Request failed');
    return d;
  }
};
