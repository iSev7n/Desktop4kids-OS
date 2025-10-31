# Desktop4Kids OS
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE) ![Version](https://img.shields.io/badge/Version-v1.3.0-green.svg?style=for-the-badge)

&#x20;   &#x20;

<p align="center">
  <img src='https://i.postimg.cc/5tp2L72x/banner-logo-title.png' border='0' alt='banner'></a>
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
- [✅ System Requirements](#-system-requirements)
- [⚡ Quick Start](#-quick-start)
- [🗺️ Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [❓ FAQ](#-faq)
- [📜 License](#-license)

---

## ✨ About

**Desktop4Kids OS** is an Electron-based desktop simulation designed to give children a safe, fun, and educational computer experience. It mimics a real operating system with a beautiful desktop, interactive icons, resizable windows, and kid-friendly apps — all running in a **fully sandboxed, offline-first environment**.

**Why parents & educators love it**

- **Safe by design** – 100% local, no internet required, no data collection.  
- **Focused & child-centric** – Curated apps with intuitive UI and built-in learning tools.  
- **Extensible & open** – Built for developers and educators to add custom apps and content.

---

## 🚦 Current Status

This release **v1.3.0** focuses on the **core desktop foundation** — stability, safety, and a strong base for future apps.

---

## ✅ Currently Functional

| **Features**          | **Description**                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------|
| **Desktop Environment** | Full simulated desktop with wallpapers, draggable icons, grid snapping, context menus, and boot animations. |
| **Window Manager**      | Handles multi-app windows, focus, z-index stacking, resizing, and taskbar integration.               |
| **File Explorer**       | Dual-view (Grid/List) with drag-reorder icons, per-folder memory, context menus, and persistent layout via `explorer-order.json`. |
| **Media Center**        | Unified image/audio/video viewer with custom controls, WebAudio visualizer, and lazy-loaded thumbnails. |
| **Notepad**             | Lightweight text editor with real-time save tracking, font scaling, and synced global theming.       |
| **Mentor AI**           | Local AI tutor powered by `node-llama-cpp`; supports offline learning, child-safe chat rules, clear-conversation button, theme-matched UI, **and a persistent popup docked to the taskbar** for always-available assistance. |
| **Calculator**          | Fully functional calculator app with basic and scientific modes, history tracking, and responsive layout. |
| **Paint**               | Feature-rich drawing app supporting freehand doodling, shapes, color picker, layers, and export as **.png** or **.jpg** — saved directly to the **Photos** folder for instant viewing. |
| **Trash System**        | Deleted files and folders are moved to a recoverable **Trash** bin with restore and permanent delete options. |
| **Account System**      | Multi-user login with isolated directories and configurable quotas (**50 MB each**).                 |
| **Settings**            | User profiles, theme & wallpaper management, and base for future system preferences.                 |
| **Filesystem API**      | Secure preload bridge (`fsAPI`) for sandboxed read/write/delete/rename operations.                   |
| **System Features**     | Live tray clock + calendar, theme propagation to apps, **revamped UI interface across all components**, **enhanced system alert popups and messages** with consistent styling and animations, and desktop notifications. |es|

---

## 🖼️ Screen Shots

<img src="https://iili.io/KPC0Wgt.md.png" alt="1.png" border="0"></a> <img src="https://iili.io/KPC0Esp.md.png" alt="2.png" border="0"></a>
<img src="https://iili.io/KPC0uqB.md.png" alt="3.png" border="0"></a> <img src="https://iili.io/KPC0Rg1.md.png" alt="4.png" border="0"></a>
<img src="https://iili.io/KPC07dF.md.png" alt="5.png" border="0"></a> <img src="https://iili.io/KPC0A0P.md.png" alt="6.png" border="0"></a>


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

## ⚡ Quick Start – Try It in 30 Seconds!

1. **Log in as `Guest`** → instantly land on the desktop!  
2. **Drag any icon** → watch it snap into place with smooth animations.  
3. **Double-click `File Explorer`** → switch between **Grid** and **List** views.  
4. **Open `Notepad`** → type “Hello!” → see **“Saved”** appear in real time.  
5. **Right-click the desktop** → create a **New Folder** or change wallpaper.  
6. **Click the Mentor AI icon** (📌 on taskbar) → ask: *“What is 5 + 3?”* → get an instant answer!  
7. **Open `Paint`** → doodle a star → **Save** → find it in **Photos**!  

> **No setup. No internet. Just fun, safe learning.**  
> Ready to build? See **Installation** above.

---

## 🗺️ Roadmap

### ✅ **Completed**
- ~~🎨 Theming in Settings for deeper personalization~~  
- ~~🖼️ Media Center for images (**.png, .jpg, .gif**) videos (**.mp4, .mov, .avi**) and music (**.mp3**, **.wav**)~~  
- ~~🤖 Mentor AI Assistant – offline tutor for math, science, English, and art concepts~~  
- ~~🗑️ Trash System with file/folder recovery~~  
- ~~🧮 Calculator with basic & scientific modes + history~~  
- ~~🎨 Paint App – doodle, draw, save as .png/.jpg to Photos~~  
- ~~✨ Revamped UI + enhanced system alerts & animations~~  

---

### 🚧 **In Progress / Next Up**

- 🎮 **Game Center** – Collection of educational mini-games (math puzzles, word games, logic challenges)  
- 👪 **Parental Controls** – App time limits, usage reports, content filtering, and **Safe Mode** for parent accounts  
- 🎨 **Advanced Theming** – Custom accent colors, dark/light/auto modes, per-user themes  
- ♿ **Accessibility Suite** – Screen reader support, high-contrast mode, keyboard navigation, voice commands  
- 🌍 **Multilingual Support** – UI localization (English, Spanish, French, etc.) + Mentor AI language switching  

---

### 🔮 **Future Vision**

- 📚 **Learning Hub** – Built-in lessons, progress tracking, and achievement badges  
- 🧑‍🏫 **Teacher Dashboard** – Multi-child management, assign activities, monitor progress  
- 🖥️ **App Store (Local)** – Safely install community-made educational apps  
- ☁️ **Optional Cloud Sync** – Secure, parent-controlled backup of drawings, notes, and progress  
- 🧠 **AI-Powered Adaptive Learning** – Mentor AI adjusts difficulty based on child’s performance  
- 🎤 **Voice Mode for Mentor AI** – Speak and listen (privacy-first, fully offline)  
- 🖨️ **Print Support** – Export drawings, notes, or activity sheets to printer  

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

### **General**
**Q: What is Desktop4Kids OS?**  
> A kid-safe, offline-first desktop environment built with **Electron**. It looks and feels like a real OS — with apps, windows, and a file system — but runs **100% locally** with no internet required.

**Q: Is it safe for children?**  
> Yes! No network access, no data collection, no ads. All files and AI processing stay on your device.

**Q: Can I use it without internet?**  
> **Absolutely.** Everything — including the **Mentor AI** — works fully offline after initial setup.

---

### **Installation & Setup**

**Q: Do I need to install anything special?**  
> Just **Node.js 22+** and **Git**. For the AI, download a small `.gguf` model (1–3B works great on CPU).

**Q: Why do I need a local AI model?**  
> The **Mentor AI** runs **on your machine** using `node-llama-cpp`. This keeps it fast, private, and fully offline.

**Q: Can I use my own AI model?**  
> Yes! any compatible `.gguf` file and place it in `/models/`, be sure to edit `MODEL_FILENAME` in `ai-runtime.js`.

**Q: Will it run on low-end laptops?**  
> Yes! A **1B–3B model** runs smoothly on **4GB RAM + modern CPU**. GPU acceleration is optional.

---

### **Features & Apps**

**Q: Where do saved files go?**  
> All user files are stored in virtual directories under `/users/<username>/` — safe, isolated, and easy to reset.

**Q: Can kids delete files permanently?**  
> No — deleted items go to the **Trash** and can be restored. Parents can empty it from Settings.

**Q: Can I add my own apps or games?**  
> Yes! The system is **modular**.

**Q: Is the Paint app full-featured?**  
> It supports **freehand drawing, shapes, colors, undo/redo**, and exports as **.png** or **.jpg** directly to the **Photos** folder.

---

### **Parental Controls & Safety**

**Q: Can parents limit screen time?**  
> Coming soon in **v1.3** — app time limits, usage reports, and **Extra Safe Mode**.

**Q: Is the Mentor AI child-appropriate?**  
> Yes. It uses **strict prompt filtering** and **child-safe response rules** — no mature content, ever.

**Q: Can I disable the AI?**  
> Yes — just remove the model file. (Also coming soon to **Extra Safe Mode** feature that toggles on and off Mentor AI.)

---

### **Troubleshooting**

**Q: Mentor AI is slow or not responding**  
> - Use a **smaller model** (1B preferred)  
> - Close other apps  
> - Try the **prebuilt backend**: `npx node-llama-cpp source download`

**Q: App windows are frozen**  
> Press **Ctrl + Shift + R** to hard reload, or restart with `npm start`.

**Q: I lost my files!**  
> Check the **Trash** folder. Files stay there until manually emptied.

**Q: How do I package it for distribution?**  
> Run `npm run build` — creates installers for Windows, macOS, and Linux.

---

**Still stuck?** Open an issue on GitHub — we’re here to help!  
[github.com/yourusername/Desktop4Kids-OS/issues](https://github.com/yourusername/Desktop4Kids-OS/issues)

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0**. You are free to use, modify, and distribute under the same terms. See [LICENSE](LICENSE) for details.

---

Made by Thomas Davis.
