  // avatar.parts.outfitStyles.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const { clamp, darkenHex, outfitBase } = A;
    const Parts = (A.Parts = A.Parts || {});

    Parts.outfitStyles = {
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

};
  })();
