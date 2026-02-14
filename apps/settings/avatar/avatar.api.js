// avatar.api.js
// Public API shim (keeps window.Avatars.initAvatarModal the same as before)
(function () {
  const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
  window.Avatars = window.Avatars || {};
  window.Avatars.initAvatarModal = function initAvatarModal({ onPick } = {}) {
    return A.initEditor?.(onPick);
  };
})();
