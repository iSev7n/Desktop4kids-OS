/* ==========================================================
   Settings App
   ----------------------------------------------------------
   Sections
   0) Wiring & helpers
   1) Nav
   2) Account (username, pin, avatar, delete)
   3) Storage (usage bar, open folder)
   4) Personalize (wallpaper)
   5) Updates (placeholder)
   6) About (version)
========================================================== */

/* ---------- 0) Wiring & helpers ---------- */
/** bridged (sandboxed) FS */
const fs = window.top?.fsAPI;
/** profiles bridge: readProfiles, writeProfiles, renameUserRoot, deleteUserRoot, setCurrentUser */
const bridge = window.top?.accountsBridge || {};
/** used to refresh UI after changes */
const Accounts = window.top?.Accounts || null;

const QUOTA_BYTES = 50 * 1024 * 1024; // keep in sync with accounts.js
const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function showAlert(msg, title = 'Notice') {
  if (window.top?.showAlert) return window.top.showAlert(msg, title);
  alert(`${title}\n\n${msg}`);
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '"Guest"');
  } catch {
    return 'Guest';
  }
}

/** Format bytes into human-readable units */
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  const u = ['KB', 'MB', 'GB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(2)} ${u[i]}`;
}

/** Ensure folder exists (no-throw) */
async function ensureFolder(rel) {
  try { await fs?.createFolder?.(rel); } catch {}
}

/* ---------- 1) Nav ---------- */
function navInit() {
  const panes = {
    account:     $('#pane-account'),
    storage:     $('#pane-storage'),
    personalize: $('#pane-personalize'),
    updates:     $('#pane-updates'),
    about:       $('#pane-about'),
  };
  const btns = $$('.nav-btn');

  function showPane(id) {
    Object.values(panes).forEach(p => p?.classList.remove('active'));
    btns.forEach(b => b.classList.remove('active'));
    panes[id]?.classList.add('active');
    btns.find(b => b.dataset.pane === id)?.classList.add('active');
  }

  btns.forEach(b => b.addEventListener('click', () => showPane(b.dataset.pane)));
  showPane('account'); // default
}

/* ==========================================================
   2) Account
   - Username + PIN
   - Avatar (gallery modal, dataURL storage)
   - Delete account
========================================================== */

