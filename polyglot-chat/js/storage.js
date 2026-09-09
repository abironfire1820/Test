// js/storage.js — local browser identity persistence (localStorage).
// ⚠️ Clearing browser storage = losing this local identity (there are no accounts).
// Only NON-sensitive fields are stored here. Never store API keys or tokens.
window.PC = window.PC || {};
PC.storage = {
  KEY: 'polyglot.identity.v1',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); } catch (_) { return null; }
  },
  set(identity) { localStorage.setItem(this.KEY, JSON.stringify(identity)); },
  clear() { localStorage.removeItem(this.KEY); }
};
