# Desktop4Kids OS
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE) ![Version](https://img.shields.io/badge/Version-v1.2.1-green.svg?style=for-the-badge)

&#x20;   &#x20;

<p align="center">
  <img src="https://i.postimg.cc/nLpxTQf0/banner-logo-title.png" alt="Desktop4Kids Banner" width="700">
</p>

**A safe, playful, and sandboxed desktop experience for kids — built with Electron.**

---

## 📌 Table of Contents

- [About](#-about)
- [Status](#-current-status)
- [Features](#-currently-functional)
- [Screenshots](#-screenshots)
- [Technical Overview](#-technical-overview)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [FAQ](#-faq)
- [License](#-license)

---

## ✨ About

**Desktop4Kids OS** is an Electron-based desktop simulation designed to give children a safe and engaging computer experience. It mimics a familiar OS with a desktop, icons, windows, and apps — but runs entirely in a **sandboxed, local environment**.

**Why parents & educators love it**

- 🛡️ **Safe by design** – everything stays local, no hidden network surprises.
- 🎯 **Focused** – curated apps and a simple UI that keeps kids on task.
- 🧩 **Extensible** – a solid foundation that you can build apps on.

---

## 🚦 Current Status

This release **v1.2.1** focuses on the **core desktop foundation** — stability, safety, and a strong base for future apps.

### ✅ Currently Functional

- **File Explorer** – Modern dual-view design (Grid/List) with drag-to-reorder icons, per-folder layout memory, context menus, and persistent order storage via `explorer-order.json`.
- **Media Center** – Unified viewer for images, audio, and video with custom playback controls, WebAudio visualizer, and lazy-loaded thumbnails.
- **Notepad** – Clean, responsive text editor with real-time save tracking, font scaling, and cross-window theme synchronization.
- **Account System** – Multi-user login/registration with isolated directories and configurable storage quotas (**50 MB each**).
- **Window Manager** – Handles app creation, focus, z-index stacking, and taskbar integration for a true desktop-like experience.
- **Settings** – User profile editor, theme selection, wallpaper management, and groundwork for future system preferences.
- **Desktop Environment** – Full desktop simulation featuring wallpapers, draggable icons, snap-to-grid layout, context menus, and boot animations.
- **Filesystem API** – Secure `fsAPI` bridge between Renderer ↔ Main via Preload, supporting sandboxed read/write, delete, and rename operations.
- **System Features** – Live tray clock with popover calendar, theme propagation to iframes, and desktop notifications on filesystem changes.


---

## 🖼️ Screenshots
<img src="https://i.postimg.cc/bvqybbhg/1.png" alt="Desktop4-Kids-OS"></a>

<img src="https://i.postimg.cc/7LqH77kB/2.png" alt="Desktop4-Kids-OS"></a>

<img src="https://i.postimg.cc/fbMzXXN2/3.png" alt="Desktop4-Kids-OS"></a>

<img src="https://i.postimg.cc/Lsm9ffpQ/4.png" alt="Desktop4-Kids-OS"></a>

---

## 🧠 Technical Overview

| Component       | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| **Framework**   | Electron 31                                                        |
| **Language**    | JavaScript (Node + Renderer bridge via `preload.js`)               |
| **Storage**     | Virtual user directories under `/users/<username>`                 |
| **Security**    | Context isolation (`contextBridge` + `ipcRenderer.invoke`) enabled |
| **Build Tools** | `electron-builder` (packaging), `electronmon` (dev hot‑reload)     |

> Tip: Keep your **preload** surface tight and validate every IPC input.

---

## 🛠️ Installation

```bash
# 1) Clone the repo
git clone https://github.com/yourusername/Desktop4Kids-OS.git
cd Desktop4Kids-OS

# 2) Install dependencies
npm install

# 3) Run in development
npm start
```

### 🧪 Optional: Package an App Build

```bash
npm run build
```

> Uses `electron-builder`. Configure targets in `package.json`.

---

## ⚡ Quick Start

- Log in as **Guest** to explore the desktop.
- Open **File Explorer** to try icon drag-ordering & view modes.
- Launch **Notepad**, type anything — notice save status.
- Right‑click desktop for **context menu** options.

---

## 🗺️ Roadmap

- ~~🎨 Theming in Settings for deeper personalization~~ **Completed**
- 🖼️ Media app for images (**.png, .jpg, .gif**) and videos (**.mp4, .mov, .avi**)
- 🎮 Game Center with educational & fun activities
- 👪 Parental Controls + Safe Mode for parent accounts
- ✨ UI polish, micro‑animations, and accessibility improvements

> Have ideas? File a feature request! 🙌

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repo & create a feature branch.
2. Follow the existing code style (preload-sandboxed IPC, no direct FS in renderer).
3. Open a PR with a clear description and screenshots for UI changes.

**Good first issues:** tests for `fsAPI`, settings menu stubs, and wallpaper presets.

---

## ❓ FAQ

**Is it safe for kids?**  Yes — apps run in a sandboxed Electron environment with context isolation and a tightly-scoped preload.

**Does it work offline?**  Yep. Everything is local-first.

**What OSes are supported?**  Windows, macOS, and Linux (dev tested on all three).

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0**. You are free to use, modify, and distribute under the same terms. See [LICENSE](LICENSE) for details.

---

Made with 💙 - by Thomas Davis. 
