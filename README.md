# Desktop4Kids OS

<p align="center">
  <img src='https://i.postimg.cc/5tp2L72x/banner-logo-title.png' alt='banner'/>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/iSev7n/Desktop4Kids-OS?style=for-the-badge" />
  <img src="https://img.shields.io/github/package-json/v/iSev7n/Desktop4Kids-OS?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/iSev7n/Desktop4Kids-OS?style=for-the-badge" />
  <img src="https://img.shields.io/github/issues/iSev7n/Desktop4Kids-OS?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Offline--First-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Local%20Qwen-blueviolet?style=for-the-badge" />
  
</p>

---

<details>
<summary><strong>📌 Table of Contents (Click to Expand)</strong></summary>

- [About](#about)
- [Current Status](#current-status)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Technical Overview](#technical-overview)
- [Installation](#installation)
  - [Windows Setup](#windows-setup)
  - [Linux Setup](#linux-setup)
  - [AI Model Configuration](#ai-model-configuration)
- [Quick Start](#quick-start--try-it-in-30-seconds)
- [System Requirements](#system-requirements)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [FAQ](#faq-quick)
- [License](#license)

</details>

---

## 🔰 About

**Desktop4Kids OS** is a **safe, offline-first desktop environment for children**, built with Electron.

It simulates a real operating system experience complete with:
- A windowed desktop
- Child-friendly applications
- A sandboxed file system
- A fully local AI learning assistant

No internet. No tracking. No cloud dependency.

---

## 📈  Current Status

This release **v1.3.0** focuses on the **core desktop foundation** stability, safety, and a strong base for future apps.

---

## 🚀 Key Features

### 🔧 Core System Components
| **System Component** | **Version** | **Key Capabilities** |
|---------------------|-------------|----------------------|
| **Desktop Environment** | 1.0 | Wallpapers, draggable icons, grid snapping, context menus, boot animations |
| **Window Manager** | 1.0 | Multi-window handling, focus control, z-index stacking, resizing, taskbar integration |
| **File Explorer** | 1.0 | Grid/List views, drag-reorder icons, per-folder layout memory, context menus |
| **Virtual Filesystem Layer** | 1.0 | Secure preload bridge, sandboxed read/write/rename/delete |
| **User Account Manager** | 1.0 | Multi-user profiles, isolated directories, storage quotas |
| **Trash System** | 1.0 | Recoverable deletes, restore support, permanent delete |
| **System Services** | 1.0 | Tray clock & calendar, global theming, alerts, notifications |

### 🧩 Built-In Applications
| **Application** | **Version** | **Key Capabilities** |
|----------------|-------------|----------------------|
| **Media Center** | 1.0 | Image/audio/video playback, custom controls, WebAudio visualizer |
| **Notepad** | 1.0 | Real-time saving, font scaling, theme synchronization |
| **Calculator** | 1.0 | Basic & scientific modes, calculation history |
| **Paint** | 1.0 | Drawing tools, shapes, layers, PNG/JPG export |
| **Mentor AI** | 1.0 | Fully offline AI tutor, child-safe responses, taskbar dock |
| **Settings** | 1.0 | User profiles, theme management, wallpaper selection |



---

## 🖼️ Screenshots

<p align="center">
  <img src="https://iili.io/KPC0Wgt.md.png" width="45%" />
  <img src="https://iili.io/KPC0Esp.md.png" width="45%" />
</p>

<p align="center">
  <img src="https://iili.io/KPC0uqB.md.png" width="45%" />
  <img src="https://iili.io/KPC0Rg1.md.png" width="45%" />
</p>

<p align="center">
  <img src="https://iili.io/KPC07dF.md.png" width="45%" />
  <img src="https://iili.io/KPC0A0P.md.png" width="45%" />
</p>

---

## 🧠 Technical Overview

| Component       | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| **Framework**   | Electron 31 (modern sandboxed configuration)                                 |
| **Language**    | JavaScript (Node.js backend + isolated renderer via `preload.js`)             |
| **Storage**     | Virtual user directories under `/users/<username>`                           |
| **Security**    | Context isolation, disabled `remote`, IPC via `contextBridge` only           |
| **Build Tools** | `electron-builder` (packaging), `electronmon` (dev hot-reload)               |

> Tip: Keep your **preload** surface minimal and validate every IPC payload.

---

## 🛠️ Installation

### Windows Setup

```bash
git clone https://github.com/yourusername/Desktop4Kids-OS.git
cd Desktop4Kids-OS
npm install
```

Create/Verify a models directory:
```bash
Desktop4Kids-OS/models/
```

Download and place:
```
Qwen2.5-3B-Instruct-Q5_K_M.gguf
```

Verify configuration:
```js
const MODEL_FILENAME = 'Qwen2.5-3B-Instruct-Q5_K_M.gguf';
```

Run:
```bash
npm start
```

---

### Linux Setup

```bash
sudo apt update

sudo apt install -y build-essential cmake python3 git

git clone https://github.com/yourusername/Desktop4Kids-OS.git

cd Desktop4Kids-OS

npm install

npm start
```

---
## ❗ **Important**

### AI Model Configuration

Any compatible GGUF model can be used.

Steps:
1. Place model in `models/`
2. Update `MODEL_FILENAME` in `ai-runtime.js`
3. Restart application

No internet is used after setup.

---

## 🧾 System Requirements

| Platform    | Requirements                                                                 |
|------------|-------------------------------------------------------------------------------|
| **Windows** | Node.js 22+, Git. (For local builds: VS 2022 Build Tools (C++), CMake, Python) |
| **macOS**  | Node.js 22+, Xcode Command Line Tools (Metal backend supported)                |
| **Linux**  | Node.js 22+, `build-essential`, `cmake`, Python 3 (CUDA/Vulkan optional)      |


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

### **Future Vision**

- 📚 **Learning Hub** – Built-in lessons, progress tracking, and achievement badges
- 🖥️ **App Store (Local)** – Safely install community-made educational apps  
- 🎤 **Voice Mode for Mentor AI** – Speak and listen (privacy-first, fully offline)

> Have ideas? File a feature request! 🙌

---

## 🤝 Contributing

Contributions are welcome.

Please:
- Respect the security model
- Avoid expanding IPC surface unnecessarily
- Document architectural changes clearly

---

## ❓ FAQ (Quick)

**Q: Is Desktop4Kids safe for children?**  
> A: Yes. It runs fully offline with no ads, tracking, or network access.

**Q: Does it require internet?**  
> A: No. Everything, including Mentor AI, runs locally after setup.

**Q: Can I use my own AI model?**  
> A: Yes. Any compatible `.gguf` model can be placed in `/models/`.

👉 **See the full FAQ:** [docs/FAQ.md](docs/FAQ.md)

---

**Still stuck?** Open an issue on GitHub — we’re here to help!  
[github.com/yourusername/Desktop4Kids-OS/issues](https://github.com/yourusername/Desktop4Kids-OS/issues)

---

## 📜 License

GNU General Public License v3.0. See [LICENSE](LICENSE) for details.

---

<h2 align="center">
   Made with :blue_heart: by Thomas Davis.<br><br>
  <a href="https://www.sololearn.com/en/profile/35861735"> <img src="https://img.shields.io/badge/SoloLearn-Profile-blue?style=for-the-badge&logo=sololearn&logoColor=white" /> </a>
  <a href="https://isev7n.github.io/Dark-Portfolio/index.html"> <img src="https://img.shields.io/badge/Portfolio-View-6b5cff?style=for-the-badge&logo=About.me&logoColor=white" /> </a>
  <a href="https://ubuntu.com/"> <img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white" /> </a>
  <a href="https://code.visualstudio.com/"> <img src="https://img.shields.io/badge/VSCode-0078D4?style=for-the-badge&logo=visualstudiocode&logoColor=white" /> </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/HTML"> <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" /> </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS"> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" /> </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" /> </a>
</h2>
