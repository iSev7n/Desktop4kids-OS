/* ==========================================================
   Desktop4Kids – Explorer (app iframe)
   ----------------------------------------------------------
   Features
   - Grid + List views
   - Drag-to-reorder in Grid view (reading order only)
   - Context menus (item + blank background)
   - New folder / New text file / Rename / Delete / Open
   - "Set as wallpaper" on images
   - Persist per-folder ORDER in user/Config/explorer-order.json
   - Notify desktop to refresh when FS changes
========================================================== */

/* 0) FS wiring ------------------------------------------------------------ */
const fs = window.top.fsAPI;

// use the desktop's custom alert dialog if available
const appAlert = (msg, title) =>
  window.top.showAlert ? window.top.showAlert(msg, title) : window.alert(msg);

/* 1) Dialog helpers (sticky prompt + confirm) ----------------------------- */
// Sticky input modal: backdrop clicks do NOT close it; Esc/Cancel do.
async function askString({ title = 'Name', placeholder = '', initial = '', selectStem = false } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap';
    wrap.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true">
        <div class="dlg-title">${title}</div>
        <input class="dlg-input" placeholder="${placeholder}" value="${initial}">
        <div class="dlg-actions">
          <button data-k="cancel" class="secondary">Cancel</button>
          <button data-k="ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const dlg = wrap.querySelector('.dlg');
    const inp = wrap.querySelector('.dlg-input');
    const btnOk = wrap.querySelector('[data-k="ok"]');
    const btnCancel = wrap.querySelector('[data-k="cancel"]');

    // Focus & optionally select only the filename stem
    setTimeout(() => {
      inp.focus({ preventScroll: true });
      if (selectStem) {
        const i = initial.lastIndexOf('.');
        if (i > 0 && i < initial.length - 1) inp.setSelectionRange(0, i);
        else inp.select();
      } else {
        inp.select();
      }
    }, 0);

    // Focus trap + keyboard
    const focusables = () => [...dlg.querySelectorAll('input,button')];
    function onKey(e) {
      if (e.key === 'Enter') { btnOk.click(); }
      else if (e.key === 'Escape') { close(null); }
      else if (e.key === 'Tab') {
        const els = focusables();
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);

    function close(val) {
      document.removeEventListener('keydown', onKey);
      wrap.remove();
      resolve(val);
    }

    btnCancel.onclick = () => close(null);
    btnOk.onclick = () => close(inp.value.trim());
  });
}

