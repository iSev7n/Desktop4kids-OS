# Contributing to Desktop4Kids OS

Thanks for your interest in contributing to **Desktop4Kids OS**. This project is focused on creating a **safe, offline-first desktop environment for children** with a strong emphasis on **security, stability, and usability**.

## Ways to Contribute

- Report bugs (UI issues, app behavior, file system edge cases)
- Suggest features (especially kid-safe + parent/educator focused)
- Improve documentation (README, FAQ, installation steps)
- Submit code changes (apps, UI polish, performance improvements)

## Before You Start

Please check:
- Existing Issues (open + closed)
- The Roadmap section in the README

If you’re proposing a feature, open an Issue first so we can align on approach before code is written.

## Development Setup

```bash
git clone https://github.com/iSev7n/Desktop4Kids-OS.git
cd Desktop4Kids-OS
npm install
npm start
```

AI model notes:
- Place your `.gguf` model in `models/`
- Update `MODEL_FILENAME` in `ai-runtime.js` if using a different model

## Branching & Pull Requests

- Create a feature branch from `main`
- Keep PRs small and focused
- Include screenshots for UI changes
- Clearly describe what changed, why it changed, and how to test it

## Security Rules (Important)

Desktop4Kids OS uses Electron. Contributions must respect the security model.

### Required
- Keep `preload.js` minimal
- Validate all IPC inputs (types, paths, expected formats)
- Prefer `ipcRenderer.invoke()` patterns
- Treat the preload bridge like a public API surface

### Avoid
- Expanding IPC surface unnecessarily
- Exposing raw filesystem access to the renderer
- Enabling insecure Electron features (such as `remote`)
- Adding network access without review

## Testing Expectations

Confirm that:
- The app boots and loads the desktop
- Window management still works correctly
- File operations behave safely
- No cross-user data leakage occurs
- Mentor AI starts correctly when a model is present

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 license.
