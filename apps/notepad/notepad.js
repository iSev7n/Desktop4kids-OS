/* ==========================================================
   Notepad — Menubar Edition
   ----------------------------------------------------------
   Sections
   0) Wiring + state
   1) File I/O (open, save, save-as)
   2) Editor behavior (line #, wrap, zoom, status)
   3) Find / Replace
   4) Menubar + dropdowns
   5) Shortcuts
   6) Window integration (close guard)
   7) Optional: Font dialog
   ========================================================== */

/* 0) Wiring + state ------------------------------------------------------ */
const fs = window.top.fsAPI;
const $  = (s) => document.querySelector(s);
window.__appCloseGuard = true;

const params = new URLSearchParams(location.search);
let rel        = params.get('file') || '';
let original   = '';
let dirty      = false;
let wrapOn     = true;
let zoomPct    = 100;
let eol        = 'LF';
let encoding   = 'UTF-8';
let statusOn   = true;

const ed   = $('#editor');
const gut  = $('#gutter');
const lbl  = $('#fileName');
const dot  = $('#dirty');
const statL= $('#statLeft');
const statR= $('#statRight');

function setTitleFromRel(){ lbl.textContent = rel ? rel.split('/').pop() : 'Untitled'; }
function detectEOL(str){ return /\r\n/.test(str) ? 'CRLF' : 'LF'; }

async function boot(){
  setTitleFromRel();
  if (rel) { try { original = await fs.readText(rel); } catch {} }
  eol = detectEOL(original);
  ed.value = original;
  updateDirty(false);
  updateGutter();
  updateStatus();
  applyWrap(true);
  applyZoom(0, true);
  restoreFontPrefs();
}
boot();

/* 1) File I/O ------------------------------------------------------------ */
function defaultSaveDir(){ return (rel && rel.includes('/')) ? rel.slice(0, rel.lastIndexOf('/')) : 'user/Documents'; }

async function save(){
  if (!rel) return saveAs();
  await fs.writeText(rel, ed.value);
  original = ed.value;
  updateDirty(false);
  window.top.postMessage({ type:'fs-change', rel }, '*');
}

async function saveAs(){
  const dir = defaultSaveDir();
  const ask = window.top.askName || null;
  const name = ask
    ? await ask({ title:'Save As', initial:'Untitled.txt', placeholder:'File name' })
    : (prompt('Save As (name only):','Untitled.txt')||null);
  if (!name) return;
  const dest = `${dir}/${name}`;
  await fs.writeText(dest, ed.value);
  rel = dest;
  original = ed.value;
  setTitleFromRel();
  updateDirty(false);
  window.top.postMessage({ type:'fs-change', rel: dest }, '*');
}

/* 2) Editor behavior ----------------------------------------------------- */
function updateDirty(v = (ed.value !== original)){ dirty = !!v; dot.classList.toggle('hide', !dirty); }

function updateGutter(){
  const lines = ed.value.split('\n').length || 1;
  let out=''; for (let i=1;i<=lines;i++) out += i + '\n';
  gut.textContent = out;
  gut.scrollTop = ed.scrollTop;
}

function caretPos(){
  const pos = ed.selectionStart || 0;
  const textUpto = ed.value.slice(0, pos);
  const ln = (textUpto.match(/\n/g)?.length || 0) + 1;
  const col= pos - (textUpto.lastIndexOf('\n') + 1);
  return { ln, col };
}
function updateStatus(){
  const { ln, col } = caretPos();
  statL.textContent = `${eol} • ${encoding}`;
  statR.textContent = `Ln ${ln}, Col ${col} • ${ed.value.length} chars`;
}

function applyWrap(init=false){
  ed.setAttribute('wrap', wrapOn ? 'soft' : 'off');
  if (!init) updateStatus();
}

function applyZoom(delta, absolute=false){
  zoomPct = absolute ? Math.max(50, Math.min(300, (delta || 100))) : Math.max(50, Math.min(300, zoomPct + delta));
  ed.style.fontSize = (14 * zoomPct / 100) + 'px';
}

