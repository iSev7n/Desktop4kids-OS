# Setup Guide

_Last updated: October 2025_

Follow these instructions to install and run Desktop4Kids OS locally.

------------------------------------------------------

## Requirements
- **Node.js 20+**
- **npm** or **yarn**
- **Electron 30+**

------------------------------------------------------

## Installation

```bash
git clone https://github.com/yourname/Desktop4Kids-OS.git
cd Desktop4Kids-OS
npm install
npm start
```
------------------------------------------------------

## Development

Run npm run dev to auto-reload on file changes.

Logs output to the Electron console.

Default dev path: Documents/Desktop4KidsFS.

------------------------------------------------------

## Packaging


```bash
npm run build
```

This creates a distributable app inside /dist.

------------------------------------------------------

## First Run

Default user: Guest

Default wallpaper: assets/wallpapers/aurora.png

Default structure is auto-seeded on first launch.

```js
---

## 🔧 `configuration.md`
```markdown
# Configuration

_Last updated: October 2025_

All settings and preferences for Desktop4Kids are stored in JSON format inside each user's Config folder.

---

## ⚙️ File Paths
```
users/<username>/Config/settings.json

```js
---

## Example:
```json
{
  "theme": "dark",
  "wallpaper": "assets/wallpapers/aurora.png"
}
```
------------------------------------------------------

**Global App Data**
```text
appdata/
├── profiles.json
├── avatars/
```

------------------------------------------------------

## Editable Settings

**Key**	                        **Type**	            **Description**
    theme	                    string	            Sets color theme (dark, light, etc.)
    wallpaper	                string	            Path to current wallpaper
    volume	number	            Global              audio volume
    notifications	            boolean	            Toggle app alerts
    
```js

---

## 👤 `accounts.md`
```markdown
# Account System

_Last updated: October 2025_

The account system provides isolated user environments.

---

## Structure
```

```text
users/
├── Guest/
├── Alice/
├── Bob/
```

```sql
Each user folder contains:
```

Desktop/
Documents/
Pictures/
Videos/
Music/
Downloads/
Games/
Config/

```js

---

## Profile Storage
All profiles are stored in:
```

appdata/profiles.json

```css

Example:
```json
[
  { "id": "Alice", "pin": "1234", "role": "child" },
  { "id": "Parent", "pin": "", "role": "parent" }
]
```

------------------------------------------------------

## Core Files

**File**	                **Purpose**
-accounts.js	            Front-end logic, login/register modals
-preload.js	                Secure IPC bridge between renderer and main
-main.js	                Handles account switching & path sandboxing

```text
Desktop4KidsFS/
├── users/
│ ├── Guest/
│ ├── <username>/
│ │ ├── Desktop/
│ │ ├── Documents/
│ │ ├── Pictures/
│ │ ├── Config/
│ │ └── ...
├── appdata/
└── system/
```
