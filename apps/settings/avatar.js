// apps/settings/avatar.js
(function () {
  /*
    Desktop4Kids - Avatar Builder Module
    Hair = PNG overlays from assets/avatars/avatar_hair_0X/avatar_hair_color.png
  */

  // =========================
  // DOM helpers
  // =========================
  const $ = (sel) => document.querySelector(sel);

  const Modal = {
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
  };

  const toSvgDataUrl = (svg) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

  // =========================
  // Hair PNG embed cache (required for data-URL SVG previews)
  // =========================
  const HairPngCache = new Map(); // src -> dataURL
  const HairPngLoading = new Map(); // src -> Promise

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

  // =========================
  // Options
  // =========================
  const SKINS = [
    { id: "peach", name: "Peach", fill: "#FFD4B8", shade: "#F2B79C", blush: "#F19C9C" },
    { id: "light", name: "Light", fill: "#FFE3C4", shade: "#F4C8A0", blush: "#F3A3A3" },
    { id: "tan", name: "Tan", fill: "#F6C39B", shade: "#E3A77D", blush: "#E59A9A" },
    { id: "brown", name: "Brown", fill: "#D8A079", shade: "#C08863", blush: "#D58B8B" },
    { id: "deep", name: "Deep", fill: "#A86F4D", shade: "#8B563C", blush: "#B97272" },
    { id: "dark", name: "Dark", fill: "#7A4A33", shade: "#623928", blush: "#9E6161" },
  ];

  // Hair styles correspond to folder names:
  // ../../assets/avatars/avatar_hair_01/ ... avatar_hair_06/
  // Each folder contains avatar_hair_black.png, avatar_hair_blonde.png, etc.
  // dx/dy/scale let you position each style.

  const HAIRS = [
    { id: "01", name: "Hair 01", dx: -2.1, dy: -4, scale: 0.70 },
    { id: "02", name: "Hair 02", dx:  1, dy: -1, scale: 0.64 },
    { id: "03", name: "Hair 03", dx: -1, dy: -4, scale: 0.68 },
    { id: "04", name: "Hair 04", dx: -1, dy: -1, scale: 0.65 },
    { id: "05", name: "Hair 05", dx: -1, dy: -1, scale: 0.65 },
    { id: "06", name: "Hair 06", dx: -1, dy: -5.5, scale: 0.65 },
    { id: "07", name: "Hair 07", dx:  2, dy: -5, scale: 0.65 },
    { id: "08", name: "Hair 08", dx: -1, dy: -4, scale: 0.66 },
    { id: "09", name: "Hair 09", dx: -1.5, dy: -41, scale: 0.67 },
    { id: "10", name: "Hair 10", dx: -1, dy: -8, scale: 0.59 },
    { id: "11", name: "Hair 11", dx: -1.5, dy: -2.5, scale: 0.67 },
    { id: "12", name: "Hair 12", dx: -1, dy: -12, scale: 0.55 },
    { id: "13", name: "Hair 13", dx: -2, dy: -5, scale: 0.65 },
    { id: "14", name: "Hair 14", dx: -1, dy: -12.5, scale: 0.62 },
    { id: "15", name: "Hair 15", dx: -1, dy: -16, scale: 0.60 },
    { id: "16", name: "Hair 16", dx: -1, dy: -11, scale: 0.63 },
    { id: "17", name: "Hair 17", dx:  2, dy: -10, scale: 0.59 },
    { id: "18", name: "Hair 18", dx:  0, dy: -24, scale: 0.55 },
    { id: "19", name: "Hair 19", dx:  0, dy: -12, scale: 0.58 },
    { id: "20", name: "Hair 20", dx:  1, dy:  18, scale: 0.98 },
  ];

  const HAIR_COLORS = [
    { id: "black", name: "Black" },
    { id: "blonde", name: "Blonde" },
    { id: "blue", name: "Blue" },
    { id: "brown", name: "Brown" },
    { id: "green", name: "Green" },
    { id: "grey", name: "Grey" },
    { id: "purple", name: "Purple" },
    { id: "red", name: "Red" },
  ];

    const HAIR_COLOR_MAP = {
    black: "#1a1a1a",
    brown: "#5A3A22",
    blonde: "#D6A94E",
    blue: "#2E6BFF",
    green: "#2F9E44",
    grey: "#7A7A7A",
    purple: "#7C4DFF",
    red: "#B83232",
  };

  const OUTFIT_COLORS = [
    { id: "navy", name: "Navy", fill: "#1B2742" },
    { id: "midnight", name: "Midnight", fill: "#0F172A" },
    { id: "teal", name: "Teal", fill: "#1AA6A0" },
    { id: "forest", name: "Forest", fill: "#1F7A4C" },
    { id: "emerald", name: "Emerald", fill: "#2BB673" },
    { id: "mustard", name: "Mustard", fill: "#D4A017" },
    { id: "orange", name: "Orange", fill: "#FF8A4C" },
    { id: "crimson", name: "Crimson", fill: "#C0392B" },
    { id: "rose", name: "Rose", fill: "#E0568C" },
    { id: "purple", name: "Purple", fill: "#7C4DFF" },
    { id: "lavender", name: "Lavender", fill: "#A78BFA" },
    { id: "charcoal", name: "Charcoal", fill: "#374151" },
  ];

  const BG_COLORS = [
    { id: "transparent", name: "Transparent", type: "none" },
    { id: "aurora", name: "Aurora", type: "gradient", from: "#5EE7DF", to: "#B490CA" },
    { id: "sunset", name: "Sunset", type: "gradient", from: "#FF758C", to: "#FF7EB3" },
    { id: "ocean", name: "Ocean", type: "gradient", from: "#2193B0", to: "#6DD5ED" },
    { id: "royal", name: "Royal", type: "gradient", from: "#7F00FF", to: "#E100FF" },
    { id: "forest", name: "Forest", type: "gradient", from: "#134E5E", to: "#71B280" },
    { id: "sky", name: "Sky", type: "gradient", from: "#56CCF2", to: "#2F80ED" },
    { id: "peachGlow", name: "Peach Glow", type: "gradient", from: "#FF9966", to: "#FF5E62" },
    { id: "mintPop", name: "Mint Pop", type: "gradient", from: "#43E97B", to: "#38F9D7" },
    { id: "deepSpace", name: "Deep Space", type: "gradient", from: "#141E30", to: "#243B55" },
    { id: "lavenderDream", name: "Lavender Dream", type: "gradient", from: "#C471F5", to: "#FA71CD" },
  ];

  const EYES = [
    { id: "simple", name: "Simple" },
    { id: "cute", name: "Cute" },
    { id: "wide", name: "Wide" },
    { id: "happy", name: "Happy" },
    { id: "sleepy", name: "Sleepy" },
    { id: "wink", name: "Wink" },
    { id: "focused", name: "Focused" },
    { id: "sparkle", name: "Sparkle" },
    { id: "angry", name: "Angry" },
    { id: "shy", name: "Shy" },
  ];

  const MOUTHS = [
    { id: "smile", name: "Smile" },
    { id: "softSmile", name: "Soft Smile" },
    { id: "meh", name: "Meh" },
    { id: "grin", name: "Grin" },
    { id: "smirk", name: "Smirk" },
    { id: "open", name: "Open" },
    { id: "laugh", name: "Laugh" },
    { id: "frown", name: "Frown" },
    { id: "oof", name: "Oof" },
    { id: "bigSmile", name: "Big Smile" },
    { id: "tinySmile", name: "Tiny Smile" },
    { id: "surprised", name: "Surprised" },
    { id: "tongue", name: "Tongue Out" },
    { id: "teeth", name: "Teeth Smile" },
    { id: "pout", name: "Pout" },
  ];

  const OUTFITS = [
    { id: "hoodie", name: "Hoodie" },
    { id: "tee", name: "T-Shirt" },
    { id: "sweater", name: "Sweater" },
    { id: "jacket", name: "Jacket" },
    { id: "denim", name: "Denim Shirt" },
    { id: "jersey", name: "Jersey" },
    { id: "collar", name: "Collar" },
    { id: "blazer", name: "Blazer" },
    { id: "tankTop", name: "Tank Top" },
    { id: "polo", name: "Polo" },
    { id: "varsity", name: "Varsity Jacket" },
    { id: "teeV", name: "V-Neck No Sleeves" },
  ];

  const ACCESSORIES = [
    { id: "none", name: "None" },
    { id: "glasses", name: "Glasses" },
    { id: "roundGlasses", name: "Round Glasses" },
    { id: "sunglasses", name: "Sunglasses" },
    { id: "goggles", name: "Goggles" },
    { id: "headphones", name: "Headphones" },
    { id: "bow", name: "Bow" },
    { id: "monocle", name: "Monocle" },
    { id: "flower", name: "Hair Flower" },
    { id: "feather", name: "Feather" },
    { id: "earrings", name: "Earrings" },
    { id: "colorGlassesBlue", name: "Blue Glasses" },
    { id: "colorGlassesPink", name: "Pink Glasses" },
    { id: "bandana", name: "Bandana" },
    { id: "bowtie", name: "Bow Tie" },
    { id: "necklace", name: "Necklace" },
  ];

  // =========================
  // Helpers
  // =========================
  function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function defaultConfig() {
    return {
      skin: SKINS[3].id,
      hair: HAIRS[4].id,
      hairColor: "brown",
      eyes: EYES[0].id,
      mouth: MOUTHS[0].id,
      outfit: OUTFITS[0].id,
      outfitColor: OUTFIT_COLORS[0].id,
      accessory: "none",
      bg: "aurora",
    };
  }

  function hairPngPath(hairId, colorId) {
    // avatar.js is in apps/settings/, assets is at project root:
    // ../../assets/avatars/avatar_hair_01/avatar_hair_black.png
    return `../../assets/avatars/avatar_hair_${hairId}/avatar_hair_${colorId}.png`;
  }

  function darkenHex(hex, amt = 0.22) {
  if (!hex || typeof hex !== "string") return "rgba(0,0,0,0.28)";
  let h = hex.trim();
  if (h.startsWith("rgb")) return h;
  if (h[0] === "#") h = h.slice(1);
  if (h.length !== 6) return hex;

  const num = parseInt(h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.floor(r * (1 - amt)));
  g = Math.max(0, Math.floor(g * (1 - amt)));
  b = Math.max(0, Math.floor(b * (1 - amt)));

  return `rgb(${r}, ${g}, ${b})`;
}

// =========================
// Outfit Base (shared torso + sleeves + outline)
// =========================
function outfitBase({ HEAD, c, R }) {
  const neckBaseY = HEAD.cy + R * 0.82;
  const bodyTopY = neckBaseY + R * 0.16;
  const bodyBottomY = 112;

  const bodyLeft = 18;
  const bodyRight = 94;
  const shoulderInset = clamp(R * 0.10, 2.0, 4.0);

  const outline = darkenHex(c, 0.28);
  const sw = clamp(R * 0.085, 1.8, 2.6);

  const topArc = `
    M ${bodyLeft + shoulderInset} ${bodyBottomY}
    V ${bodyTopY + 6}
    C ${bodyLeft + 10} ${bodyTopY - 8}, ${bodyRight - 10} ${bodyTopY - 8}, ${bodyRight - shoulderInset} ${bodyTopY + 6}
    V ${bodyBottomY}
    Z
  `;

const sleeveW = clamp(R * 0.70, 40, 90);
const sleeveH = clamp(R * 0.68, 60, 90);
  const sleeveY = bodyTopY + 10;

const leftSleeveX = bodyLeft - sleeveW * 0.20;
const rightSleeveX = bodyRight - sleeveW * 0.80;

  const sleeves = `
    <rect x="${leftSleeveX}" y="${sleeveY}" width="${sleeveW}" height="${sleeveH}" rx="${sleeveW * 0.35}"
          fill="${darkenHex(c, 0.08)}" stroke="${outline}" stroke-width="${sw}" opacity="0.98"/>
    <rect x="${rightSleeveX}" y="${sleeveY}" width="${sleeveW}" height="${sleeveH}" rx="${sleeveW * 0.35}"
          fill="${darkenHex(c, 0.08)}" stroke="${outline}" stroke-width="${sw}" opacity="0.98"/>
  `;

  const body = `<path d="${topArc}" fill="${c}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>`;

  return { bodyLeft, bodyRight, bodyTopY, bodyBottomY, bodyMid: 56, outline, sw, body, sleeves };
}

  // =========================
  // Parts
  // =========================
  const Parts = {
    eyeStyles: {
      _browsSoft(ctx) {
        const { lx, rx, y, R } = ctx;
        const browY = y - R * 0.22;
        const browW = R * 0.42;
        const browLift = R * 0.06;
        const browT = clamp(R * 0.070, 1.9, 2.7);
        const browColor = ctx.hairColor || "#1a1a1a";

        return `
          <path d="M ${lx - browW * 0.50} ${browY}
                  Q ${lx} ${browY - browLift} ${lx + browW * 0.50} ${browY}"
                stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round" fill="none"/>
          <path d="M ${rx - browW * 0.50} ${browY}
                  Q ${rx} ${browY - browLift} ${rx + browW * 0.50} ${browY}"
                stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round" fill="none"/>
        `;
      },

      simple(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 1.70;
        const pupilR = pr * 1.05;
        const brows = Parts.eyeStyles._browsSoft(ctx);

        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.95"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.95"/>
          <circle cx="${lx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${rx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${lx + pr * 0.65}" cy="${y - pr * 0.55}" r="${pr * 0.45}" fill="white" opacity="0.85"/>
          <circle cx="${rx + pr * 0.65}" cy="${y - pr * 0.55}" r="${pr * 0.45}" fill="white" opacity="0.85"/>
        `;
      },

      cute(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 1.80;
        const pupilR = pr * 1.15;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${lx}" cy="${y + pr * 0.25}" r="${pupilR}" fill="${ink}" opacity="0.88"/>
          <circle cx="${rx}" cy="${y + pr * 0.25}" r="${pupilR}" fill="${ink}" opacity="0.88"/>
          <circle cx="${lx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.85"/>
          <circle cx="${rx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.85"/>`;
      },

      wide(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 1.95;
        const pupilR = pr * 1.10;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${lx}" cy="${y + pr * 0.10}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${rx}" cy="${y + pr * 0.10}" r="${pupilR}" fill="${ink}" opacity="0.90"/>`;
      },

      happy(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y}
                   q ${pr * 3.0} ${pr * 2.2} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.90"/>
          <path d="M ${rx - pr * 3.0} ${y}
                   q ${pr * 3.0} ${pr * 2.2} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.90"/>`;
      },

      sleepy(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
          <path d="M ${rx - pr * 3.0} ${y} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>`;
      },

      wink(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        const scleraR = pr * 2.05;
        const pupilR = pr * 1.05;
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.95"/>
          <circle cx="${lx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
          <circle cx="${lx + pr * 0.65}" cy="${y - pr * 0.55}" r="${pr * 0.45}" fill="white" opacity="0.85"/>
          <path d="M ${rx - pr * 3.0} ${y} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>`;
      },

      focused(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.11, 2.0, 3.2);
        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y - pr * 0.60} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
          <path d="M ${rx - pr * 3.0} ${y - pr * 0.60} h ${pr * 6.0}"
                stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" opacity="0.85"/>
          <circle cx="${lx}" cy="${y + pr * 0.55}" r="${pr * 0.70}" fill="${ink}" opacity="0.82"/>
          <circle cx="${rx}" cy="${y + pr * 0.55}" r="${pr * 0.70}" fill="${ink}" opacity="0.82"/>`;
      },

      sparkle(ctx) {
        const { lx, rx, y, pr, ink } = ctx;
        const scleraR = pr * 2.15;
        const pupilR = pr * 1.10;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        return `${brows}
          <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.96"/>
          <circle cx="${lx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.86"/>
          <circle cx="${rx}" cy="${y + pr * 0.15}" r="${pupilR}" fill="${ink}" opacity="0.86"/>
          <circle cx="${lx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.90"/>
          <circle cx="${rx + pr * 0.75}" cy="${y - pr * 0.70}" r="${pr * 0.55}" fill="white" opacity="0.90"/>
          <circle cx="${lx + pr * 1.35}" cy="${y - pr * 0.05}" r="${pr * 0.22}" fill="white" opacity="0.75"/>
          <circle cx="${rx + pr * 1.35}" cy="${y - pr * 0.05}" r="${pr * 0.22}" fill="white" opacity="0.75"/>`;
      },

angry(ctx) {
  const { lx, rx, y, pr, ink, R, hairColor } = ctx;
  const browColor = hairColor || "rgba(0,0,0,0.55)";

  const browY = y - R * 0.32;
  const browW = R * 0.62;

  const browT = clamp(R * 0.070, 1.9, 2.7);

  const scleraR = pr * 1.90;
  const pupilR = pr * 1.05;

  const pupilY = y + pr * 0.20;

  return `
    <path d="M ${lx - browW * 0.55} ${browY - R * 0.03}
             L ${lx + browW * 0.55} ${browY + R * 0.10}"
          stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round"/>
    <path d="M ${rx + browW * 0.55} ${browY - R * 0.03}
             L ${rx - browW * 0.55} ${browY + R * 0.10}"
          stroke="${browColor}" stroke-width="${browT}" stroke-linecap="round"/>

    <circle cx="${lx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.94"/>
    <circle cx="${rx}" cy="${y}" r="${scleraR}" fill="white" opacity="0.94"/>

    <circle cx="${lx}" cy="${pupilY}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
    <circle cx="${rx}" cy="${pupilY}" r="${pupilR}" fill="${ink}" opacity="0.90"/>
  `;
},

      shy(ctx) {
        const { lx, rx, y, pr, ink, R } = ctx;
        const brows = Parts.eyeStyles._browsSoft(ctx);
        const sw = clamp(R * 0.10, 2.0, 3.0);

        return `${brows}
          <path d="M ${lx - pr * 3.0} ${y} q ${pr * 3.0} ${pr * 1.8} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.88"/>
          <path d="M ${rx - pr * 3.0} ${y} q ${pr * 3.0} ${pr * 1.8} ${pr * 6.0} 0"
                stroke="${ink}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.88"/>`;
      },
    },

    mouthStyles: {
      smile(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `<path d="M ${x0} ${y} C ${HEAD.cx - w * 0.20} ${y + R * 0.22} ${HEAD.cx + w * 0.20} ${y + R * 0.22} ${x1} ${y}"
                      stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>`;
      },

      softSmile(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `<path d="M ${x0 + w * 0.10} ${y} C ${HEAD.cx} ${y + R * 0.14} ${HEAD.cx} ${y + R * 0.14} ${x1 - w * 0.10} ${y}"
                      stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round" opacity="0.9"/>`;
      },

      meh(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `<path d="M ${x0 + w * 0.08} ${y} L ${x1 - w * 0.08} ${y}"
                      stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round" opacity="0.9"/>`;
      },

      grin(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `
          <path d="M ${x0 + w * 0.08} ${y}
                   C ${HEAD.cx - w * 0.15} ${y + R * 0.16} ${HEAD.cx + w * 0.15} ${y + R * 0.16} ${x1 - w * 0.08} ${y}"
                stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>
          <path d="M ${x0 + w * 0.18} ${y + R * 0.12}
                   C ${HEAD.cx} ${y + R * 0.22} ${HEAD.cx} ${y + R * 0.22} ${x1 - w * 0.18} ${y + R * 0.12}"
                stroke="rgba(0,0,0,0.16)" stroke-width="${t * 0.55}" fill="none" stroke-linecap="round"/>`;
      },

      smirk(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `<path d="M ${x0 + w * 0.08} ${y + R * 0.04}
                      C ${HEAD.cx - w * 0.10} ${y + R * 0.20} ${HEAD.cx + w * 0.10} ${y + R * 0.06} ${x1 - w * 0.08} ${y - R * 0.06}"
                      stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>`;
      },

      open(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const rx = clamp(R * 0.18, 4.6, 6.6);
        const ry = clamp(R * 0.22, 5.8, 8.2);
        return `
          <ellipse cx="${HEAD.cx}" cy="${y + R * 0.10}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.18)"/>
          <ellipse cx="${HEAD.cx}" cy="${y + R * 0.12}" rx="${rx * 0.78}" ry="${ry * 0.72}" fill="${ink}" opacity="0.82"/>`;
      },

      laugh(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `
          <path d="M ${x0 - w * 0.05} ${y}
                   C ${HEAD.cx - w * 0.25} ${y + R * 0.40} ${HEAD.cx + w * 0.25} ${y + R * 0.40} ${x1 + w * 0.05} ${y}"
                stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>
          <path d="M ${x0 + w * 0.12} ${y + R * 0.18}
                   C ${HEAD.cx} ${y + R * 0.30} ${HEAD.cx} ${y + R * 0.30} ${x1 - w * 0.12} ${y + R * 0.18}"
                stroke="rgba(0,0,0,0.16)" stroke-width="${t * 0.55}" fill="none" stroke-linecap="round"/>`;
      },

      frown(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        const x0 = HEAD.cx - w * 0.5;
        const x1 = HEAD.cx + w * 0.5;
        const t = clamp(R * 0.10, 2.2, 3.4);
        return `<path d="M ${x0} ${y + R * 0.12}
                      C ${HEAD.cx - w * 0.20} ${y - R * 0.08} ${HEAD.cx + w * 0.20} ${y - R * 0.08} ${x1} ${y + R * 0.12}"
                      stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>`;
      },
      oof(ctx) {
        const { HEAD, ink, R } = ctx;
        const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
        const w = clamp(ctx.MOUTH.w, R * 0.75, R * 1.10);
        return `<rect x="${HEAD.cx - w * 0.22}" y="${y - R * 0.02}"
                      width="${w * 0.44}" height="${R * 0.22}" rx="${R * 0.11}"
                      fill="${ink}" opacity="0.85"/>`;
      },
      bigSmile(ctx) {
  const { HEAD, ink, R } = ctx;
  const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
  const w = clamp(ctx.MOUTH.w, R * 0.9, R * 1.25);
  const x0 = HEAD.cx - w * 0.5;
  const x1 = HEAD.cx + w * 0.5;
  const t = clamp(R * 0.11, 2.4, 3.6);

  return `<path d="M ${x0} ${y}
                 C ${HEAD.cx - w * 0.25} ${y + R * 0.35}
                   ${HEAD.cx + w * 0.25} ${y + R * 0.35}
                   ${x1} ${y}"
                stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>`;
},

tinySmile(ctx) {
  const { HEAD, ink, R } = ctx;
  const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.40, HEAD.cy + R * 0.75);
  const w = clamp(ctx.MOUTH.w, R * 0.35, R * 0.55);
  const x0 = HEAD.cx - w * 0.5;
  const x1 = HEAD.cx + w * 0.5;
  const t = clamp(R * 0.08, 2, 3);

  return `<path d="M ${x0} ${y}
                 C ${HEAD.cx} ${y + R * 0.10}
                   ${HEAD.cx} ${y + R * 0.10}
                   ${x1} ${y}"
                stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>`;
},

