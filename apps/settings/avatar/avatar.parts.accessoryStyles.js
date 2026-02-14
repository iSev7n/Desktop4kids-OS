  // avatar.parts.accessoryStyles.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const { clamp, darkenHex, outfitBase } = A;
    const Parts = (A.Parts = A.Parts || {});

    Parts.accessoryStyles = {
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

    };
  })();