async function accountInit() {
  const unameEl        = document.getElementById('acctUser');
  const pinEl          = document.getElementById('acctPin');
  const avatarImg      = document.getElementById('avatarPreview');
  const btnChoose      = document.getElementById('btnChooseAvatar');
  const btnAvatarReset = document.getElementById('btnAvatarReset');
  const btnSave        = document.getElementById('btnSaveAccount');
  const btnDelete      = document.getElementById('btnDeleteAccount');
  const avatarFile     = document.getElementById('avatarFile'); // hidden fallback

  if (!unameEl || !pinEl || !avatarImg) return; // pane not present

  // Load profiles
  let profiles = await (bridge.readProfiles?.().catch(() => []) || []);
  const meId = getCurrentUser();
  let me = profiles.find(p => p.id === meId) || { id: meId, role: 'parent', pin: '', avatar: null, avatarDataUrl: null };

  // Seed UI
  unameEl.value = me.id;
  pinEl.value   = me.pin || '';

  await ensureFolder('appdata/avatars'); // legacy storage compatibility
  const DEFAULT_AVATAR = '../../assets/ui/default-avatar.svg';

  function renderAvatar() {
    if (me.avatarDataUrl && /^data:image\//.test(me.avatarDataUrl)) {
      avatarImg.src = me.avatarDataUrl;
      return;
    }
    if (me.avatar) {
      fs?.readText?.(me.avatar)
        .then(b64 => { avatarImg.src = `data:image/png;base64,${b64}`; })
        .catch(() => { avatarImg.src = DEFAULT_AVATAR; });
      return;
    }
    avatarImg.src = DEFAULT_AVATAR;
  }
  renderAvatar();

  // In-app gallery (if present)
  let avatarPicker = null;
  if (window.Avatars?.initAvatarModal) {
    avatarPicker = window.Avatars.initAvatarModal({
      onPick: async (dataUrl) => {
        me.avatarDataUrl = dataUrl; // new format (self-contained)
        me.avatar = null;           // clear legacy pointer
        avatarImg.src = dataUrl;
        await bridge.writeProfiles?.(profiles).catch(() => {});

        // reflect on desktop chip
        try {
          const chipImg = window.top?.document?.querySelector('#userChip .avatar');
          if (chipImg) chipImg.src = dataUrl;
          window.top?.Accounts?.refreshUserChip?.();
        } catch {}
      }
    });
  }

  // Unified opener
  function openAvatarPicker() {
    if (avatarPicker) {
      avatarPicker.show();
    } else {
      avatarFile?.click();
    }
  }

  btnChoose?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openAvatarPicker(); });
  avatarImg?.addEventListener('click', openAvatarPicker);
  avatarImg?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAvatarPicker(); }
  });

  // Fallback file input → store as base64 (legacy path)
  avatarFile?.addEventListener('change', async () => {
    const file = avatarFile.files?.[0];
    if (!file) return;

    const bytes = new Uint8Array(await file.arrayBuffer());
    let b64 = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      // eslint-disable-next-line prefer-spread
      b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    const base64 = btoa(b64);

    const rel = `appdata/avatars/${meId}.png`; // store base64 text
    await fs?.writeText?.(rel, base64).catch(() => {});

    me.avatar = rel;
    me.avatarDataUrl = null;
    await bridge.writeProfiles?.(profiles).catch(() => {});

    const dataUrl = `data:image/png;base64,${base64}`;
    avatarImg.src = dataUrl;
    try {
      const chipImg = window.top?.document?.querySelector('#userChip .avatar');
      if (chipImg) chipImg.src = dataUrl;
      window.top?.Accounts?.refreshUserChip?.();
    } catch {}
    showAlert('Avatar updated.');
  });

  // Reset avatar
  btnAvatarReset?.addEventListener('click', async () => {
    me.avatarDataUrl = null;
    me.avatar = null;
    renderAvatar();
    await bridge.writeProfiles?.(profiles).catch(() => {});
    try {
      const chipImg = window.top?.document?.querySelector('#userChip .avatar');
      if (chipImg) chipImg.src = DEFAULT_AVATAR;
      window.top?.Accounts?.refreshUserChip?.();
    } catch {}
  });

  // Save username / PIN
  btnSave?.addEventListener('click', async () => {
    const newId  = (unameEl.value || '').trim();
    const newPin = (pinEl.value  || '').trim();

    if (!/^[\w-]{1,32}$/.test(newId))
      return showAlert('Username can use letters, numbers, underscore, dash (1–32 chars).', 'Invalid username');
    if (newPin && !/^\d{4}$/.test(newPin))
      return showAlert('PIN must be exactly 4 digits.', 'Invalid PIN');

    // Username change?
    if (newId !== me.id) {
      if (profiles.some(p => p.id === newId))
        return showAlert('That username is already taken.', 'Username in use');

      // 1) rename users/<old> → users/<new>
      await bridge.renameUserRoot?.(me.id, newId).catch(() => {});

      // 2) move legacy avatar file if present (dataUrl needs no move)
      if (me.avatar) {
        const newAvatar = `appdata/avatars/${newId}.png`;
        try {
          const oldB64 = await fs?.readText?.(me.avatar);
          if (oldB64) {
            await fs?.writeText?.(newAvatar, oldB64);
            try { await fs?.delete?.(me.avatar); } catch {}
            me.avatar = newAvatar;
          }
        } catch {}
      }

      // 3) update profile id + session
      me.id = newId;
      localStorage.setItem('currentUser', JSON.stringify(newId));
      await bridge.setCurrentUser?.(newId).catch(() => {});
    }

    // PIN change
    me.pin = newPin || '';

    // Persist
    await bridge.writeProfiles?.(profiles).catch(() => {});

    // Refresh header chip + desktop
    try {
      const chip = document.querySelector('#userChip .uname');
      if (chip) chip.textContent = me.id;
      window.top?.applyWallpaper?.();
      window.top?.loadDesktopIcons?.();
      window.top?.Accounts?.refreshUserChip?.();
    } catch {}

    showAlert('Account settings saved.', 'Saved');
  });

  // Delete account
  btnDelete?.addEventListener('click', async () => {
    const ok = confirm(`Delete account “${me.id}”? This removes their files and cannot be undone.`);
    if (!ok) return;

    profiles = profiles.filter(p => p.id !== me.id);
    await bridge.writeProfiles?.(profiles).catch(() => {});
    await bridge.deleteUserRoot?.(me.id).catch(() => {});

    const self = (getCurrentUser() === me.id);
    if (self) {
      localStorage.setItem('currentUser', JSON.stringify('Guest'));
      await bridge.setCurrentUser?.('Guest').catch(() => {});
      const chip = document.querySelector('#userChip .uname');
      if (chip) chip.textContent = 'Guest';
      window.top?.applyWallpaper?.();
      window.top?.loadDesktopIcons?.();
      window.top?.Accounts?.refreshUserChip?.();
      showAlert('Account deleted. You are now signed out.', 'Deleted');
    } else {
      showAlert('Account deleted.', 'Deleted');
    }
  });
}