surprised(ctx) {
  const { HEAD, ink, R } = ctx;
  const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
  const r = clamp(R * 0.18, 5, 9);

  return `<circle cx="${HEAD.cx}" cy="${y + R * 0.10}"
                  r="${r}"
                  stroke="${ink}" stroke-width="${R * 0.10}"
                  fill="none"/>`;
},

tongue(ctx) {
  const { HEAD, ink, R } = ctx;
  const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
  const w = clamp(ctx.MOUTH.w, R * 0.7, R * 1.0);
  const x0 = HEAD.cx - w * 0.5;
  const x1 = HEAD.cx + w * 0.5;
  const t = clamp(R * 0.10, 2.2, 3.4);

  return `
    <path d="M ${x0} ${y}
             C ${HEAD.cx - w * 0.2} ${y + R * 0.20}
               ${HEAD.cx + w * 0.2} ${y + R * 0.20}
               ${x1} ${y}"
          stroke="${ink}" stroke-width="${t}" fill="none" stroke-linecap="round"/>
    <ellipse cx="${HEAD.cx}" cy="${y + R * 0.25}"
             rx="${w * 0.18}" ry="${R * 0.20}"
             fill="rgba(255,100,120,0.9)"/>`;
},

teeth(ctx) {
  const { HEAD, ink, R } = ctx;
  const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.35, HEAD.cy + R * 0.75);
  const w = clamp(ctx.MOUTH.w, R * 0.7, R * 1.0);
  const h = R * 0.22;

  return `
    <rect x="${HEAD.cx - w * 0.5}"
          y="${y}"
          width="${w}"
          height="${h}"
          rx="${R * 0.05}"
          fill="white"
          stroke="${ink}"
          stroke-width="${R * 0.08}"/>
    <line x1="${HEAD.cx - w * 0.5}" y1="${y + h/2}"
          x2="${HEAD.cx + w * 0.5}" y2="${y + h/2}"
          stroke="${ink}" stroke-width="${R * 0.06}"/>`;
},