function setStatusBar(on){
  statusOn = !!on;
  document.body.classList.toggle('no-status', !statusOn);
}

/* keep gutter aligned even after zoom/font change */
new ResizeObserver(() => gut.scrollTop = ed.scrollTop).observe(ed);

/* 3) Find / Replace ------------------------------------------------------ */
const findUI = $('#findPanel');
const findQ  = $('#findQ');
const replaceQ = $('#replaceQ');
const optCase = $('#optCase');
const optWord = $('#optWord');
const optRegex= $('#optRegex');
let lastFind = { q:'', dir:1 };

function showFind(replacing=false){
  findUI.classList.remove('hide'); findUI.setAttribute('aria-hidden','false');
  replacing ? null : replaceQ.parentElement.parentElement.classList.add('hide');
  if (replacing) replaceQ.parentElement.parentElement.classList.remove('hide');
  if (ed.selectionStart !== ed.selectionEnd) findQ.value = ed.value.slice(ed.selectionStart, ed.selectionEnd);
  findQ.focus();
}
function hideFind(){ findUI.classList.add('hide'); findUI.setAttribute('aria-hidden','true'); }

function getFlags(){ return optCase.checked ? 'g' : 'gi'; }
function rxFor(q){
  if (optRegex.checked){ try { return new RegExp(q, getFlags()); } catch { return null; } }
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(optWord.checked ? `\\b${esc}\\b` : esc, getFlags());
}
function findNext(dir=1){
  const q = findQ.value; if (!q) return;
  lastFind = { q, dir };
  const rx = rxFor(q); if (!rx) return;
  const text = ed.value;
  const start = dir>0 ? ed.selectionEnd : ed.selectionStart;
  let m;
  if (dir>0){
    rx.lastIndex = start; m = rx.exec(text); if (!m){ rx.lastIndex = 0; m = rx.exec(text); }
  } else {
    const up = text.slice(0, Math.max(0, start-1)); let last=null; while ((m=rx.exec(up))) last = m; m = last;
  }
  if (m){ ed.focus(); ed.selectionStart=m.index; ed.selectionEnd=m.index+m[0].length; updateStatus(); }
}
function replaceOne(){
  if (ed.selectionStart === ed.selectionEnd){ findNext(1); return; }
  const rep = replaceQ.value ?? '';
  const before = ed.value.slice(0, ed.selectionStart);
  const after  = ed.value.slice(ed.selectionEnd);
  ed.value = before + rep + after;
  const pos = before.length + rep.length;
  ed.selectionStart = ed.selectionEnd = pos;
  updateDirty(true); updateGutter(); updateStatus(); findNext(1);
}
function replaceAll(){
  const q = findQ.value; const rx = rxFor(q); if (!q || !rx) return;
  const rep = replaceQ.value ?? '';
  ed.value = ed.value.replace(rx, rep);
  updateDirty(true); updateGutter(); updateStatus();
}