async function askConfirm(msg = 'Are you sure?') {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'dlg-wrap';
    el.innerHTML = `
      <div class="dlg">
        <div class="dlg-title">${msg}</div>
        <div class="dlg-actions">
          <button data-k="cancel">Cancel</button>
          <button data-k="ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const done = (val) => { el.remove(); resolve(!!val); };
    el.querySelector('[data-k="cancel"]').onclick = () => done(false);
    el.querySelector('[data-k="ok"]').onclick = () => done(true);
  });
}

/* 2) Name helpers + validated prompt ------------------------------------- */
function hasIllegalChars(name){
  // disallow slashes, backslashes, control chars; also forbid "." and ".."
  return /[\\\/\x00-\x1F]/.test(name) || name === '.' || name === '..';
}
function splitNameExt(name){
  const i = name.lastIndexOf('.');
  return (i > 0 && i < name.length - 1)
    ? { stem: name.slice(0, i), ext: name.slice(i) }
    : { stem: name, ext: '' };
}
function nextAvailableName(base, used){
  if (!used.has(base)) return base;
  const { stem, ext } = splitNameExt(base);
  let n = 1, cand;
  do { cand = `${stem} (${n++})${ext}`; } while (used.has(cand));
  return cand;
}
async function askName({ title='Name', initial='', placeholder='', validate, selectStem=false } = {}){
  // validation loop
  while (true) {
    const v = await askString({ title, initial, placeholder, selectStem });
    if (v == null) return null;                   // cancelled
    const trimmed = v.trim();
    const err = validate ? (validate(trimmed) || '') : '';
    if (!err) return trimmed;
    await appAlert(err, 'Invalid name');
    initial = trimmed;
  }
}

/* 3) Desktop notification hook ------------------------------------------- */
function notifyDesktop() {
  window.top?.postMessage?.({ type: 'fs-change', rel: pathNow }, '*');
}

/* 4) Elements ------------------------------------------------------------- */
const gridEl     = document.getElementById('grid');
const listViewEl = document.getElementById('listView');
const rowsEl     = document.getElementById('rows');

const addrEl     = document.getElementById('addr');
const searchEl   = document.getElementById('search');
const btnSearch  = document.getElementById('btnSearch');

const btnBack    = document.getElementById('btnBack');
const btnNext    = document.getElementById('btnNext');
const btnUp      = document.getElementById('btnUp');
const toggleView = document.getElementById('toggleView');

const ctxEl      = document.getElementById('ctx');
const contentEl  = document.querySelector('.content');

gridEl.classList.remove('hide');
listViewEl.classList.remove('hide');

/* 5) State --------------------------------------------------------------- */
let pathNow = 'user';         // canonical: home is always 'user'
let history = ['user']; let hIdx = 0;
let selected = null;
let mode = 'grid';            // 'grid' | 'list'

/* 6) Icons --------------------------------------------------------------- */
const ICON_BASE = '../../assets/icons/';
const ICONS = {
  folder: ICON_BASE + 'folder.svg',
  'folder-images': ICON_BASE + 'folder-images.svg',
  'folder-video': ICON_BASE + 'folder-video.svg',
  'folder-text':  ICON_BASE + 'folder-text.svg',
  'folder-games': ICON_BASE + 'folder-games.svg',
  file: ICON_BASE + 'file.svg',
  'file-text': ICON_BASE + 'file-text.svg',
  'file-code': ICON_BASE + 'file-code.svg',
  'file-video': ICON_BASE + 'file-video.svg',
  'file-info': ICON_BASE + 'file-info.svg'
};
function iconForEntry(it){
  if (it.type === 'dir') {
    const n = it.name.toLowerCase();
    if (n.includes('picture') || n.includes('image') || it.rel.endsWith('/Pictures')) return ICONS['folder-images'];
    if (n.includes('video')   || it.rel.endsWith('/Videos'))   return ICONS['folder-video'];
    if (n.includes('document')|| it.rel.endsWith('/Documents'))return ICONS['folder-text'];
    if (n.includes('games')    || it.rel.endsWith('/Games'))    return ICONS['folder-games'];
    return ICONS.folder;
  }
  const ext = (it.ext || '').toLowerCase();
  if (['txt','md','rtf','log'].includes(ext)) return ICONS['file-text'];
  if (['html','htm','css','js','ts','json','py','c','cpp','cs','java','xml','yml','yaml','sh','bat'].includes(ext)) return ICONS['file-code'];
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return ICONS['file-video'];
  return ICONS.file;
}

/* 7) Utils --------------------------------------------------------------- */
function fmtSize(n){ if(!n) return '—'; const u=['B','KB','MB','GB']; let i=0; while(n>1024&&i<u.length-1){n/=1024;i++} return `${n.toFixed(1)} ${u[i]}`; }
function fmtDate(ms){ return new Date(ms).toLocaleString(); }
const dirname = rel => rel.split('/').slice(0,-1).join('/');

// Address bar view ⇄ model conversions
function relToDisplay(rel){
  if (!rel || rel === 'user') return '~';
  return '~\\' + rel.replace(/\//g,'\\');
}
function displayToRel(text){
  let s = text.trim();
  if (!s || s === '~') return 'user';
  s = s.replace(/^~[\\/]/,'').replace(/\\/g,'/');
  return s ? ('user/' + s) : 'user';
}

/* 8) Grid math (absolute tiles) ----------------------------------------- */
const GRID = { cellW: 100, cellH: 110, gapX: 16, gapY: 16, marginX: 24, marginY: 24 };
function gridMetrics() {
  const area = gridEl;
  const w = area.clientWidth, h = area.clientHeight;
  const cols = Math.max(1, Math.floor((w - GRID.marginX * 2 + GRID.gapX) / (GRID.cellW + GRID.gapX)));
  const rows = Math.max(1, Math.floor((h - GRID.marginY * 2 + GRID.gapY) / (GRID.cellH + GRID.gapY)));
  return { w, h, cols, rows };
}
function posForCell(col, row) {
  return {
    x: GRID.marginX + col * (GRID.cellW + GRID.gapX),
    y: GRID.marginY + row * (GRID.cellH + GRID.gapY)
  };
}

/* 9) ORDER persistence (reading-order only) ------------------------------ */
const ORDER_FILE = 'user/Config/explorer-order.json';
const HOME_KEY   = 'user';
const keyFor     = (rel) => (rel && rel !== '' ? rel : HOME_KEY);

async function readOrderDB(){
  try { return JSON.parse(await fs.readText(ORDER_FILE)); }
  catch { return {}; }
}
async function writeOrderDB(db){
  await fs.writeText(ORDER_FILE, JSON.stringify(db, null, 2));
}

/* 10) Canonicalization (normalize all inputs) ---------------------------- */
// Make sure home is ALWAYS 'user' internally
function canonicalize(rel){
  rel = String(rel || '');
  if (!rel) return 'user'; // normalize '' → 'user'

  const id = window.top.Accounts?.getCurrentUserId?.() || 'Guest';
  const mine = `users/${id}`;

  if (rel === 'users' || rel === 'system' || rel.startsWith('system/')) return 'user'; // eject to home
  if (rel === mine) return 'user';
  if (rel.startsWith(mine + '/')) return rel.replace(mine, 'user');
  if (rel.startsWith('users/')) return 'user'; // cross-user → home
  return rel; // already 'user' or 'user/...'
}

/* 11) Directory load + render ------------------------------------------- */
async function load(rel = pathNow){
  rel = canonicalize(rel);
  pathNow = rel;

  // address shows "~" for home
  addrEl.value = relToDisplay(pathNow);

  // search filter
  const query = (searchEl.classList.contains('hide') ? '' : (searchEl.value || '')).toLowerCase();
  const items = (await fs.list(pathNow)).filter(it => it.name.toLowerCase().includes(query));
  selected = null;

  // Apply saved reading-order for this folder (single stable key)
  const k         = keyFor(pathNow);
  const orderDB   = await readOrderDB();
  const saved     = orderDB[k] || [];
  const byRel     = new Map(items.map(i => [i.rel, i]));
  const ordered   = saved.filter(rel => byRel.has(rel));
  const newcomers = items.map(i => i.rel).filter(rel => !saved.includes(rel));
  const viewKeys  = [...ordered, ...newcomers];
  const itemsOrdered = viewKeys.map(rel => byRel.get(rel));

  /* ---- GRID render: absolute tiles positioned from index -------------- */
  gridEl.style.position = 'relative';
  gridEl.innerHTML = '';

  const m = gridMetrics();
  const fromIndex = (i) => ({ col: i % m.cols, row: Math.floor(i / m.cols) });
  const placeAt = (el, i) => {
    const { col, row } = fromIndex(i);
    const p = posForCell(col, row);
    el.style.left = p.x + 'px';
    el.style.top  = p.y + 'px';
    el.dataset.col = col; el.dataset.row = row;
    el.dataset.order = i;
  };

  itemsOrdered.forEach((it, i) => {
    const gi = document.createElement('div');
    gi.className = 'gitem';
    gi.style.position = 'absolute';
    gi.style.width  = GRID.cellW + 'px';
    gi.style.height = GRID.cellH + 'px';
    gi.dataset.key = it.rel;

    gi.innerHTML = `<img src="${iconForEntry(it)}" alt=""><div class="gname">${it.name}</div>`;

    gi.addEventListener('dblclick', () => openItem(it));
    gi.addEventListener('click', () => select(it, gi));
    gi.addEventListener('contextmenu', (e) => showItemMenu(e, it));
    gi.addEventListener('dragstart', (ev) => ev.preventDefault()); // kill native ghost

    // Drag-to-reorder (reading-order only)
    gi.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const rect  = gridEl.getBoundingClientRect();
      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      const DRAG_THRESHOLD = 4;

      // ⬅️ capture current order snapshot
      const tiles      = [...gridEl.children].sort((a,b)=>(a.dataset.order - b.dataset.order));
      const baseKeys   = tiles.map(t => t.dataset.key);
      const byKey      = new Map(tiles.map(t => [t.dataset.key, t]));
      const draggedKey = gi.dataset.key;

      // Grid inner bounds (respect margins)
      const originX = GRID.marginX;
      const originY = GRID.marginY;
      const maxX = gridEl.clientWidth  - GRID.marginX - GRID.cellW;
      const maxY = gridEl.clientHeight - GRID.marginY - GRID.cellH;

      let dragging = false;
      let previewKeys = baseKeys.slice();
      const sx = e.clientX, sy = e.clientY;

      const onMove = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!dragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
          dragging = true;

          // ensure the tile is selected while dragging
          const draggedItem = (typeof itemsOrdered !== 'undefined')
            ? itemsOrdered.find(x => x.rel === draggedKey)
            : null;
          if (draggedItem) select(draggedItem, gi);

          gi.classList.add('dragging');
          gi.style.pointerEvents = 'none';
          gridEl.style.userSelect = 'none';
        }
        if (!dragging) return;

        // follow cursor (centered) within inner bounds
        const mx = ev.clientX - rect.left - GRID.cellW / 2;
        const my = ev.clientY - rect.top  - GRID.cellH / 2;
        const relX = clamp(mx, originX, maxX);
        const relY = clamp(my, originY, maxY);
        gi.style.left = relX + 'px';
        gi.style.top  = relY + 'px';

        // snap to nearest cell center
        const mNow = gridMetrics();
        const col = clamp(Math.round((relX - originX) / (GRID.cellW + GRID.gapX)), 0, mNow.cols - 1);
        const row = clamp(Math.round((relY - originY) / (GRID.cellH + GRID.gapY)), 0, mNow.rows - 1);
        let t = row * mNow.cols + col;
        t = clamp(t, 0, baseKeys.length - 1);

        const others = baseKeys.filter(k => k !== draggedKey);
        const keys = others.slice();
        keys.splice(t, 0, draggedKey);
        previewKeys = keys;

        // live shift others
        keys.forEach((k, i) => {
          if (k === draggedKey) return;
          const el = byKey.get(k);
          if (el) {
            const { x, y } = posForCell(i % mNow.cols, Math.floor(i / mNow.cols));
            el.style.left = x + 'px';
            el.style.top  = y + 'px';
          }
        });

        ev.preventDefault();
      };

      const onUp = async () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        gridEl.style.userSelect = '';
        gi.style.pointerEvents  = '';

        if (!dragging) return;

        // snap dragged tile into final slot, update dataset.order for all
        const finalIndex = previewKeys.indexOf(draggedKey);
        const { x, y } = posForCell(finalIndex % gridMetrics().cols, Math.floor(finalIndex / gridMetrics().cols));
        gi.style.left = x + 'px';
        gi.style.top  = y + 'px';
        gi.classList.remove('dragging');

        previewKeys.forEach((k, i) => {
          const el = byKey.get(k);
          if (el) el.dataset.order = i;
        });

        // persist reading-order under stable key
        const db = await readOrderDB();
        const k = keyFor(pathNow);
        db[k] = previewKeys;
        await writeOrderDB(db);
      };

      document.addEventListener('mousemove', onMove, { passive:false });
      document.addEventListener('mouseup', onUp, { once:true });
      e.preventDefault();
    });

    gridEl.appendChild(gi);
    placeAt(gi, i); // initial position based on index
  });

  /* ---- LIST render (independent; leave alphabetic) -------------------- */
  rowsEl.innerHTML = '';
  items.forEach(it => {
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div class="c name"><span class="icon"><img src="${iconForEntry(it)}" alt=""></span>${it.name}</div>
      <div class="c type">${it.type === 'dir' ? 'Folder' : (it.ext || 'File')}</div>
      <div class="c size">${it.type === 'dir' ? '' : fmtSize(it.size)}</div>
      <div class="c date">${fmtDate(it.mtime)}</div>
    `;
    row.addEventListener('dblclick', () => openItem(it));
    row.addEventListener('click', () => select(it, row));
    row.addEventListener('contextmenu', (e) => showItemMenu(e, it));
    rowsEl.appendChild(row);
  });

  applyMode();
  setToolbarState();                      // reflect disabled Up at home
  requestAnimationFrame(ensureGridLayout); // ensure absolute positions
}

