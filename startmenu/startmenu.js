// startmenu/startmenu.js
(function () {
  /* ==========================================================
     Desktop4Kids – Start Menu
     ----------------------------------------------------------
     Responsibilities
     - Inject startmenu.html
     - Render pinned + all apps
     - Search apps
     - Power flyout (signout/restart/shutdown)
     - Open apps by posting messages to the desktop (renderer)
  ========================================================== */

  /* ========== 0) Constants ============================================ */

  // App catalog (decoupled from renderer.js)
  const START_APPS = [
    { id: 'files',     name: 'Files',     icon: 'assets/icons/folder.svg',        cat: 'System' },
    { id: 'documents', name: 'Documents', icon: 'assets/icons/folder-text.svg',   cat: 'System' },
    { id: 'images',    name: 'Pictures',  icon: 'assets/icons/folder-images.svg', cat: 'System' },
    { id: 'videos',    name: 'Videos',    icon: 'assets/icons/folder-video.svg',  cat: 'System' },
    { id: 'games',     name: 'Games',     icon: 'assets/icons/folder-games.svg',  cat: 'Games'  },
    { id: 'notepad',   name: 'Notepad',   icon: 'assets/icons/notepad.svg',       cat: 'Apps'   },
    { id: 'settings',  name: 'Settings',  icon: 'assets/icons/settings.svg',      cat: 'System' },
  ];

  // Order of the large tiles at the top
  const PINNED_IDS = ['files', 'documents', 'images', 'videos', 'games'];

  // Quick lookup for id → app
  const APP_BY_ID = Object.fromEntries(START_APPS.map(a => [a.id, a]));

  /* ========== 1) DOM refs / state ===================================== */
  /** @type {HTMLElement|null} */ let root;
  /** @type {HTMLElement|null} */ let pinnedGrid;
  /** @type {HTMLElement|null} */ let allAppsEl;
  /** @type {HTMLInputElement|null} */ let startSearch;
  /** @type {HTMLButtonElement|null} */ let btnPower;
  /** @type {HTMLElement|null} */ let powerFlyout;

  /* ========== 2) Helpers ============================================== */
  function openAppById(id) {
    // Keep opening logic centralized (renderer handles actual windows)
    switch (id) {
      case 'files':
        window.top.postMessage({ type: 'open-explorer', pathRel: '' }, '*');
        break;
      case 'documents':
        window.top.postMessage({ type: 'open-explorer', pathRel: 'user/Documents' }, '*');
        break;
      case 'images':
        window.top.postMessage({ type: 'open-explorer', pathRel: 'user/Pictures' }, '*');
        break;
      case 'videos':
        window.top.postMessage({ type: 'open-explorer', pathRel: 'user/Videos' }, '*');
        break;
      case 'notepad':
        window.top.postMessage({ type: 'open-notepad', rel: '' }, '*');
        break;
      default:
        window.top.postMessage({ type: 'open-app', id }, '*');
    }
  }

  function show() {
    if (!root) return;
    root.classList.remove('hidden');
    if (startSearch) startSearch.value = '';
    renderPinned();
    renderAllApps('');
    // focus search for quick typing
    setTimeout(() => startSearch?.focus(), 0);
  }

  function hide() {
    root?.classList.add('hidden');
    powerFlyout?.classList.add('hidden');
  }

  function toggle() {
    if (!root) return;
    root.classList.contains('hidden') ? show() : hide();
  }

  /* ========== 3) Rendering ============================================ */
  function renderPinned() {
    if (!pinnedGrid) return;
    pinnedGrid.innerHTML = '';

    PINNED_IDS
      .map(id => APP_BY_ID[id])
      .filter(Boolean)
      .forEach(app => {
        const el = document.createElement('button');
        el.className = 'app-tile';
        el.innerHTML = `<img src="${app.icon}" alt=""><div class="t-name">${app.name}</div>`;
        el.onclick = () => { openAppById(app.id); hide(); };
        pinnedGrid.appendChild(el);
      });
  }

  function renderAllApps(filter = '') {
    if (!allAppsEl) return;
    const q = filter.trim().toLowerCase();
    allAppsEl.innerHTML = '';

    START_APPS
      .filter(a => !q || a.name.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(app => {
        const row = document.createElement('div');
        row.className = 'app-row';
        row.innerHTML = `
          <img src="${app.icon}" alt="">
          <div class="r-name">${app.name}</div>
          <div class="r-cat">${app.cat}</div>
        `;
        row.onclick = () => { openAppById(app.id); hide(); };
        allAppsEl.appendChild(row);
      });
  }

  /* ========== 4) Events & wiring ====================================== */
  function wireEvents() {
    // Start button toggles menu
    const startBtn = document.getElementById('startBtn');
    startBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Click outside to close
    document.addEventListener('mousedown', (e) => {
      if (!root || root.classList.contains('hidden')) return;
      const clickedInside = root.contains(e.target);
      const clickedStartBtn = (e.target && (e.target === startBtn || startBtn?.contains(e.target)));
      if (!clickedInside && !clickedStartBtn) hide();
    });

    // ESC closes
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

    // Live search
    startSearch?.addEventListener('input', () => renderAllApps(startSearch.value));

    // Power button toggles flyout
    btnPower?.addEventListener('click', (e) => {
      e.stopPropagation();
      powerFlyout?.classList.toggle('hidden');
    });

    // Power actions
    powerFlyout?.addEventListener('click', async (e) => {
      const act = e.target.closest('button[data-power]')?.getAttribute('data-power');
      if (!act) return;

      if (act === 'shutdown') {
        window.system?.exit?.();
      } else if (act === 'restart') {
        location.reload();
      } else if (act === 'signout') {
        try {
          localStorage.setItem('currentUser', JSON.stringify('Guest'));
          await window.accountsBridge?.setCurrentUser?.('Guest');
          const unameEl = document.querySelector('#userChip .uname');
          if (unameEl) unameEl.textContent = 'Guest';
          window.applyWallpaper?.();
          window.loadDesktopIcons?.();
          window.Accounts?.refreshUserChip?.();
        } catch {}
      }
      hide();
    });

    // Click outside power flyout closes it (but not the whole Start menu)
    document.addEventListener('mousedown', (e) => {
      if (!powerFlyout || powerFlyout.classList.contains('hidden')) return;
      if (!powerFlyout.contains(e.target) && e.target !== btnPower && !btnPower?.contains(e.target)) {
        powerFlyout.classList.add('hidden');
      }
    });

    // Left rail quick apps
    root?.querySelector('.start-rail')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.rail-btn[data-app]');
      if (!btn) return;
      openAppById(btn.getAttribute('data-app'));
      hide();
    });
  }

  /* ========== 5) Mount (inject HTML + cache refs) ====================== */
  async function mount() {
    // Use the Start Menu that already exists in index.html
    root        = document.getElementById('startMenu');
    pinnedGrid  = document.getElementById('pinnedGrid');
    allAppsEl   = document.getElementById('allApps');
    startSearch = document.getElementById('startSearch');
    btnPower    = document.getElementById('btnPower');
    powerFlyout = document.getElementById('powerFlyout');

    // Optional: show current user name (if Accounts loaded)
    try {
      const nameEl = document.getElementById('smUserName');
      if (nameEl) nameEl.textContent = window.Accounts?.getCurrentUserId?.() || '';
    } catch {}

    wireEvents();
  }

  /* ========== 6) Public API ============================================ */
  async function remount(){
  const old = document.getElementById('startmenu-wrap');
  if (old) old.remove();
  await mount();
  }
  window.StartMenu = { show, hide, toggle, mount, remount };
  })();

/* ========== 7) Auto-mount on DOM ready ================================= */
document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r') {
    window.StartMenu?.remount?.();
  }
});

  // Ensure stylesheet exists (idempotent)
  if (!document.querySelector('link[href="startmenu/startmenu.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'startmenu/startmenu.css';
    document.head.appendChild(l);
  }
  StartMenu.mount();
});
