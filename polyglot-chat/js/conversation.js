// js/conversations.js — "Messages" screen: 1-to-1 conversation list with empty state.
window.PC = window.PC || {};
PC.conversations = {
  async render(root) {
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><a href="#/">← Back</a><span class="brand">Messages</span><span></span></div>
        <div id="conv-list"><p class="sub">Loading…</p></div>
      </div>`;
    const box = root.querySelector('#conv-list');
    try {
      const { conversations } = await PC.api.get('get-requests', { userId: PC.storage.get().userId });
      if (!conversations.length) {
        box.innerHTML = `
          <div class="empty">
            <div class="big">💬</div>
            <p><b>No conversations yet.</b></p>
            <p>Find someone by User ID or invite someone to chat.</p>
            <div class="nav-row" style="justify-content:center">
              <a class="btn" href="#/search">Find User</a>
              <a class="btn ghost" href="#/invite">Invite User</a>
            </div>
          </div>`;
        return;
      }
      box.innerHTML = '';
      conversations
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach((c) => {
          const el = document.createElement('button');
          el.className = 'list-item';
          const initial = PC.ui.esc((c.other.name || '?').trim().charAt(0).toUpperCase());
          el.innerHTML = `
            <span class="avatar">${initial}</span>
            <span class="grow"><b>${PC.ui.esc(c.other.name)}</b>
            <small>${PC.ui.esc(c.other.language || '')}</small></span>`;
          el.onclick = () => { location.hash = '/chat/' + c.id; };
          box.appendChild(el);
        });
    } catch (err) {
      box.innerHTML = `<div class="empty"><div class="big">⚠️</div>${PC.ui.esc(err.message)}</div>`;
    }
  }
};