/* 12) View mode + relayout guards --------------------------------------- */
function applyMode(){
  if (mode === 'grid') {
    listViewEl.style.display = 'none';
    gridEl.style.display = 'block';
    gridEl.style.position = 'relative';
    requestAnimationFrame(ensureGridLayout);
  } else {
    gridEl.style.display = 'none';
    listViewEl.style.display = 'block';
  }
}
toggleView.onclick = () => { mode = (mode === 'grid' ? 'list' : 'grid'); applyMode(); };
window.addEventListener('resize', ensureGridLayout);

// Recompute absolute positions using current columns and stored order
function ensureGridLayout(){
  if (mode !== 'grid') return;
  const m = gridMetrics(); // recalc columns
  const tiles = [...gridEl.children].sort((a,b)=> (a.dataset.order - b.dataset.order));
  tiles.forEach((el, i) => {
    const { col, row } = { col: i % m.cols, row: Math.floor(i / m.cols) };
    const p = posForCell(col, row);
    el.style.left = p.x + 'px';
    el.style.top  = p.y + 'px';
    el.dataset.col = col; el.dataset.row = row; el.dataset.order = i;
  });
}

/* Safety: never leave dashed outlines hanging if the window loses focus */
window.addEventListener('blur', () => {
  document.querySelectorAll('.gitem.dragging').forEach(n => n.classList.remove('dragging'));
});

