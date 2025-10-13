// accounts/accounts.js
(function(){

  /* ==========================================================
     Desktop4Kids – Accounts
     ----------------------------------------------------------
     Sections
     0) Constants
     1) Session & profiles (read/write/skeleton)
     2) Quota + fsAPI wrapper (isolation, rewrite, filtering)
     3) Template loader + modal framework
     4) Modal flows (Login / Register / Account)
     5) User chip dropdown (render + actions)
     6) Public API
  ========================================================== */

  /* ---------------------------------------------------------------------
   * 0) Constants
   * ------------------------------------------------------------------ */
  const QUOTA_BYTES  = 50 * 1024 * 1024;          // 50 MB per account
  const USERS_ROOT   = 'users';                   // physical storage root
  const PROFILES_REG = 'appdata/profiles.json';   // registered accounts
  const TPL_URL      = 'accounts/accounts.html';  // HTML <template> bundle

  /* ---------------------------------------------------------------------
   * 1) Session & profiles (read/write/skeleton)
   * ------------------------------------------------------------------ */
  function getCurrentUserId(){
    try { return JSON.parse(localStorage.getItem('currentUser') || '"Guest"'); }
    catch { return 'Guest'; }
  }
  function setCurrentUserId(id){ localStorage.setItem('currentUser', JSON.stringify(id)); }

  async function readProfiles(){
    try { return await window.accountsBridge.readProfiles(); }
    catch { return []; }
  }
  async function writeProfiles(list){
    await window.accountsBridge.writeProfiles(list);
  }

  // Create a brand-new user home with standard folders + default desktop
  async function ensureUserSkeleton(id){
    const base = `${USERS_ROOT}/${id}`;
    const dirs = ['Desktop','Documents','Pictures','Videos','Downloads','Music','Games','Config'];

    await window.fsAPI.createFolder(base).catch(()=>{});
    for (const d of dirs) await window.fsAPI.createFolder(`${base}/${d}`).catch(()=>{});

    const desk = `${base}/Desktop`;
    try { await window.fsAPI.readText(`${desk}/Welcome.txt`); } catch {
      await window.fsAPI.writeText(`${desk}/Welcome.txt`,
`Welcome to Desktop4Kids!

• Double-click files to open them.
• Use the Start menu → Files to browse your folders.
• Right-click for New, Rename, or Delete.`);
    }
    try { await window.fsAPI.readText(`${desk}/About.md`); } catch {
      await window.fsAPI.writeText(`${desk}/About.md`,
`# About Desktop4Kids

- Per-account storage (50 MB)
- Isolated files per user
- Simple Notepad and Files apps`);
    }
    try { await window.fsAPI.readText(`${base}/Config/settings.json`); } catch {
      await window.fsAPI.writeText(`${base}/Config/settings.json`, '{}');
    }
  }

  /* ---------------------------------------------------------------------
   * 2) Quota + fsAPI wrapper (isolation, rewrite, filtering)
   * ------------------------------------------------------------------ */

  // Map any UI-relative path into the current user's private space.
  function normalize(rel){
    const id = getCurrentUserId();
    if (!rel) return `${USERS_ROOT}/${id}`;
    if (rel === '~' || rel === '.' || rel === './') return `${USERS_ROOT}/${id}`;
    if (rel.startsWith('~/')) return `${USERS_ROOT}/${id}/${rel.slice(2)}`;
    if (rel === 'user') return `${USERS_ROOT}/${id}`;
    if (rel.startsWith('user/')) return rel.replace(/^user(\/|$)/, `${USERS_ROOT}/${id}$1`);
    if (rel === USERS_ROOT || rel === 'system' || rel === 'assets') throw new Error('Access denied.');
    if (rel.startsWith(`${USERS_ROOT}/`)){
      if (!rel.startsWith(`${USERS_ROOT}/${id}`)) throw new Error('Access denied.');
      return rel;
    }
    return `${USERS_ROOT}/${id}/${rel}`;
  }

  // Pretty path back to UI space (users/<me>/... -> user/...)
  function displayRel(rel){
    const id = getCurrentUserId();
    return rel
      .replace(new RegExp(`^${USERS_ROOT}/${id}/`), 'user/')
      .replace(new RegExp(`^${USERS_ROOT}/${id}$`), 'user');
  }

  // list() that filters to the current user and rewrites rels to user/...
  async function listWrapped(p){
    const path = normalize(p);
    const rows = await _origFs.list(path);
    const id = getCurrentUserId();
    const allowPrefix = `${USERS_ROOT}/${id}`;
    return rows
      .filter(r => r.rel.startsWith(allowPrefix))
      .map(r => ({ ...r, rel: displayRel(r.rel) }));
  }

  // Compute size of a file/folder under the *real* normalized path
  async function getSize(rel){
    const path = normalize(rel);
    try {
      const rows = await _origFs.list(path);
      let sum = 0;
      for (const it of rows) sum += (it.type === 'dir') ? await getSize(it.rel) : (it.size || 0);
      return sum;
    } catch {
      try {
        const dir  = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
        const name = path.slice(path.lastIndexOf('/')+1);
        const rows = await _origFs.list(dir);
        const f = rows.find(x => x.name === name);
        return f ? (f.size || 0) : 0;
      } catch { return 0; }
    }
  }
  async function getUsedBytes(id=getCurrentUserId()){ return getSize(`${USERS_ROOT}/${id}`); }

  async function assertQuota(deltaBytes){
    if (deltaBytes <= 0) return;
    const used = await getUsedBytes();
    if (used + deltaBytes > QUOTA_BYTES) {
      const remain = Math.max(0, QUOTA_BYTES - used);
      throw new Error(`Storage limit reached. You have ${Math.ceil(remain/1024)} KB left (50 MB max).`);
    }
  }

  // Keep original around, then wrap with our sandbox + quota + rewriting
  let _origFs = null;
  function wrapFs(){
    _origFs = window.fsAPI;

    const wrap = {
      list:         (p)=> listWrapped(p),
      readText:     (p)=> _origFs.readText(normalize(p)),
      fileUrl:      (p)=> _origFs.fileUrl(normalize(p)),
      createFolder: (p)=> _origFs.createFolder(normalize(p)),
      delete:       (p)=> _origFs.delete(normalize(p)),
      renameOrMove: (a,b)=> _origFs.renameOrMove(normalize(a), normalize(b)),
      writeText:    async (p, text) => {
        if (!p || String(p).trim() === '' || /[\\\/]$/.test(p)) {
          throw new Error('Please choose a file name (not a folder).');
        }
        const dest = normalize(p);
        let old = 0; try { old = await getSize(dest); } catch {}
        const neu = new Blob([String(text ?? '')]).size;
        await assertQuota(Math.max(0, neu - old));
        return _origFs.writeText(dest, text);
      },
      openExternal: (p)=> _origFs.openExternal(normalize(p)),
    };

    for (const [k, fn] of Object.entries(wrap)) {
      try { Object.defineProperty(window.fsAPI, k, { value: fn, configurable: true, writable: true }); }
      catch { window.fsAPI[k] = fn; }
    }
  }

  /* ---------------------------------------------------------------------
   * 3) Template loader + modal framework
   * ------------------------------------------------------------------ */
  let _tplHost = null;
  async function ensureTemplatesLoaded(){
    if (_tplHost) return;
    const html = await fetch(TPL_URL).then(r=>r.text());
    const div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = html;
    document.body.appendChild(div);
    _tplHost = div;
  }

  function cloneTemplate(id){
    const t = document.getElementById(id) || _tplHost?.querySelector(`#${id}`);
    if (!t) throw new Error(`Template not found: ${id}`);
    return t.content.firstElementChild.cloneNode(true);
  }

  function showModalFromTemplate(tplId, setup){
    return new Promise(async (resolve)=>{
      await ensureTemplatesLoaded();
      const dlg  = cloneTemplate(tplId);
      const wrap = document.createElement('div');
      wrap.className = 'dlg-wrap';
      wrap.appendChild(dlg);
      document.body.appendChild(wrap);

      const btnOK     = dlg.querySelector('[data-k="ok"]');
      const btnCancel = dlg.querySelector('[data-k="cancel"]');

      const api = { wrap, dlg, ok:btnOK, cancel:btnCancel, resolve, close: (val)=> close(val) };
      setup?.(api);

      function onKey(e){
        if (e.key === 'Escape') return close(null);
        if (e.key === 'Enter' && btnOK && !btnOK.disabled) btnOK.click();
        if (e.key === 'Tab'){
          const els = [...dlg.querySelectorAll('input,select,button')].filter(el=>!el.disabled);
          if (!els.length) return;
          const first = els[0], last = els[els.length-1];
          if (e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
        }
      }
      function cleanup(){ document.removeEventListener('keydown', onKey, true); }
      function close(val){ cleanup(); wrap.remove(); resolve(val); }

      btnCancel?.addEventListener('click', ()=> close(null));
      document.addEventListener('keydown', onKey, true);
      setTimeout(()=> dlg.querySelector('input,select,button')?.focus(), 0);
    });
  }

  function showAlert(message, title = 'Notice'){
    return new Promise((resolve)=>{
      const wrap = document.createElement('div');
      wrap.className = 'dlg-wrap';
      wrap.innerHTML = `
        <div class="dlg" role="dialog" aria-modal="true">
          <div class="dlg-title">${title}</div>
          <div class="dlg-body" style="padding-top:6px">${message}</div>
          <div class="dlg-actions">
            <button data-k="ok">OK</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const btn = wrap.querySelector('[data-k="ok"]');
      const close = ()=>{ document.removeEventListener('keydown', onKey, true); wrap.remove(); resolve(); };
      const onKey = (e)=>{ if (e.key==='Escape' || e.key==='Enter') close(); };
      btn.addEventListener('click', close);
      document.addEventListener('keydown', onKey, true);
      setTimeout(()=> btn.focus(), 0);
    });
  }

  /* ---------------------------------------------------------------------
   * 4) Modal flows (Login / Register / Account)
   * ------------------------------------------------------------------ */
  const bytesToMB = (n)=> (n/1024/1024).toFixed(2);

  async function showLoginModal(profileNames){
    let result = null;
    await showModalFromTemplate('tpl-login', ({ dlg, ok, close })=>{
      const sel = dlg.querySelector('#u');
      sel.innerHTML = profileNames.map(n=>`<option value="${n}">${n}</option>`).join('');
      ok.addEventListener('click', ()=>{
        result = {
          id:  dlg.querySelector('#u').value.trim(),
          pin: dlg.querySelector('#p').value.trim()
        };
        close(true);
      });
    });
    return result;
  }

  async function showRegisterModal(){
    let result = null;
    await showModalFromTemplate('tpl-register', ({ dlg, ok, close })=>{
      ok.addEventListener('click', ()=>{
        const id  = dlg.querySelector('#u').value.trim();
        const pin = dlg.querySelector('#p').value.trim();
        const role= dlg.querySelector('#r').value;
        if (!/^[\w-]{1,32}$/.test(id)) { showAlert('Username can use letters, numbers, underscore, dash (1–32 chars).','Invalid username'); return; }
        if (pin && !/^\d{4}$/.test(pin)) { showAlert('PIN must be exactly 4 digits.','Invalid PIN'); return; }
        result = { id, pin, role };
        close(true);
      });
    });
    return result;
  }

  async function showAccountModal({ id, role, usedBytes, quotaBytes }){
    let didLogout = false;
    await showModalFromTemplate('tpl-account', ({ dlg, ok, close })=>{
      dlg.querySelector('#acctName').textContent    = id;
      dlg.querySelector('#acctRole').textContent    = role || 'parent';
      dlg.querySelector('#acctUsedMB').textContent  = bytesToMB(usedBytes);
      dlg.querySelector('#acctQuotaMB').textContent = bytesToMB(quotaBytes);
      const pct = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
      dlg.querySelector('#acctBar').style.width = pct + '%';
      ok.addEventListener('click', ()=>{ didLogout = true; close(true); });
    });
    return didLogout;
  }

  /* ---------------------------------------------------------------------
   * 5) User chip dropdown (render + actions) + avatar sync
   * ------------------------------------------------------------------ */
  async function renderUserMenuHTML(menu){
    const logged = getCurrentUserId() !== 'Guest';
    menu.innerHTML = logged
      ? `<div class="mi" data-k="account">Account information</div>
         <div class="mi" data-k="settings">Settings</div>
         <div class="sep"></div>
         <div class="mi" data-k="logout">Log out</div>`
      : `<div class="mi" data-k="login">Log in</div>
         <div class="mi" data-k="register">Register</div>`;
  }

  function positionMenu(chip, menu){
    const r = chip.getBoundingClientRect();
    const wasHidden = menu.classList.contains('hidden');
    if (wasHidden){ menu.style.visibility='hidden'; menu.classList.remove('hidden'); }
    const w = menu.offsetWidth;
    menu.style.top  = Math.round(r.bottom + 8) + 'px';
    menu.style.left = Math.round(r.right - w) + 'px';
    if (wasHidden){ menu.classList.add('hidden'); menu.style.visibility=''; }
  }

  // --- Helper: set the #userChip avatar image based on current profile
  async function setChipAvatar(){
    try {
      const chipImg = document.querySelector('#userChip .avatar');
      if (!chipImg) return;

      const id = getCurrentUserId();
      const profs = await readProfiles().catch(()=>[]);
      const me = profs.find(p => p.id === id);

      // Preferred: data URL stored in profile
      if (me?.avatarDataUrl && /^data:image\//.test(me.avatarDataUrl)) {
        chipImg.src = me.avatarDataUrl;
        return;
      }

      // Legacy: avatar path is base64 text → render as data URL
      if (me?.avatar) {
        try {
          const b64 = await window.fsAPI.readText(me.avatar);
          chipImg.src = `data:image/png;base64,${b64}`;
          return;
        } catch {}
      }

      // Fallback
      chipImg.src = 'assets/ui/default-avatar.svg';
    } catch {}
  }

  async function initChip(){
    const chip = document.getElementById('userChip');
    const menu = document.getElementById('userMenu');
    if (!chip || !menu) return;

    // ensure menu lives under <body>
    if (menu.parentElement !== document.body) document.body.appendChild(menu);

    chip.querySelector('.uname').textContent = getCurrentUserId();
    await setChipAvatar();

    const toggleMenu = (show)=>{
      if (show) {
        renderUserMenuHTML(menu);
        positionMenu(chip, menu);
        menu.classList.remove('hidden');
        chip.setAttribute('aria-expanded','true');
      } else {
        menu.classList.add('hidden');
        chip.setAttribute('aria-expanded','false');
      }
    };

    chip.addEventListener('click', ()=> toggleMenu(true));
    document.addEventListener('mousedown', (e)=>{ if (!menu.contains(e.target) && !chip.contains(e.target)) toggleMenu(false); });
    window.addEventListener('resize', ()=>{ if (!menu.classList.contains('hidden')) positionMenu(chip, menu); });

// actions
menu.addEventListener('click', async (e)=>{
  const k = e.target.closest('.mi')?.dataset.k; if (!k) return;
  toggleMenu(false);

  if (k === 'settings'){
    // Launch Settings app; your renderer already handles open-app → id:'settings'
    // 'tab' is optional; Settings defaults to Account anyway.
    window.top.postMessage({ type: 'open-app', id: 'settings', tab: 'account' }, '*');
    return;
  }

  if (k === 'register'){
    const data = await showRegisterModal(); if (!data) return;
    const profs = await readProfiles();
    if (profs.some(p=>p.id===data.id)) { await showAlert('That user already exists.','Register'); return; }
    profs.push({ id:data.id, pin:data.pin, role:data.role, createdAt: Date.now() });
    await writeProfiles(profs);
    setCurrentUserId(data.id);
    await window.accountsBridge?.setCurrentUser?.(data.id);
    await ensureUserSkeleton(data.id);
    chip.querySelector('.uname').textContent = data.id;
    window.applyWallpaper?.();
    window.loadDesktopIcons?.();
    await setChipAvatar();
    return;
  }

  if (k === 'login'){
    const profs = await readProfiles();
    if (!profs.length) { await showAlert('No accounts yet. Please register.','Log in'); return; }
    const pick = await showLoginModal(profs.map(p=>p.id)); if (!pick) return;
    const u = profs.find(p=>p.id===pick.id);
    if (!u) { await showAlert('No such user.','Log in'); return; }
    if (u.pin && pick.pin !== u.pin) { await showAlert('Wrong PIN.','Log in'); return; }
    setCurrentUserId(u.id);
    await window.accountsBridge?.setCurrentUser?.(u.id);
    await ensureUserSkeleton(u.id);
    chip.querySelector('.uname').textContent = u.id;
    window.applyWallpaper?.();
    window.loadDesktopIcons?.();
    await setChipAvatar();
    return;
  }

  if (k === 'logout'){
    setCurrentUserId('Guest');
    await window.accountsBridge?.setCurrentUser?.('Guest');
    chip.querySelector('.uname').textContent = 'Guest';
    window.applyWallpaper?.();
    window.loadDesktopIcons?.();
    await setChipAvatar();
    return;
  }

  if (k === 'account'){
    const profs = await readProfiles();
    const me = profs.find(x=>x.id===getCurrentUserId()) || { id:getCurrentUserId(), role:'parent' };
    const used = await getUsedBytes();
    const doLogout = await showAccountModal({ id: me.id, role: me.role, usedBytes: used, quotaBytes: QUOTA_BYTES });
    if (doLogout){
      setCurrentUserId('Guest');
      chip.querySelector('.uname').textContent = 'Guest';
      window.applyWallpaper?.();
      window.loadDesktopIcons?.();
      await setChipAvatar();
    }
    return;
  }
});
  }

  /* ---------------------------------------------------------------------
   * 6) Public API
   * ------------------------------------------------------------------ */
  window.Accounts = {
    init: async function(){
      if (!localStorage.getItem('currentUser')) setCurrentUserId('Guest');
      await window.accountsBridge?.setCurrentUser?.(getCurrentUserId());
      wrapFs();
      await ensureUserSkeleton(getCurrentUserId()).catch(()=>{});
      await ensureTemplatesLoaded();                 // load modal templates
      await initChip();                              // user chip UI
    },
    getCurrentUserId,
    refreshUserChip: async function(){
      try {
        const chipName = document.querySelector('#userChip .uname');
        if (chipName) chipName.textContent = getCurrentUserId();
        await setChipAvatar();
      } catch {}
    },
  };

})();
