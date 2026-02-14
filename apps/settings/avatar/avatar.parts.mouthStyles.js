  // avatar.parts.mouthStyles.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const { clamp, darkenHex, outfitBase } = A;
    const Parts = (A.Parts = A.Parts || {});

    Parts.mouthStyles = {
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

    };
  })();
