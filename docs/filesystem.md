# Filesystem & Explorer Overview

_Last updated: 2025-10-11_

This document explains how Desktop4Kids implements its **virtual filesystem**, how paths are mapped/sandboxed, and how the **Explorer** (`apps/explorer/explorer.js`) and **Renderer/Desktop** (`renderer.js`) interact with it.

------------------------------------------------------

## Table of Contents

- [Virtual Root & Layout](#virtual-root--layout)
- [Path Mapping & Aliases](#path-mapping--aliases)
- [Security Rules](#security-rules)
- [Main → Preload → Renderer Bridges](#main--preload--renderer-bridges)
- [Renderer: Desktop Layer](#renderer-desktop-layer)
  - [Desktop icons layout & persistence](#desktop-icons-layout--persistence)
  - [Desktop context menu & file ops](#desktop-context-menu--file-ops)
  - [Cross-app messaging](#crossapp-messaging)
- [Explorer App](#explorer-app)
  - [State & address bar](#state--address-bar)
  - [Grid view: absolute tiling + reorder](#grid-view-absolute-tiling--reorder)
  - [List view](#list-view)
  - [Per-folder order persistence](#per-folder-order-persistence)
  - [History, Up/Back/Next](#history-upbacknext)
  - [Context menus](#context-menus)
  - [New / Rename / Delete](#new--rename--delete)
  - [File opening rules](#file-opening-rules)
- [Persistence Files](#persistence-files)
- [Common Errors & Fixes](#common-errors--fixes)
- [Extending the Explorer](#extending-the-explorer)
- [Quick Reference: API Calls](#quick-reference-api-calls)

------------------------------------------------------

## Virtual Root & Layout

On first launch the main process seeds a sandboxed tree under your OS **Documents**:


```text
Documents/Desktop4KidsFS/
├─ users/
│ ├─ Guest/
│ │ ├─ Desktop/ Documents/ Pictures/ Videos/ Music/ Downloads/ Games/ Config/
│ ├─ <OtherUser>/
│ │ └─ (same structure)
├─ appdata/
│ ├─ profiles.json
│ └─ avatars/
└─ .seeded
```


- Every account gets `users/<id>/…`.
- Shared registry and non-user data live in `appdata/`.

------------------------------------------------------

## Path Mapping & Aliases

Renderers/apps never use absolute OS paths. They talk to a **UI path space** that the main process maps to the real disk:

| UI Path (what apps use)     | Mapped to (per CURRENT_USER)          |
|-----------------------------|---------------------------------------|
| `""`, `"."`, `"./"`, `"~"`  | `users/<me>`                          |
| `"user"`                    | `users/<me>`                          |
| `"~/X"`                     | `users/<me>/X`                        |
| `"user/X"`                  | `users/<me>/X`                        |
| `"users/<me>/..."`          | allowed (still inside your sandbox)   |

> The renderer’s **Accounts wrapper** also normalizes/rewrites these for convenience and safety.

------------------------------------------------------

## Security Rules

The main process rejects any attempt to access:

- `users` (top), `system`, `assets`, `appdata` (and their subpaths) from generic FS APIs,
- another user’s folder (cross-user),
- or any path that resolves outside the sandbox root.

All file operations go through **IPC** (`fs:list`, `fs:readText`, `fs:writeText`, …).  
The renderer never touches `fs`/`path` Node modules directly.

------------------------------------------------------

## Main → Preload → Renderer Bridges

- **Main**: implements IPC handlers; enforces path mapping; rejects unsafe paths; seeds the filesystem.
- **Preload**: exposes two narrow bridges:
  - `window.fsAPI`: safe filesystem calls (list/read/write/etc.).
  - `window.accountsBridge`: limited, audited access to **profiles** and **current user** switch.

The **Accounts module** (renderer) wraps `fsAPI` to:
- transparently rewrite UI paths into `users/<me>/…`,
- filter `list()` to remain inside the user’s subtree,
- enforce per-account **quota** on writes.

------------------------------------------------------

## Renderer: Desktop Layer

The desktop itself (in `renderer.js`) is an app-like layer that:
- paints the **wallpaper** from `user/Config/settings.json`,
- renders **Desktop icons** from `~/Desktop`,
- manages windows for apps (Explorer, Notepad, etc.),
- provides **context menus** for creating/renaming/deleting items on Desktop.

### Desktop icons layout & persistence

- Icons snap to a grid defined by cell size/margins.
- Each icon’s grid position (col/row) is persisted to:
  - `user/Config/desktop.json` → a map from item path → `{ col, row }`
- Dragging an icon recomputes a non-overlapping layout and writes the new positions.

**Open behavior**:
- Double-click **folder** → open Explorer at that path.
- Double-click **text-ish file** (`.txt`, `.md`, `.log`, etc.) → open in Notepad.
- Otherwise → falls back to opening **Explorer** in the current folder.

### Desktop context menu & file ops

Right-click empty Desktop:
- **New folder** → `~/Desktop/New Folder`, ensuring a unique name.
- **New text file** → `~/Desktop/New Text File.txt`.

Right-click an icon:
- **Open**, **Open in Notepad** (for text files),
- **Rename** (preserves icon’s saved position by migrating the key),
- **Delete** (removes layout entry, then deletes the file/folder).

### Cross-app messaging

The desktop and apps communicate via `postMessage`:
- `{ type: 'open-explorer', pathRel: 'user/Documents' }`
- `{ type: 'open-notepad', rel: 'user/Desktop/Notes.txt' }`
- `{ type: 'fs-change', rel }` → desktop refreshes icons if Desktop changed.
- App close requests/decisions are also messaged (safe closing flow).

------------------------------------------------------

## Explorer App

Located at `apps/explorer/explorer.js`. It is a **separate iframe app** managed by the desktop window layer.

### State & address bar

- Internal `pathNow` holds the current folder **UI path** (`''` means home `~`, `'user'` means `~/`).
- Address bar shows the pretty form: `~\user\Documents`.
- Typing a path in the bar and hitting **Enter** normalizes and loads it (errors show a dialog).

### Grid view: absolute tiling + reorder

- The grid uses **absolute positioning** based on computed columns from the viewport.
- Tiles are placed by **reading order** (left→right, top→bottom).
- You can **drag to reorder tiles**:
  - Dragging preview reflows **other** tiles live.
  - On drop, the **reading order** for the current folder is persisted.
- After any resize or mode change, the app recomputes tile positions so indices align with the current column count.

### List view

- Renders a simple file table:
  - Name, Type (Folder or file extension), Size (for files), Modified date.
- List view stays **alphabetical**; it does not apply the grid reorder.

### Per-folder order persistence

- Stored in `user/Config/explorer-order.json`:
  - a mapping: `{ "<folder-ui-path>": ["<itemRel1>", "<itemRel2>", ...] }`
- On load:
  1. Fetch current items,
  2. Apply saved order for those that still exist,
  3. Append **newcomers** in name order at the end.

> The saved order affects **Grid** only (not List).

### History, Up/Back/Next

- `history[]` + index support **Back** / **Next**.
- **Up** goes to the parent path, clamped at home (`~`).
- A canonicalizer ejects invalid/forbidden locations back to home.

### Context menus

- **Item menu**: Open / Open in Notepad (text) / Rename / Delete / Set as wallpaper (images) / New folder / New text file.
- **Blank menu**: New folder / New text file.

Menus are positioned with viewport clamping so they don’t overflow.

### New / Rename / Delete

- **New folder / file** prompt validates names (no slashes, no control chars, not `.`/`..`).
- **Rename** preserves the folder’s saved order by updating the stored keys if the relative path changed.
- **Delete** updates the order database and then removes the file/folder.

### File opening rules

- **Folder** → navigates inside Explorer.
- **Text-ish** → opens Notepad via desktop message.
- Others → `fsAPI.openExternal(rel)` which lets the OS handle it (or you can later add viewers).

------------------------------------------------------

## Persistence Files

| File                                             | Purpose                                             |
|--------------------------------------------------|-----------------------------------------------------|
| `user/Config/settings.json`                      | Wallpaper/theme (& any future user preferences).    |
| `user/Config/desktop.json`                       | Desktop icon positions `{ "<rel>": { col, row } }`. |
| `user/Config/explorer-order.json`                | Per-folder reading order for Grid view.             |
| `appdata/profiles.json`                          | Registered account profiles.                        |

> All paths above are **UI paths** when called from apps. The main process maps them to `users/<id>/…`.

------------------------------------------------------

## Common Errors & Fixes

1) **“Access denied.”**  
Cause: Trying to read/write blocked roots (`system/`, `assets/`, `appdata/`) via generic `fsAPI`.  
Fix: Use the dedicated bridges (e.g., `accountsBridge` for profiles) or confine operations to `~/…` or `user/…`.

2) **EISDIR: illegal operation on a directory** or **Cannot write: path is a directory**  
Cause: Attempted `writeText` to a folder path or `""`.  
Fix: Ensure the destination has a **filename** (e.g., `~/Documents/Notes.txt`). The main handler checks and throws a friendly message.

3) **Cross-user path blocked**  
Cause: Supplying `users/<someone_else>/…` in the renderer.  
Fix: Use `user/…` or `~/…`. The wrapper maps to `users/<me>/…`.

4) **Order persistence mismatch**  
Cause: Renaming/moving items without updating `explorer-order.json`.  
Fix: The provided `rename` flow already migrates keys; ensure you keep that logic when refactoring.

------------------------------------------------------

## Extending the Explorer

- **Sorting columns** in List view: add headers, keep the saved Grid order separate.
- **File previews**: detect extension and show a side panel/tooltip.
- **Keyboard nav**: Arrow keys in Grid, Enter to open, F2 to rename, Del to delete.
- **Drag-and-drop copy/move**: use IPC to copy files within the user sandbox.
- **Search**: current implementation filters by name; you can add recursive search with a progress UI.

------------------------------------------------------

## Quick Reference: API Calls

All from the **renderer/app iframe** via `window.fsAPI` (wrapped by Accounts):

```js
// list directory
const rows = await fsAPI.list('user/Documents');
// -> [{ name, rel, type: 'dir'|'file', size, mtime, ext }, …]

// read / write text
const text = await fsAPI.readText('user/Documents/readme.txt');
await fsAPI.writeText('user/Documents/new.txt', 'Hello');

// create folder
await fsAPI.createFolder('user/Documents/Projects');

// rename (or move) – pass UI paths
await fsAPI.renameOrMove('user/Documents/new.txt', 'user/Documents/renamed.txt');

// delete (file or folder)
await fsAPI.delete('user/Documents/old.txt');

// file URL for <img src> or iframe
const url = await fsAPI.fileUrl('user/Pictures/photo.png');

// open via OS (or system handler)
await fsAPI.openExternal('user/Documents/report.pdf');
```