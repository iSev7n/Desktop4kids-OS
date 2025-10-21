(function () {
  // ===== Theme sync (same as your other apps) ============================
  try {
    const t = window.top?.document?.documentElement?.getAttribute('data-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch {}
  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'theme') {
      document.documentElement.setAttribute('data-theme', e.data.theme);
    }
  });

  // ===== DOM refs ========================================================
  const webview   = document.getElementById('webview');
  const addrForm  = document.getElementById('addrForm');
  const addrInput = document.getElementById('addr');
  const btnBack   = document.getElementById('btnBack');
  const btnFwd    = document.getElementById('btnForward');
  const btnReload = document.getElementById('btnReload');
  const btnHome   = document.getElementById('btnHome');

  // ===== Very small state (own history so we can disable buttons) =======
  const HOME_URL = 'https://example.com/'; // change later to your single allowed site
  let history = [HOME_URL];
  let hIdx = 0;

  // ===== Helpers =========================================================
  function normalizeUrl(input) {
    let s = (input || '').trim();
    if (!s) return '';
    // Allow about:blank and http(s) only (super limited)
    if (s === 'about:blank') return s;
    if (!/^https?:\/\//i.test(s)) {
      // treat bare words as https host
      s = 'https://' + s;
    }
    try { return new URL(s).toString(); }
    catch { return ''; }
  }

  function updateButtons() {
    btnBack.disabled   = (hIdx <= 0);
    btnFwd.disabled    = (hIdx >= history.length - 1);
    btnReload.disabled = !history[hIdx];
    addrInput.value = history[hIdx] || '';
  }

  function navigate(url, { push=true } = {}) {
    if (!url) return;
    webview.src = url;
    if (push) {
      history = history.slice(0, hIdx + 1);
      history.push(url);
      hIdx = history.length - 1;
    }
    updateButtons();
  }

  // ===== Wire UI =========================================================
  addrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = normalizeUrl(addrInput.value);
    if (url) navigate(url);
  });

  btnBack.addEventListener('click', () => {
    if (hIdx > 0) { hIdx--; navigate(history[hIdx], { push:false }); }
  });
  btnFwd.addEventListener('click', () => {
    if (hIdx < history.length - 1) { hIdx++; navigate(history[hIdx], { push:false }); }
  });
  btnReload.addEventListener('click', () => {
    // Force reload (append a no-op hash to bypass some caches)
    const url = history[hIdx];
    if (url) webview.src = url;
  });
  btnHome.addEventListener('click', () => navigate(HOME_URL));

  // Reflect current URL after same-document navigations within iframe
  webview.addEventListener('load', () => {
    // Best effort update: we can read src (not nested location for cross-origin).
    const url = webview.getAttribute('src') || '';
    if (url && url !== history[hIdx]) {
      history = history.slice(0, hIdx + 1);
      history.push(url);
      hIdx = history.length - 1;
      updateButtons();
    }
  });

  // Block right-click (cosmetic; doesn’t affect the page inside cross-origin)
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Drop navigation via drag & drop (keep it simple)
  ['dragover','drop'].forEach(type =>
    document.addEventListener(type, e => { e.preventDefault(); e.stopPropagation(); })
  );

  // Boot
  navigate(HOME_URL);
})();
