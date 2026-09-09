// js/search.js — "Find User" screen: search by User ID, send a message request.
window.PC = window.PC || {};
PC.search = {
  render(root) {
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><a href="#/">← Back</a><span class="brand">Find User</span><span></span></div>
        <p class="sub">Enter someone's User ID to send them a message request.</p>
        <form id="search-form">
          <label for="search-id">Enter User ID</label>
          <input id="search-id" type="text" placeholder="e.g. U7K9X4P2" autocomplete="off" required>
          <button class="btn block" type="submit">Search</button>
        </form>
        <div id="search-result"></div>
      </div>`;

    root.querySelector('#search-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const box = root.querySelector('#search-result');
      const id = root.querySelector('#search-id').value.trim().toUpperCase();
      box.innerHTML = `<p class="sub">Searching…</p>`;
      try {
        const { user } = await PC.api.get('search-user', { id });
        if (user.id === PC.storage.get().userId) {
          box.innerHTML = `<div class="empty"><div class="big">🙃</div>That's your own ID!</div>`;
          return;
        }
        box.innerHTML = `
          <div class="user-card">
            <h3>${PC.ui.esc(user.name)}</h3>
            <div class="meta">ID: ${PC.ui.esc(user.id)} · Native language: ${PC.ui.esc(user.language)}</div>
            <button class="btn green block" id="send-req">Send Message Request</button>
          </div>`;
        box.querySelector('#send-req').onclick = async (ev) => {
          ev.target.disabled = true;
          try {
            await PC.api.post('send-request', { fromId: PC.storage.get().userId, toId: user.id });
            PC.ui.toast('Request sent ✉️');
            ev.target.textContent = 'Request Sent ✓';
          } catch (err) {
            PC.ui.toast(err.message);
            ev.target.disabled = false;
          }
        };
      } catch (err) {
        box.innerHTML = `<div class="empty"><div class="big">🔍</div>${PC.ui.esc(err.message)}</div>`;
      }
    });
  }
};
