// js/home.js — Home screen after identity exists.
window.PC = window.PC || {};
PC.home = {
  render(root) {
    const me = PC.storage.get();
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><span class="brand">🌐 Polyglot Chat</span><a href="#/myid">My ID</a></div>
        <h2>Hi, ${PC.ui.esc(me.displayName)} 👋</h2>
        <p class="sub">Your language: ${PC.ui.esc(me.nativeLanguage)}</p>
        <div class="nav-row">
          <button class="card-btn" data-go="#/search"><b>🔎 Find User</b><span>Chat by User ID</span></button>
          <button class="card-btn" data-go="#/invite"><b>✉️ Invite User</b><span>Share an invite link</span></button>
          <button class="card-btn" data-go="#/conversations"><b>💬 Messages</b><span>Your conversations</span></button>
          <button class="card-btn" data-go="#/requests"><b>📥 Requests</b><span>Message requests</span></button>
        </div>
        <p class="fine" style="margin-top:20px">Every message is shown in its original language
        plus an AI translation in your language. 🌍</p>
      </div>`;
    root.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.go)));
  }
};