/* 13) Select / open ------------------------------------------------------ */
function select(it, el){
  selected = it;
  [...rowsEl.children].forEach(r => r.classList.remove('sel'));
  [...gridEl.children].forEach(r => r.classList.remove('sel'));
  if (el) el.classList.add('sel');
}
async function openItem(it){
  if (it.type === 'dir') { pushHistory(it.rel); await load(it.rel); }
  else if (['txt','md','rtf','log'].includes((it.ext||'').toLowerCase())) {
    window.top.postMessage({ type: 'open-notepad', rel: it.rel }, '*');
  } else {
    await fs.openExternal(it.rel);
  }
}

/* 14) History + toolbar -------------------------------------------------- */
function pushHistory(rel){ history = history.slice(0, hIdx+1); history.push(canonicalize(rel)); hIdx++; }
const navTo = async (rel) => { pushHistory(rel); await load(rel); };
btnBack.onclick = async () => { if (hIdx>0){ hIdx--; await load(history[hIdx]); } };
btnNext.onclick = async () => { if (hIdx<history.length-1){ hIdx++; await load(history[hIdx]); } };

// Up stops at 'user'
btnUp.onclick = async () => {
  if (pathNow === 'user') return; // hard-stop at home
  const up = pathNow.includes('/') ? pathNow.slice(0, pathNow.lastIndexOf('/')) : 'user';
  pushHistory(up);
  await load(up);
};

