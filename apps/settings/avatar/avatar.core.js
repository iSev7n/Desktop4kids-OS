// avatar.core.js
// Auto-split from apps/settings/avatar.js (no behavior changes)
(function () {
  const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
  /*
    Desktop4Kids - Avatar Builder Module
    Hair = PNG overlays from assets/avatars/avatar_hair_0X/avatar_hair_color.png
  */

  // =========================
  // DOM helpers
  // =========================
  const $ = (A.$ = (sel) => document.querySelector(sel));

  const Modal = (A.Modal = {
    wrap: null,
    closeBtn: null,
    show() {
      this.wrap?.classList?.remove("hidden");
      this.wrap?.setAttribute("aria-hidden", "false");
    },
    hide() {
      this.wrap?.classList?.add("hidden");
      this.wrap?.setAttribute("aria-hidden", "true");
    },
  });

  const toSvgDataUrl = (A.toSvgDataUrl = (svg) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`);

  // =========================
  // Hair PNG embed cache (required for data-URL SVG previews)
  // =========================
  const HairPngCache = (A.HairPngCache = new Map()); // src -> dataURL
  const HairPngLoading = (A.HairPngLoading = new Map()); // src -> Promise

  async function pngToDataUrl(src) {
    if (HairPngCache.has(src)) return HairPngCache.get(src);
    if (HairPngLoading.has(src)) return HairPngLoading.get(src);

    const p = (async () => {
      const res = await fetch(src, { cache: "force-cache" });
      if (!res.ok) throw new Error(`Failed to load hair PNG: ${src} (${res.status})`);
      const blob = await res.blob();

      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
      });

      HairPngCache.set(src, dataUrl);
      HairPngLoading.delete(src);
      return dataUrl;
    })();

    HairPngLoading.set(src, p);
    return p;
  }

  A.pngToDataUrl = pngToDataUrl;
A.Modal = Modal;
A.$ = $;
A.toSvgDataUrl = toSvgDataUrl;
})();
