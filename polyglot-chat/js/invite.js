// js/invite.js — "Invite User" screen: unique invite link per click, Copy / Share.
window.PC = window.PC || {};
PC.invite = {
  render(root) {
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><a href="#/">← Back</a><span class="brand">Invite User</span><span></span></div>
        <p class="sub">Generate a unique link and share it. Each link works for one person and
        creates a private 1-to-1 conversation after they press "Join Conversation".</p>
        <button class="btn block" id="gen">✨ Generate Invitation Link</button>
        <div id="invite-out"></div>
      </div>`;

    root.querySelector('#gen').onclick = async (e) => {
      e.target.disabled = true;
      try {
        const { invite } = await PC.api.post('create-invite', { userId: PC.storage.get().userId });
        root.querySelector('#invite-out').innerHTML = `
          <p style="margin:18px 0 6px"><b>Invitation created 🎉</b></p>
          <div class="invite-url">${PC.ui.esc(invite.url)}</div>
          <div class="nav-row">
            <button class="btn" id="copy-link">📋 Copy Link</button>
            <button class="btn ghost" id="share-link">↗️ Share Link</button>
          </div>
          <p class="fine" style="margin-top:14px">Opening the link alone does NOT join the conversation —
          the recipient must explicitly press "Join Conversation".</p>`;
        root.querySelector('#copy-link').onclick = () => PC.ui.copy(invite.url, 'Link copied');
        root.querySelector('#share-link').onclick = () =>
          PC.ui.share('Chat with me on Polyglot Chat', `${PC.storage.get().displayName} invited you to chat (auto-translated).`, invite.url);
      } catch (err) {
        PC.ui.toast(err.message);
      } finally {
        e.target.disabled = false;
      }
    };
  }
};
