  // avatar.utils.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const { SKINS, HAIRS, EYES, MOUTHS, OUTFITS, OUTFIT_COLORS } = A;
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
    A.randPick = randPick;
A.clamp = clamp;
A.defaultConfig = defaultConfig;
A.hairPngPath = hairPngPath;
A.darkenHex = darkenHex;
A.outfitBase = outfitBase;
  })();