function setToolbarState(){
  const atHome = (pathNow === 'user');
  btnUp.disabled = atHome;
  btnUp.setAttribute('aria-disabled', atHome ? 'true' : 'false');
}

/* 15) Address bar -------------------------------------------------------- */
addrEl.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const rel = displayToRel(addrEl.value);
    try {
      await fs.list(rel);                  // will throw on forbidden
      pushHistory(rel);
      await load(rel);
    } catch (err) {
      await appAlert('Access denied or path not found.', 'Cannot open');
      addrEl.value = relToDisplay(pathNow);
    }
  }
});

/* 16) Search (collapsible) ----------------------------------------------- */
btnSearch.addEventListener('click', (e) => {
  e.stopPropagation();
  searchEl.classList.toggle('hide');
  if (!searchEl.classList.contains('hide')) { searchEl.focus(); searchEl.select(); }
});
searchEl.addEventListener('input', () => load(pathNow));
document.addEventListener('click', (e) => {
  if (e.target === searchEl) return;
  if (!searchEl.classList.contains('hide')) {
    searchEl.classList.add('hide');
    searchEl.value = '';
    load(pathNow);
  }
});

/* 17) Context menus ------------------------------------------------------ */
function buildMenuHTML(items){
  return items.map(it=>{
    if (it.k==='sep') return `<div class="sep"></div>`;
    return `<div class="mi ${it.danger?'danger':''}" data-k="${it.k}">${it.label}</div>`;
  }).join('');
}
function positionContextMenu(ev) {
  ctxEl.classList.remove('hide');
  ctxEl.style.left = ev.clientX + 'px';
  ctxEl.style.top  = ev.clientY + 'px';
  const r  = ctxEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (r.right > vw)  ctxEl.style.left = Math.max(8, vw - r.width  - 8) + 'px';
  if (r.bottom > vh) ctxEl.style.top  = Math.max(8, vh - r.height - 8) + 'px';
}

