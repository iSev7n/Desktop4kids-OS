# Accounts System

_Last updated: 2025-10-11_

The Desktop4Kids account system gives each user an **isolated home folder**, an **optional PIN**, and a **per-account storage quota**.  
Profiles are stored centrally in `appdata/profiles.json`, while each user’s files live in `users/<id>/`.

------------------------------------------------------

## Table of Contents

- [Goals](#goals)
- [Folder Layout](#folder-layout)
- [Profile Storage Schema](#profile-storage-schema)
- [Security & Path Rules](#security--path-rules)
- [Main Process (Electron) Responsibilities](#main-process-electron-responsibilities)
- [Preload Bridge](#preload-bridge)
- [Renderer Accounts Module](#renderer-accounts-module)
- [Creating User Skeleton](#creating-user-skeleton)
- [Quota Enforcement](#quota-enforcement)
- [UI Flows](#ui-flows)
- [Common Errors & Fixes](#common-errors--fixes)
- [Testing Checklist](#testing-checklist)
- [FAQ](#faq)

------------------------------------------------------

## Goals

- **Isolation**: Users cannot access each other’s files.
- **Simplicity**: A 4-digit optional PIN for kids; simple dialogs.
- **Safety**: Strict path mapping and guarded IPC calls.
- **Durability**: Data sits under a single app root so resetting is easy.

------------------------------------------------------

## Folder Layout

```text
Documents/Desktop4KidsFS/
├─ users/
│  ├─ Guest/
│  │  ├─ Desktop/ Documents/ Pictures/ Videos/ Music/ Downloads/ Games/ Config/
│  ├─ Alice/
│  │  └─ (same structure)
│  └─ ...
├─ appdata/
│  ├─ profiles.json ← All registered profiles live here
│  └─ avatars/
└─ .seeded
```

- users/<id>/Config/settings.json keeps the per-user wallpaper/theme.
- appdata/profiles.json is a shared registry of all accounts.

------------------------------------------------------

## Profile Storage Schema

**File:** `appdata/profiles.json`

```json
[
  {
    "id": "Guest",                  //* id: [A-Za-z0-9_-]{1,32}
    "pin": "",                      //* pin: "" or "####" (4 digits)
    "role": "parent",               //* role: "child" or "parent"
    "createdAt": 1710000000000
  },
  {
    "id": "Alice",
    "pin": "1234",
    "role": "child",
    "createdAt": 1712345678901
  }
]

```text
Tip: You can extend with displayName, avatar, etc., later.
```

------------------------------------------------------

**Security & Path Rules**

```markdown
## Security & Path Rules

The renderer passes UI-style paths such as:

- `""`, `.`, `./`, `~`, `user` → resolve to `users/<CURRENT_USER>`
- `~/X`, `user/X` → resolve to `users/<CURRENT_USER>/X`

The main process blocks:

- `users` (top), `system`, `assets`, `appdata` + any of their subpaths
- any attempt to access `users/<someone_else>`

All user-facing file ops must go through `fsAPI` (IPC), and never touch Node APIs directly in the renderer.

------------------------------------------------------

## Main Process (Electron) Responsibilities

Seed `ROOT_DIR` and the initial structure on first run.  
Maintain `CURRENT_USER` (default `"Guest"`).  
Provide sandboxed FS IPC handlers.  
Provide an `acct:set` IPC to switch `CURRENT_USER`.

```js
// main.js – CURRENT_USER and path mapping (abbrev)
let CURRENT_USER = 'Guest';

function uiToFsRel(rel) {
  rel = String(rel || '');
  const id = CURRENT_USER || 'Guest';

  // Aliases → users/<me>
  if (!rel || rel === '.' || rel === './' || rel === '~' || rel === 'user') rel = `users/${id}`;
  else if (rel.startsWith('~/'))    rel = `users/${id}/${rel.slice(2)}`;
  else if (rel.startsWith('user/')) rel = rel.replace(/^user(\/|$)/, `users/${id}$1`);

  // Block internals
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

ipcMain.handle('acct:set', (_, id) => { CURRENT_USER = id || 'Guest'; return true; });
```

**DO:** keep appdata blocked from renderer FS calls.
**DO:** switch user only via acct:set.
**DON’T:** expose raw filesystem or absolute paths to the renderer.

------------------------------------------------------

## Preload Bridge

You expose two bridges:

window.fsAPI – safe FS methods (list, readText, writeText, createFolder, delete, renameOrMove, fileUrl, openExternal, stat)

window.accountsBridge – direct helpers for profiles and active user only

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fsAPI', {
  list:         (rel)            => ipcRenderer.invoke('fs:list', rel),
  readText:     (rel)            => ipcRenderer.invoke('fs:readText', rel),
  writeText:    (rel, text)      => ipcRenderer.invoke('fs:writeText', rel, text),
  createFolder: (rel)            => ipcRenderer.invoke('fs:createFolder', rel),
  delete:       (rel)            => ipcRenderer.invoke('fs:delete', rel),
  renameOrMove: (a, b)           => ipcRenderer.invoke('fs:rename', a, b),
  fileUrl:      (rel)            => ipcRenderer.invoke('fs:fileUrl', rel),
  stat:         (rel)            => ipcRenderer.invoke('fs:stat', rel),
  openExternal: (rel)            => ipcRenderer.invoke('fs:openExternal', rel),
});

contextBridge.exposeInMainWorld('accountsBridge', {
  // central registry lives in appdata/
  readProfiles:  async () => {
    try { return JSON.parse(await ipcRenderer.invoke('fs:readText', 'appdata/profiles.json')); }
    catch { return []; }
  },
  writeProfiles: async (list) => {
    await ipcRenderer.invoke('fs:createFolder', 'appdata');
    await ipcRenderer.invoke('fs:writeText', 'appdata/profiles.json', JSON.stringify(list, null, 2));
  },
  setCurrentUser: (id) => ipcRenderer.invoke('acct:set', id),
});
```

**Note:*** writeProfiles uses fs:createFolder('appdata') first; the main process allows creating appdata but blocks reading/writing arbitrary files there from the renderer unless bridged. The above is bridged and audited.

------------------------------------------------------

## Renderer Accounts Module

```text
Your accounts.js wraps fsAPI so UI paths (~, user/...) map into the current user’s folder. It also adds quota checks and filters list() to the user’s subtree.

Key pieces (summarized)
```
```js
// accounts.js (abbrev)

// 1) Session ID
function getCurrentUserId(){
  try { return JSON.parse(localStorage.getItem('currentUser') || '"Guest"'); }
  catch { return 'Guest'; }
}
function setCurrentUserId(id){ localStorage.setItem('currentUser', JSON.stringify(id)); }

// 2) Profiles (through accountsBridge)
async function readProfiles(){ return window.accountsBridge.readProfiles(); }
async function writeProfiles(list){ return window.accountsBridge.writeProfiles(list); }

// 3) Path rewrite for current user
const USERS_ROOT = 'users';
function normalize(rel){
  const id = getCurrentUserId();
  if (!rel || rel === '~' || rel === '.' || rel === './') return `${USERS_ROOT}/${id}`;
  if (rel.startsWith('~/')) return `${USERS_ROOT}/${id}/${rel.slice(2)}`;
  if (rel === 'user') return `${USERS_ROOT}/${id}`;
  if (rel.startsWith('user/')) return rel.replace(/^user(\/|$)/, `${USERS_ROOT}/${id}$1`);
  if (rel === USERS_ROOT || rel === 'system' || rel === 'assets') throw new Error('Access denied.');
  if (rel.startsWith(`${USERS_ROOT}/`) && !rel.startsWith(`${USERS_ROOT}/${id}`)) throw new Error('Access denied.');
  return `${USERS_ROOT}/${id}/${rel}`;
}

// 4) fsAPI wrapper with quota enforcement
const QUOTA_BYTES = 50 * 1024 * 1024;
let _origFs = null;

async function getSize(rel) { /* (as in your file) */ }
async function getUsedBytes(id=getCurrentUserId()){ return getSize(`${USERS_ROOT}/${id}`); }
async function assertQuota(delta){ /* (as in your file) */ }

function wrapFs(){
  _origFs = window.fsAPI;
  const wrap = {
    list:         (p)=> listWrapped(p),
    readText:     (p)=> _origFs.readText(normalize(p)),
    fileUrl:      (p)=> _origFs.fileUrl(normalize(p)),
    createFolder: (p)=> _origFs.createFolder(normalize(p)),
    delete:       (p)=> _origFs.delete(normalize(p)),
    renameOrMove: (a,b)=> _origFs.renameOrMove(normalize(a), normalize(b)),
    writeText:    async (p, text)=>{
      if (!p || /[\\\/]$/.test(p)) throw new Error('Please choose a file name (not a folder).');
      const dest = normalize(p);
      let old=0; try{ old=await getSize(dest); }catch{}
      const neu = new Blob([String(text ?? '')]).size;
      await assertQuota(Math.max(0, neu - old));
      return _origFs.writeText(dest, text);
    },
    openExternal: (p)=> _origFs.openExternal(normalize(p)),
  };
  Object.assign(window.fsAPI, wrap);
}

// 5) Init
window.Accounts = {
  init: async function(){
    if (!localStorage.getItem('currentUser')) setCurrentUserId('Guest');
    await window.accountsBridge.setCurrentUser(getCurrentUserId());
    await ensureUserSkeleton(getCurrentUserId()).catch(()=>{});
    wrapFs();
    // load templates + user chip UI...
  },
  getCurrentUserId,
};
```

------------------------------------------------------

## Creating User Skeleton

On register/login (first time), create the home tree:

```js
async function ensureUserSkeleton(id){
  const base = `users/${id}`;
  const dirs = ['Desktop','Documents','Pictures','Videos','Downloads','Music','Games','Config'];

  await window.fsAPI.createFolder('users').catch(()=>{});
  await window.fsAPI.createFolder(base).catch(()=>{});
  for (const d of dirs) await window.fsAPI.createFolder(`${base}/${d}`).catch(()=>{});

  // seed defaults if missing
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
```

------------------------------------------------------

## Quota Enforcement

Each account has 50 MB (QUOTA_BYTES) by default.

On writeText(), compute size delta (newSize - oldSize) and reject if it exceeds remaining quota.

Reading and listing do not affect quota.

------------------------------------------------------

## UI Flows

**Register**

Open “Register” modal (validate id, optional PIN).

Append { id, pin, role, createdAt } to profiles.json via accountsBridge.writeProfiles.

Save currentUser to localStorage.

acct:set in main, then ensureUserSkeleton(id).

Refresh UI (chip name, wallpaper, desktop icons).

**Login**

Choose username; if the user has a PIN, prompt and verify.

currentUser = id; acct:set, ensureUserSkeleton(id).

Refresh UI.

**Logout**

currentUser = 'Guest'.

acct:set('Guest').

Refresh UI.

------------------------------------------------------

## Common Errors & Fixes

1) Error: Access denied. when writing profiles

Cause: Writing appdata/profiles.json via raw fsAPI is blocked by uiToFsRel.

Fix: Always use window.accountsBridge.writeProfiles(...) from the renderer.

2) EISDIR: illegal operation on a directory

Cause: Attempted writeText to a path that resolves to a directory or to the root.

Fix: Your main fs:writeText handler already checks st.isDirectory() and throws a friendly message. Ensure you pass a file path (~/Documents/file.txt) not a folder.

3) Mismatched alias (user vs users)

Rule: UI should use user/... or ~/...; main maps it to users/<id>/....

Fix: Don’t pass users/<id> from the renderer; let the wrapper map it.

4) TypeError: window.accountsBridge.writeProfiles is not a function

Cause: Preload didn’t expose accountsBridge or function names differ.

Fix: Ensure preload.js matches the snippet above and that preload is enabled.

------------------------------------------------------

## Testing Checklist

→  Register a new account (no PIN) → appears in appdata/profiles.json

→  Register another with PIN → login rejects wrong PIN

→  After login, ~/Desktop/Welcome.txt exists and desktop shows icons

→  Create, rename, delete files inside ~/Documents → no cross-user leakage

→  Write many files until near 50 MB → save fails with quota message

→  Logout → the user chip shows Guest; desktop resets accordingly

→  Try to read/write system/, assets/, appdata/ via fsAPI → blocked

→  Use accountsBridge.readProfiles() → returns list safely

------------------------------------------------------

## FAQ

**Q: Can the renderer read appdata/profiles.json directly via fsAPI.readText?**
A: No. appdata is blocked by uiToFsRel. Use accountsBridge.readProfiles() which calls a narrow, audited path through IPC.

**Q: Where is the active user kept?**
A: localStorage.currentUser in the renderer and CURRENT_USER in main (kept in sync with acct:set).

**Q: How do I add avatars?**
A: Store images under appdata/avatars/ (managed by a dedicated IPC/bridge). Save only a reference (filename) in each profile entry.