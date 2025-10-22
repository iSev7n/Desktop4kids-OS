// main.js
/* ==========================================================
   Desktop4Kids – Main Process (Electron)
   ----------------------------------------------------------
   Responsibilities
   - Single instance + app lifecycle
   - Window creation + dev tools
   - Seed a safe virtual filesystem root
   - Path sandboxing per CURRENT_USER
   - IPC handlers for:
       • Minimal FS API (public, sandboxed)
       • Accounts profiles (private, appdata/)
========================================================== */

const { app, BrowserWindow, Menu, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { pathToFileURL } = require('url');

// AI Mentor runtime (loads the local model + streams tokens)
const { askMentorStreaming, askMentorText, modelPath, modelExists } =
  require('./apps/ai-worker/ai-runtime');

/* ========== 0) Single instance ======================================== */
if (!app.requestSingleInstanceLock()) app.quit();
const isDev = !app.isPackaged;

/* ========== 1) Globals ================================================= */
let ROOT_DIR;               // Set in ensureRoot()
let CURRENT_USER = 'Guest'; // Updated by renderer via IPC (acct:set)

/* ========== 2) UI path → FS path (per-user sandbox) ==================== */
/**
 * Map UI-facing rel paths to the real on-disk path under ROOT_DIR
 * for the CURRENT_USER, while blocking system/internal trees.
 *
 * UI accepts:
 *   '', '.', './', '~', 'user'         → users/<me>
 *   '~/X', 'user/X'                    → users/<me>/X
 *   'users/<me>/...'                   → allowed
 *
 * Blocked:
 *   'users' (top), 'system', 'assets', 'appdata' (top-level),
 *   and any path that tries to cross into other users.
 */
function uiToFsRel(rel) {
  rel = String(rel || '');
  const id = CURRENT_USER || 'Guest';

  // Home aliases → users/<me>
  if (!rel || rel === '.' || rel === './' || rel === '~' || rel === 'user') rel = `users/${id}`;
  else if (rel.startsWith('~/'))      rel = `users/${id}/${rel.slice(2)}`;
  else if (rel.startsWith('user/'))   rel = rel.replace(/^user(\/|$)/, `users/${id}$1`);

  // Hard block internal roots or their subpaths
  if (rel === 'users' || rel === 'system' || rel === 'assets' || rel === 'appdata')
    throw new Error('Access denied');
  if (rel.startsWith('system/') || rel.startsWith('assets/') || rel.startsWith('appdata/'))
    throw new Error('Access denied');

  // Never cross into other users
  if (rel.startsWith('users/')) {
    const base = `users/${id}`;
    if (rel !== base && !rel.startsWith(base + '/')) throw new Error('Access denied');
  }
  return rel;
}

/* ========== 3) Window state persistence ================================ */
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); }
  catch { return { width: 1280, height: 800 }; }
}

function saveWindowState(win) {
  try {
    const b = win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() }));
  } catch {}
}

/* ========== 4) Virtual filesystem seeding ============================== */
/**
 * Seeds a private root for the app under the user's Documents:
 *   <Documents>/Desktop4KidsFS/
 * Creates initial per-user tree for Guest and a neutral appdata/ store.
 */
function ensureRoot() {
  ROOT_DIR = path.join(app.getPath('documents'), 'Desktop4KidsFS');
  fs.mkdirSync(ROOT_DIR, { recursive: true });

  const marker = path.join(ROOT_DIR, '.seeded');
  if (!fs.existsSync(marker)) {
    const STRUCTURE = [
      // Per-user trees live under users/<id> only
      'users',
      'users/Guest',
      'users/Guest/Desktop',
      'users/Guest/Documents',
      'users/Guest/Pictures',
      'users/Guest/Videos',
      'users/Guest/Music',
      'users/Guest/Downloads',
      'users/Guest/Games',
      'users/Guest/Config',

      // Neutral top-level store
      'appdata',
      'appdata/avatars'
    ];
    for (const rel of STRUCTURE) fs.mkdirSync(path.join(ROOT_DIR, rel), { recursive: true });

    const write = (rel, data, enc = 'utf8') =>
      fs.writeFileSync(path.join(ROOT_DIR, rel), data, { encoding: enc });

    // Welcome content for Guest
    write('users/Guest/Desktop/Welcome.txt', 'Welcome! Open File Explorer from the Menu.');
    write('users/Guest/Documents/Getting Started.html',
`<!doctype html><meta charset="utf-8"><title>Getting Started</title>
<h1>Desktop4Kids</h1><p>This is your Documents folder.</p>`);

    // Tiny placeholder image in Pictures
    const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+K9JcAAAAASUVORK5CYII=';
    write('users/Guest/Pictures/Sample.png', PNG_1x1, 'base64');

    // Default settings (asset path for wallpaper)
    write('users/Guest/Config/settings.json', JSON.stringify({
      theme: 'dark',
      wallpaper: 'assets/wallpapers/wallpaper-14.png'
    }, null, 2));

    fs.writeFileSync(marker, '1');
  }
}

