/* ==========================================================
   Desktop4Kids — Paint (fit canvas, no scroll at 100%)
   - Canvas always fits the visible stage at 100% zoom
   - Scrollbars appear only when zoom > 1
   - Top-bar settings; simple & consistent
========================================================== */
'use strict';

/* Theme sync */
try {
  const t = window.top?.document?.documentElement?.getAttribute('data-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch {}
window.addEventListener('message', (e) => {
  if (e?.data?.type === 'theme' && e.data.theme) {
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
});

/* ---------- Themed dialogs ---------- */

const askConfirm = (message = 'Are you sure?', title = 'Confirm') => {
  if (window.top?.askConfirm) return window.top.askConfirm(message, title);
  // Fallback styled like system dialogs
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap';
    wrap.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true">
        <div class="dlg-title">${title}</div>
        <div class="dlg-body"><div>${message}</div></div>
        <div class="dlg-actions">
          <button data-k="cancel" class="secondary">Cancel</button>
          <button data-k="ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const ok = wrap.querySelector('[data-k="ok"]');
    const no = wrap.querySelector('[data-k="cancel"]');
    const close = (v)=>{ wrap.remove(); resolve(!!v); };
    wrap.addEventListener('mousedown',(e)=>{ if(e.target===wrap) e.preventDefault(); }, true);
    ok.onclick = ()=> close(true);
    no.onclick = ()=> close(false);
    wrap.addEventListener('keydown',(e)=>{ if(e.key==='Escape') close(false); if(e.key==='Enter') close(true); }, true);
    setTimeout(()=> ok.focus(), 0);
  });
};

// Optional toast-ish notice hook (kept for parity)
const showNotice = (msg, title = 'Notice') =>
  window.top?.showAlert ? window.top.showAlert(msg, title) : alert(`${title}\n\n${msg}`);

/* DOM */
const viewport = document.getElementById('viewport');
const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d', { willReadFrequently: true });
const stage    = document.querySelector('.stage');

const toolBrush  = document.getElementById('toolBrush');
const toolEraser = document.getElementById('toolEraser');
const toolLine   = document.getElementById('toolLine');
const toolRect   = document.getElementById('toolRect');
const toolFill   = document.getElementById('toolFill');
const toolPicker = document.getElementById('toolPicker');

const colorInp = document.getElementById('color');
const hexInp   = document.getElementById('hex');
const sizeInp  = document.getElementById('size');
const sizeVal  = document.getElementById('sizeVal');
const alphaInp = document.getElementById('alpha');
const alphaVal = document.getElementById('alphaVal');

const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const newBtn  = document.getElementById('newDoc');
const resizeBtn = document.getElementById('resizeDoc');
const saveBtn = document.getElementById('save');
const fmtSel  = document.getElementById('format');

const zIn   = document.getElementById('zIn');
const zOut  = document.getElementById('zOut');
const zReset= document.getElementById('zReset');

const sizePreview = document.getElementById('sizePreview');

/* State */
const state = {
  tool: 'brush',
  color: '#2dd4bf',
  alpha: 1,
  size: 14,
  down: false,
  last: null,
  tmpStart: null,
  snapshot: null,
  undo: [],
  redo: [],
  maxUndo: 50,
  zoom: 1,          // 1 = fit (no scroll)
  panning: false,
  panSx: 0, panSy: 0,
  panLeft: 0, panTop: 0,
  cw: 0, ch: 0,     // logical canvas pixels (match viewport at 100%)
};

/* Utils */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dpr = () => Math.max(1, window.devicePixelRatio || 1);

/* Fit canvas to viewport (bitmap resizes but image preserved/scaled) */
function fitCanvasToViewport(preserve = true){
  const rect = viewport.getBoundingClientRect();
  const w = Math.max(200, Math.floor(rect.width));
  const h = Math.max(150, Math.floor(rect.height));

  const scale = dpr();
  let prev = null;
  if (preserve && canvas.width && canvas.height){
    prev = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  canvas.width  = Math.round(w * scale);
  canvas.height = Math.round(h * scale);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';

  // logical size equals viewport at 100%
  state.cw = w; state.ch = h;

  if (prev){
    const pw = prev.width / scale, ph = prev.height / scale;
    const c = document.createElement('canvas');
    c.width = prev.width; c.height = prev.height;
    c.getContext('2d').putImageData(prev, 0, 0);
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(c, 0, 0, pw, ph, 0, 0, w, h); // scale to new fit
  }

  applyZoom(); // keep scrolling mode correct
}

/* Toolbar */
function setTool(name){
  state.tool = name;
  document.querySelectorAll('.tool').forEach(b=>b.classList.remove('active'));
  ({brush:toolBrush, eraser:toolEraser, line:toolLine, rect:toolRect, fill:toolFill, picker:toolPicker}[name])?.classList.add('active');
}
function setColor(c){ state.color=c; colorInp.value=c; hexInp.value=c.toLowerCase(); }
function setSize(v){ state.size=+v; sizeVal.textContent=v; }
function setAlpha(a){ state.alpha=+a; alphaVal.textContent=(+a).toFixed(2); }

/* Undo/Redo */
function pushUndo(){
  try{
    const snap = ctx.getImageData(0,0,canvas.width,canvas.height);
    state.undo.push(snap);
    if (state.undo.length > state.maxUndo) state.undo.shift();
  }catch{}
}
function doUndo(){
  if (!state.undo.length) return;
  const cur = ctx.getImageData(0,0,canvas.width,canvas.height);
  state.redo.push(cur);
  ctx.putImageData(state.undo.pop(),0,0);
}
function doRedo(){
  if (!state.redo.length) return;
  const cur = ctx.getImageData(0,0,canvas.width,canvas.height);
  state.undo.push(cur);
  ctx.putImageData(state.redo.pop(),0,0);
}

/* Drawing */
function beginStroke(x,y){
  pushUndo();
  state.down = true;
  state.last = {x,y};
  if (state.tool==='line' || state.tool==='rect'){
    state.tmpStart = {x,y};
    state.snapshot = ctx.getImageData(0,0,canvas.width,canvas.height);
  }
}
function endStroke(){
  state.down = false;
  state.last = null;
  state.tmpStart = null;
  state.snapshot = null;
  state.redo = [];
}
function drawBrush(a,b){
  ctx.save(); ctx.globalAlpha=state.alpha; ctx.globalCompositeOperation='source-over';
  ctx.strokeStyle=state.color; ctx.lineWidth=state.size;
  ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.restore();
}
function drawEraser(a,b){
  ctx.save(); ctx.globalCompositeOperation='destination-out';
  ctx.lineWidth=state.size; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.restore();
}
function drawLinePreview(s,e){
  ctx.putImageData(state.snapshot,0,0);
  ctx.save(); ctx.globalAlpha=state.alpha; ctx.strokeStyle=state.color; ctx.lineWidth=state.size;
  ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(e.x,e.y); ctx.stroke(); ctx.restore();
}
function drawRectPreview(s,e){
  ctx.putImageData(state.snapshot,0,0);
  ctx.save(); ctx.globalAlpha=state.alpha; ctx.strokeStyle=state.color; ctx.lineWidth=state.size;
  const x=Math.min(s.x,e.x), y=Math.min(s.y,e.y), w=Math.abs(e.x-s.x), h=Math.abs(e.y-s.y);
  ctx.strokeRect(x,y,w,h); ctx.restore();
}

/* Fill + Picker */
function hexToRGBA(hex,a=1){ let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255,Math.round(a*255)]; }
function colorMatch(p,i,t,tol=0){ return Math.abs(p[i]-t[0])<=tol && Math.abs(p[i+1]-t[1])<=tol && Math.abs(p[i+2]-t[2])<=tol && Math.abs(p[i+3]-t[3])<=tol; }
function bucketFill(x,y){
  const w=canvas.width, h=canvas.height, img=ctx.getImageData(0,0,w,h), d=img.data;
  const scale=dpr(), px=Math.floor(x*scale), py=Math.floor(y*scale);
  const idx=(px+py*w)*4, target=[d[idx],d[idx+1],d[idx+2],d[idx+3]], fill=hexToRGBA(state.color,state.alpha);
  if(target[0]===fill[0]&&target[1]===fill[1]&&target[2]===fill[2]&&target[3]===fill[3]) return;
  const q=[[px,py]], seen=new Uint8Array(w*h), tol=6;
  while(q.length){
    const [cx,cy]=q.pop(); if(cx<0||cy<0||cx>=w||cy>=h) continue; const ii=(cx+cy*w)*4;
    if(seen[cx+cy*w]) continue; if(!colorMatch(d,ii,target,tol)) continue;
    d[ii]=fill[0]; d[ii+1]=fill[1]; d[ii+2]=fill[2]; d[ii+3]=fill[3]; seen[cx+cy*w]=1;
    q.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  ctx.putImageData(img,0,0);
}
function pickColor(x,y){
  const scale=dpr(), px=Math.floor(x*scale), py=Math.floor(y*scale), p=ctx.getImageData(px,py,1,1).data;
  const hex='#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join(''); setColor(hex);
}

/* Pointer mapping (respect zoom & canvas border) */
function stageToCanvas(ev){
  const r = canvas.getBoundingClientRect();
  const cs = getComputedStyle(canvas);
  const bl = parseFloat(cs.borderLeftWidth) || 0;
  const bt = parseFloat(cs.borderTopWidth)  || 0;
  const x = (ev.clientX - r.left - bl) / state.zoom;
  const y = (ev.clientY - r.top  - bt) / state.zoom;
  return { x: clamp(x,0,state.cw), y: clamp(y,0,state.ch) };
}
/* Cursor ring aligned to the stage */
function showSizePreview(ev){
  const d = Math.max(6, state.size) * state.zoom;
  const r = stage.getBoundingClientRect();
  sizePreview.style.display = 'block';
  sizePreview.style.left = (ev.clientX - r.left) + 'px';
  sizePreview.style.top  = (ev.clientY - r.top)  + 'px';
  sizePreview.style.width  = d + 'px';
  sizePreview.style.height = d + 'px';
}
const hideSizePreview=()=> sizePreview.style.display='none';

function onPointerDown(ev){
  if (state.panning) return;
  ev.preventDefault(); canvas.setPointerCapture(ev.pointerId); showSizePreview(ev);
  const p=stageToCanvas(ev);
  if (state.tool==='fill'){ pushUndo(); bucketFill(p.x,p.y); return; }
  if (state.tool==='picker'){ pickColor(p.x,p.y); return; }
  beginStroke(p.x,p.y);
}
function onPointerMove(ev){
  if (state.panning) return;
  showSizePreview(ev);
  if (!state.down) return;
  const p=stageToCanvas(ev), last=state.last||p;
  if (state.tool==='brush') drawBrush(last,p);
  else if (state.tool==='eraser') drawEraser(last,p);
  else if (state.tool==='line' && state.tmpStart) drawLinePreview(state.tmpStart,p);
  else if (state.tool==='rect' && state.tmpStart) drawRectPreview(state.tmpStart,p);
  state.last=p;
}
function onPointerUp(ev){
  hideSizePreview();
  if ((state.tool==='line'||state.tool==='rect') && state.tmpStart && state.snapshot){
    const p=stageToCanvas(ev);
    if (state.tool==='line') drawLinePreview(state.tmpStart,p); else drawRectPreview(state.tmpStart,p);
  }
  endStroke();
}

/* Pan (Space) */
let spaceDown=false;
function beginPan(e){ state.panning=true; viewport.style.cursor='grab'; hideSizePreview(); state.panSx=e.clientX; state.panSy=e.clientY; state.panLeft=viewport.scrollLeft; state.panTop=viewport.scrollTop; }
function movePan(e){ if(!state.panning) return; viewport.scrollLeft = state.panLeft - (e.clientX - state.panSx); viewport.scrollTop = state.panTop - (e.clientY - state.panSy); }
function endPan(){ state.panning=false; viewport.style.cursor=''; }
document.addEventListener('keydown', (e)=>{ if(e.code==='Space'&&!spaceDown){ spaceDown=true; beginPan(e); }});
document.addEventListener('keyup',   (e)=>{ if(e.code==='Space'){ spaceDown=false; endPan(); }});
viewport.addEventListener('pointerdown', (e)=>{ if(!spaceDown) return; viewport.setPointerCapture?.(e.pointerId); state.panSx=e.clientX; state.panSy=e.clientY; state.panLeft=viewport.scrollLeft; state.panTop=viewport.scrollTop; });
viewport.addEventListener('pointermove', (e)=>{ if(spaceDown) movePan(e); });
viewport.addEventListener('pointerup',   ()=>{ if(spaceDown) endPan(); });

/* Zoom: at 1 => no scroll, >1 => scroll */
function applyZoom(){
  canvas.style.transform = `scale(${state.zoom})`;
  if (state.zoom > 1) viewport.classList.add('scroll');
  else { viewport.classList.remove('scroll'); viewport.scrollLeft=0; viewport.scrollTop=0; }
}
function zoomBy(f){ state.zoom = clamp(state.zoom * f, 0.25, 8); applyZoom(); }
function zoomTo(z){ state.zoom = clamp(z, 0.25, 8); applyZoom(); }

/* File ops */
function doClear(){ pushUndo(); ctx.clearRect(0,0,canvas.width,canvas.height); }
async function doNew(){
  const ok = await askConfirm('Start a new blank canvas? This clears the current image.', 'New Canvas');
  if (!ok) return;
  doClear();
}
async function doResize(){
  const res = await promptSize({ w: state.cw, h: state.ch });
  if (!res) return;
  const scale = dpr();
  let prev = ctx.getImageData(0,0,canvas.width,canvas.height);
  canvas.width  = Math.round(res.w * scale);
  canvas.height = Math.round(res.h * scale);
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality='high'; ctx.lineCap='round'; ctx.lineJoin='round';
  state.cw = res.w; state.ch = res.h;
  const c=document.createElement('canvas'); c.width=prev.width; c.height=prev.height; c.getContext('2d').putImageData(prev,0,0);
  ctx.clearRect(0,0,res.w,res.h); ctx.drawImage(c,0,0,prev.width/scale,prev.height/scale,0,0,res.w,res.h);
  canvas.style.width = viewport.clientWidth + 'px';
  canvas.style.height= viewport.clientHeight + 'px';
  zoomTo(1);
}

function promptSize({ w, h }) {
  // System-styled numeric dialog using .dlg-body so your CSS section 9 applies
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap';
    wrap.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true">
        <div class="dlg-title">Resize Canvas</div>
        <div class="dlg-body">
          <div class="field">
            <div class="label">Width</div>
            <input id="pw" class="input" type="number" min="64" max="8192" value="${w}">
          </div>
          <div class="field">
            <div class="label">Height</div>
            <input id="ph" class="input" type="number" min="64" max="8192" value="${h}">
          </div>
          <div class="dlg-msg" aria-live="polite"></div>
        </div>
        <div class="dlg-actions">
          <button data-k="cancel" class="secondary">Cancel</button>
          <button data-k="ok">Apply</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const pw = wrap.querySelector('#pw');
    const ph = wrap.querySelector('#ph');
    const msg = wrap.querySelector('.dlg-msg');
    const ok  = wrap.querySelector('[data-k="ok"]');
    const cancel = wrap.querySelector('[data-k="cancel"]');

    const clampNum = (v)=> Math.min(8192, Math.max(64, v|0));
    const validate = ()=> {
      const W = pw.valueAsNumber, H = ph.valueAsNumber;
      let err = '';
      if (!Number.isFinite(W) || !Number.isFinite(H)) err = 'Enter valid numbers.';
      else if (W < 64 || H < 64) err = 'Minimum is 64 × 64.';
      else if (W > 8192 || H > 8192) err = 'Maximum is 8192 × 8192.';
      msg.textContent = err;
      ok.disabled = !!err;
    };

    pw.addEventListener('input', validate);
    ph.addEventListener('input', validate);

    const close = (v)=>{ wrap.remove(); resolve(v); };
    wrap.addEventListener('mousedown',(e)=>{ if(e.target===wrap) e.preventDefault(); }, true);
    cancel.onclick = ()=> close(null);
    ok.onclick = ()=> close({ w: clampNum(pw.value), h: clampNum(ph.value) });
    wrap.addEventListener('keydown',(e)=>{ if(e.key==='Escape') close(null); if(e.key==='Enter' && !ok.disabled) ok.click(); }, true);

    setTimeout(()=> pw.focus(), 0);
    validate();
  });
}

