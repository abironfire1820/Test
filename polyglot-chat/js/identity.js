// js/identity.js — onboarding (name + native language) and "My ID" screen.
window.PC = window.PC || {};
PC.identity = {
  // after: optional callback (used by the invite flow before joining).
  renderOnboarding(root, after) {
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><span class="brand">🌐 Polyglot Chat</span></div>
        <h1>Talk with anyone, in your own language</h1>
        <p class="sub">Real-time 1-to-1 chat with AI translation. No sign-up needed.</p>
        <form id="onboard-form">
          <label for="ob-name">Your Name</label>
          <input id="ob-name" name="name" type="text" maxlength="40" required autocomplete="name"
                 placeholder="e.g. Abir">
          <label for="ob-lang">Your Native Language</label>
          <select id="ob-lang" name="language" required>
            <option value="" disabled selected>Select your language…</option>
          </select>
          <button class="btn block" type="submit">Create My Identity</button>
        </form>
        <p class="fine">🔒 No accounts, no passwords, no email. A random User ID is generated for you
        and saved only in this browser — clearing site data will create a new identity next time.</p>
      </div>`;

    const sel = root.querySelector('#ob-lang');
    PC.languages.forEach((l) => sel.insertAdjacentHTML('beforeend', `<option>${PC.ui.esc(l)}</option>`));

    root.querySelector('#onboard-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      try {
        const name = root.querySelector('#ob-name').value.trim();
        const language = sel.value;
        const { user } = await PC.api.post('create-identity', { name, language });
        PC.storage.set({ userId: user.id, displayName: user.name, nativeLanguage: user.language });
        PC.ui.toast('Identity created 🎉');
        if (after) return after();
        location.hash = '/';
      } catch (err) {
        PC.ui.toast(err.message);
        btn.disabled = false;
      }
    });
  },

  renderMyId(root) {
    const me = PC.storage.get();
    root.innerHTML = `
      <div class="screen">
        <div class="topbar"><a href="#/">← Back</a><span class="brand">My ID</span><span></span></div>
        <h2>${PC.ui.esc(me.displayName)}</h2>
        <p class="sub">Native language: ${PC.ui.esc(me.nativeLanguage)}</p>
        <p style="margin-bottom:2px"><b>Your ID</b> — share it so others can find you:</p>
        <div class="uid">${PC.ui.esc(me.userId)}</div>
        <div class="nav-row">
          <button class="btn" id="copy-id">📋 Copy ID</button>
          <button class="btn ghost" id="share-id">↗️ Share ID</button>
        </div>
        <p class="fine" style="margin-top:22px">⚠️ This identity exists only in this browser.
        Clearing site data = losing it. There is no recovery because there are no accounts.</p>
        <button class="btn danger block" id="forget">Forget this identity</button>
      </div>`;
    root.querySelector('#copy-id').onclick = () => PC.ui.copy(me.userId, 'User ID copied');
    root.querySelector('#share-id').onclick = () =>
      PC.ui.share('My Polyglot Chat ID', `Chat with me on Polyglot Chat! My ID: ${me.userId}`, location.origin + '/');
    root.querySelector('#forget').onclick = () => {
      if (confirm('Forget this identity? You cannot get it back.')) {
        PC.storage.clear();
        location.hash = '/';
        PC.app.reload();
      }
    };
  }
};