/* ========== 5) Path safety guards ===================================== */
function resolveSafe(rel) {
  const target = path.resolve(ROOT_DIR, '.' + path.sep + (rel || ''));
  if (!target.startsWith(ROOT_DIR)) throw new Error('Path out of bounds');
  return target;
}

// helper: path inside appdata (still goes through resolveSafe root clamp)
function appdataPath(rel = '') {
  return resolveSafe(path.posix.join('appdata', rel));
}

/* ========== 6) Protected paths (cannot delete/rename) ================== */
const PROTECTED = new Set([
  '', 'user', 'user/Config', 'users', 'system', '.seeded'
]);

function isProtected(rel) {
  const n = String(rel).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  return PROTECTED.has(n) || n.startsWith('user/Config/');
}

/* ========== 7) Directory listing helper ================================ */
async function listDir(rel = '') {
  const dir = resolveSafe(rel || '.');
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  const rows = await Promise.all(entries.map(async (d) => {
    const fp = path.join(dir, d.name);
    const st = await fsp.stat(fp);
    const ext = d.isFile() ? path.extname(d.name).slice(1).toLowerCase() : '';
    return {
      name: d.name,
      rel: path.relative(ROOT_DIR, fp).split(path.sep).join('/'),
      type: d.isDirectory() ? 'dir' : 'file',
      size: st.size,
      mtime: st.mtimeMs,
      ext
    };
  }));

  // Folders first, then name
  rows.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
  return rows;
}

