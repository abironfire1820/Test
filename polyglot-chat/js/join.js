// js/join.js — invite landing (/join/:token). Shows inviter, requires EXPLICIT join action.
// New visitors go through onboarding first; existing local identity is never replaced.
window.PC = window.PC || {};
PC.join = {
  async render(root, token) {
    let info;
    try {
      info = await PC.api.get('join-invite', { token });
    } catch (err) {
      root.innerHTML = `
        <div class="screen">
          <div class="empty"><div class="big">🔗</div>
            <p><b>Invalid invitation link</b></p><p>${PC.ui.esc(err.message)}</p>
            <p><a href="/">Go home</a></p>
          </div>
        </div>`;
      return;
    }

    const from = info.invite.from;
    const banner = `
      <div class="invite-banner">✉️ <b>${PC.ui.esc(from ? from.name : 'Someone')}</b>
      (${PC.ui.esc(from ? from.language : '')}) invited you to a private 1-to-1 conversation on Polyglot Chat.</div>`;

    const me = PC.storage.get();

    // Brand-new visitor: onboarding FIRST (creates their own identity), then join.
    if (!me) {
      PC.identity.renderOnboarding(root, () => PC.join.doJoin(PC.storage.get(), token, banner));
      root.querySelector('.screen').insertAdjacentHTML('afterbegin', banner);
      return;
    }

    root.innerHTML = `
      <div class="screen">
        ${banner}
        <h2>Join this conversation?</h2>
        <p class="sub">You will chat as <b>${PC.ui.esc(me.displayName)}</b> (${PC.ui.esc(me.nativeLanguage)}).
        Messages will be translated automatically for both of you.</p>
        <button class="btn green block" id="join-btn">Join Conversation</button>
        <p class="fine" style="margin-top:14px">Nothing happens until you press the button.</p>
      </div>`;
    root.querySelector('#join-btn').onclick = () => PC.join.doJoin(me, token, banner);
  },

  async doJoin(me, token, banner) {
    const root = document.getElementById('app');
    root.innerHTML = `<div class="screen">${banner}<p class="sub">Joining…</p></div>`;
    try {
      const res = await PC.api.post('join-invite', { token, userId: me.userId });
      // Clean the /join/:token path, then route to the chat screen.
      history.replaceState(null, '', '/#/chat/' + res.conversationId);
      PC.app.reload();
    } catch (err) {
      root.insertAdjacentHTML('beforeend', `<div class="empty"><div class="big">⚠️</div>${PC.ui.esc(err.message)}</div>`);
    }
  }
};