/* ---------- 3) Storage ---------- */
function storageInit() {
  const usedEl  = $('#storeUsed');
  const freeEl  = $('#storeFree');
  const quotaEl = $('#storeQuota');
  const bar     = $('#storeBar');
  const btnRe   = $('#btnRefreshStorage');
  const btnOpen = $('#btnOpenUserFolder');

  if (!usedEl || !freeEl || !quotaEl || !bar) return;

  quotaEl.textContent = fmtBytes(QUOTA_BYTES);

  async function folderBytes(rel) {
    let sum = 0;
    const q = [rel];
    while (q.length) {
      const p = q.pop();
      let rows = [];
      try { rows = await fs?.list?.(p); } catch { continue; }
      for (const it of rows) {
        if (it.type === 'dir') q.push(it.rel);
        else sum += (it.size || 0);
      }
    }
    return sum;
  }

  async function refresh() {
    const used = await folderBytes('user').catch(() => 0);
    const free = Math.max(0, QUOTA_BYTES - used);
    usedEl.textContent = fmtBytes(used);
    freeEl.textContent = fmtBytes(free);
    const pct = Math.min(100, Math.round((used / QUOTA_BYTES) * 100));
    bar.style.width = pct + '%';
  }

  btnRe?.addEventListener('click', refresh);
  btnOpen?.addEventListener('click', () => window.top?.postMessage?.({ type: 'open-explorer', pathRel: 'user' }, '*'));
  refresh();
}

/* ---------- 4) Personalize ---------- */
function personalizeInit() {
  const pane     = document.getElementById('pane-personalize');
  if (!pane) return;

  const grid     = document.getElementById('wallList');
  const btnReset = document.getElementById('btnResetWallpaper');
  const statusEl = document.getElementById('wallpaperStatus');

  // Preset wallpapers (renderer understands 'assets/...').
  // Thumbnails inside apps/settings/ need '../../' prefix.
  const PRESETS = [
    'assets/wallpapers/wallpaper-1.png',
    'assets/wallpapers/wallpaper-2.png',
    'assets/wallpapers/wallpaper-3.png',
    'assets/wallpapers/wallpaper-4.png',
    'assets/wallpapers/wallpaper-5.png',
    'assets/wallpapers/wallpaper-6.png',
    'assets/wallpapers/wallpaper-7.png',
    'assets/wallpapers/wallpaper-8.png',
    'assets/wallpapers/wallpaper-9.png',
    'assets/wallpapers/wallpaper-10.png',
    'assets/wallpapers/wallpaper-11.png',
    'assets/wallpapers/wallpaper-12.png',
    'assets/wallpapers/wallpaper-13.png',
    'assets/wallpapers/wallpaper-14.png',
    'assets/wallpapers/wallpaper-15.png',
  ];

  const assetThumbUrl = (rel) => (rel.startsWith('assets/') ? `../../${rel}` : rel);
  const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg || ''; };

  async function saveWallpaperRel(rel) {
    try {
      let settings = {};
      try { settings = JSON.parse(await fs?.readText?.('~/Config/settings.json')); } catch {}
      settings.wallpaper = rel; // keep raw 'assets/...' here
      await fs?.writeText?.('~/Config/settings.json', JSON.stringify(settings, null, 2));
      await window.top?.applyWallpaper?.();
      setStatus('Wallpaper applied.');
    } catch (err) {
      setStatus(err?.message || 'Failed to apply wallpaper.');
    }
  }

  function renderPresets() {
    if (!grid) return;
    grid.innerHTML = '';
    PRESETS.forEach(rel => {
      const btn = document.createElement('button');
      btn.className = 'wall-tile';
      btn.innerHTML = `<img src="${assetThumbUrl(rel)}" alt="">`;
      btn.addEventListener('click', () => saveWallpaperRel(rel));
      grid.appendChild(btn);
    });
  }

  async function resetWallpaper() {
    await saveWallpaperRel('assets/wallpapers/wallpaper-14.png');
  }

  renderPresets();
  btnReset?.addEventListener('click', resetWallpaper);
}

/* ---------- 5) Updates (placeholder) ---------- */
function updatesInit() {
  const btn = $('#btnCheckUpdates');
  const msg = $('#updMsg');
  if (!btn || !msg) return;

  btn.addEventListener('click', () => {
    msg.textContent = 'You are on the latest version.';
  });
}

/* ---------- 6) About ---------- */
function aboutInit() {
  // Optionally set real version via preload bridge:
  // $('#aboutVersion').textContent = 'v1.1.0';
}

/* ---------- Boot (run after DOM ready) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try { navInit(); }           catch (e) { console.error(e); }
  try { accountInit(); }       catch (e) { console.error(e); }
  try { storageInit(); }       catch (e) { console.error(e); }
  try { personalizeInit(); }   catch (e) { console.error(e); }
  try { updatesInit(); }       catch (e) { console.error(e); }
  try { aboutInit(); }         catch (e) { console.error(e); }
});