/* ========== 8) Browser window creation + IPC =========================== */
function createWindow() {
  const state = loadWindowState();

  const win = new BrowserWindow({
    width: state.width, height: state.height, x: state.x, y: state.y,
    frame: false,
    resizable: true,
    fullscreen: false,            // start windowed for dev
    title: 'Desktop',
    backgroundColor: '#0f1115',
    icon: path.join(__dirname, 'assets', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  if (state.maximized) win.maximize();
  win.on('close', () => saveWindowState(win));

  // Dev menu + shortcuts
  if (isDev) {
    const viewMenu = Menu.buildFromTemplate([
      {
        label: 'View',
        submenu: [
          { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' },
          { type: 'separator' }, { role: 'togglefullscreen' }
        ]
      }
    ]);
    Menu.setApplicationMenu(viewMenu);
  } else {
    Menu.setApplicationMenu(null);
  }

  if (isDev) {
    // auto-reload on changes to html/css/js
    require('electron-reload')(__dirname, { awaitWriteFinish: true, ignored: /node_modules|dist/ });
  }

  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());

  // Quick hotkeys
  try {
    globalShortcut.register('F11', () => win.setFullScreen(!win.isFullScreen()));
    globalShortcut.register('Control+Alt+Q', () => app.quit());
  } catch {}

  // Security: lock external nav
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  /* ----- 8.1 IPC: system ---------------------------------------------- */
  ipcMain.handle('system:exit', () => app.quit());

  /* ----- 8.2 IPC: filesystem (public, sandboxed) ----------------------- */
  ipcMain.handle('fs:list',         (_, rel)              => listDir(uiToFsRel(rel)));
  ipcMain.handle('fs:readText',     (_, rel)              => fsp.readFile(resolveSafe(uiToFsRel(rel)), 'utf8'));

  ipcMain.handle('fs:writeText',    async (_, rel, content) => {
    rel = uiToFsRel(rel);
    const filePath = resolveSafe(rel);

    // If path exists and is a directory, stop.
    const st = await fsp.stat(filePath).catch(() => null);
    if (st && st.isDirectory()) {
      throw new Error('Cannot write: path is a directory. Choose a file name.');
    }

    // Ensure parent folder exists
    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    return fsp.writeFile(filePath, content, 'utf8');
  });

  ipcMain.handle('fs:createFolder', (_, rel)              => fsp.mkdir(resolveSafe(uiToFsRel(rel)), { recursive: true }));

  ipcMain.handle('fs:delete',       (_, rel) => {
    rel = uiToFsRel(rel);
    if (isProtected(rel)) throw new Error('System item cannot be deleted');
    return fsp.rm(resolveSafe(rel), { recursive: true, force: true });
  });

  ipcMain.handle('fs:rename',       async (_, rel, newNameOrDestRel) => {
    rel = uiToFsRel(rel);
    newNameOrDestRel = uiToFsRel(newNameOrDestRel);
    if (isProtected(rel)) throw new Error('System item cannot be renamed/moved');
    const oldPath  = resolveSafe(rel);
    const destPath = resolveSafe(newNameOrDestRel);
    return fsp.rename(oldPath, destPath); // supports rename or move
  });

  ipcMain.handle('fs:fileUrl',      (_, rel)              => pathToFileURL(resolveSafe(uiToFsRel(rel))).toString());
  ipcMain.handle('fs:stat',         (_, rel)              => fsp.stat(resolveSafe(uiToFsRel(rel))));
  ipcMain.handle('fs:openExternal', (_, rel)              => shell.openPath(resolveSafe(uiToFsRel(rel))));

  // Accounts: set current user for mapping
  ipcMain.handle('acct:set',        (_, id)               => { CURRENT_USER = id || 'Guest'; return true; });

  /* ----- 8.3 IPC: accounts profiles (private, appdata/) ----------------
     These bypass the public FS sandbox and write to ROOT_DIR/appdata/.
     Keep appdata/ invisible to normal FS calls. */
  ipcMain.handle('acct:profiles:get', async () => {
    try {
      const p = appdataPath('profiles.json');
      return await fsp.readFile(p, 'utf8');
    } catch {
      return '[]'; // default: no profiles
    }
  });

  ipcMain.handle('acct:profiles:set', async (_evt, json) => {
    await fsp.mkdir(resolveSafe('appdata'), { recursive: true });
    const p = appdataPath('profiles.json');
    await fsp.writeFile(p, json, 'utf8');
    return true;
  });

  return win;
}

/* ========== 9) App lifecycle ========================================== */
let mainWindow = null;

app.whenReady().then(() => {
  ensureRoot();
  mainWindow = createWindow();
});

// --- AI Mentor IPC (renderer -> main) ---
if (ipcMain.listenerCount('mentor:ask') === 0) {
  ipcMain.on('mentor:ask', async (event, { id, payload }) => {
    try {
      console.log('[mentor] model:', modelPath(), 'exists:', modelExists());
      // Quick sanity so we fail loudly if model missing
      if (!modelExists()) {
        throw new Error(`Model missing. Expected at: ${modelPath()}`);
      }

      const stream = await askMentorStreaming(payload);
      let full = '';
      let sawChunk = false;

      for await (const chunk of stream) {
        const piece = String(chunk ?? '');
        if (piece) {
          sawChunk = true;
          full += piece;
          event.sender.send(`mentor:chunk:${id}`, piece);
        }
      }

      // Fallback if stream yielded nothing
      if (!sawChunk || !full.trim()) {
        const text = await askMentorText(payload);
        full = String(text || '');
      }

      // Ensure it ends with "Your turn:"
      if (!/your turn:?$/i.test(full.trim())) {
        full = full.trim() + '\n\nYour turn:';
      }

      event.sender.send(`mentor:done:${id}`, { ok: true, text: full });
    } catch (err) {
      event.sender.send(`mentor:done:${id}`, {
        ok: false,
        error: (err && (err.message || String(err))) || 'Unknown error',
      });
    }
  });
}

// Focus existing window if a second instance is launched
app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
