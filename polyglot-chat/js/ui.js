// js/ui.js — shared UI helpers: escaping, toasts, clipboard, Web Share, connection status.
window.PC = window.PC || {};
PC.ui = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  toast(msg) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
  async copy(text, label = 'Copied') {
    try {
      await navigator.clipboard.writeText(text);
      PC.ui.toast(label);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      PC.ui.toast(label);
    }
  },
  // Native Web Share API where available; clipboard fallback otherwise.
  async share(title, text, url) {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (_) { /* user cancelled */ }
    }
    await PC.ui.copy(url, 'Link copied');
  },
  setConnection(isOk, silent) {
    const el = document.getElementById('conn-status');
    if (!el) return;
    el.textContent = isOk ? 'Connected' : 'Reconnecting…';
    el.className = 'conn ' + (isOk ? 'ok' : 'bad');
    if (!isOk && !silent) PC.ui.toast('Reconnecting…');
  }
};

// Basic offline / reconnect behavior (duplicate-safe: server is idempotent).
window.addEventListener('offline', () => PC.ui.setConnection(false));
window.addEventListener('online', () => {
  PC.ui.setConnection(true);
  PC.ui.toast('Connected');
  if (PC.app && PC.app.reload) PC.app.reload();
});
