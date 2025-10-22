# Desktop4Kids OS
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE) ![Version](https://img.shields.io/badge/Version-v1.2.1-green.svg?style=for-the-badge)

&#x20;   &#x20;

<p align="center">
  <img src="https://i.postimg.cc/nLpxTQf0/banner-logo-title.png" alt="Desktop4Kids Banner" width="700">
</p>

**A safe, playful, and sandboxed desktop experience for kids — built with Electron.**

---

## 📌 Table of Contents

- [✨ About](#-about)
- [🚦 Current Status](#-current-status)
- [✅ Currently Functional](#-currently-functional)
- [🖼️ Screen Shots](#-screen-shots)
- [🧠 Technical Overview](#-technical-overview)
- [🛠️ Installation](#-installation)
- [✅ Prereqs](#-prereqs)
- [⚡ Quick Start](#-quick-start)
- [🗺️ Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [❓ FAQ](#-faq)
- [📜 License](#-license)

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

## ✅ Currently Functional

- **Desktop Environment** – Full simulated desktop with wallpapers, draggable icons, grid snapping, context menus, and boot animations.
- **Window Manager** – Handles multi-app windows, focus, z-index stacking, resizing, and taskbar integration.  
- **File Explorer** – Dual-view (Grid/List) with drag-reorder icons, per-folder memory, context menus, and persistent layout via `explorer-order.json`.
- **Media Center** – Unified image/audio/video viewer with custom controls, WebAudio visualizer, and lazy-loaded thumbnails.
- **Notepad** – Lightweight text editor with real-time save tracking, font scaling, and synced global theming.  
- **Mentor AI** – Local AI tutor powered by `node-llama-cpp`; supports offline learning, child-safe chat rules, clear-conversation button, and theme-matched UI.
- **Account System** – Multi-user login with isolated directories and configurable quotas (**50 MB each**).  
- **Settings** – User profiles, theme & wallpaper management, and base for future system preferences.  
- **Filesystem API** – Secure preload bridge (`fsAPI`) for sandboxed read/write/delete/rename operations.  
- **System Features** – Live tray clock + calendar, theme propagation to apps, and desktop notifications on file changes.

---

## 🖼️ Screen Shots

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

```
**2.1 Get a local LLM model (GGUF)**

Place your model file here (1B–3B runs well on CPU):
```bash
Desktop4Kids-OS/models/llama-3.2-1b-instruct-q4_k_m.gguf
```
> You can rename any compatible GGUF to this filename, or edit `MODEL_FILENAME` inside `apps/ai-worker/ai-runtime.js`.

**2.2 Stage the llama backend (one-time)**

Download a prebuilt llama backend (fastest):
```bash
npx --no node-llama-cpp source download
```

Or build locally (optional, adds GPU support):

```bash
# auto-selects CPU/CUDA/Metal/Vulkan depending on hardware
npx --no node-llama-cpp source build --gpu auto --nodeTarget v22.20.0
```

> `--nodeTarget v22.20.0` matches Electron 38.4.0’s embedded Node version.

**3 Run Development**
```bash
npm start
```
Launch the Mentor app from the desktop environment.
You should see the greeting:

> “Welcome back! Are you ready to learn?”

### 🧪 Optional: Package an App Build

```bash
npm run build
```

> Uses `electron-builder`. Models are loaded from `resources/models/…` when packaged. Configure targets in `package.json`.

---

## ✅ Prereqs

| Platform        | Requirements                                                                  |
| --------------- | ------------------------------------------------------------------------------|
| **Windows**     | Node 22+, Git. (For local builds: VS 2022 Build Tools (C++), CMake, Python 3) |
| **macOS**       | Xcode Command Line Tools (Metal backend supported)                            |
| **Linux**       | `build-essential`, `cmake`, Python 3, and CUDA/Vulkan if using GPU            |

---

## ⚡ Quick Start

- Log in as **Guest** to explore the desktop.
- Open **File Explorer** to try icon drag-ordering & view modes.
- Launch **Notepad**, type anything — notice save status.
- Right‑click desktop for **context menu** options.

---

## 🗺️ Roadmap

- ~~🎨 Theming in Settings for deeper personalization~~ **Completed**
- ~~🖼️ Media app for images (**.png, .jpg, .gif**) and videos (**.mp4, .mov, .avi**)~~
- 🎮 Game Center with educational & fun activities
- 👪 Parental Controls + Safe Mode for parent accounts
- ✨ UI polish, micro‑animations, and accessibility improvements
- ~~🤖 Mentor Ai Assistant for teaching and assisting with understanding math, science, english, art concepts.~~

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