/* 4) Menubar + dropdowns ------------------------------------------------- */
const MENUS = {
  file: (ctx)=> [
    { label:'New', accel:'Ctrl+N', action: ()=> window.top.postMessage({ type:'open-notepad', rel:'' }, '*') },
    { label:'Open', accel:'Ctrl+O', action: ()=>{
    const dir = (rel && rel.includes('/')) ? rel.slice(0, rel.lastIndexOf('/')) : 'user/Documents';
    // Ask the desktop to open Explorer at a specific path
    window.top.postMessage({ type:'open-explorer', pathRel: dir }, '*');
  }},
    { label:'Save', accel:'Ctrl+S', action: save },
    { label:'Save As…', accel:'Ctrl+Shift+S', action: saveAs },
    'sep',
    { label:'Close', accel:'Esc', action: requestClose }
  ],
  edit: (ctx)=> [
    { label:'Undo', accel:'Ctrl+Z', action: ()=> document.execCommand('undo') },
    { label:'Redo', accel:'Ctrl+Y', action: ()=> document.execCommand('redo') },
    'sep',
    { label:'Find…', accel:'Ctrl+F', action: ()=> showFind(false) },
    { label:'Replace…', accel:'Ctrl+H', action: ()=> showFind(true) },
    { label:'Go to…', accel:'Ctrl+G', action: gotoLine },
    'sep',
    { label:'Select All', accel:'Ctrl+A', action: ()=> { ed.select(); } },
    { label:'Time/Date', accel:'F5', action: insertDateTime }
  ],
  view: (ctx)=> [
    { label:'Word Wrap', check:true, checked: wrapOn, accel:'Ctrl+W',
      action: ()=> { wrapOn = !wrapOn; applyWrap(); } },
    'sep',
    { label:'Zoom In', accel:'Ctrl++', action: ()=> applyZoom(+10) },
    { label:'Zoom Out', accel:'Ctrl+-', action: ()=> applyZoom(-10) },
    { label:'Reset Zoom', accel:'Ctrl+0', action: ()=> applyZoom(100, true) },
    'sep',
    { label:'Status Bar', check:true, checked: statusOn,
      action: ()=> setStatusBar(!statusOn) }
  ],
  format: (ctx)=> [
    { label:'Font…', action: showFontDialog }
  ]
};

const menubar = $('#menubar');
let openMenu = null;

menubar.addEventListener('click', (e)=>{
  const root = e.target.closest('.mroot'); if (!root) return;
  const id = root.dataset.menu;
  toggleMenu(root, MENUS[id]?.({}) || []);
});

document.addEventListener('mousedown', (e)=>{ if (openMenu && !openMenu.contains(e.target) && !menubar.contains(e.target)) closeMenus(); });
window.addEventListener('resize', closeMenus);

function closeMenus(){
  openMenu?.remove(); openMenu = null;
  menubar.querySelectorAll('.mroot[aria-expanded="true"]').forEach(b=> b.setAttribute('aria-expanded','false'));
}

function toggleMenu(root, items){
  if (root.getAttribute('aria-expanded') === 'true'){ closeMenus(); return; }
  closeMenus();

  const menu = renderMenu(items);
  menu.style.visibility = 'hidden';
  document.body.appendChild(menu);

  placeMenu(menu, root);
  menu.style.visibility = '';

  root.setAttribute('aria-expanded','true');
  openMenu = menu;
}

function renderMenu(items){
  const m = document.createElement('div');
  m.className = 'menu-popup';
  for (const it of items){
    if (it === 'sep'){ const sep = document.createElement('div'); sep.className='menu-sep'; m.appendChild(sep); continue; }
    const btn = document.createElement('button');
    btn.className = 'menu-item';
    if (it.check){ btn.setAttribute('aria-checked', it.checked ? 'true':'false'); }
    btn.innerHTML = `<span class="label">${it.label}</span><span class="accel">${it.accel||''}</span>`;
    btn.onclick = () => { it.action?.(); closeMenus(); };
    m.appendChild(btn);
  }
  // basic keyboard nav
  m.tabIndex = 0;
  m.addEventListener('keydown', (e)=>{
    const items = [...m.querySelectorAll('.menu-item')];
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown'){ e.preventDefault(); (items[idx+1]||items[0]).focus(); }
    if (e.key === 'ArrowUp'){ e.preventDefault(); (items[idx-1]||items[items.length-1]).focus(); }
    if (e.key === 'Escape'){ e.preventDefault(); closeMenus(); }
    if (e.key === 'Enter' && document.activeElement.classList.contains('menu-item')){ document.activeElement.click(); }
  });
  // focus first item on open
  setTimeout(()=> m.querySelector('.menu-item')?.focus(), 0);
  return m;
}