pout(ctx) {
  const { HEAD, ink, R } = ctx;
  const y = clamp(ctx.MOUTH.y, HEAD.cy + R * 0.40, HEAD.cy + R * 0.75);
  const w = clamp(ctx.MOUTH.w, R * 0.5, R * 0.8);
  const x0 = HEAD.cx - w * 0.5;
  const x1 = HEAD.cx + w * 0.5;
  const t = clamp(R * 0.10, 2.2, 3.4);

  return `<path d="M ${x0} ${y + R * 0.08}
                 C ${HEAD.cx} ${y - R * 0.08}
                   ${HEAD.cx} ${y - R * 0.08}
                   ${x1} ${y + R * 0.08}"
                stroke="${ink}" stroke-width="${t}"
                fill="none" stroke-linecap="round"/>`;
},

    },

   outfitStyles: {
  hoodie(ctx) {
    const b = outfitBase(ctx);
    const { bodyMid, bodyTopY } = b;

    return `
      ${b.sleeves}
      ${b.body}

      <path d="M ${bodyMid - 24} ${bodyTopY + 6}
               C ${bodyMid - 12} ${bodyTopY - 10}, ${bodyMid + 12} ${bodyTopY - 10}, ${bodyMid + 24} ${bodyTopY + 6}
               C ${bodyMid + 10} ${bodyTopY + 18}, ${bodyMid - 10} ${bodyTopY + 18}, ${bodyMid - 24} ${bodyTopY + 6}
               Z" fill="rgba(255,255,255,0.10)"/>

      <path d="M ${bodyMid - 10} ${bodyTopY + 18} v 12"
            stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round"/>
      <path d="M ${bodyMid + 10} ${bodyTopY + 18} v 12"
            stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round"/>
    `;
  },

  tee(ctx) {
    const b = outfitBase(ctx);
    const { bodyMid, bodyTopY } = b;

    return `
      ${b.sleeves}
      ${b.body}

      <path d="M ${bodyMid - 14} ${bodyTopY + 2}
               h 28
               v 8
               c 0 10 -28 10 -28 0
               z" fill="rgba(0,0,0,0.10)"/>
    `;
  },

  sweater(ctx) {
    const b = outfitBase(ctx);
    const { bodyLeft, bodyRight, bodyTopY } = b;

    return `
      ${b.sleeves}
      ${b.body}

      <path d="M ${bodyLeft + 12} ${bodyTopY + 34} H ${bodyRight - 12}"
            stroke="rgba(255,255,255,0.16)" stroke-width="4" stroke-linecap="round"/>
    `;
  },

  denim(ctx) {
  const b = outfitBase(ctx);
  const { bodyMid, bodyTopY, bodyBottomY, bodyLeft, bodyRight } = b;

  const seam = "rgba(255,255,255,0.14)";
  const shadow = "rgba(0,0,0,0.18)";

  return `
    ${b.sleeves}
    ${b.body}

    <!-- center button placket -->
    <path d="M ${bodyMid} ${bodyTopY + 2} V ${bodyBottomY - 2}"
          stroke="${shadow}" stroke-width="3" stroke-linecap="round"/>

    <!-- collar (smaller than polo) -->
    <path d="
      M ${bodyMid - 16} ${bodyTopY + 6}
      L ${bodyMid} ${bodyTopY + 18}
      L ${bodyMid + 16} ${bodyTopY + 6}
      Z"
      fill="${darkenHex(ctx.c, 0.18)}"/>

    <!-- yoke seam -->
    <path d="M ${bodyLeft + 10} ${bodyTopY + 20} H ${bodyRight - 10}"
          stroke="${seam}" stroke-width="3" stroke-linecap="round"/>

    <!-- left chest pocket -->
    <path d="
      M ${bodyMid - 30} ${bodyTopY + 30}
      h 18
      v 16
      c 0 4 -18 4 -18 0
      z"
      fill="rgba(0,0,0,0.08)"
      stroke="${seam}"
      stroke-width="2"
      stroke-linejoin="round"/>

    <!-- right chest pocket -->
    <path d="
      M ${bodyMid + 12} ${bodyTopY + 30}
      h 18
      v 16
      c 0 4 -18 4 -18 0
      z"
      fill="rgba(0,0,0,0.08)"
      stroke="${seam}"
      stroke-width="2"
      stroke-linejoin="round"/>

    <!-- subtle vertical seams -->
    <path d="M ${bodyMid - 22} ${bodyTopY + 22} V ${bodyBottomY - 10}"
          stroke="${seam}" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${bodyMid + 22} ${bodyTopY + 22} V ${bodyBottomY - 10}"
          stroke="${seam}" stroke-width="2" stroke-linecap="round"/>

    <!-- buttons -->
    <circle cx="${bodyMid}" cy="${bodyTopY + 34}" r="1.8" fill="rgba(255,255,255,0.55)"/>
    <circle cx="${bodyMid}" cy="${bodyTopY + 48}" r="1.8" fill="rgba(255,255,255,0.55)"/>
    <circle cx="${bodyMid}" cy="${bodyTopY + 62}" r="1.8" fill="rgba(255,255,255,0.55)"/>
  `;
},

jersey(ctx) {
  const b = outfitBase(ctx);
  const { bodyMid, bodyTopY, bodyBottomY, bodyLeft, bodyRight } = b;

  const rib = darkenHex(ctx.c, 0.22);
  const stripe = "rgba(255,255,255,0.35)";
  const seam = "rgba(0,0,0,0.14)";

  // If you have ctx.seed (or similar), this makes a stable “random” 0-99 number.
  // Otherwise it falls back to 7.
  const seedNum =
    typeof ctx.seed === "number"
      ? Math.abs(ctx.seed) % 100
      : (typeof ctx.id === "number" ? Math.abs(ctx.id) % 100 : 17);

  const num = String(seedNum).padStart(2, "0");

  // chest number placement
  const numY = bodyTopY + (bodyBottomY - bodyTopY) * 0.96;

  return `
    ${b.sleeves}
    ${b.body}

    <!-- rib collar -->
    <path d="M ${bodyMid - 16} ${bodyTopY + 2}
             h 32
             v 10
             c 0 10 -32 10 -32 0
             z"
          fill="${rib}"/>

    <!-- collar highlight -->
    <path d="M ${bodyMid - 12} ${bodyTopY + 6}
             h 24"
          stroke="rgba(255,255,255,0.18)"
          stroke-width="2"
          stroke-linecap="round"/>

    <!-- sleeve stripes (left) -->
    <path d="M ${bodyLeft + 2} ${bodyTopY + 26} H ${bodyLeft + 24}"
          stroke="${stripe}" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${bodyLeft + 2} ${bodyTopY + 32} H ${bodyLeft + 24}"
          stroke="${stripe}" stroke-width="3" stroke-linecap="round"/>

    <!-- sleeve stripes (right) -->
    <path d="M ${bodyRight - 24} ${bodyTopY + 26} H ${bodyRight - 2}"
          stroke="${stripe}" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${bodyRight - 24} ${bodyTopY + 32} H ${bodyRight - 2}"
          stroke="${stripe}" stroke-width="3" stroke-linecap="round"/>

    <!-- side seams -->
    <path d="M ${bodyLeft + 10} ${bodyTopY + 18} V ${bodyBottomY - 8}"
          stroke="${seam}" stroke-width="2" stroke-linecap="round"/>
    <path d="M ${bodyRight - 10} ${bodyTopY + 18} V ${bodyBottomY - 8}"
          stroke="${seam}" stroke-width="2" stroke-linecap="round"/>

    <!-- chest number -->
    <text x="${bodyMid}" y="${numY}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial"
          font-weight="900"
          font-size="26"
          fill="rgba(255, 255, 255, 0.79)"
          stroke="rgba(0,0,0,0.22)"
          stroke-width="2"
          paint-order="stroke"
    >${num}</text>

    <!-- small chest shine -->
    <path d="M ${bodyMid - 26} ${bodyTopY + 40}
             C ${bodyMid - 10} ${bodyTopY + 30},
               ${bodyMid + 10} ${bodyTopY + 30},
               ${bodyMid + 26} ${bodyTopY + 40}"
          stroke="rgba(255,255,255,0.12)"
          stroke-width="2"
          stroke-linecap="round"
          fill="none"/>
  `;
},

  jacket(ctx) {
    const b = outfitBase(ctx);
    const { bodyMid, bodyTopY, bodyBottomY } = b;

    return `
      ${b.sleeves}
      ${b.body}

      <path d="M ${bodyMid} ${bodyTopY} V ${bodyBottomY}"
            stroke="rgba(0,0,0,0.22)" stroke-width="3" stroke-linecap="round"/>

      <path d="M ${bodyMid - 20} ${bodyTopY + 14}
               C ${bodyMid - 10} ${bodyTopY + 2}, ${bodyMid - 2} ${bodyTopY + 2}, ${bodyMid + 6} ${bodyTopY + 10}"
            stroke="rgba(255,255,255,0.18)" stroke-width="3" stroke-linecap="round" fill="none"/>
    `;
  },

  collar(ctx) {
    const b = outfitBase(ctx);
    const { bodyMid, bodyTopY } = b;

    return `
      ${b.sleeves}
      ${b.body}

      <path d="M ${bodyMid - 18} ${bodyTopY + 6}
               L ${bodyMid} ${bodyTopY + 24}
               L ${bodyMid + 18} ${bodyTopY + 6}"
            fill="rgba(0,0,0,0.12)"/>

      <path d="M ${bodyMid - 10} ${bodyTopY + 10}
               L ${bodyMid} ${bodyTopY + 20}
               L ${bodyMid + 10} ${bodyTopY + 10}"
            fill="rgba(255,255,255,0.10)"/>
    `;
  },

  blazer(ctx) {
  const b = outfitBase(ctx);

  return `
    ${b.sleeves}
    ${b.body}

    <!-- lapels -->
    <path d="
      M ${b.bodyMid - 18} ${b.bodyTopY + 6}
      L ${b.bodyMid - 4} ${b.bodyTopY + 26}
      L ${b.bodyMid - 2} ${b.bodyTopY + 6}
      Z"
      fill="${darkenHex(ctx.c, 0.18)}"/>

    <path d="
      M ${b.bodyMid + 18} ${b.bodyTopY + 6}
      L ${b.bodyMid + 4} ${b.bodyTopY + 26}
      L ${b.bodyMid + 2} ${b.bodyTopY + 6}
      Z"
      fill="${darkenHex(ctx.c, 0.18)}"/>
  `;
},

tankTop(ctx) {
  const { HEAD, c, R, skin } = ctx;

  const stroke = "#1F2433";
  const sw = clamp(R * 0.085, 1.8, 2.6);

  const neckBaseY = HEAD.cy + R * 0.82;
  const bodyTopY = neckBaseY + R * 0.14;
  const bodyBottomY = 112;

  // Torso bounds
  const bodyLeft = 14;
  const bodyRight = 96;
  const shoulderInset = clamp(R * 0.14, 2.8, 5.2);

// Arms (skin colored) - behind everything (rounded shoulder-cap style)
const armW = clamp(R * 0.55, 13, 17);
const armH = clamp(R * 1.05, 24, 30);
const armY = bodyTopY + R * 0.28; // a touch higher helps

const leftArmX  = bodyLeft - armW * 0.45;
const rightArmX = bodyRight - armW * 0.55;

const shoulderDrop = clamp(R * 0.22, 5, 8);    // how far the shoulder cap drops
const shoulderBulge = clamp(R * 0.22, 1, 3);   // how “round” the shoulder looks
const elbowRound = armW * 0.38;                // bottom rounding

const armPath = (x) => {
  const y = armY;
  const w = armW;
  const h = armH;

  const topLx = x;
  const topRx = x + w;
  const botY = y + h;

  return `
    M ${topLx + elbowRound} ${botY}
    Q ${topLx} ${botY} ${topLx} ${botY - elbowRound}
    L ${topLx} ${y + shoulderDrop}
    Q ${topLx + shoulderBulge * 0.15} ${y} ${topLx + w * 0.5} ${y}
    Q ${topRx - shoulderBulge * 0.15} ${y} ${topRx} ${y + shoulderDrop}
    L ${topRx} ${botY - elbowRound}
    Q ${topRx} ${botY} ${topRx - elbowRound} ${botY}
    Z
  `;
};

const arms = `
  <path d="${armPath(leftArmX)}"
        fill="${skin.fill}" stroke="${stroke}" stroke-width="${sw}" opacity="0.98"
        stroke-linejoin="round"/>
  <path d="${armPath(rightArmX)}"
        fill="${skin.fill}" stroke="${stroke}" stroke-width="${sw}" opacity="0.98"
        stroke-linejoin="round"/>
`;

  // --- Torso (skin base) ---
  const torsoD = `
    M ${bodyLeft + shoulderInset} ${bodyBottomY}
    V ${bodyTopY + 10}
    C ${bodyLeft + 14} ${bodyTopY - 10},
      ${bodyRight - 14} ${bodyTopY - 10},
      ${bodyRight - shoulderInset} ${bodyTopY + 10}
    V ${bodyBottomY}
    Z
  `;

  const torso = `
    <path d="${torsoD}"
          fill="${skin.fill}"
          stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
  `;

  // --- Tank top geometry values (DEFINE THESE BEFORE USING THEM) ---
  const clipId = `torsoClip_${Math.random().toString(16).slice(2)}`;

  // Raise tank on shoulders
  const shirtTopY = bodyTopY - 3;        // higher than before
  const shirtBottomY = bodyBottomY - 2;

  // Neckline sizing
  const necklineDepth = clamp(R * 0.70, 14, 22); 
  const necklineWidth = clamp(R * 1.10, 24, 34);
  const neckDrop = clamp(R * 0.12, 2, 4);  

  // Smaller inset = thicker straps = more shoulder coverage
  const strapInset = clamp(R * 0.22, 4, 7);

  // Shirt outer edges (where straps meet shoulders)
  const xL = bodyLeft + shoulderInset + 5;
  const xR = bodyRight - shoulderInset - 5;

  // Inner strap edges (near neckline)
  const xLi = xL + strapInset;
  const xRi = xR - strapInset;

  const tank = `
    <defs>
      <clipPath id="${clipId}">
        <path d="${torsoD}"/>
      </clipPath>
    </defs>

    <g clip-path="url(#${clipId})">

      <!-- Main tank shape -->
      <path d="
        M ${xL} ${shirtBottomY}
        V ${shirtTopY}
        L ${xLi} ${shirtTopY}
        C ${HEAD.cx - necklineWidth} ${shirtTopY - 2},
          ${HEAD.cx + necklineWidth} ${shirtTopY - 2},
          ${xRi} ${shirtTopY}
        L ${xR} ${shirtTopY}
        V ${shirtBottomY}
        Z
      "
      fill="${c}"
      stroke="${stroke}"
      stroke-width="${sw}"
      stroke-linejoin="round"/>

      <!-- Mask the top stroke behind the neck/shoulders (removes that thin line) -->
      <rect
        x="${HEAD.cx - necklineWidth * 1.45}"
        y="${shirtTopY - sw - 6}"
        width="${necklineWidth * 2.9}"
        height="${sw + 10}"
        fill="${skin.fill}"
      />

      <!-- Stroke eraser: bigger + a little deeper to fully hide the halo line -->
      <path d="
        M ${HEAD.cx - necklineWidth * 0.88} ${shirtTopY + 0 + neckDrop}
        C ${HEAD.cx - necklineWidth * 0.42} ${shirtTopY + necklineDepth + neckDrop + 4},
          ${HEAD.cx + necklineWidth * 0.42} ${shirtTopY + necklineDepth + neckDrop + 4},
          ${HEAD.cx + necklineWidth * 0.88} ${shirtTopY + 0 + neckDrop}
        Z
      "
      fill="${skin.fill}"/>


      <!-- Neckline cutout (shows skin) -->
      <path d="
        M ${HEAD.cx - necklineWidth * 0.78} ${shirtTopY + 2 + neckDrop}
        C ${HEAD.cx - necklineWidth * 0.36} ${shirtTopY + necklineDepth + neckDrop},
          ${HEAD.cx + necklineWidth * 0.36} ${shirtTopY + necklineDepth + neckDrop},
          ${HEAD.cx + necklineWidth * 0.78} ${shirtTopY + 2 + neckDrop}
        Z
      "
      fill="${skin.fill}"/>

      <!-- Tiny inner shadow (optional) -->
      <path d="
        M ${HEAD.cx - necklineWidth * 0.70} ${shirtTopY + 4}
        C ${HEAD.cx - necklineWidth * 0.33} ${shirtTopY + necklineDepth - 2},
          ${HEAD.cx + necklineWidth * 0.33} ${shirtTopY + necklineDepth - 2},
          ${HEAD.cx + necklineWidth * 0.70} ${shirtTopY + 4}
      "
      fill="none"
      stroke="rgba(0,0,0,0.10)"
      stroke-width="${sw * 0.9}"
      stroke-linecap="round"/>

    </g>
  `;

  // --- Small highlight (optional) ---
  const highlight = `
    <path d="M ${HEAD.cx - R * 1.00} ${bodyTopY + 26}
             C ${HEAD.cx - R * 0.40} ${bodyTopY + 14},
               ${HEAD.cx + R * 0.60} ${bodyTopY + 18},
               ${HEAD.cx + R * 1.05} ${bodyTopY + 32}"
          stroke="rgba(255,255,255,0.14)"
          stroke-width="${sw * 1.2}"
          stroke-linecap="round"
          fill="none"/>
  `;

  return `${arms}${torso}${tank}${highlight}`;
},

polo(ctx) {
  const b = outfitBase(ctx);

  return `
    ${b.sleeves}
    ${b.body}

    <!-- collar -->
    <path d="
      M ${b.bodyMid - 18} ${b.bodyTopY + 6}
      L ${b.bodyMid} ${b.bodyTopY + 18}
      L ${b.bodyMid + 18} ${b.bodyTopY + 6}
      Z"
      fill="${darkenHex(ctx.c, 0.20)}"/>

    <!-- button line -->
    <path d="
      M ${b.bodyMid} ${b.bodyTopY + 10}
      V ${b.bodyTopY + 30}"
      stroke="rgba(0,0,0,0.25)"
      stroke-width="2"/>
  `;
},

varsity(ctx) {
  const b = outfitBase(ctx);

  return `
    ${b.sleeves}
    ${b.body}

    <!-- white stripes -->
    <path d="M ${b.bodyLeft + 10} ${b.bodyTopY + 14} H ${b.bodyRight - 10}"
          stroke="rgba(255,255,255,0.35)" stroke-width="3"/>

    <path d="M ${b.bodyLeft + 10} ${b.bodyTopY + 20} H ${b.bodyRight - 10}"
          stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
  `;
},

teeV(ctx) {
  const { HEAD, R, c, skin, stroke } = ctx;

  const mid = HEAD.cx;

  // teeV sizing (wider than before)
  const topY = HEAD.cy + R * 1.02;
  const bottomY = 112;

  const left = 14;
  const right = 98;

  // arms (skin color)
  const armW = clamp(R * 0.74, 16, 22);
  const armH = clamp(R * 0.95, 22, 34);
  const armY = topY + 10;

  const leftArmX = left - 4;
  const rightArmX = right - armW + 4;

  const sleeveRX = armW * 0.52;
  const outline = darkenHex(c, 0.28);
  const sw = clamp(R * 0.085, 1.8, 2.7);

  // torso (wider body)
  const torsoPath = `
    M ${left + 6} ${bottomY}
    V ${topY + 6}
    C ${left + 16} ${topY - 12}, ${right - 16} ${topY - 12}, ${right - 6} ${topY + 6}
    V ${bottomY}
    Z
  `;

  // V-neck / undershirt opening
  const vNeck = `
    <path d="M ${mid - 20} ${topY + 10}
             L ${mid} ${topY + 30}
             L ${mid + 20} ${topY + 10}"
          fill="rgba(0,0,0,0.16)"/>
  `;

  // subtle chest highlight
  const highlight = `
    <path d="M ${mid - 26} ${topY + 18}
             C ${mid - 10} ${topY + 10}, ${mid + 10} ${topY + 10}, ${mid + 26} ${topY + 18}"
          stroke="rgba(255,255,255,0.14)" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
  `;

  return `
    <!-- Arms -->
    <rect x="${leftArmX}" y="${armY}" width="${armW}" height="${armH}" rx="${sleeveRX}"
          fill="${skin.fill}" stroke="${stroke}" stroke-width="2" opacity="0.98"/>
    <rect x="${rightArmX}" y="${armY}" width="${armW}" height="${armH}" rx="${sleeveRX}"
          fill="${skin.fill}" stroke="${stroke}" stroke-width="2" opacity="0.98"/>

    <!-- Torso -->
    <path d="${torsoPath}" fill="${c}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>

    ${vNeck}
    ${highlight}
  `;
},

},

    accessoryStyles: {
      none() {
        return "";
      },

      glasses(ctx) {
        const { R, SAFE, lx, rx, y, ink } = ctx;
        const lensW = clamp(R * 0.55, 12, 16);
        const lensH = clamp(R * 0.36, 8.5, 12);
        const rxCorner = clamp(R * 0.18, 3.5, 6.5);
        const sw = clamp(R * 0.10, 2.3, 3.4);

        const leftX = clamp(lx - lensW * 0.55, SAFE.minX, SAFE.maxX);
        const rightX = clamp(rx - lensW * 0.45, SAFE.minX, SAFE.maxX);

        return `
          <rect x="${leftX}" y="${y - lensH * 0.5}" width="${lensW}" height="${lensH}" rx="${rxCorner}"
                fill="rgba(255,255,255,0.06)" stroke="${ink}" stroke-width="${sw}"/>
          <rect x="${rightX}" y="${y - lensH * 0.5}" width="${lensW}" height="${lensH}" rx="${rxCorner}"
                fill="rgba(255,255,255,0.06)" stroke="${ink}" stroke-width="${sw}"/>
          <path d="M ${leftX + lensW} ${y} H ${rightX}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      },

      roundGlasses(ctx) {
        const { R, lx, rx, y, ink } = ctx;
        const sw = clamp(R * 0.10, 2.3, 3.4);
        const rr = clamp(R * 0.26, 6.5, 9.5);
        return `
          <circle cx="${lx}" cy="${y}" r="${rr}" fill="rgba(255,255,255,0.06)" stroke="${ink}" stroke-width="${sw}"/>
          <circle cx="${rx}" cy="${y}" r="${rr}" fill="rgba(255,255,255,0.06)" stroke="${ink}" stroke-width="${sw}"/>
          <path d="M ${lx + rr} ${y} H ${rx - rr}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      },

      sunglasses(ctx) {
        const { R, SAFE, lx, rx, y, ink } = ctx;
        const lensW = clamp(R * 0.55, 16, 16);
        const lensH = clamp(R * 0.36, 10.5, 12);
        const rxCorner = clamp(R * 0.18, 3.5, 6.5);
        const sw = clamp(R * 0.10, 2.3, 3.4);

        const leftX = clamp(lx - lensW * 0.55, SAFE.minX, SAFE.maxX);
        const rightX = clamp(rx - lensW * 0.45, SAFE.minX, SAFE.maxX);

        return `
          <rect x="${leftX}" y="${y - lensH * 0.5}" width="${lensW}" height="${lensH}" rx="${rxCorner}"
                fill="rgba(0,0,0,0.35)" stroke="${ink}" stroke-width="${sw}"/>
          <rect x="${rightX}" y="${y - lensH * 0.5}" width="${lensW}" height="${lensH}" rx="${rxCorner}"
                fill="rgba(0,0,0,0.35)" stroke="${ink}" stroke-width="${sw}"/>
          <path d="M ${leftX + lensW} ${y} H ${rightX}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      },

      goggles(ctx) {
        const { R, SAFE, lx, rx, y, ink } = ctx;
        const lensW = clamp(R * 0.55, 16, 16);
        const lensH = clamp(R * 0.36, 10.5, 12);
        const rxCorner = clamp(R * 0.18, 3.5, 6.5);
        const sw = clamp(R * 0.10, 2.3, 3.4);

        const leftX = clamp(lx - lensW * 0.55, SAFE.minX, SAFE.maxX);
        const rightX = clamp(rx - lensW * 0.45, SAFE.minX, SAFE.maxX);

        return `
          <rect x="${leftX - 1}" y="${y - lensH * 0.55}" width="${lensW + 2}" height="${lensH + 3}" rx="${rxCorner + 2}"
                fill="rgba(0,0,0,0.12)" stroke="${ink}" stroke-width="${sw}"/>
          <rect x="${rightX - 1}" y="${y - lensH * 0.55}" width="${lensW + 2}" height="${lensH + 3}" rx="${rxCorner + 2}"
                fill="rgba(0,0,0,0.12)" stroke="${ink}" stroke-width="${sw}"/>
          <path d="M ${leftX + lensW} ${y} H ${rightX}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      },
      
      headphones(ctx) {
        const { HEAD, ink, R } = ctx;

        const sw = clamp(R * 0.10, 2.4, 3.6);
        const arcY = HEAD.cy - R * 0.32;
        const cupY = HEAD.cy - R * 0.40;

        const leftCupX = HEAD.cx - R * 1.22;
        const rightCupX = HEAD.cx + R * 0.90;

        return `
          <path d="M ${HEAD.cx - R * 1.10} ${arcY}
                   C ${HEAD.cx - R * 1.00} ${HEAD.cy - R * 1.30}
                     ${HEAD.cx + R * 1.00} ${HEAD.cy - R * 1.30}
                     ${HEAD.cx + R * 1.10} ${arcY}"
                fill="none" stroke="${ink}" stroke-width="${sw + 1.0}" stroke-linecap="round"/>

          <rect x="${leftCupX}" y="${cupY}" width="${R * 0.34}" height="${R * 0.86}"
                rx="${R * 0.17}" fill="rgb(190, 190, 190)" stroke="${ink}" stroke-width="${sw * 0.55}"/>

          <rect x="${rightCupX}" y="${cupY}" width="${R * 0.34}" height="${R * 0.86}"
                rx="${R * 0.17}" fill="rgb(190, 190, 190)" stroke="${ink}" stroke-width="${sw * 0.55}"/>
        `;
      },
      bow(ctx) {
        const { HEAD, R } = ctx;
        return `
          <path d="M ${HEAD.cx + R * 0.05} ${HEAD.cy - R * 1.10}
                   c ${-R * 0.35} ${-R * 0.35} ${-R * 0.65} ${-R * 0.35} ${-R * 0.90} 0
                   c ${R * 0.30} ${R * 0.30} ${R * 0.55} ${R * 0.55} ${R * 0.90} ${R * 0.40}
                   c ${R * 0.35} ${-R * 0.15} ${R * 0.60} ${-R * 0.35} ${R * 0.90} ${-R * 0.40}
                   c ${-R * 0.25} ${-R * 0.25} ${-R * 0.60} ${-R * 0.60} ${-R * 0.90} 0 z"
                fill="#F06EAA" opacity="0.90"/>`;
      },

      flower(ctx) {
  const { HEAD, R } = ctx;
  const x = HEAD.cx + R * 0.9;
  const y = HEAD.cy - R * 1.0;
  const r = R * 0.18;

  return `
    <circle cx="${x}" cy="${y}" r="${r}" fill="#FF6FAE"/>
    <circle cx="${x - r}" cy="${y}" r="${r}" fill="#FF9BCB"/>
    <circle cx="${x + r}" cy="${y}" r="${r}" fill="#FF9BCB"/>
    <circle cx="${x}" cy="${y - r}" r="${r}" fill="#FF9BCB"/>
    <circle cx="${x}" cy="${y + r}" r="${r}" fill="#FF9BCB"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#FFD966"/>
  `;
},

monocle(ctx) {
  const { lx, y, R, ink } = ctx;
  const r = R * 0.32;
  const sw = R * 0.08;

  return `
    <circle cx="${lx}" cy="${y}" r="${r}"
            fill="rgba(255,255,255,0.08)"
            stroke="${ink}" stroke-width="${sw}"/>

    <!-- chain hanging slightly inward -->
    <path d="
      M ${lx - r * 0.2} ${y + r}
      C ${lx - r * 0.4} ${y + r * 1.8},
        ${lx - r * 0.2} ${y + r * 2.4},
        ${lx - r * 0.3} ${y + r * 3.0}
    "
      stroke="${ink}"
      stroke-width="${R * 0.05}"
      stroke-linecap="round"
      fill="none"
      opacity="0.9"/>
  `;
},

feather(ctx) {
  const { HEAD, R } = ctx;

  // position slightly above and behind head
  const baseX = HEAD.cx - R * 0.95;
  const baseY = HEAD.cy - R * 1.65;

  const height = R * 1.7;
  const width = R * 0.35;

  return `
    <!-- feather body -->
    <path d="
      M ${baseX} ${baseY}
      C ${baseX - width} ${baseY + height * 0.3},
        ${baseX - width * 0.4} ${baseY + height * 0.7},
        ${baseX} ${baseY + height}
      C ${baseX + width * 0.6} ${baseY + height * 0.6},
        ${baseX + width * 0.4} ${baseY + height * 0.2},
        ${baseX} ${baseY}
      Z"
      fill="#dddddd"
      opacity="0.85"/>

    <!-- feather spine -->
    <path d="
      M ${baseX} ${baseY}
      L ${baseX} ${baseY + height}
    "
      stroke="rgba(0,0,0,0.25)"
      stroke-width="${R * 0.05}"
      stroke-linecap="round"/>
  `;
},

earrings(ctx) {
  const { HEAD, R } = ctx;
  const leftX = HEAD.cx - HEAD.rx * 1.06;
  const rightX = HEAD.cx + HEAD.rx * 1.06;
  const y = HEAD.cy + R * 0.4;
  const r = R * 0.12;

  return `
    <circle cx="${leftX}" cy="${y}" r="${r}" fill="#FFD700"/>
    <circle cx="${rightX}" cy="${y}" r="${r}" fill="#FFD700"/>
  `;
},

colorGlassesBlue(ctx) {
  const { lx, rx, y, R, ink } = ctx;
  const r = R * 0.30;
  const sw = R * 0.08;

  return `
    <circle cx="${lx}" cy="${y}" r="${r}"
            fill="rgba(80,150,255,0.35)"
            stroke="${ink}" stroke-width="${sw}"/>

    <circle cx="${rx}" cy="${y}" r="${r}"
            fill="rgba(80,150,255,0.35)"
            stroke="${ink}" stroke-width="${sw}"/>

      <!-- hump bridge -->
      <path d="
        M ${lx + r} ${y}
        C ${lx + r * 1.2} ${y - r * 0.8},
          ${rx - r * 1.2} ${y - r * 0.8},
          ${rx - r} ${y}
      "
        stroke="${ink}"
        stroke-width="${sw}"
        fill="none"
        stroke-linecap="round"/>
  `;
},

colorGlassesPink(ctx) {
  const { lx, rx, y, R, ink } = ctx;
  const r = R * 0.30;
  const sw = R * 0.08;

  return `
    <circle cx="${lx}" cy="${y}" r="${r}"
            fill="rgba(255,120,200,0.35)"
            stroke="${ink}" stroke-width="${sw}"/>

    <circle cx="${rx}" cy="${y}" r="${r}"
            fill="rgba(255,120,200,0.35)"
            stroke="${ink}" stroke-width="${sw}"/>

      <!-- hump bridge -->
      <path d="
        M ${lx + r} ${y}
        C ${lx + r * 1.2} ${y - r * 0.8},
          ${rx - r * 1.2} ${y - r * 0.8},
          ${rx - r} ${y}
      "
        stroke="${ink}"
        stroke-width="${sw}"
        fill="none"
        stroke-linecap="round"/>
  `;
},

bandana(ctx) {
    const { HEAD, R } = ctx;

    const bandY = HEAD.cy - HEAD.ry * 0.75;
    const bandHeight = R * 0.40;

    const left = HEAD.cx - HEAD.rx * 1.25;
    const right = HEAD.cx + HEAD.rx * 1.25;

    return `
      <path d="
        M ${left} ${bandY}
        Q ${HEAD.cx} ${bandY - R * 0.25} ${right} ${bandY}
        L ${right} ${bandY + bandHeight}
        Q ${HEAD.cx} ${bandY + bandHeight + R * 0.15} ${left} ${bandY + bandHeight}
        Z"
        fill="#C0392B"
        opacity="0.95"/>

      <path d="
        M ${HEAD.cx - R * 0.7} ${bandY + bandHeight * 0.35}
        Q ${HEAD.cx} ${bandY + bandHeight * 0.15} ${HEAD.cx + R * 0.7} ${bandY + bandHeight * 0.35}
      "
        stroke="rgba(255,255,255,0.25)"
        stroke-width="${R * 0.05}"
        fill="none"
        stroke-linecap="round"/>
    `;
  },

 bowtie(ctx) {
  const { HEAD, R } = ctx;

  const cx = HEAD.cx;
  const y = HEAD.cy + HEAD.ry * 1.20;

  const wingW = R * 0.55;
  const wingH = R * 0.32;
  const knotW = R * 0.28;
  const knotH = R * 0.22;

  return `
    <!-- left wing -->
    <path d="
      M ${cx - knotW/2} ${y}
      L ${cx - wingW} ${y - wingH}
      L ${cx - wingW} ${y + wingH}
      Z"
      fill="#111111"/>

    <!-- right wing -->
    <path d="
      M ${cx + knotW/2} ${y}
      L ${cx + wingW} ${y - wingH}
      L ${cx + wingW} ${y + wingH}
      Z"
      fill="#111111"/>

    <!-- center knot -->
    <rect x="${cx - knotW/2}" 
          y="${y - knotH/2}" 
          width="${knotW}" 
          height="${knotH}" 
          rx="${knotH * 0.9}"
          fill="#000000"/>

    <!-- subtle shine -->
    <path d="
      M ${cx - wingW * 0.5} ${y - wingH * 0.2}
      Q ${cx} ${y - wingH * 0.6}
        ${cx + wingW * 0.5} ${y - wingH * 0.2}
    "
      stroke="rgba(255,255,255,0.08)"
      stroke-width="${R * 0.04}"
      fill="none"
      stroke-linecap="round"/>
  `;
},

necklace(ctx) {
  const { HEAD, R, ink } = ctx;

  const cx = HEAD.cx;
  const y = HEAD.cy + HEAD.ry * 1.18;   // around upper neck / collar
  const chainW = R * 1.30;
  const chainDrop = R * 0.55;

  const leftX = cx - chainW;
  const rightX = cx + chainW;

  const sw = Math.max(1.6, R * 0.06);

  const pendantY = y + chainDrop * 0.85;
  const pendantR = R * 0.13;

  return `
    <!-- chain -->
    <path d="M ${leftX} ${y}
             Q ${cx} ${y + chainDrop} ${rightX} ${y}"
          stroke="rgba(255, 217, 0, 0.9)"
          stroke-width="${sw}"
          fill="none"
          stroke-linecap="round"/>

    <!-- subtle dark edge for contrast -->
    <path d="M ${leftX} ${y}
             Q ${cx} ${y + chainDrop} ${rightX} ${y}"
          stroke="rgba(0,0,0,0.18)"
          stroke-width="${sw * 0.55}"
          fill="none"
          stroke-linecap="round"/>

    <!-- pendant -->
    <circle cx="${cx}" cy="${pendantY}" r="${pendantR}"
            fill="rgba(255, 217, 0, 0.9)" stroke="${ink}" stroke-width="${sw * 0.75}" opacity="0.9"/>

    <circle cx="${cx + pendantR * 0.35}" cy="${pendantY - pendantR * 0.35}" r="${pendantR * 0.35}"
            fill="rgba(255, 255, 255, 0.9)"  opacity="0.8"/>
  `;
},

    },
  };

  // =========================
  // Avatar Generator
  // =========================
  function svgAvatar(cfg, hairDataUrl) {
    const skin = SKINS.find((x) => x.id === cfg.skin) || SKINS[0];
    const outfitColor = OUTFIT_COLORS.find((x) => x.id === cfg.outfitColor) || OUTFIT_COLORS[0];
    const bgOpt = BG_COLORS.find((x) => x.id === cfg.bg) || BG_COLORS[1];

    let bgDefs = "";
    let bgRect = "";

    if (bgOpt.type === "gradient") {
      bgDefs = `
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgOpt.from}" />
            <stop offset="100%" stop-color="${bgOpt.to}" />
          </linearGradient>
        </defs>
      `;
      bgRect = `<rect width="112" height="112" rx="24" fill="url(#bgGrad)"/>`;
    } else if (bgOpt.type === "none") {
      bgRect = "";
    }

    const stroke = "#1F2433";
    const ink = "#1F2433";

    // OVAL face rig
    const HEAD = { cx: 56, cy: 54, rx: 23.5, ry: 28.0 };
    const R = (HEAD.rx + HEAD.ry) / 2;

    const EYE = {
      y: HEAD.cy - R * 0.14,
      dx: R * 0.50,
      r: R * 0.090,
    };

    const MOUTH = {
      y: HEAD.cy + R * 0.56,
      w: R * 0.78,
    };

    const SAFE = {
      minX: HEAD.cx - HEAD.rx * 0.90,
      maxX: HEAD.cx + HEAD.rx * 0.90,
      eyeTop: EYE.y - R * 0.35,
      mouthBottom: MOUTH.y + R * 0.45,
    };

    const ears = `
      <ellipse cx="${HEAD.cx - HEAD.rx * 1.06}" cy="${HEAD.cy + HEAD.ry * 0.02}"
               rx="${R * 0.18}" ry="${R * 0.28}" fill="${skin.fill}" opacity="0.95"/>
      <ellipse cx="${HEAD.cx + HEAD.rx * 1.06}" cy="${HEAD.cy + HEAD.ry * 0.02}"
               rx="${R * 0.18}" ry="${R * 0.28}" fill="${skin.fill}" opacity="0.95"/>
    `;

    const neck = `
      <path d="M ${HEAD.cx - R * 0.38} ${HEAD.cy + HEAD.ry * 0.78}
               Q ${HEAD.cx} ${HEAD.cy + HEAD.ry * 1.05} ${HEAD.cx + R * 0.38} ${HEAD.cy + HEAD.ry * 0.78}
               L ${HEAD.cx + R * 0.38} ${HEAD.cy + HEAD.ry * 1.22}
               Q ${HEAD.cx} ${HEAD.cy + HEAD.ry * 1.40} ${HEAD.cx - R * 0.38} ${HEAD.cy + HEAD.ry * 1.22}
               Z"
            fill="${skin.shade}" opacity="0.55"/>
    `;

    const faceBase = `
      <ellipse cx="${HEAD.cx}" cy="${HEAD.cy}" rx="${HEAD.rx}" ry="${HEAD.ry}"
               fill="${skin.fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M ${HEAD.cx - HEAD.rx * 0.65} ${HEAD.cy + HEAD.ry * 0.25}
               Q ${HEAD.cx} ${HEAD.cy + HEAD.ry * 0.78} ${HEAD.cx + HEAD.rx * 0.65} ${HEAD.cy + HEAD.ry * 0.25}"
            fill="${skin.shade}" opacity="0.16"/>
    `;

    const blush = `
      <circle cx="${HEAD.cx - HEAD.rx * 0.62}" cy="${HEAD.cy + HEAD.ry * 0.22}" r="${R * 0.20}" fill="${skin.blush}" opacity="0.10"/>
      <circle cx="${HEAD.cx + HEAD.rx * 0.62}" cy="${HEAD.cy + HEAD.ry * 0.22}" r="${R * 0.20}" fill="${skin.blush}" opacity="0.10"/>
    `;

    const nose = (() => {
      const x = HEAD.cx;
      const y = HEAD.cy + R * 0.10;
      return `
        <path d="M ${x} ${y - R * 0.10}
                 Q ${x + R * 0.10} ${y + R * 0.10} ${x} ${y + R * 0.18}"
              stroke="rgba(0,0,0,0.14)" stroke-width="${R * 0.06}" fill="none" stroke-linecap="round"/>
      `;
    })();

    const eyeCtx = {
      HEAD,
      R,
      lx: HEAD.cx - EYE.dx,
      rx: HEAD.cx + EYE.dx,
      y: EYE.y,
      pr: EYE.r,
      ink,
      SAFE,
      hairColor: HAIR_COLOR_MAP[cfg.hairColor] || "#1a1a1a",
    };
    const eyes = (Parts.eyeStyles[cfg.eyes] || Parts.eyeStyles.simple)(eyeCtx);

    const mouth = (Parts.mouthStyles[cfg.mouth] || Parts.mouthStyles.smile)({ HEAD, MOUTH, ink, R });

    const outfit = (Parts.outfitStyles[cfg.outfit] || Parts.outfitStyles.hoodie)({ HEAD, c: outfitColor.fill, R, skin, stroke });

    const accessory = (Parts.accessoryStyles[cfg.accessory] || Parts.accessoryStyles.none)({
      HEAD,
      R,
      SAFE,
      lx: HEAD.cx - EYE.dx,
      rx: HEAD.cx + EYE.dx,
      y: EYE.y - R * 0.04,
      ink,
    });

    // Hair placement: base center 128 on 112 = -8. Then per-hair adjustments.
    const hairObj = HAIRS.find((h) => h.id === cfg.hair) || HAIRS[0];
    const BASE_SIZE = 128;

    const scale = hairObj.scale || 1;
    const dx = hairObj.dx || 0;
    const dy = hairObj.dy || 0;

    const scaledSize = BASE_SIZE * scale;
    const centerOffset = (112 - scaledSize) / 2;

    const x = centerOffset + dx;
    const y = centerOffset + dy;

    const hairImg = hairDataUrl
      ? `<image x="${x}" y="${y}" width="${scaledSize}" height="${scaledSize}"
                href="${hairDataUrl}" xlink:href="${hairDataUrl}"
                preserveAspectRatio="xMidYMid meet" />`
      : "";

    return `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 112 112">
  ${bgDefs}
  ${bgRect}
  <ellipse cx="56" cy="98" rx="26" ry="7" fill="rgba(0,0,0,0.16)"/>

  ${outfit}
  ${neck}

  <g>
    ${ears}
    ${faceBase}
    ${blush}
    ${nose}
    ${eyes}
    ${mouth}

    ${hairImg}
    ${accessory}
  </g>
</svg>`;
  }

  // =========================
  // UI Wiring
  // =========================
  function fillSelect(selectEl, items, getName = (x) => x.name, getId = (x) => x.id) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    for (const item of items) {
      const opt = document.createElement("option");
      opt.value = getId(item);
      opt.textContent = getName(item);
      selectEl.appendChild(opt);
    }
  }

  function initEditor(onPick) {
    Modal.wrap = $("#avatarModal");
    if (!Modal.wrap) return null;

    Modal.closeBtn = Modal.wrap.querySelector('[data-k="close"]');
    const preview = $("#avatarEditorPreview");
    const hint = $("#avatarEditorHint");

    const selSkin = $("#avSkin");
    const selHair = $("#avHair");
    const selHairColor = $("#avHairColor");
    const selEyes = $("#avEyes");
    const selMouth = $("#avMouth");
    const selOutfit = $("#avOutfit");
    const selOutfitColor = $("#avOutfitColor");
    const selBg = $("#avBg");
    const selAccessory = $("#avAccessory");

    const btnRandom = $("#btnAvatarRandom");
    const btnSave = $("#btnAvatarSave");

    if (!preview || !selSkin || !btnSave) return null;

    fillSelect(selSkin, SKINS);
    fillSelect(selHair, HAIRS);
    fillSelect(selHairColor, HAIR_COLORS);
    fillSelect(selEyes, EYES);
    fillSelect(selMouth, MOUTHS);
    fillSelect(selOutfit, OUTFITS);
    fillSelect(selOutfitColor, OUTFIT_COLORS);
    fillSelect(selBg, BG_COLORS);
    fillSelect(selAccessory, ACCESSORIES);

    let cfg = defaultConfig();

    function applyToUI() {
      selSkin.value = cfg.skin;
      selHair.value = cfg.hair;
      selHairColor.value = cfg.hairColor;
      selEyes.value = cfg.eyes;
      selMouth.value = cfg.mouth;
      selOutfit.value = cfg.outfit;
      selOutfitColor.value = cfg.outfitColor;
      selBg.value = cfg.bg;
      selAccessory.value = cfg.accessory;
    }

    function pullFromUI() {
      cfg = {
        skin: selSkin.value,
        hair: selHair.value,
        hairColor: selHairColor.value,
        eyes: selEyes.value,
        mouth: selMouth.value,
        outfit: selOutfit.value,
        outfitColor: selOutfitColor.value,
        bg: selBg.value,
        accessory: selAccessory.value,
      };
    }

    function currentHairSrc() {
      return hairPngPath(cfg.hair, cfg.hairColor);
    }

    function render() {
      const hairSrc = currentHairSrc();

      // render immediately with cached hair if available
      const cached = HairPngCache.get(hairSrc) || null;
      preview.src = toSvgDataUrl(svgAvatar(cfg, cached));

      // load and re-render if needed
      if (!HairPngCache.has(hairSrc)) {
        pngToDataUrl(hairSrc)
          .then((hairDataUrl) => {
            // If user changed options while loading, ensure we still match current selection
            if (hairSrc !== currentHairSrc()) return;
            preview.src = toSvgDataUrl(svgAvatar(cfg, hairDataUrl));
          })
          .catch(() => {
            // silent fail: show without hair
          });
      }
      return preview.src;
    }

    function randomize() {
      cfg.skin = randPick(SKINS).id;
      cfg.hair = randPick(HAIRS).id;
      cfg.hairColor = randPick(HAIR_COLORS).id;
      cfg.eyes = randPick(EYES).id;
      cfg.mouth = randPick(MOUTHS).id;
      cfg.outfit = randPick(OUTFITS).id;
      cfg.outfitColor = randPick(OUTFIT_COLORS).id;
      cfg.bg = randPick(BG_COLORS).id;
      cfg.accessory = randPick(ACCESSORIES).id;

      applyToUI();
      render();
    }

    const onChange = () => {
      pullFromUI();
      render();
    };

    // ===== Visual UI helpers (tabs + chips + tiles) =====
const elTabs = $("#avTabs");
const panes = Array.from(Modal.wrap.querySelectorAll(".av-pane"));

function setTab(name){
  // tabs
  activeTab = name;
  rebuildVisualUI();
  elTabs?.querySelectorAll(".tab").forEach(b=>{
    b.classList.toggle("is-on", b.dataset.tab === name);
  });
  // panes
  panes.forEach(p=>{
    p.classList.toggle("hidden", p.dataset.pane !== name);
  });
}

elTabs?.addEventListener("click", (e)=>{
  const btn = e.target.closest(".tab");
  if (!btn) return;
  setTab(btn.dataset.tab);
});

// Make a “thumbnail” that shows the feature by temporarily switching cfg
async function makeThumb({ patch }) {
  const saved = { ...cfg };
  Object.assign(cfg, patch);

  const hairSrc = hairPngPath(cfg.hair, cfg.hairColor);
  let hairDataUrl = HairPngCache.get(hairSrc) || null;

  // load hair if needed (so hair tiles actually show hair)
  if (!hairDataUrl) {
    try { hairDataUrl = await pngToDataUrl(hairSrc); } catch {}
  }

  const url = toSvgDataUrl(svgAvatar(cfg, hairDataUrl));
  cfg = saved; // restore
  return url;
}

function setSelectValue(selectEl, value){
  if (!selectEl) return;
  selectEl.value = value;
  // trigger same path as user change
  selectEl.dispatchEvent(new Event("change", { bubbles: true }));
}

function buildChips(container, items, getId, getLabel, getDotColor, currentId, onPickId){
  if (!container) return;
  container.innerHTML = "";
  for (const item of items) {
    const id = getId(item);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (id === currentId ? " is-on" : "");
    btn.innerHTML = `
      ${getDotColor ? `<span class="dot" style="color:${getDotColor(item)}"></span>` : ""}
      <span>${getLabel(item)}</span>
    `;
    btn.addEventListener("click", () => onPickId(id));
    container.appendChild(btn);
  }
}

async function buildTiles(container, items, selectedId, onPickId, thumbPatchForItem){
  if (!container) return;
  container.innerHTML = "";

  for (const item of items) {
    const id = item.id;

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile" + (id === selectedId ? " is-on" : "");
    tile.innerHTML = `
      <div class="thumb"><img alt="" /></div>
      <div class="label">${item.name}</div>
    `;

    tile.addEventListener("click", () => onPickId(id));

    container.appendChild(tile);

    // Lazy thumb render
    const img = tile.querySelector("img");
    try {
      const url = await makeThumb({ patch: thumbPatchForItem(item) });
      img.src = url;
    } catch {
      // If thumb fails, keep empty
    }
  }
}

// Build all visual controls from current cfg
async function rebuildVisualUI(){
  // chips
if (activeTab === "face") {
  buildChips(
    $("#chipSkin"),
    SKINS,
    (x)=>x.id,
    (x)=>x.name,
    (x)=>x.fill,
    cfg.skin,
    (id)=>setSelectValue(selSkin, id)
  );
}

if (activeTab === "hair") {
  buildChips(
    $("#chipHairColor"),
    HAIR_COLORS,
    (x)=>x.id,
    (x)=>x.name,
    (x)=>HAIR_COLOR_MAP[x.id] || "#999",
    cfg.hairColor,
    (id)=>setSelectValue(selHairColor, id)
  );
}

if (activeTab === "outfit") {
  buildChips(
    $("#chipOutfitColor"),
    OUTFIT_COLORS,
    (x)=>x.id,
    (x)=>x.name,
    (x)=>x.fill,
    cfg.outfitColor,
    (id)=>setSelectValue(selOutfitColor, id)
  );
}

  // tiles
  await buildTiles(
    $("#gridEyes"),
    EYES,
    cfg.eyes,
    (id)=>setSelectValue(selEyes, id),
    (item)=>({ eyes: item.id })
  );

  await buildTiles(
    $("#gridMouth"),
    MOUTHS,
    cfg.mouth,
    (id)=>setSelectValue(selMouth, id),
    (item)=>({ mouth: item.id })
  );

  await buildTiles(
    $("#gridHair"),
    HAIRS,
    cfg.hair,
    (id)=>setSelectValue(selHair, id),
    (item)=>({ hair: item.id })
  );

  await buildTiles(
    $("#gridOutfit"),
    OUTFITS,
    cfg.outfit,
    (id)=>setSelectValue(selOutfit, id),
    (item)=>({ outfit: item.id })
  );

  await buildTiles(
    $("#gridAccessory"),
    ACCESSORIES,
    cfg.accessory,
    (id)=>setSelectValue(selAccessory, id),
    (item)=>({ accessory: item.id })
  );

  await buildTiles(
    $("#gridBg"),
    BG_COLORS,
    cfg.bg,
    (id)=>setSelectValue(selBg, id),
    (item)=>({ bg: item.id })
  );
}

// Call once after applyToUI + render
// and also whenever cfg changes
const originalRender = render;
render = function(){
  const result = originalRender();
  // rebuild visuals after cfg updates (debounced-ish)
  rebuildVisualUI();
  return result;
};

// default starting tab
let activeTab = "face";


    selSkin.addEventListener("change", onChange);
    selHair.addEventListener("change", onChange);
    selHairColor.addEventListener("change", onChange);
    selEyes.addEventListener("change", onChange);
    selMouth.addEventListener("change", onChange);
    selOutfit.addEventListener("change", onChange);
    selOutfitColor.addEventListener("change", onChange);
    selBg.addEventListener("change", onChange);
    selAccessory.addEventListener("change", onChange);

    btnRandom?.addEventListener("click", (e) => {
      e.preventDefault();
      randomize();
    });

    btnSave?.addEventListener("click", async (e) => {
      e.preventDefault();
      const dataUrl = render();
      try {
        onPick?.(dataUrl, { ...cfg, provider: "d4k-avatar-v3.1-pnghair-folders" });
      } catch {}
      Modal.hide();
    });

    Modal.closeBtn?.addEventListener("click", () => Modal.hide());

    applyToUI();
    render();

    return {
      show() {
        Modal.show();
        render();
      },
      hide() {
        Modal.hide();
      },
      getConfig() {
        return { ...cfg };
      },
    };
  }

  // =========================
  // Public API
  // =========================
  window.Avatars = {
    initAvatarModal({ onPick } = {}) {
      return initEditor(onPick);
    },
  };
})();