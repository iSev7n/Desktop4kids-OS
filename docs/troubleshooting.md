# Troubleshooting

_Last updated: October 2025_

------------------------------------------------------

## 🔒 Access Denied Errors
**Cause:** Attempting to access protected paths like `system/`, `assets/`, or another user’s folder.  
**Fix:** Ensure your code calls `window.fsAPI` with valid paths (`~/Documents`, `~/Pictures`, etc.).

------------------------------------------------------

## 🖼️ Missing Avatars

If you see: 
GET file:///.../apps/settings/assets/ui/default-avatar.svg net::ERR_FILE_NOT_FOUND

**Fix:** Update the path in `settings.html` to:

../../assets/ui/default-avatar.svg

------------------------------------------------------

## ⚠️ Uncaught TypeError
Occurs when JS tries to call `.classList` or `.addEventListener` on a missing element.  
Check that element IDs in `settings.html` match what your JS expects.

------------------------------------------------------

## 💾 Quota Reached
Each account has a 50 MB limit. Delete files or increase `QUOTA_BYTES` in `accounts.js` to expand it.