/* Item menu */
function showItemMenu(ev, item){
  ev.preventDefault();
  select(item, ev.currentTarget);

  const items = [];
  if (item.type === 'dir') items.push({k:'open', label:'Open'});
  else {
    if (['txt','md','rtf','log'].includes((item.ext||'').toLowerCase())) items.push({k:'edit', label:'Open in Notepad'});
    else items.push({k:'open', label:'Open'});
  }
  items.push({k:'rename', label:'Rename'});

  const ext = (item.ext || '').toLowerCase();
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) items.push({k:'wall', label:'Set as wallpaper'});

  items.push({k:'delete', label:'Delete', danger:true});
  items.push({k:'sep'});
  items.push({k:'newFolder', label:'New folder'});
  items.push({k:'newTxt',    label:'New text file'});

  ctxEl.innerHTML = buildMenuHTML(items);
  positionContextMenu(ev);
}

/* Background (empty area) menu */
function showBlankMenu(ev){
  ev.preventDefault();
  selected = null;
  [...rowsEl.children].forEach(r => r.classList.remove('sel'));
  [...gridEl.children].forEach(r => r.classList.remove('sel'));

  const items = [
    {k:'newFolder', label:'New folder'},
    {k:'newTxt',    label:'New text file'}
  ];
  ctxEl.innerHTML = buildMenuHTML(items);
  positionContextMenu(ev);
}

/* Show background menu when not clicking a row/tile */
contentEl.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.gitem') || e.target.closest('.row')) return;
  showBlankMenu(e);
});

// Left-click blank area clears selection (matches Desktop)
contentEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (e.target.closest('.gitem') || e.target.closest('.row')) return;
  selected = null;
  [...rowsEl.children].forEach(r => r.classList.remove('sel'));
  [...gridEl.children].forEach(r => r.classList.remove('sel'));
});

// Esc clears selection
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  selected = null;
  [...rowsEl.children].forEach(r => r.classList.remove('sel'));
  [...gridEl.children].forEach(r => r.classList.remove('sel'));
});

/* Close menu on click elsewhere */
document.addEventListener('click', () => ctxEl.classList.add('hide'));

/* Single click handler for all ctx actions */
ctxEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-k]');
  if (!btn) return;
  const k = btn.dataset.k;
  ctxEl.classList.add('hide');

  try {
    if (k === 'newFolder')  return await doNewFolder();
    if (k === 'newTxt')     return await doNewTextFile();

    if (!selected) return;
    const it = selected;

    if (k === 'open')       return openItem(it);
    if (k === 'edit')       return window.top.postMessage({ type:'open-notepad', rel: it.rel }, '*');
    if (k === 'rename')     return await doRename(it);
    if (k === 'delete')     return await doDelete(it);
    if (k === 'wall')       return window.top.postMessage({ type:'set-wallpaper', rel: it.rel }, '*');
  } catch (err) {
     await appAlert(err.message || String(err) || 'Operation failed.', 'Error');
  }
});

