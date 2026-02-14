  // avatar.renderer.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const { SKINS, HAIRS, HAIR_COLOR_MAP, OUTFIT_COLORS, BG_COLORS, Parts } = A;
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
   // Exports (used by avatar.editor.js)
    A.fillSelect = fillSelect;
    A.svgAvatar = svgAvatar;
  })();