/* Save */
async function doSave(){
  const fmt = fmtSel.value;
  const mime = fmt==='png'?'image/png':(fmt==='jpeg'?'image/jpeg':'image/webp');

  const out = document.createElement('canvas');
  out.width = canvas.width; out.height = canvas.height;
  out.getContext('2d').drawImage(canvas,0,0);
  const dataUrl = out.toDataURL(mime,0.92);
  const b64 = dataUrl.split(',')[1];

  const name = await askName({ initial:'My painting' });
  if (name == null) return;
  const filename = name.replace(/[\\/:*?"<>|]/g,'_') + '.' + fmt;
  const rel = `user/Pictures/${filename}`;

  try{
    await window.top.fsAPI.writeText(rel, b64);
    window.top?.postMessage?.({ type:'fs-change', rel:'user/Pictures' }, '*');
    if (window.top?.showAlert) {
  await window.top.showAlert(`Saved to Pictures as ${filename}`, 'Saved');
} else {
  // fallback if shell dialogs not loaded
  const wrap = document.createElement('div');
  wrap.className = 'dlg-wrap';
  wrap.innerHTML = `
    <div class="dlg" role="dialog" aria-modal="true">
      <div class="dlg-title">Saved</div>
      <div class="dlg-body"><div>Saved to Pictures as ${filename}</div></div>
      <div class="dlg-actions"><button data-k="ok">OK</button></div>
    </div>`;
  document.body.appendChild(wrap);
  const ok = wrap.querySelector('[data-k="ok"]');
  ok.onclick = () => wrap.remove();
  wrap.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key==='Escape') wrap.remove(); }, true);
  setTimeout(()=> ok.focus(), 0);
}

  }catch(err){
    window.top?.showAlert?.(String(err||'Failed to save'), 'Error') ?? alert('Error\n\n' + err);
  }
}
const askName = (opts = {}) => {
  // Prefer the desktop’s askName (has validation + selection behavior)
  if (window.top?.askName) return window.top.askName({ title:'File name', initial:'My painting', ...opts });

  const { title='File name', initial='My painting', ok='Save', cancel='Cancel' } = opts;
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap';
    wrap.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true">
        <div class="dlg-title">${title}</div>
        <div class="dlg-body">
          <input class="dlg-input" value="${initial}">
          <div class="dlg-msg" aria-live="polite"></div>
        </div>
        <div class="dlg-actions">
          <button data-k="cancel" class="secondary">${cancel}</button>
          <button data-k="ok">${ok}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const inp = wrap.querySelector('.dlg-input');
    const okBtn = wrap.querySelector('[data-k="ok"]');
    const noBtn = wrap.querySelector('[data-k="cancel"]');
    const done = (v)=>{ wrap.remove(); resolve(v); };

    wrap.addEventListener('mousedown',(e)=>{ if(e.target===wrap) e.preventDefault(); }, true);
    okBtn.onclick = ()=> done(inp.value.trim() || initial);
    noBtn.onclick = ()=> done(null);
    wrap.addEventListener('keydown',(e)=>{ if(e.key==='Escape') done(null); if(e.key==='Enter') okBtn.click(); }, true);

    setTimeout(()=>{ 
      const i = initial.lastIndexOf('.');
      inp.focus();
      if (i>0 && i!==initial.length-1) inp.setSelectionRange(0,i); else inp.select();
    }, 0);
  });
};

