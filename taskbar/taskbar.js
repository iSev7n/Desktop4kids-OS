/* =============================================================================
   Desktop4Kids — Taskbar

   Public API on window.Taskbar:
     - init()
     - addWindow(winEl, { title, icon })
     - removeWindow(wid)
     - minimize(wid) / restore(wid) / toggle(wid) / activate(wid)
     - setIconsOnly(bool) / setTight(bool)
     - nudge(wid)
   Notes:
     • The bar is expected in HTML as <footer id="taskbar">…</footer>.
       If missing, create one automatically.
     • Buttons appear inside #taskbarList.
     • Each managed window element gets data-wid; the matching button too.

   ============================================================================= */
(function () {
  // ---------- State ----------
  const windows = new Map(); // wid -> { win, btn, title, icon }
  let bar, listEl, trayEl;

  // ---------- DOM & layout helpers ----------
  function ensureBar() {
    if (bar) return bar;
    bar = document.getElementById('taskbar');
    if (!bar) {
      bar = document.createElement('footer');
      bar.id = 'taskbar';
      bar.innerHTML = `
        <div id="taskbarList" role="tablist" aria-label="Open windows"></div>
        <div id="taskbarTray"></div>
      `;
      document.body.appendChild(bar);
    }
    listEl = bar.querySelector('#taskbarList');
    trayEl = bar.querySelector('#taskbarTray');
    fitSafeArea();
    return bar;
  }

  function fitSafeArea() {
    const b = ensureBar();
    const desk = document.getElementById('desktop');
    if (!desk) return;
    const h = b.getBoundingClientRect().height || 0;
    desk.style.paddingBottom = (h + 8) + 'px'; // keep content above bar
  }

  window.addEventListener('resize', fitSafeArea);

  // ---------- Core actions ----------
  function activate(wid) {
    for (const [k, v] of windows) v.btn.classList.toggle('active', k === wid);
    // bring active button into view
    const activeBtn = [...(listEl?.children || [])].find(el => el.classList?.contains('active'));
    activeBtn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function minimize(wid) {
    const o = windows.get(wid); if (!o) return;
    o.win.classList.add('minimized');
    o.btn.classList.add('minimized');
    o.btn.classList.remove('active');
  }

  function restore(wid) {
    const o = windows.get(wid); if (!o) return;
    o.win.classList.remove('minimized');
    o.btn.classList.remove('minimized');
    if (typeof window.Z === 'number') o.win.style.zIndex = ++window.Z;
    activate(wid);
  }

  function toggle(wid) {
    const o = windows.get(wid); if (!o) return;
    o.win.classList.contains('minimized') ? restore(wid) : minimize(wid);
  }

  function addMinimizeButton(win, wid) {
    const btns = win.querySelector('.btns');
    if (!btns || win.querySelector('.btns .min')) return;
    const b = document.createElement('button');
    b.className = 'min'; b.title = 'Minimize'; b.textContent = '–';
    b.onclick = (e) => { e.stopPropagation(); minimize(wid); };
    btns.insertBefore(b, btns.firstChild);
  }

  function createTaskButton(wid, { title, icon }) {
    const btn = document.createElement('button');
    btn.className = 'tb-item'; btn.setAttribute('role', 'tab');
    btn.dataset.wid = wid;
    btn.innerHTML = `<img class="ico" src="${icon}" alt=""><span class="t">${title}</span>`;
    btn.title = title;

    // Left click → toggle minimize/restore
    btn.addEventListener('click', () => toggle(wid));

    // Keyboard (Enter/Space behave like click)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(wid); }
      if (e.key === 'Escape') { btn.blur(); }
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault(); showCtxFor(wid, btn); // keyboard context menu
      }
    });

    // Right-click context menu
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); showCtxFor(wid, btn, e.clientX); });

    return btn;
  }

  function addWindow(win, { title = 'Window', icon = 'assets/icons/file.svg' } = {}) {
    ensureBar();
    const wid = 'w' + Math.random().toString(36).slice(2, 9);
    win.dataset.wid = wid;

    const btn = createTaskButton(wid, { title, icon });
    listEl.appendChild(btn);

    addMinimizeButton(win, wid);

    // Focus handling (clicks inside bring to front/active)
    win.addEventListener('mousedown', () => activate(wid), { capture: true });
    const iframe = win.querySelector('iframe');
    if (iframe) iframe.addEventListener('load', () => {
      try {
        iframe.contentWindow.document.addEventListener('mousedown', () => activate(wid), { capture: true });
      } catch {}
    });

    windows.set(wid, { win, btn, title, icon });
    restore(wid);
    return wid;
  }

  function removeWindow(wid) {
    const o = windows.get(wid); if (!o) return;
    o.btn.remove();
    windows.delete(wid);
    hideCtx();
  }

  // ---------- Context menu (always above the bar) ----------
  let ctxEl = null;

  function ensureCtx() {
    if (ctxEl) return ctxEl;
    ctxEl = document.createElement('div');
    ctxEl.className = 'tb-ctx';
    ctxEl.innerHTML = `
      <button data-k="restore">Restore</button>
      <button data-k="minimize">Minimize</button>
      <button data-k="close">Close</button>
    `;
    document.body.appendChild(ctxEl);
    document.addEventListener('mousedown', (e) => { if (!ctxEl.contains(e.target)) hideCtx(); });
    window.addEventListener('wheel', hideCtx, { passive: true });
    window.addEventListener('resize', hideCtx);
    ctxEl.addEventListener('click', onCtxClick);
    return ctxEl;
  }

  function hideCtx() { if (ctxEl) ctxEl.style.display = 'none'; }

  function onCtxClick(e) {
    const k = e.target?.dataset?.k;
    const wid = ctxEl?.dataset?.wid;
    if (!k || !wid) return hideCtx();
    if (k === 'restore') restore(wid);
    if (k === 'minimize') minimize(wid);
    if (k === 'close') {
      const w = [...document.querySelectorAll('.win')].find(x => x.dataset.wid === wid);
      w?.querySelector('.close')?.click();
    }
    hideCtx();
  }

  // Place menu centered over button, above taskbar
  function showCtxFor(wid, btn, clientXHint) {
    const barR = ensureBar().getBoundingClientRect();
    const c = ensureCtx();
    c.dataset.wid = wid;
    c.style.display = 'block';
    c.style.visibility = 'hidden'; // measure before placing

    const btnR = btn.getBoundingClientRect();
    const menuW = c.offsetWidth;
    const menuH = c.offsetHeight;
    const vw = window.innerWidth;

    // Center over the button; clamp inside viewport with 8px margins
    let left = (clientXHint ?? (btnR.left + btnR.width / 2)) - menuW / 2;
    left = Math.max(8, Math.min(vw - menuW - 8, left));

    // Always above the bar; if window is very short, clamp to 8px from top
    const top = Math.max(8, barR.top - menuH - 8);

    // Arrow position relative to menu left
    const arrowX = (btnR.left + btnR.width / 2) - left - 6; // 6 = half triangle base
    c.style.setProperty('--arrow-left', Math.max(10, Math.min(menuW - 10, arrowX)) + 'px');

    c.style.left = left + 'px';
    c.style.top  = top  + 'px';
    c.style.visibility = 'visible';
  }

  // ---------- Options ----------
  function setIconsOnly(on) { ensureBar(); bar.classList.toggle('icons-only', !!on); fitSafeArea(); }
  function setTight(on)     { ensureBar(); bar.classList.toggle('tight', !!on);     fitSafeArea(); }

  // ---------- Extras ----------
  function nudge(wid) {
    const o = windows.get(wid);
    if (!o) return;
    o.btn.classList.add('attn');
    setTimeout(() => o.btn.classList.remove('attn'), 1200);
  }

  // ---------- Public ----------
  function init() { ensureBar(); fitSafeArea(); }
  window.Taskbar = {
    init, addWindow, removeWindow,
    minimize, restore, toggle, activate,
    setIconsOnly, setTight, nudge
  };
})();
