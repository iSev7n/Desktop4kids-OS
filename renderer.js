/* ==========================================================
   Desktop4Kids – Renderer (Desktop Shell)
   ----------------------------------------------------------
   Sections
   A) Strict mode & DOM helpers
   B) Dialog helpers (askName / askConfirm)
   C) Global bindings & forward declarations
   D) Tray clock (taskbar)
   E) Soft-delete Trash API (hidden per-user store)
   F) Theme & Wallpaper
   G) Desktop icons
      G1) Icon assets & icon selection
      G2) Grid math (cells/positions)
      G3) Name helper for unique creation
      G4) Desktop icon load + drag/select/open
   H) Window manager
      H1) Close-guard messaging
      H2) createWindow (drag + optional resize)
      H3) App open helpers
   I) Desktop context menu (background + item)
   J) Cross-app messages
   K) Boot
========================================================== */


/* ==========================================================
   A) Strict mode & DOM helpers
========================================================== */
'use strict';

const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));


/* ==========================================================
   B) Dialog helpers (askName / askConfirm)
========================================================== */

// askName (uses .dlg-body)
async function askName({ title='Name', initial='', placeholder='', validate } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'dlg-wrap';
    el.innerHTML = `
      <div class="dlg" role="dialog" aria-label="${title}">
        <div class="dlg-title">${title}</div>
        <div class="dlg-body">
          <input class="dlg-input" spellcheck="false" value="${initial}" placeholder="${placeholder}">
          <div class="dlg-msg" aria-live="polite"></div>
        </div>
        <div class="dlg-actions">
          <button data-k="cancel" class="secondary">Cancel</button>
          <button data-k="ok" disabled>OK</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const inp = el.querySelector('.dlg-input'), msg = el.querySelector('.dlg-msg'), ok = el.querySelector('[data-k="ok"]');
    const done = (v)=>{ el.remove(); resolve(v); };

    el.addEventListener('mousedown',(e)=>{ if(e.target===el) e.preventDefault(); },true);
    el.querySelector('[data-k="cancel"]').onclick = ()=> done(null);
    ok.onclick = ()=> done(inp.value.trim());

    const run = ()=>{ const v = inp.value.trim(); const err = validate ? (validate(v)||'') : ''; msg.textContent = err; ok.disabled = !!err; };
    inp.addEventListener('input', run);

    el.addEventListener('keydown',(e)=> e.stopPropagation());
    inp.addEventListener('keydown',(e)=>{ e.stopPropagation(); if(e.key==='Enter'&&!ok.disabled) ok.click(); if(e.key==='Escape') el.querySelector('[data-k="cancel"]').click(); });

    setTimeout(()=>{ inp.focus(); const i = initial.lastIndexOf('.'); if(i>0 && i!==initial.length-1) inp.setSelectionRange(0,i); else inp.select(); run(); },0);
  });
}
const askString = askName;

// askConfirm (title + message, .dlg-body)
async function askConfirm(message='Are you sure?', title='Confirm') {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'dlg-wrap';
    el.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true">
        <div class="dlg-title">${title}</div>
        <div class="dlg-body"><div>${message}</div></div>
        <div class="dlg-actions">
          <button data-k="cancel" class="secondary">Cancel</button>
          <button data-k="ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    const ok = el.querySelector('[data-k="ok"]');
    const cancel = el.querySelector('[data-k="cancel"]');
    const dlg = el.querySelector('.dlg');

    // Auto “danger” styling for destructive text (optional)
    if (/delete|remove|empty|permanent|trash|cannot be undone/i.test(message)) {
      ok.classList.add('danger');
    }

    const close=(v)=>{ document.removeEventListener('keydown', onKey, true); el.remove(); resolve(!!v); };
    const onKey=(e)=>{ if(e.key==='Escape') return close(false); if(e.key==='Enter') return close(true);
      if(e.key==='Tab'){ const f=[...dlg.querySelectorAll('button')]; const first=f[0], last=f[f.length-1];
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } } };

    el.addEventListener('mousedown',(e)=>{ if(e.target===el) e.preventDefault(); },true);
    cancel.onclick=()=> close(false);
    ok.onclick=()=> close(true);
    document.addEventListener('keydown', onKey, true);
    setTimeout(()=> ok.focus(),0);
  });
}

// showAlert (title + message, .dlg-body)
async function showAlert(message = 'OK', title = 'Notice') {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'dlg-wrap';
    el.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true">
        <div class="dlg-title">${title}</div>
        <div class="dlg-body"><div>${message}</div></div>
        <div class="dlg-actions">
          <button data-k="ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    const ok = el.querySelector('[data-k="ok"]');
    const dlg = el.querySelector('.dlg');

    const close = () => {
      document.removeEventListener('keydown', onKey, true);
      el.remove();
      resolve(true);
    };

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') return close();
      if (e.key === 'Tab') {
        const f = [...dlg.querySelectorAll('button')];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    el.addEventListener('mousedown', (e) => { if (e.target === el) e.preventDefault(); }, true);
    ok.onclick = close;
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => ok.focus(), 0);
  });
}

// Export to top (apps should always call window.top.*)
window.askName = askName;
window.askString = askName;
window.askConfirm = askConfirm;
window.showAlert = window.showAlert;


/* ==========================================================
   C) Global bindings & forward declarations
========================================================== */
let showDeskItemMenu; // assigned in Section I
$('#closeApp')?.addEventListener('click', () => window.system?.exit?.());
$('#powerOff')?.addEventListener('click', () => window.system?.exit?.());


/* ==========================================================
   D) Tray clock (taskbar)
========================================================== */
function formatTrayClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(now);
  const get   = (t) => parts.find((p) => p.type === t)?.value || '';
  const hour  = get('hour').replace(/^0(?=\d$)/, '');
  const time  = `${hour}:${get('minute')} ${get('dayPeriod')?.toUpperCase?.() || ''}`.trim();
  const date  = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return `${time}  •  ${date}`;
}
function initTrayClock() {
  const btn = $('#trayClock');
  const pop = $('#trayPopover');
  if (!btn || !pop) return;

  function tick(){ btn.textContent = formatTrayClock(new Date()); }
  tick();
  setInterval(tick, 15_000);

  // lazy iframe
  let iframe = null;
  function ensureIframe(){
    if (iframe) return;
    iframe = document.createElement('iframe');
    iframe.src = 'apps/clock/clock.html?mode=tray';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.addEventListener('load', () => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      try { iframe.contentWindow?.postMessage({ type: 'theme', theme }, '*'); } catch {}
    });
    pop.appendChild(iframe);
  }

  const show   = () => { ensureIframe(); pop.classList.remove('hidden'); pop.setAttribute('aria-hidden','false'); };
  const hide   = () => { pop.classList.add   ('hidden'); pop.setAttribute('aria-hidden','true');  };
  const toggle = () => (pop.classList.contains('hidden') ? show() : hide());

  btn.addEventListener('click', toggle);
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }});
  document.addEventListener('mousedown', (e) => { if (!pop.classList.contains('hidden') && !pop.contains(e.target) && e.target !== btn) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
}


/* ==========================================================
   E) Soft-delete Trash API (hidden per-user store)
========================================================== */
window.Trash = (function () {
  const INDEX = 'user/.Trash/index.json';
  const DIR   = 'user/.Trash/files';

  // --- Broadcaster: tell everyone what changed -----------------
function broadcastTrash(payload) {
  // 1) Fire a host-level CustomEvent (useful if the shell wants to react)
  window.dispatchEvent(new CustomEvent('trash:changed', { detail: payload }));

  // 2) Tell all app iframes (Trash app, Explorer windows, etc.)
  $$('iframe').forEach((f) => {
    try { f.contentWindow?.postMessage({ type: 'trash-changed', ...payload }, '*'); } catch {}
  });
}

// This lets Explorers refresh their current folder automatically.
function broadcastFsChanges(rels = []) {
  $$('iframe').forEach((f) => {
    try {
      rels.forEach((rel) => f.contentWindow?.postMessage({ type: 'fs-change', rel }, '*'));
    } catch {}
  });
}

  async function ensure() {
    try { await window.fsAPI.createFolder('user/.Trash'); } catch {}
    try { await window.fsAPI.createFolder(DIR); } catch {}
    try { await window.fsAPI.readText(INDEX); }
    catch { await window.fsAPI.writeText(INDEX, JSON.stringify({ items: [] }, null, 2)); }
  }

  async function readIndex() {
    await ensure();
    try { return JSON.parse(await window.fsAPI.readText(INDEX)) || { items: [] }; }
    catch { return { items: [] }; }
  }
  async function writeIndex(db) {
    await window.fsAPI.writeText(INDEX, JSON.stringify(db, null, 2));
  }

  function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  // E1) Move (soft delete)
  async function move(rel) {
    await ensure();
    const db = await readIndex();

    const base = rel.split('/').pop();
    const id   = uid();
    const storeName = `${id}__${base}`;
    const to   = `${DIR}/${storeName}`;

    await window.fsAPI.renameOrMove(rel, to);

    db.items.push({ id, base, storeName, orig: rel, size: 0, deletedAt: Date.now() });

    // best-effort size fill
    try {
      const rows = await window.fsAPI.list(to);
      let sum = 0; for (const it of rows) sum += it.size || 0;
      db.items[db.items.length - 1].size = sum;
    } catch {}

    await writeIndex(db);
    // tell listeners: item moved into trash
    broadcastTrash({ action: 'move', id, item: { id, base, orig: rel }, when: Date.now() });

    // let Explorers know both the original folder and Trash have changed
    const origDir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : 'user';
    broadcastFsChanges([origDir, 'user/.Trash/files']);
  }

  // E2) Restore
  async function restore(id) {
    const db = await readIndex();
    const it = db.items.find(x => x.id === id);
    if (!it) return false;

    const origDir = it.orig.includes('/') ? it.orig.slice(0, it.orig.lastIndexOf('/')) : 'user';
    const name    = it.base;

    const entries = await window.fsAPI.list(origDir).catch(() => []);
    const used    = new Set(entries.map(e => e.name));
    let final     = name;

    if (used.has(final)) {
      const iDot = name.lastIndexOf('.');
      const stem = iDot > 0 ? name.slice(0, iDot) : name;
      const ext  = iDot > 0 ? name.slice(iDot) : '';
      let n = 1;
      while (used.has(final)) final = `${stem} (${n++})${ext}`;
    }

    const from = `${DIR}/${it.storeName}`;
    const to   = `${origDir}/${final}`;

    await window.fsAPI.renameOrMove(from, to);

    db.items = db.items.filter(x => x.id !== id);
    await writeIndex(db);

    
    // tell listeners: restored out of trash
    broadcastTrash({ action: 'restore', id, to });

    // refresh both: destination dir and Trash dir
    const destDir = to.includes('/') ? to.slice(0, to.lastIndexOf('/')) : 'user';
    broadcastFsChanges([destDir, 'user/.Trash/files']);

    return true;
  }

  // E3) Remove forever
  async function remove(id) {
    const db = await readIndex();
    const it = db.items.find(x => x.id === id);
    if (!it) return false;

    const path = `${DIR}/${it.storeName}`;
    await window.fsAPI.delete(path).catch(()=>{});
    db.items = db.items.filter(x => x.id !== id);
    await writeIndex(db);

    // tell listeners: permanently removed from trash
    broadcastTrash({ action: 'remove', id });

    // refresh Trash dir
    broadcastFsChanges(['user/.Trash/files']);

    return true;
  }

  // E4) Empty
  async function empty() {
    const db = await readIndex();
    for (const it of db.items) {
      await window.fsAPI.delete(`${DIR}/${it.storeName}`).catch(()=>{});
    }
    db.items = [];
    await writeIndex(db);

    // tell listeners: trash emptied
    broadcastTrash({ action: 'empty' });

    // refresh Trash dir
    broadcastFsChanges(['user/.Trash/files']);

  }

  // E5) List
  async function list() {
    const db = await readIndex();
    return db.items.slice().sort((a,b)=> b.deletedAt - a.deletedAt);
  }

  return { move, restore, remove, empty, list, ensure };
})();


/* ==========================================================
   F) Theme & Wallpaper
========================================================== */
const SETTINGS_PATH = 'user/Config/settings.json';

async function applyTheme() {
  let theme = 'dark';
  try {
    const raw = await window.fsAPI.readText(SETTINGS_PATH);
    const settings = JSON.parse(raw || '{}');
    theme = settings.theme || 'dark';
  } catch {}
  document.documentElement.setAttribute('data-theme', theme);

  // echo theme to all iframes/popovers
  $$('iframe').forEach((f) => { try { f.contentWindow?.postMessage({ type: 'theme', theme }, '*'); } catch {} });

  return theme;
}
window.applyTheme = applyTheme;

async function applyWallpaper() {
  const DEFAULT_WALLPAPER = 'assets/wallpapers/wallpaper-14.png';
  let settings = {};
  try { settings = JSON.parse((await window.fsAPI.readText(SETTINGS_PATH)) || '{}'); } catch {}
  let rel = settings.wallpaper || DEFAULT_WALLPAPER;

  let url;
  if (rel.startsWith('assets/'))       url = rel;
  else if (rel.startsWith('data:'))    url = rel;
  else {
    url = await window.fsAPI.fileUrl(rel).catch(() => DEFAULT_WALLPAPER);
    if (!url) url = DEFAULT_WALLPAPER;
  }

  $('#desktop').style.background = `center / cover no-repeat url("${url}")`;

  // persist normalized choice
  if (settings.wallpaper !== rel) {
    settings.wallpaper = rel;
    await window.fsAPI.writeText(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  }
}

function hasIllegalChars(name){ return /[\\\/\x00-\x1F]/.test(name) || name==='.' || name==='..'; }
function splitNameExt(name){ const i=name.lastIndexOf('.'); return (i>0&&i<name.length-1)?{stem:name.slice(0,i),ext:name.slice(i)}:{stem:name,ext:''}; }
function nextAvailableName(base, used){ if(!used.has(base)) return base; const {stem,ext}=splitNameExt(base); let n=1,c; do{ c=`${stem} (${n++})${ext}`; }while(used.has(c)); return c; }


/* ==========================================================
   G) Desktop icons
========================================================== */

/* ----------------------------------------------------------
   G1) Icon assets & icon selection
---------------------------------------------------------- */
const ICON_BASE = 'assets/icons/';
const ICONS = {
  folder: ICON_BASE + 'folder.svg',
  'folder-images': ICON_BASE + 'folder-images.svg',
  'folder-video': ICON_BASE + 'folder-video.svg',
  'folder-text': ICON_BASE + 'folder-text.svg',
  'folder-games': ICON_BASE + 'folder-games.svg',
  file: ICON_BASE + 'file.svg',
  'file-text': ICON_BASE + 'file-text.svg',
  'file-code': ICON_BASE + 'file-code.svg',
  'file-video': ICON_BASE + 'file-video.svg',
  'file-info': ICON_BASE + 'file-info.svg',
  'file-music': ICON_BASE + 'file-song.svg',
  trash: ICON_BASE + 'trash.svg', // synthetic Trash app
};

function iconForEntryDesktop(it) {
  // Synthetic “Trash” app icon
  if (it.rel === '__TRASH__' || (it.type === 'app' && it.name === 'Trash')) return ICONS.trash;

  if (it.type === 'dir') {
    const n = it.name.toLowerCase();
    if (n.includes('picture') || n.includes('image') || it.rel.endsWith('/Pictures')) return ICONS['folder-images'];
    if (n.includes('video')   || it.rel.endsWith('/Videos'))   return ICONS['folder-video'];
    if (n.includes('document')|| it.rel.endsWith('/Documents'))return ICONS['folder-text'];
    if (n.includes('games')   || it.rel.endsWith('/Games'))    return ICONS['folder-games'];
    return ICONS.folder;
  }

  const ext = (it.ext || '').toLowerCase();
  if (['txt','md','rtf','log'].includes(ext)) return ICONS['file-text'];
  if (['html','htm','css','js','ts','json','py','c','cpp','cs','java','xml','yml','yaml','sh','bat'].includes(ext)) return ICONS['file-code'];
  if (['mp3','wav','ogg'].includes(ext))  return ICONS['file-music'];
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return ICONS['file-video'];
  return ICONS.file;
}

/* ----------------------------------------------------------
   G2) Grid math (cells/positions)
---------------------------------------------------------- */
const GRID = { cellW: 100, cellH: 110, gapX: 16, gapY: 16, marginX: 24, marginY: 24 };

function gridMetrics() {
  const area = $('#desktop');
  const w = area.clientWidth, h = area.clientHeight;
  const cols = Math.max(1, Math.floor((w - GRID.marginX * 2 + GRID.gapX) / (GRID.cellW + GRID.gapX)));
  const rows = Math.max(1, Math.floor((h - GRID.marginY * 2 + GRID.gapY) / (GRID.cellH + GRID.gapY)));
  return { w, h, cols, rows };
}
function posForCell(col, row) {
  return { x: GRID.marginX + col * (GRID.cellW + GRID.gapX), y: GRID.marginY + row * (GRID.cellH + GRID.gapY) };
}
function snapToCell(px, py) {
  const m = gridMetrics();
  let col = Math.round((px - GRID.marginX) / (GRID.cellW + GRID.gapX));
  let row = Math.round((py - GRID.marginY) / (GRID.cellH + GRID.gapY));
  col = Math.max(0, Math.min(m.cols - 1, col));
  row = Math.max(0, Math.min(m.rows - 1, row));
  return { col, row };
}

/* ----------------------------------------------------------
   G3) Name helper for unique creation
---------------------------------------------------------- */
async function pickUniqueName(dirRel, { base, title }) {
  const entries = await window.fsAPI.list(dirRel);
  const used    = new Set(entries.map((e) => e.name));
  const initial = nextAvailableName(base, used);
  const name = await askName({
    title, initial,
    validate: (v) => { if (!v) return 'Please enter a name.'; if (hasIllegalChars(v)) return 'Invalid characters.'; return ''; },
  });
  if (!name) return null;
  return used.has(name) ? nextAvailableName(name, used) : name;
}

/* ----------------------------------------------------------
   G4) Desktop icon load + drag/select/open
---------------------------------------------------------- */
async function loadDesktopIcons() {
  const cont = $('#desktopIcons');
  cont.innerHTML = '';

  const items = await window.fsAPI.list('~/Desktop');
  const TRASH_ICON = { name: 'Trash', rel: '__TRASH__', type: 'app', icon: 'assets/icons/trash.svg' };
  items.unshift(TRASH_ICON);

  // one-time: clicking empty desktop clears selection
  if (!window._deskDeselectBound) {
    const desk = $('#desktop');
    const clearSel = () => cont.querySelectorAll('.d-icon.selected').forEach((n) => n.classList.remove('selected'));
    desk.addEventListener('mousedown', (e) => { if (e.button !== 0) return; if (e.target.closest('.d-icon')) return; clearSel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSel(); });
    window._deskDeselectBound = true;
  }

  // icon layout cache
  let layout = {};
  try { layout = JSON.parse((await window.fsAPI.readText('user/Config/desktop.json')) || '{}'); } catch {}

  const m   = gridMetrics();
  const occ = new Set();
  const keyFor = (c, r) => `${c},${r}`;

  function clampCell(c, r) {
    c = Math.max(0, Math.min(m.cols - 1, c));
    r = Math.max(0, Math.min(m.rows - 1, r));
    return { col: c, row: r };
  }
  function nextFree(col, row) {
    ({ col, row } = clampCell(col, row));
    if (!occ.has(keyFor(col, row))) return { col, row };
    for (let radius = 1; radius <= Math.max(m.cols, m.rows); radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const c = col + dc, r = row + dr;
          if (c < 0 || r < 0 || c >= m.cols || r >= m.rows) continue;
          if (!occ.has(keyFor(c, r))) return { col: c, row: r };
        }
      }
    }
    for (let r = 0; r < m.rows; r++) for (let c = 0; c < m.cols; c++) if (!occ.has(keyFor(c, r))) return { col: c, row: r };
    return { col: 0, row: 0 };
  }

  for (let i = 0; i < items.length; i++) {
    const it  = items[i];
    const key = it.rel;

    // starting guess
    let col = i % m.cols, row = Math.floor(i / m.cols);

    const place = layout[key];
    if (place) {
      if (typeof place.col === 'number' && typeof place.row === 'number') ({ col, row } = clampCell(place.col, place.row));
      else if (typeof place.x === 'number' && typeof place.y === 'number') { const sn = snapToCell(place.x, place.y); col = sn.col; row = sn.row; }
    }

    ({ col, row } = nextFree(col, row));
    occ.add(keyFor(col, row));

    const { x, y } = posForCell(col, row);
    const icon = document.createElement('div');
    icon.className   = 'd-icon';
    icon.style.left  = x + 'px';
    icon.style.top   = y + 'px';
    icon.dataset.key = key;
    icon.dataset.col = col;
    icon.dataset.row = row;

    const iconSrc = it.icon || iconForEntryDesktop(it);
    icon.innerHTML = `
      <div class="d-ico"><img class="d-ico-img" src="${iconSrc}" alt=""></div>
      <div class="label">${it.name}</div>
    `;

    // open
    icon.addEventListener('dblclick', () => {
      if (it.type === 'dir') return openExplorerAt(it.rel);
      if (it.rel === '__TRASH__') return openTrash();
      const ext = (it.ext || '').toLowerCase();
      if (['txt', 'md', 'rtf', 'log'].includes(ext)) return openNotepad(it.rel);
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm'].includes(ext)) return openMedia(it.rel);
      openExplorerAt('user/Desktop');
    });

    // select (Ctrl toggles multi-select)
    icon.addEventListener('click', (e) => {
      if (!e.ctrlKey) cont.querySelectorAll('.d-icon.selected').forEach((n) => n.classList.remove('selected'));
      icon.classList.toggle('selected');
    });

    // right-click menu
    icon.addEventListener('contextmenu', (e) => showDeskItemMenu(e, it));

    // drag reposition
    icon.addEventListener('mousedown', (e) => {
      const cont = $('#desktopIcons');
      const area = $('#desktop');
      const m    = gridMetrics();
      const N    = m.cols * m.rows;

      const toIndex = (c, r) => r * m.cols + c;
      const fromIndex = (i) => ({ col: i % m.cols, row: Math.floor(i / m.cols) });
      const idxOf  = (el) => toIndex(+el.dataset.col, +el.dataset.row);
      const placeEl = (el, col, row) => {
        const p = posForCell(col, row);
        el.style.left = p.x + 'px';
        el.style.top  = p.y + 'px';
        el.dataset.col = col;
        el.dataset.row = row;
      };

      function baselineCells() {
        const cells = Array(N).fill(null);
        [...cont.children].forEach((el) => { if (el === icon) return; const i = idxOf(el); if (i >= 0 && i < N) cells[i] = el; });
        return cells;
      }
      function nearestFreeIndex(t, cells) {
        for (let i = t; i < N; i++) if (!cells[i]) return i;
        for (let i = t; i >= 0; i--) if (!cells[i]) return i;
        return -1;
      }

      icon.classList.add('dragging');
      let base = baselineCells();
      let lastPreview = base.slice();

      const onMove = (ev) => {
        const px = Math.min(area.clientWidth - GRID.cellW,  Math.max(0, ev.clientX - GRID.cellW / 2));
        const py = Math.min(area.clientHeight - GRID.cellH, Math.max(0, ev.clientY - GRID.cellH / 2));
        const { col, row } = snapToCell(px, py);
        const t = toIndex(col, row);

        const cells = base.slice();
        const dest  = nearestFreeIndex(t, cells);
        if (dest === -1) return;

        if (dest >= t) { for (let k = dest; k > t; k--) cells[k] = cells[k - 1]; }
        else           { for (let k = dest; k < t; k++) cells[k] = cells[k + 1]; }
        cells[t] = icon;

        for (let i = 0; i < N; i++) {
          const el = cells[i]; if (!el) continue;
          const { col: c, row: r } = fromIndex(i);
          placeEl(el, c, r);
        }
        lastPreview = cells;
        ev.preventDefault();
      };

      const onUp = async () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        icon.classList.remove('dragging');

        let layout = {};
        try { layout = JSON.parse((await window.fsAPI.readText('user/Config/desktop.json')) || '{}'); } catch {}
        for (let i = 0; i < N; i++) {
          const el = lastPreview[i];
          if (!el) continue;
          const { col: c, row: r } = fromIndex(i);
          layout[el.dataset.key] = { col: c, row: r };
        }
        await window.fsAPI.writeText('user/Config/desktop.json', JSON.stringify(layout, null, 2));
      };

      document.addEventListener('mousemove', onMove, { passive: false });
      document.addEventListener('mouseup',    onUp,   { once: true });
      e.preventDefault();
    });

    cont.appendChild(icon);
  }
}


/* ==========================================================
   H) Window manager
========================================================== */

/* ----------------------------------------------------------
   H1) Close-guard messaging helper
---------------------------------------------------------- */
function requestAppCanClose(iframe) {
  if (!iframe?.contentWindow) return Promise.resolve(true);
  const w = iframe.contentWindow;
  try { if (!w.__appCloseGuard) return Promise.resolve(true); } catch { return Promise.resolve(true); }

  return new Promise((resolve) => {
    const onMsg = (ev) => {
      if (ev.source === w && ev.data?.type === 'app-close-decision') {
        window.removeEventListener('message', onMsg);
        resolve(!!ev.data.ok);
      }
    };
    window.addEventListener('message', onMsg);
    try { w.postMessage({ type: 'app-close-request' }, '*'); }
    catch { window.removeEventListener('message', onMsg); resolve(true); }
  });
}

/* ----------------------------------------------------------
   H2) createWindow (drag + optional resize)
---------------------------------------------------------- */
let Z = 100;
function createWindow(title, src, opts = {}) {
  const host = $('#winHost');
  const win  = document.createElement('div');
  win.className = 'win';

  // sizing (optional)
  if (opts.w)    win.style.width     = opts.w + 'px';
  if (opts.h)    win.style.height    = opts.h + 'px';
  if (opts.minW) win.style.minWidth  = opts.minW + 'px';
  if (opts.minH) win.style.minHeight = opts.minH + 'px';

  win.style.left   = '140px';
  win.style.top    = '100px';
  win.style.zIndex = ++Z;

  win.innerHTML = `
    <div class="title">
      <div>${title}</div>
      <div class="btns"><button class="close">×</button></div>
    </div>
    <iframe src="${src}" sandbox="allow-scripts allow-same-origin allow-modals allow-forms"></iframe>
  `;

  // resizable (optional)
  if (opts.resizable) {
    win.classList.add('resizable');

    let resizing = false, startX, startY, startW, startH;
    const resizer = document.createElement('div');
    resizer.className = 'win-resizer';
    win.appendChild(resizer);

    resizer.addEventListener('mousedown', (e) => {
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = win.offsetWidth; startH = win.offsetHeight;
      document.body.style.cursor = 'nwse-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!resizing) return;
      const newW = Math.max(opts.minW || 200, startW + (e.clientX - startX));
      const newH = Math.max(opts.minH || 150, startH + (e.clientY - startY));
      win.style.width  = newW + 'px';
      win.style.height = newH + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (resizing) { resizing = false; document.body.style.cursor = ''; }
    });
  }

  win.addEventListener('mousedown', () => (win.style.zIndex = ++Z));

  const wid = Taskbar.addWindow(win, { title, icon: opts.icon });
  win.dataset.wid = wid;

  // Close button w/ guard
  const btnClose = win.querySelector('.close');
  btnClose.onclick = async () => {
    const iframe = win.querySelector('iframe');
    const ok = await requestAppCanClose(iframe);
    if (ok) { Taskbar.removeWindow(wid); win.remove(); }
  };

  // bring-front on iframe click
  const iframe = win.querySelector('iframe');
  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.document.addEventListener('mousedown', () => { win.style.zIndex = ++Z; }, { capture: true });
    } catch {}
  });

  // drag constraints
  const bar = win.querySelector('div.title');
  let dx = 0, dy = 0;
  const TOP_BAR  = 0;   // top chrome
  const TASKBAR_H = 74; // taskbar height
  const PAD = 0;

  const onMove = (e) => {
    let x = e.clientX - dx;
    let y = e.clientY - dy;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const maxX = Math.max(PAD, vw - win.offsetWidth  - PAD);
    const maxY = Math.max(TOP_BAR, vh - TASKBAR_H - win.offsetHeight - PAD);

    if (x < PAD) x = PAD; else if (x > maxX) x = maxX;
    if (y < TOP_BAR) y = TOP_BAR; else if (y > maxY) y = maxY;

    win.style.left = x + 'px';
    win.style.top  = y + 'px';
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
    document.body.style.cursor = '';
  };
  bar.onmousedown = (e) => {
    dx = e.clientX - win.offsetLeft;
    dy = e.clientY - win.offsetTop;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    document.body.style.cursor = 'grabbing';
    e.preventDefault();
  };

  host.appendChild(win);

  // center (default) using constants above
  if (opts.center !== false) {
    const w = win.offsetWidth, h = win.offsetHeight;
    const x = Math.max(PAD, Math.round((innerWidth  - w) / 2));
    const y = Math.max(TOP_BAR, Math.round((innerHeight - TASKBAR_H - h) / 2));
    win.style.left = x + 'px';
    win.style.top  = y + 'px';
  }

  return win;
}

/* ----------------------------------------------------------
   H3) App open helpers
---------------------------------------------------------- */
function openExplorerAt(pathRel) {
  const url = `apps/explorer/explorer.html?path=${encodeURIComponent(pathRel || '')}`;
  createWindow('Files', url, { icon: 'assets/icons/folder.svg', resizable: true });
}
function openNotepad(rel) {
  const url = `apps/notepad/notepad.html?file=${encodeURIComponent(rel)}`;
  createWindow('Notepad', url, { icon: 'assets/icons/file-text.svg', resizable: true });
}
function openSettings() {
  createWindow('Settings', 'apps/settings/settings.html', { icon: 'assets/icons/settings.svg' });
}
function openMedia(rel) {
  const url = `apps/media/mediacenter.html?file=${encodeURIComponent(rel)}`;
  createWindow('Media Center', url, { icon: 'assets/icons/file-video.svg', resizable: true });
}
function openBrowser() {
  createWindow('Browser', 'apps/browser/browser.html', { icon: 'assets/icons/browser.svg', resizable: true });
}
function openMentor() {
  createWindow('Mentor', 'apps/ai-worker/mentor.html', { icon: 'assets/icons/assistant.svg' });
}
function openCalculator() {
  createWindow('Calculator', 'apps/calculator/calculator.html', {
    icon: 'assets/icons/calculator.svg',
    w: 360, h: 520, minW: 320, minH: 440, center: true
  });
}
function openTrash() {
  createWindow('Trash', 'apps/trash/trash.html', {
    icon: 'assets/icons/trash.svg',
    w: 560, h: 480, minW: 420, minH: 380, resizable: true, center: true
  });
}

function openPaint() {
  createWindow('Paint', 'apps/paint/paint.html', {
    icon: 'assets/icons/paint.svg',
    w: 900, h: 620, minW: 640, minH: 420, resizable: true, center: true
  });
}


/* ==========================================================
   I) Desktop context menu (background + item)
========================================================== */
(function () {
  const fs   = window.fsAPI;
  const desk = $('#desktop');
  if (!desk) return;

  const host = document.createElement('div');
  host.className = 'ctx hidden';
  document.body.appendChild(host);

  // I1) edge-safe position
  function positionCtx(ev) {
    host.classList.remove('hidden');
    host.style.left = ev.clientX + 'px';
    host.style.top  = ev.clientY + 'px';
    const r = host.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    if (r.right  > vw) host.style.left = Math.max(8, vw - r.width  - 8) + 'px';
    if (r.bottom > vh) host.style.top  = Math.max(8, vh - r.height - 8) + 'px';
  }

  // I2) background menu
  function showDeskMenu(ev) {
    ev.preventDefault();
    host.innerHTML = `
      <div class="mi" data-k="newFolder">New folder</div>
      <div class="mi" data-k="newTxt">New text file</div>
    `;
    positionCtx(ev);
  }

  // I3) item menu (exported)
  showDeskItemMenu = function (ev, it) {
    ev.preventDefault();
    host.innerHTML = `
      <div class="mi" data-k="open">Open</div>
      <div class="mi" data-k="edit">Open in Notepad</div>
      <div class="mi" data-k="rename">Rename</div>
      <div class="mi" data-k="delete">Delete</div>
    `;
    positionCtx(ev);

    // prevent stacked handlers
    if (host._itemHandler) host.removeEventListener('click', host._itemHandler);

    const onClick = async (e) => {
      const k = e.target.closest('.mi')?.dataset.k;
      if (!k) return;
      host.classList.add('hidden');

      try {
        if (k === 'open') {
          if (it.type === 'dir') openExplorerAt(it.rel);
          else openNotepad(it.rel);
        }
        if (k === 'edit') {
          openNotepad(it.rel);
        }
        if (k === 'rename') {
          const dir     = it.rel.includes('/') ? it.rel.slice(0, it.rel.lastIndexOf('/')) : '';
          const entries = await fs.list(dir);
          const used    = new Set(entries.map((e) => e.name));
          used.delete(it.name);

          const nn = await askName({
            title: 'Rename to:',
            initial: it.name,
            validate: (v) => { if (!v) return 'Please enter a name.'; if (hasIllegalChars(v)) return 'Invalid characters.'; return ''; },
          });
          if (nn && nn !== it.name) {
            const finalName = used.has(nn) ? nextAvailableName(nn, used) : nn;
            const to = dir ? `${dir}/${finalName}` : finalName;

            // keep icon position by migrating layout key
            let layout = {};
            try { layout = JSON.parse((await fs.readText('user/Config/desktop.json')) || '{}'); } catch {}
            const oldPos = layout[it.rel];

            await fs.renameOrMove(it.rel, to);

            if (oldPos) {
              delete layout[it.rel];
              layout[to] = oldPos;
              await fs.writeText('user/Config/desktop.json', JSON.stringify(layout, null, 2));
            }

            await loadDesktopIcons();
          }
        }
        if (k === 'delete') {
          const kind = it.type === 'dir' ? 'Folder' : 'File';
          const ok = await askConfirm(`Delete “${it.name}” ${kind}?`);
          if (!ok) return;

          // remove layout entry first so it doesn’t “ghost”
          let layout = {};
          try { layout = JSON.parse((await fs.readText('user/Config/desktop.json')) || '{}'); } catch {}
          delete layout[it.rel];
          await fs.writeText('user/Config/desktop.json', JSON.stringify(layout, null, 2));

          await window.Trash.move(it.rel);
          await loadDesktopIcons();
        }
      } catch (err) {
        alert(err.message || String(err));
      } finally {
        if (host._itemHandler) host.removeEventListener('click', host._itemHandler);
        host._itemHandler = null;
      }
    };

    host.addEventListener('click', onClick, { capture: false });
    host._itemHandler = onClick;
  };

  // I4) bind background menu
  desk.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.d-icon')) return;
    $('#desktopIcons')?.querySelectorAll('.d-icon.selected').forEach((n) => n.classList.remove('selected'));
    showDeskMenu(e);
  });

  // I5) global click hides + cleans handler
  document.addEventListener('click', () => {
    host.classList.add('hidden');
    if (host._itemHandler) { host.removeEventListener('click', host._itemHandler); host._itemHandler = null; }
  });

  // I6) background actions
  host.addEventListener('click', async (e) => {
    const k = e.target.closest('.mi')?.dataset.k;
    if (!k) return;
    host.classList.add('hidden');
    try {
      if (k === 'newFolder') {
        const n = await pickUniqueName('~/Desktop', { base: 'New Folder', title: 'Folder name' });
        if (n) { await fs.createFolder(`~/Desktop/${n}`); await loadDesktopIcons(); }
      }
      if (k === 'newTxt') {
        const n = await pickUniqueName('~/Desktop', { base: 'New Text File.txt', title: 'File name' });
        if (n) { await fs.writeText(`~/Desktop/${n}`, ''); await loadDesktopIcons(); }
      }
    } catch (err) {
      alert(err.message || String(err));
    }
  });
})();


/* ==========================================================
   J) Cross-app messages
========================================================== */
window.addEventListener('message', async (ev) => {
  const { type, rel } = ev.data || {};

  if (type === 'set-wallpaper') {
    let settings = {};
    try { settings = JSON.parse((await window.fsAPI.readText(SETTINGS_PATH)) || '{}'); } catch {}
    settings.wallpaper = rel;
    await window.fsAPI.writeText(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    await applyWallpaper();
    return;
  }

  if (type === 'open-notepad' && rel !== undefined) { openNotepad(rel); return; }

  if (type === 'open-explorer') {
    const p = ev.data?.pathRel || '';
    openExplorerAt(p);
    return;
  }

  if (type === 'open-app' && ev.data?.id === 'browser')   { openBrowser();   return; }
  if (type === 'open-app' && ev.data?.id === 'settings')  { openSettings();  return; }
  if (type === 'open-app' && ev.data?.id === 'mentor')    { openMentor();    return; }
  if (type === 'open-app' && ev.data?.id === 'calculator'){ openCalculator();return; }
  if (type === 'open-app' && ev.data?.id === 'paint')     { openPaint();     return; }

  if (type === 'open-media' && rel !== undefined) { openMedia(rel); return; }

  if (type === 'close-active-window') {
    const host = $('#winHost');
    const wins = [...host.querySelectorAll('.win')];
    if (wins.length) {
      const w = wins[wins.length - 1];
      const iframe = w.querySelector('iframe');
      if (await requestAppCanClose(iframe)) {
        const wid = w.dataset.wid;
        if (wid) Taskbar.removeWindow(wid);
        w.remove();
      }
    }
    return;
  }

  if (type === 'fs-change') {
    // refresh desktop icons when paths under Desktop changed
    const isDesktopPath = (r) => {
      if (!r) return true; // home changed
      const cands = ['user/Desktop', 'Desktop', '~/Desktop'];
      return cands.some((p) => r === p || r.startsWith(p + '/'));
    };
    if (isDesktopPath(rel)) await loadDesktopIcons();
    return;
  }
});


/* ==========================================================
   K) Boot
========================================================== */
(async function boot() {
  await Accounts.init();
  Taskbar?.init?.();
  Taskbar?.setIconsOnly?.(true);
  initTrayClock();
  await applyTheme();
  await applyWallpaper();
  await loadDesktopIcons();
})();
