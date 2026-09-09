// js/requests.js — "Message Requests" screen: accept / reject incoming requests.
window.PC = window.PC || {};
PC.requests = {
  async render(root) {
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><a href="#/">← Back</a><span class="brand">Message Requests</span><span></span></div>
        <div id="req-list"><p class="sub">Loading…</p></div>
      </div>`;
    const box = root.querySelector('#req-list');
    try {
      const { requests } = await PC.api.get('get-requests', { userId: PC.storage.get().userId });
      if (!requests.length) {
        box.innerHTML = `<div class="empty"><div class="big">📭</div>No pending message requests.</div>`;
        return;
      }
      box.innerHTML = '';
      requests.forEach((r) => {
        const el = document.createElement('div');
        el.className = 'user-card';
        el.innerHTML = `
          <h3>${PC.ui.esc(r.from ? r.from.name : 'Unknown user')}</h3>
          <div class="meta">ID: ${PC.ui.esc(r.fromId)} · Language: ${PC.ui.esc(r.from ? r.from.language : '?')}</div>
          <p style="margin:0 0 12px">wants to connect with you.</p>
          <div class="nav-row" style="margin-top:0">
            <button class="btn green" data-act="accept">Accept</button>
            <button class="btn ghost" data-act="reject">Reject</button>
          </div>`;
        el.querySelectorAll('button').forEach((b) => {
          b.onclick = async () => {
            b.disabled = true;
            try {
              const res = await PC.api.post('manage-request', {
                userId: PC.storage.get().userId, requestId: r.id, action: b.dataset.act,
              });
              if (res.status === 'accepted') location.hash = '/chat/' + res.conversationId;
              else { PC.ui.toast('Request rejected'); PC.requests.render(root); }
            } catch (err) { PC.ui.toast(err.message); b.disabled = false; }
          };
        });
        box.appendChild(el);
      });
    } catch (err) {
      box.innerHTML = `<div class="empty"><div class="big">⚠️</div>${PC.ui.esc(err.message)}</div>`;
    }
  }
};
