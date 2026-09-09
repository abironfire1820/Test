// js/app.js — hash router + identity gate.
window.PC = window.PC || {};
PC.app = (function () {
  const root = () => document.getElementById('app');

  function route() {
    PC.chat.stopPolling();

    // Invite links arrive as real paths (/join/:token) via the netlify.toml redirect.
    const joinMatch = location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
    if (joinMatch) { PC.join.render(root(), joinMatch[1]); return; }

    const hash = location.hash.replace(/^#/, '') || '/';
    const me = PC.storage.get();

    // Identity gate: everyone must create (or already have) a local identity.
    if (!me) {
      if (hash.startsWith('/join/')) { PC.join.render(root(), hash.split('/')[2]); return; }
      PC.identity.renderOnboarding(root());
      return;
    }

    if (hash.startsWith('/chat/')) { PC.chat.render(root(), hash.split('/')[2]); return; }
    switch (hash) {
      case '/search':        PC.search.render(root()); break;
      case '/requests':      PC.requests.render(root()); break;
      case '/conversations': PC.conversations.render(root()); break;
      case '/invite':        PC.invite.render(root()); break;
      case '/myid':          PC.identity.renderMyId(root()); break;
      default:               PC.home.render(root());
    }
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', route);
  return { reload: route };
})();