function placeMenu(menu, root){
  const pad = 8;
  const r = root.getBoundingClientRect();

  // If menu is wider than viewport, clamp width first
  const vw = window.innerWidth;
  if (menu.offsetWidth > vw - pad*2) {
    menu.style.width = (vw - pad*2) + 'px';
  }
  const w = menu.offsetWidth;

  // Default: left-align to root; if it spills right, right-align to root
  let left = Math.round(r.left);
  const wouldOverflowRight = left + w + pad - vw > 0;
  if (wouldOverflowRight) left = Math.round(r.right - w);

  // Final clamps
  if (left < pad) left = pad;
  if (left + w > vw - pad) left = vw - pad - w;

  menu.style.left = left + 'px';
  menu.style.top  = Math.round(r.bottom + 6) + 'px';
}

/* 5) Shortcuts ----------------------------------------------------------- */
function gotoLine(){
  const ask = window.top.askName || null;
  let v;
  if (ask){ v = awaiter(ask({ title:'Go to line', initial:'1', placeholder:'Line #' })); }
  else { v = prompt('Go to line:', '1'); }
  const n = Math.max(1, parseInt(v || '1', 10) || 1);
  const lines = ed.value.split('\n');
  let idx = 0; for (let i=0;i<Math.min(n-1, lines.length-1);i++) idx += lines[i].length + 1;
  ed.focus(); ed.selectionStart = ed.selectionEnd = idx; updateStatus();
}
function insertDateTime(){
  const s = new Date().toLocaleString();
  const before = ed.value.slice(0, ed.selectionStart);
  const after  = ed.value.slice(ed.selectionEnd);
  ed.value = before + s + after;
  const pos = before.length + s.length;
  ed.selectionStart = ed.selectionEnd = pos;
  updateDirty(true); updateGutter(); updateStatus();
}

function awaiter(x){ return (x && typeof x.then === 'function') ? x : Promise.resolve(x); }

document.addEventListener('keydown', (e)=>{
  // Save / Save As / New / Open
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 's'){ e.preventDefault(); save(); }
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's'){ e.preventDefault(); saveAs(); }
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'n'){ e.preventDefault(); window.top.postMessage({ type:'open-notepad', rel:'' }, '*'); }
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'o'){ e.preventDefault(); window.top.postMessage({ type:'open-app', id:'files' }, '*'); }
  // Find/Replace/Goto
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'f'){ e.preventDefault(); showFind(false); }
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'h'){ e.preventDefault(); showFind(true); }
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'g'){ e.preventDefault(); gotoLine(); }
  // Next/Prev
  if (!e.ctrlKey && !e.shiftKey && e.key === 'F3'){ e.preventDefault(); findNext(1); }
  if (!e.ctrlKey && e.shiftKey && e.key === 'F3'){ e.preventDefault(); findNext(-1); }
  // Wrap
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'w'){ e.preventDefault(); wrapOn = !wrapOn; applyWrap(); }
  // Zoom
  if (e.ctrlKey && (e.key === '=' || e.key === '+')){ e.preventDefault(); applyZoom(+10); }
  if (e.ctrlKey && e.key === '-'){ e.preventDefault(); applyZoom(-10); }
  if (e.ctrlKey && e.key === '0'){ e.preventDefault(); applyZoom(100, true); }
  // Status toggle shortcut (Alt+S)
  if (e.altKey && e.key.toLowerCase() === 's'){ e.preventDefault(); setStatusBar(!statusOn); }
  // Date/Time (F5)
  if (!e.ctrlKey && !e.shiftKey && e.key === 'F5'){ e.preventDefault(); insertDateTime(); }
  // Close
  if (!e.ctrlKey && e.key === 'Escape'){ e.preventDefault(); requestClose(); }
});

ed.addEventListener('scroll', () => gut.scrollTop = ed.scrollTop);
ed.addEventListener('input', () => { updateDirty(true); updateGutter(); updateStatus(); eol = /\r\n/.test(ed.value)?'CRLF':'LF'; });
ed.addEventListener('click', updateStatus);
ed.addEventListener('keyup',  updateStatus);

/* 6) Window integration -------------------------------------------------- */
async function requestClose(){
  if (!dirty) { window.top.postMessage({ type:'close-active-window' }, '*'); return; }
  const ask = window.top.askConfirm || null;
  const ok = ask ? await ask(`You have unsaved changes to “${lbl.textContent}”.\nClose without saving?`) : confirm('Close without saving?');
  if (ok) window.top.postMessage({ type:'close-active-window' }, '*');
}

