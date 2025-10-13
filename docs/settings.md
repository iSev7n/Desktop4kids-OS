# Settings Application

_Last updated: October 2025_

The Settings app provides control over accounts, personalization, and system behavior.

------------------------------------------------------

## Structure
- `apps/settings/settings.html`
- `apps/settings/settings.js`
- `apps/settings/settings.css`

------------------------------------------------------

## Sections (Panes)
| Section | Purpose |
|----------|----------|
| **Account** | View/change username, PIN, and avatar |
| **Storage** | Show used quota and clear data |
| **Personalize** | Manage theme, wallpaper, and UI style |
| **Updates** | System version and patch info |
| **About** | Credits and license details |

------------------------------------------------------

## Extending
To add a new pane:
1. Add a `<section data-pane="newpane">` in `settings.html`
2. Add a `<button data-go="newpane">` to the sidebar
3. Initialize a new function like `newPaneInit()` in `settings.js`
4. Register it under the global init chain