/* Events */
toolBrush .addEventListener('click', ()=> setTool('brush'));
toolEraser.addEventListener('click', ()=> setTool('eraser'));
toolLine  .addEventListener('click', ()=> setTool('line'));
toolRect  .addEventListener('click', ()=> setTool('rect'));
toolFill  .addEventListener('click', ()=> setTool('fill'));
toolPicker.addEventListener('click', ()=> setTool('picker'));

colorInp.addEventListener('input', ()=> setColor(colorInp.value));
hexInp  .addEventListener('change', ()=> { const v=hexInp.value.trim(); if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) setColor(v); else hexInp.value=state.color; });
sizeInp .addEventListener('input', ()=> setSize(sizeInp.value));
alphaInp.addEventListener('input', ()=> setAlpha(alphaInp.value));

undoBtn.addEventListener('click', doUndo);
redoBtn.addEventListener('click', doRedo);
newBtn .addEventListener('click', doNew);
resizeBtn.addEventListener('click', doResize);
saveBtn.addEventListener('click', doSave);

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup',   onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);

zIn   .addEventListener('click', ()=> zoomBy(1.25));
zOut  .addEventListener('click', ()=> zoomBy(1/1.25));
zReset.addEventListener('click', ()=> zoomTo(1));

document.addEventListener('keydown', (e)=>{
  if (e.key==='+' || (e.key==='='&&(e.ctrlKey||e.metaKey))) { e.preventDefault(); zoomBy(1.25); }
  if (e.key==='-' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); zoomBy(1/1.25); }
  if (!e.ctrlKey && !e.metaKey){
    if (e.key==='b'||e.key==='B') setTool('brush');
    if (e.key==='e'||e.key==='E') setTool('eraser');
    if (e.key==='l'||e.key==='L') setTool('line');
    if (e.key==='r'||e.key==='R') setTool('rect');
    if (e.key==='f'||e.key==='F') setTool('fill');
    if (e.key==='i'||e.key==='I') setTool('picker');
  }
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
});

/* Boot & resize */
function boot(){
  setColor(state.color); setSize(state.size); setAlpha(state.alpha);
  fitCanvasToViewport(false);
  zoomTo(1);
}
new ResizeObserver(()=> fitCanvasToViewport(/*preserve*/true)).observe(viewport);
window.addEventListener('load', boot);