window.addEventListener('message', async (e) => {
  if (e.data?.type !== 'app-close-request') return;

  if (!dirty) {
    // No unsaved changes — allow close
    window.parent.postMessage({ type: 'app-close-decision', ok: true }, '*');
    return;
  }

  // Ask user to confirm discarding changes
  const title = (lbl?.textContent || 'Untitled').trim();
  const ask = window.top?.askConfirm; // use desktop dialog if available
  const ok = ask
    ? await ask(`You have unsaved changes to “${title}”.\nClose without saving?`)
    : confirm(`You have unsaved changes to "${title}". Close without saving?`);

  window.parent.postMessage({ type: 'app-close-decision', ok: !!ok }, '*');
});

/* 7) Font dialog --------------------------------------------------------- */
function restoreFontPrefs(){
  try{
    const p = JSON.parse(localStorage.getItem('np.font') || '{}');
    if (p.family) ed.style.fontFamily = p.family;
    if (p.size)   ed.style.fontSize   = p.size + 'px';
    if (p.lh)     ed.style.lineHeight = p.lh;
  }catch{}
}
function saveFontPrefs(p){
  localStorage.setItem('np.font', JSON.stringify(p));
}
function showFontDialog(){
  const wrap = document.createElement('div');
  wrap.className = 'menu-popup'; // reuse style
  wrap.style.left = '12px'; wrap.style.top = '56px'; wrap.style.minWidth='320px';

  const p = JSON.parse(localStorage.getItem('np.font') || '{}');
  const fam = p.family || 'var(--mono)';
  const size= p.size   || parseInt(getComputedStyle(ed).fontSize) || 14;
  const lh  = p.lh     || getComputedStyle(ed).lineHeight || '1.5';

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;">
      <label style="color:var(--muted);font:13px var(--sans);">Family</label>
      <select id="fFam" style="height:28px;border:1px solid var(--btnb);background:#0f131c;color:#fff;border-radius:8px;padding:0 8px;">
        <option value="var(--mono)">Monospace</option>
        <option value="var(--sans)">Sans-serif</option>
        <option value="serif">Serif</option>
      </select>
      <label style="color:var(--muted);font:13px var(--sans);">Size</label>
      <input id="fSize" type="number" min="8" max="48" value="${size}" style="height:28px;border:1px solid var(--btnb);background:#0f131c;color:#fff;border-radius:8px;padding:0 8px;">
      <label style="color:var(--muted);font:13px var(--sans);">Line height</label>
      <input id="fLh" type="text" value="${lh}" placeholder="e.g. 1.5 or 22px" style="height:28px;border:1px solid var(--btnb);background:#0f131c;color:#fff;border-radius:8px;padding:0 8px;">
      <div></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">
        <button id="fCancel" class="menu-item" style="width:auto;">Cancel</button>
        <button id="fOK" class="menu-item" style="width:auto;">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const fFam  = wrap.querySelector('#fFam');
  const fSize = wrap.querySelector('#fSize');
  const fLh   = wrap.querySelector('#fLh');
  fFam.value = fam;

  function close(){ wrap.remove(); }
  wrap.querySelector('#fCancel').onclick = close;
  wrap.querySelector('#fOK').onclick = ()=>{
    const fam = fFam.value;
    const size= Math.max(8, Math.min(48, parseInt(fSize.value,10)||14));
    const lh  = fLh.value.trim() || '1.5';
    ed.style.fontFamily = fam;
    ed.style.fontSize   = size + 'px';
    ed.style.lineHeight = lh;
    saveFontPrefs({ family:fam, size, lh });
    close();
  };

  // dismiss on outside click
  const onDoc = (e)=>{ if(!wrap.contains(e.target)) { wrap.remove(); document.removeEventListener('mousedown', onDoc, true);} };
  document.addEventListener('mousedown', onDoc, true);
}
