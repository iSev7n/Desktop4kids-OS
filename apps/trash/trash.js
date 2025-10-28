'use strict';

// === Theme sync =============================================================
try {
  const t = window.top?.document?.documentElement?.getAttribute('data-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch {}
window.addEventListener('message', (e) => {
  if (e?.data?.type === 'theme') {
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
});

// === Dialog bridge (use global themed dialogs if available) =================
const Dialogs = (() => {
  const topWin = window.top || window;
  const askConfirm = topWin.askConfirm
    ? (msg, title='Confirm') => topWin.askConfirm(msg, title)
    : (msg) => Promise.resolve(window.confirm(msg));
  const showAlert = topWin.showAlert
    ? (msg, title='Notice') => topWin.showAlert(msg, title)
    : (msg) => { window.alert(msg); return Promise.resolve(); };
  return { askConfirm, showAlert };
})();

// === DOM ====================================================================
const listEl   = document.getElementById('list');
const emptyEl  = document.getElementById('emptyState');
const btnEmpty = document.getElementById('btnEmpty');

// === Utils ==================================================================
function fmtBytes(n){
  if (!n || n <= 0) return '—';
  const u = ['B','KB','MB','GB','TB']; let i=0;
  while (n >= 1024 && i < u.length-1){ n/=1024; i++; }
  return n.toFixed(1)+' '+u[i];
}
function fmtDate(ms){ return new Date(ms).toLocaleString(); }

// Debounce refreshes coming from multiple events at once
let refreshTimer = null;
function scheduleRefresh() {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refresh();
  }, 50);
}

// === Render =================================================================
async function refresh(){
  const items = await window.top.Trash.list();
  listEl.innerHTML = '';
  emptyEl.classList.toggle('hide', items.length > 0);

  for (const it of items){
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div class="info">
        <div><strong>${it.base}</strong></div>
        <div class="meta">From: ${it.orig}</div>
        <div class="meta">Deleted: ${fmtDate(it.deletedAt)} • Size: ${fmtBytes(it.size||0)}</div>
      </div>
      <div class="actions">
        <button data-k="restore">Restore</button>
        <button data-k="delete" class="danger">Delete forever</button>
      </div>
    `;

    const btnRestore = row.querySelector('[data-k="restore"]');
    const btnDelete  = row.querySelector('[data-k="delete"]');

    btnRestore.addEventListener('click', async ()=>{
      btnRestore.disabled = true; btnDelete.disabled = true;
      try {
        await window.top.Trash.restore(it.id);
        scheduleRefresh();
      } catch (err) {
        await Dialogs.showAlert(err?.message || String(err), 'Restore failed');
      } finally {
        btnRestore.disabled = false; btnDelete.disabled = false;
      }
    });

    btnDelete.addEventListener('click', async ()=>{
      const ok = await Dialogs.askConfirm(
        `Permanently delete “${it.base}”? This cannot be undone.`,
        'Delete forever'
      );
      if (!ok) return;
      btnRestore.disabled = true; btnDelete.disabled = true;
      try {
        await window.top.Trash.remove(it.id);
        scheduleRefresh();
      } catch (err) {
        await Dialogs.showAlert(err?.message || String(err), 'Delete failed');
      } finally {
        btnRestore.disabled = false; btnDelete.disabled = false;
      }
    });

    listEl.appendChild(row);
  }
}

// === Auto-refresh wiring ====================================================
// Refresh when the host announces trash changes or FS changes under the trash dir
window.addEventListener('message', (ev) => {
  const msg = ev.data || {};
  if (msg.type === 'trash-changed') {
    scheduleRefresh();
  }
  if (msg.type === 'fs-change') {
    const rel = msg.rel || '';
    if (rel === 'user/.Trash/files' || rel.startsWith('user/.Trash/files/')) {
      scheduleRefresh();
    }
  }
});

// === Empty trash ============================================================
btnEmpty.addEventListener('click', async ()=>{
  const ok = await Dialogs.askConfirm(
    'Empty Trash permanently? This cannot be undone.',
    'Empty Trash'
  );
  if (!ok) return;
  btnEmpty.disabled = true;
  try {
    await window.top.Trash.empty();
    scheduleRefresh();
  } catch (err) {
    await Dialogs.showAlert(err?.message || String(err), 'Empty Trash failed');
  } finally {
    btnEmpty.disabled = false;
  }
});

// === Boot ===================================================================
refresh();