/* 18) File ops (with desktop notify) ------------------------------------- */
async function doNewFolder() {
  const entries = await fs.list(pathNow || 'user');
  const used = new Set(entries.map(e => e.name));
  const initial = nextAvailableName('New Folder', used);

  const name = await askName({
    title: 'Folder name',
    initial,
    validate: (v) => {
      if (!v) return 'Please enter a name.';
      if (hasIllegalChars(v)) return 'Invalid characters.';
      return '';
    }
  });
  if (!name) return;

  const finalName = used.has(name) ? nextAvailableName(name, used) : name;
  const rel = pathNow ? `${pathNow}/${finalName}` : `user/${finalName}`;

  await fs.createFolder(rel);

  // append new item at end of reading-order (stable key)
  const db = await readOrderDB();
  const k = keyFor(pathNow);
  db[k] = (db[k] || []).concat(rel);
  await writeOrderDB(db);

  await load(pathNow);
  notifyDesktop();
}

async function doNewTextFile() {
  const entries = await fs.list(pathNow || 'user');
  const used = new Set(entries.map(e => e.name));
  const initial = nextAvailableName('New Text File.txt', used);

  const name = await askName({
    title: 'File name',
    initial,
    validate: (v) => {
      if (!v) return 'Please enter a name.';
      if (hasIllegalChars(v)) return 'Invalid characters.';
      return '';
    }
  });
  if (!name) return;

  const finalName = used.has(name) ? nextAvailableName(name, used) : name;
  const rel = pathNow ? `${pathNow}/${finalName}` : `user/${finalName}`;
  await fs.writeText(rel, '');

  // append new item at end of reading-order (stable key)
  const db = await readOrderDB();
  const k = keyFor(pathNow);
  db[k] = (db[k] || []).concat(rel);
  await writeOrderDB(db);

  await load(pathNow);
  notifyDesktop();
}

async function doRename(it) {
  const dir = it.rel.includes('/') ? it.rel.slice(0, it.rel.lastIndexOf('/')) : 'user';
  const entries = await fs.list(dir);
  const used = new Set(entries.map(e => e.name));
  used.delete(it.name); // allow keeping same name

  const nn = await askName({
    title: 'Rename to:',
    initial: it.name,
    selectStem: true,
    validate: (v) => {
      if (!v) return 'Please enter a name.';
      if (hasIllegalChars(v)) return 'Invalid characters.';
      return '';
    }
  });
  if (!nn || nn === it.name) return;

  const finalName = used.has(nn) ? nextAvailableName(nn, used) : nn;
  const to = dir ? `${dir}/${finalName}` : `user/${finalName}`;

  // update reading-order key (rel path) if directory segment changes
  const db = await readOrderDB();
  const k = keyFor(pathNow);
  const list = db[k] || [];
  const idx = list.indexOf(it.rel);

  await fs.renameOrMove(it.rel, to);

  if (idx !== -1) { list[idx] = to; db[k] = list; await writeOrderDB(db); }

  await load(pathNow);
  notifyDesktop();
}

async function doDelete(it) {
  const ok = await askConfirm(`Delete "${it.name}"?`);
  if (!ok) return;
  await fs.delete(it.rel);

  // remove from reading-order
  const db = await readOrderDB();
  const k = keyFor(pathNow);
  const list = db[k] || [];
  db[k] = list.filter(x => x !== it.rel);
  await writeOrderDB(db);

  await load(pathNow);
  notifyDesktop();
}

/* 19) Sidebar quick links ------------------------------------------------ */
document.querySelectorAll('.sitem').forEach(b => b.addEventListener('click', () => navTo(b.dataset.goto)));

/* 20) Boot --------------------------------------------------------------- */
const startPath = canonicalize(new URLSearchParams(location.search).get('path') || 'user');
history = [startPath]; hIdx = 0;
load(startPath);
