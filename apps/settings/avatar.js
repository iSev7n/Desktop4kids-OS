// apps/settings/avatar.js (VARIED EDITION)
(function () {
  /* ==========================================================
     Desktop4Kids – Avatar Gallery (self-contained, high-variance)
     -------------------------------------------------------------
     - 7 categories × 10 avatars each (procedural SVG, all distinct)
     - Exposes: window.Avatars.initAvatarModal({ onPick(dataUrl) })
  ========================================================== */

  // ---------- utils ----------
  const toDataUrl = (svg) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

  const pick = (arr, i) => arr[i % arr.length];

  const PALETTES = {
    brand: ['#7C4DFF', '#5B7CFA', '#2BB673', '#18A999', '#FF7A59', '#F06EAA', '#F5A623', '#1F8EFA', '#C86DD7', '#2D334F'],
    dark:  ['#302D3A', '#243047', '#233142', '#1D2636', '#0F131C', '#1A2030', '#172034', '#182033', '#1C2436', '#262B35'],
    suits: ['#7bdff2', '#b2f7ef', '#eff7f6', '#f7d6e0', '#f2b5d4', '#ffd166', '#a8dadc', '#ffd6a5', '#caffbf', '#bdb2ff']
  };
  const FACE = { stroke: '#232634', eyes: '#222', mouth: '#222', skin: '#FFE8A3', skin2: '#FFD3A3', skin3: '#F8C29C', plate: '#d0f2ef' };

  // base rounded square
  const panel = (bg) => `<rect width="120" height="120" rx="24" fill="${bg}"/>`;

  // helper: simple shadow under heads
  const shadow = (cx=60, cy=90, rx=26, ry=6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.18)"/>`;

  // ---------- ANIMALS (10 unique silhouettes) ----------
  function animal(i) {
    const bg = pick(PALETTES.brand, i);
    const idx = i % 10;
    const skin = [FACE.skin, FACE.skin2, FACE.skin3][i % 3];
    let body = '';
    if (idx === 0) { // Cat
      body = `
        <g transform="translate(10,8)">
          <path d="M26 26l12-14 12 14M86 26L74 12 62 26" fill="#f6d6ad"/>
          <circle cx="60" cy="54" r="32" fill="#f7e3c6" stroke="#332244" stroke-width="3"/>
          <circle cx="48" cy="50" r="4"/><circle cx="72" cy="50" r="4"/>
          <path d="M50 64c6 6 14 6 20 0" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M38 56h8M84 56h-8M38 60h8M84 60h-8" stroke="#333" stroke-width="2"/>
        </g>`;
    } else if (idx === 1) { // Dog
      body = `
        <g transform="translate(8,10)">
          <path d="M28 28c-8-16 12-16 16-6 4-6 22-12 18 6" fill="#d9c2a3"/>
          <rect x="28" y="30" width="76" height="54" rx="26" fill="#f2e1c9" stroke="#4a3b2f" stroke-width="3"/>
          <circle cx="56" cy="56" r="5"/><circle cx="84" cy="56" r="5"/>
          <path d="M64 70c8 4 16 4 24 0" stroke="#4a3b2f" stroke-width="4" fill="none"/>
          <circle cx="70" cy="66" r="5" fill="#4a3b2f"/>
        </g>`;
    } else if (idx === 2) { // Fox
      body = `
        <g transform="translate(6,10)">
          <path d="M30 28l18-18 18 18" fill="#ffb74d"/>
          <path d="M20 86l18-16h44l18 16" fill="#ffe0b2"/>
          <rect x="24" y="34" width="72" height="50" rx="22" fill="#ffa726" stroke="#8d3c00" stroke-width="3"/>
          <circle cx="48" cy="58" r="4"/><circle cx="72" cy="58" r="4"/>
          <path d="M46 66c8 8 20 8 28 0" stroke="#8d3c00" stroke-width="3" fill="none"/>
        </g>`;
    } else if (idx === 3) { // Panda
      body = `
        <g transform="translate(8,14)">
          <circle cx="52" cy="50" r="34" fill="#fff" stroke="#222" stroke-width="3"/>
          <ellipse cx="40" cy="46" rx="10" ry="8" fill="#222"/>
          <ellipse cx="64" cy="46" rx="10" ry="8" fill="#222"/>
          <circle cx="40" cy="46" r="4" fill="#fff"/><circle cx="64" cy="46" r="4" fill="#fff"/>
          <rect x="44" y="62" width="16" height="6" rx="3" fill="#222"/>
        </g>`;
    } else if (idx === 4) { // Bunny
      body = `
        <g transform="translate(10,8)">
          <rect x="40" y="6" width="10" height="26" rx="5" fill="#ffe6ef"/>
          <rect x="60" y="6" width="10" height="26" rx="5" fill="#ffe6ef"/>
          <circle cx="60" cy="56" r="30" fill="#fff4f8" stroke="#c47a9e" stroke-width="3"/>
          <circle cx="50" cy="56" r="4"/><circle cx="70" cy="56" r="4"/>
          <rect x="56" y="64" width="8" height="6" rx="3" fill="#c47a9e"/>
        </g>`;
    } else if (idx === 5) { // Tiger
      body = `
        <g transform="translate(8,12)">
          <circle cx="56" cy="50" r="34" fill="#ffa000" stroke="#5a2a00" stroke-width="3"/>
          <path d="M28 44l16 8M84 44l-16 8M36 60l12 6M76 60l-12 6" stroke="#5a2a00" stroke-width="4"/>
          <circle cx="46" cy="48" r="4"/><circle cx="66" cy="48" r="4"/>
          <path d="M44 66c10 6 16 6 24 0" stroke="#5a2a00" stroke-width="3" fill="none"/>
        </g>`;
    } else if (idx === 6) { // Bear
      body = `
        <g transform="translate(10,14)">
          <circle cx="52" cy="48" r="34" fill="#c79a6a" stroke="#5a4635" stroke-width="3"/>
          <circle cx="36" cy="28" r="8" fill="#c79a6a" stroke="#5a4635"/>
          <circle cx="68" cy="28" r="8" fill="#c79a6a" stroke="#5a4635"/>
          <circle cx="44" cy="50" r="4"/><circle cx="60" cy="50" r="4"/>
          <circle cx="52" cy="60" r="6" fill="#5a4635"/>
        </g>`;
    } else if (idx === 7) { // Owl
      body = `
        <g transform="translate(6,10)">
          <path d="M60 26c22 0 32 22 28 40-4 18-20 28-28 28s-24-10-28-28 6-40 28-40z" fill="#6d5d4b" stroke="#3b2e23" stroke-width="3"/>
          <circle cx="48" cy="54" r="10" fill="#ffeb3b"/><circle cx="72" cy="54" r="10" fill="#ffeb3b"/>
          <circle cx="48" cy="54" r="5"/><circle cx="72" cy="54" r="5"/>
          <path d="M58 70l4 6 4-6z" fill="#e67a00"/>
        </g>`;
    } else if (idx === 8) { // Frog
      body = `
        <g transform="translate(8,16)">
          <rect x="26" y="28" width="68" height="48" rx="24" fill="#7cb342" stroke="#2f5d18" stroke-width="3"/>
          <circle cx="44" cy="28" r="10" fill="#7cb342" stroke="#2f5d18"/>
          <circle cx="76" cy="28" r="10" fill="#7cb342" stroke="#2f5d18"/>
          <circle cx="44" cy="28" r="4"/><circle cx="76" cy="28" r="4"/>
          <path d="M46 64c10 6 20 6 30 0" stroke="#2f5d18" stroke-width="3" fill="none"/>
        </g>`;
    } else { // Penguin
      body = `
        <g transform="translate(14,12)">
          <path d="M46 24c24 0 34 18 34 36s-12 36-34 36-34-18-34-36 10-36 34-36z" fill="#222" stroke="#111"/>
          <ellipse cx="46" cy="58" rx="18" ry="24" fill="#fff"/>
          <circle cx="40" cy="46" r="4" fill="#000"/><circle cx="54" cy="46" r="4" fill="#000"/>
          <path d="M42 58l8 0-4 6z" fill="#ff9800"/>
        </g>`;
    }
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      ${shadow()}
      ${body}
    </svg>`;
  }

  // ---------- ROBOTS (10 unique bodies) ----------
  function robot(i) {
    const bg = pick(PALETTES.brand, i + 3);
    const idx = i % 10;
    const plate = pick(PALETTES.suits, i);
    const eye = idx % 2 ? '#9FFCF5' : '#FFD166';
    const mouthShapes = [
      '<rect x="30" y="64" width="36" height="6" rx="3"/>',
      '<path d="M30 70c8-8 28-8 36 0" fill="none" stroke-width="4" stroke="currentColor"/>',
      '<circle cx="48" cy="67" r="3"/><circle cx="58" cy="67" r="3"/><circle cx="68" cy="67" r="3"/>'
    ];
    const mouth = mouthShapes[idx % mouthShapes.length];
    let head = '';
    if (idx === 0) {
      head = `<rect x="18" y="22" width="84" height="62" rx="12" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else if (idx === 1) {
      head = `<circle cx="60" cy="54" r="32" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else if (idx === 2) {
      head = `<path d="M20 64l14-36h52l14 36-14 20H34z" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else if (idx === 3) {
      head = `<rect x="24" y="28" width="72" height="48" rx="8" fill="#0f131c" stroke="${plate}" stroke-width="3"/><rect x="54" y="14" width="12" height="14" rx="6" fill="#0f131c" stroke="${plate}"/>`;
    } else if (idx === 4) {
      head = `<path d="M22 70c0-22 16-40 38-40s38 18 38 40-16 24-38 24-38-2-38-24z" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else if (idx === 5) {
      head = `<rect x="18" y="32" width="84" height="44" rx="4" fill="#0f131c" stroke="${plate}" stroke-width="3"/><circle cx="60" cy="28" r="6" fill="#0f131c" stroke="${plate}"/>`;
    } else if (idx === 6) {
      head = `<path d="M20 40h80v36l-20 12H40L20 76z" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else if (idx === 7) {
      head = `<path d="M24 36l72 0v26c0 16-16 26-36 26s-36-10-36-26V36z" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else if (idx === 8) {
      head = `<rect x="26" y="26" width="68" height="56" rx="20" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    } else {
      head = `<path d="M22 50l18-18h40l18 18v24l-18 14H40L22 74z" fill="#0f131c" stroke="${plate}" stroke-width="3"/>`;
    }

    const eyeRow = idx % 3 === 0
      ? `<circle cx="44" cy="50" r="6" fill="${eye}"/><circle cx="76" cy="50" r="6" fill="${eye}"/>`
      : idx % 3 === 1
      ? `<rect x="40" y="46" width="40" height="8" rx="4" fill="${eye}"/>`
      : `<circle cx="54" cy="50" r="6" fill="${eye}"/><circle cx="66" cy="50" r="6" fill="${eye}"/><circle cx="60" cy="56" r="3" fill="${eye}"/>`;

    const deco = idx % 2
      ? `<rect x="28" y="78" width="64" height="6" rx="3" fill="${plate}" opacity=".5"/>`
      : `<circle cx="60" cy="80" r="4" fill="${plate}"/>`;

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      <g transform="translate(0,0)" fill="${FACE.plate}" color="${FACE.plate}">
        ${head}
        ${eyeRow}
        <g fill="${FACE.plate}" color="${FACE.plate}">${mouth}</g>
        ${deco}
      </g>
    </svg>`;
  }

  // ---------- FANTASY (10 archetypes) ----------
  function fantasy(i) {
    const bg = pick(PALETTES.brand, i + 6);
    const idx = i % 10;
    const skin = [FACE.skin, FACE.skin2, FACE.skin3][(i + 1) % 3];
    const beard = idx % 2 ? `<path d="M36 62c8 10 28 10 36 0" fill="#8d6e63"/>` : '';
    const eyes = `<circle cx="48" cy="48" r="4"/><circle cx="68" cy="48" r="4"/>`;

    const head = `<circle cx="58" cy="52" r="28" fill="${skin}" stroke="#332244" stroke-width="2"/>`;

    const hats = [
      '<path d="M24 40l34-18 34 18-34 10z" fill="#3b2c84"/>', // wizard
      '<path d="M28 38h60l-10 16H38z" fill="#6d4c41"/>', // ranger hood
      '<path d="M28 46h60v10H28z" fill="#b71c1c"/>', // bandana
      '<path d="M34 30h48l-4 14H38z" fill="#263238"/>', // knight helm top
      '<path d="M24 44l34-22 34 22-34 8z" fill="#7b1fa2"/>', // witch
      '<path d="M30 44l28-10 28 10-28 12z" fill="#00695c"/>', // elf circlet blocky
      '<path d="M26 42l32-16 32 16-32 6z" fill="#ff6f00"/>', // dwarf helm
      '<path d="M24 38l34-16 34 16-10 4H34z" fill="#1e88e5"/>', // paladin crest
      '<path d="M22 44h72v6H22z" fill="#4e342e"/>', // bard cap
      '<path d="M24 36l34-14 34 14-6 8H30z" fill="#2e7d32"/>' // druid crown
    ];

    const gear = [
      '<rect x="40" y="66" width="36" height="6" rx="3" fill="#3b2c84"/>', // wand band
      '<path d="M24 72h70" stroke="#6d4c41" stroke-width="4"/>', // bow line
      '<circle cx="58" cy="72" r="6" fill="#b71c1c"/>', // amulet
      '<rect x="30" y="60" width="56" height="10" rx="5" fill="#90a4ae"/>', // visor
      '<path d="M24 70l68 0" stroke="#7b1fa2" stroke-width="4"/>',
      '<rect x="44" y="70" width="28" height="6" rx="3" fill="#00695c"/>',
      '<rect x="36" y="70" width="44" height="8" rx="4" fill="#795548"/>',
      '<path d="M34 70h48" stroke="#1e88e5" stroke-width="4"/>',
      '<path d="M36 70h44" stroke="#4e342e" stroke-width="4"/>',
      '<path d="M32 70h52" stroke="#2e7d32" stroke-width="4"/>'
    ];

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      ${shadow()}
      <g transform="translate(0,4)">
        ${hats[idx]}
        ${head}
        ${eyes}
        <path d="M46 60c8 6 16 6 24 0" stroke="#332244" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${beard}
        ${gear[idx]}
      </g>
    </svg>`;
  }

  // ---------- MONSTERS (10 wildly different) ----------
  function monster(i) {
    const bg = pick(PALETTES.brand, i + 1);
    const idx = i % 10;
    const shell = (shape) =>
      shape === 'round' ? `<circle cx="60" cy="64" r="34" fill="#1a2030" stroke="#2a3247" stroke-width="3"/>`
      : shape === 'square' ? `<rect x="26" y="30" width="68" height="68" rx="18" fill="#1a2030" stroke="#2a3247" stroke-width="3"/>`
      : `<path d="M26 44l34-16 34 16v44l-34 16-34-16z" fill="#1a2030" stroke="#2a3247" stroke-width="3"/>`;

    const eyes = [
      '<circle cx="60" cy="56" r="12" fill="#fff"/><circle cx="60" cy="56" r="5"/>', // cyclops
      '<circle cx="44" cy="56" r="8" fill="#fff"/><circle cx="76" cy="56" r="8" fill="#fff"/><circle cx="44" cy="56" r="3"/><circle cx="76" cy="56" r="3"/>', // two eyes
      '<circle cx="38" cy="54" r="6" fill="#fff"/><circle cx="60" cy="50" r="6" fill="#fff"/><circle cx="82" cy="54" r="6" fill="#fff"/>', // three
      '<rect x="40" y="50" width="40" height="10" rx="5" fill="#fff"/>' // visor
    ][idx % 4];

    const mouths = [
      '<rect x="46" y="70" width="28" height="10" rx="5"/>',
      '<path d="M40 74c8 6 32 6 40 0" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/>',
      '<path d="M44 70h32v10H44z" fill="#000"/><path d="M48 70v10M56 70v10M64 70v10M72 70v10" stroke="#fff"/>',
      '<path d="M44 76l8-6 8 6 8-6 8 6" stroke="#fff" stroke-width="2"/>'
    ][(idx+1)%4];

    const extras = [
      '<path d="M26 52l-10-10M94 52l10-10" stroke="#2a3247" stroke-width="6"/>', // horns
      '<circle cx="60" cy="92" r="8" fill="#2a3247"/>', // belly button
      '<rect x="26" y="88" width="68" height="8" rx="4" fill="#2a3247"/>', // belt
      '<path d="M26 40h68" stroke="#2a3247" stroke-width="6"/>',
      '<circle cx="60" cy="92" r="12" fill="#6c0f91"/>'
    ][idx % 5];

    const shape = ['round','square','hex'][idx % 3];

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      ${shadow()}
      <g>
        ${shell(shape)}
        ${eyes}
        ${mouths}
        ${extras}
      </g>
    </svg>`;
  }

  // ---------- SPACE ("space people" – 10 suit/helmet variants) ----------
  function space(i) {
    const bg = pick(PALETTES.dark, i);
    const suit = pick(PALETTES.suits, i);
    const idx = i % 10;
    const visorColor = idx % 2 ? '#b2ebf2' : '#cbd7ff';

    const helmets = [
      '<rect x="28" y="26" width="64" height="64" rx="22"/>',
      '<circle cx="60" cy="58" r="34"/>',
      '<path d="M24 60c0-22 16-36 36-36s36 14 36 36-16 34-36 34-36-12-36-34z"/>',
      '<path d="M26 46h68v50l-12 8H38l-12-8z"/>',
      '<path d="M24 54l18-18h36l18 18v34l-18 18H42L24 88z"/>',
      '<rect x="22" y="38" width="76" height="54" rx="8"/>',
      '<path d="M22 60l18-24h40l18 24v28l-18 14H40L22 88z"/>',
      '<path d="M24 44h72v32c0 18-16 30-36 30s-36-12-36-30V44z"/>',
      '<path d="M28 36h64l-6 12H34z"/>',
      '<path d="M24 48h72v44l-10 10H34l-10-10z"/>'
    ];

    const torso = `<rect x="36" y="86" width="48" height="18" rx="6" fill="${suit}"/>`;
    const badges = [
      '<circle cx="44" cy="94" r="4"/>',
      '<rect x="44" y="92" width="8" height="6" rx="2"/>',
      '<path d="M44 92h12v6H44z"/>',
      '<circle cx="76" cy="94" r="4"/>',
      '<path d="M50 92h18v6H50z"/>'
    ];

    const antenna = idx % 3 === 0 ? '<rect x="58" y="22" width="4" height="10"/><circle cx="60" cy="20" r="3"/>' : '';

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      ${shadow(60,100,20,5)}
      <g fill="#1a2232" stroke="#1a2232" stroke-width="2">
        ${antenna}
        ${helmets[idx]}
      </g>
      <g>
        <rect x="34" y="48" width="52" height="32" rx="12" fill="${visorColor}" stroke="#1a2232" stroke-width="3"/>
        ${torso}
        <g fill="#1a2232">${badges[idx % badges.length]}</g>
      </g>
    </svg>`;
  }

  // ---------- SPORTS (10 distinct equipment/objects) ----------
  function sports(i) {
    const bg = pick(PALETTES.brand, i + 2);
    const idx = i % 10;
    const items = [
      '<circle cx="60" cy="60" r="26" fill="#F28E2B"/><path d="M60 34v52M34 60h52" stroke="#7A3D1C" stroke-width="3"/>', // basketball
      '<path d="M36 40h48v28H36z" fill="#8B4513"/><path d="M36 46h48M36 62h48" stroke="#fff" stroke-width="3"/>', // football (american)
      '<circle cx="60" cy="60" r="26" fill="#fff" stroke="#ccc"/><path d="M48 48l24 24M72 48L48 72" stroke="#bbb" stroke-width="3"/>', // baseball
      '<circle cx="60" cy="60" r="26" fill="#C43E3E"/><circle cx="60" cy="60" r="20" fill="none" stroke="#fff" stroke-width="3"/>', // soccer
      '<rect x="44" y="34" width="8" height="52" rx="4" fill="#cfd8dc"/><circle cx="72" cy="62" r="18" fill="#eceff1" stroke="#b0bec5"/>', // tennis racquet
      '<circle cx="60" cy="60" r="26" fill="#e0f7fa" stroke="#90a4ae"/><path d="M60 34v52M34 60h52" stroke="#90a4ae"/>', // volleyball
      '<rect x="54" y="30" width="12" height="48" rx="6" fill="#9e9e9e"/><rect x="48" y="78" width="24" height="12" rx="6" fill="#37474f"/>', // hockey stick top
      '<circle cx="60" cy="74" r="8" fill="#263238"/><rect x="52" y="34" width="16" height="36" fill="#4caf50"/>', // golf (ball + flag)
      '<rect x="46" y="34" width="28" height="44" rx="8" fill="#37474f"/><rect x="42" y="78" width="36" height="8" rx="4" fill="#ffb300"/>', // skate
      '<path d="M40 76h40l-6 10H46z" fill="#ffd54f"/><rect x="52" y="34" width="16" height="36" rx="4" fill="#90caf9"/>' // trophy + ribbon
    ];

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      ${items[idx]}
    </svg>`;
  }

  // ---------- FOOD (10 different foods) ----------
  function food(i) {
    const bg = pick(PALETTES.brand, i + 4);
    const idx = i % 10;
    const items = [
      '<ellipse cx="60" cy="74" rx="28" ry="16" fill="#FFD166"/><rect x="40" y="48" width="40" height="16" rx="8" fill="#F8961E"/>', // burger
      '<path d="M40 46l40 0-4 24H44z" fill="#ff7043"/><circle cx="60" cy="76" r="16" fill="#ef5350"/>', // pizza slice + pepperoni
      '<rect x="40" y="48" width="40" height="28" rx="4" fill="#8D5524"/><rect x="44" y="56" width="12" height="6" fill="#fff"/><rect x="64" y="62" width="12" height="6" fill="#fff"/>', // choco bar
      '<path d="M48 80c0-10 10-10 12-18 2 8 12 8 12 18z" fill="#ff8a80"/><rect x="52" y="44" width="16" height="20" rx="8" fill="#80deea"/>', // ice cream
      '<circle cx="60" cy="60" r="24" fill="#E5383B"/><circle cx="48" cy="52" r="3" fill="#fff"/><circle cx="68" cy="66" r="3" fill="#fff"/>', // donut
      '<path d="M36 70l24-18 24 18-24 16z" fill="#ffe082"/><rect x="34" y="62" width="52" height="8" fill="#8d6e63"/>', // taco
      '<rect x="40" y="58" width="40" height="14" rx="7" fill="#ff7043"/><rect x="42" y="48" width="36" height="10" rx="5" fill="#d32f2f"/>', // hotdog
      '<rect x="38" y="54" width="44" height="26" rx="6" fill="#f5f5f5"/><path d="M44 74h32" stroke="#ffa000" stroke-width="4"/>', // fries box
      '<rect x="40" y="44" width="40" height="36" rx="6" fill="#ffccbc"/><path d="M46 70h28" stroke="#6a1b9a" stroke-width="4"/>', // cake slice
      '<path d="M48 84c-8-16 4-38 18-44 8-4 20 12 10 22-8 8-16 12-28 22z" fill="#ffd54f"/><rect x="58" y="46" width="8" height="12" fill="#66bb6a"/>' // pineapple
    ];

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${panel(bg)}
      ${items[idx]}
    </svg>`;
  }

  // ---------- category registry ----------
  const CATS = [
    { id: 'animals',  label: 'Animals',  gen: animal },
    { id: 'robots',   label: 'Robots',   gen: robot },
    { id: 'fantasy',  label: 'Fantasy',  gen: fantasy },
    { id: 'monsters', label: 'Monsters', gen: monster },
    { id: 'space',    label: 'Space Crew', gen: space },
    { id: 'sports',   label: 'Sports',   gen: sports },
    { id: 'food',     label: 'Food',     gen: food },
  ];
  const PER_CAT = 10;

  // ---------- modal builder (matches your dialog theme) ----------
  function buildModal() {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap hidden'; // hidden by default (CSS handles dim backdrop)
    wrap.innerHTML = `
      <div class="dlg" role="dialog" aria-modal="true" style="width:min(760px,90vw)">
        <div class="dlg-title">Choose an avatar</div>
        <div class="dlg-body" style="padding-top:8px">
          <div class="tabbar" role="tablist" aria-label="Avatar categories" style="margin-bottom:8px">
            ${CATS.map((c, i) => `<button class="tab${i===0?' active':''}" data-tab="${c.id}" role="tab" aria-selected="${i===0?'true':'false'}">${c.label}</button>`).join('')}
          </div>
          ${CATS.map((c, i) => `
            <div class="tabpane${i===0?' active':''}" data-tab="${c.id}">
              <div class="avatar-grid" id="avGrid-${c.id}"></div>
            </div>`).join('')}
        </div>
        <div class="dlg-actions">
          <button class="btn sm secondary" data-k="close">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  function renderCategory(grid, gen) {
    grid.innerHTML = '';
    for (let i = 0; i < PER_CAT; i++) {
      const url = toDataUrl(gen(i));
      const tile = document.createElement('button');
      tile.className = 'avatar-tile';
      tile.innerHTML = `<img alt="" src="${url}">`;
      grid.appendChild(tile);
    }
  }

  function wireTabs(wrap) {
    const tabs  = [...wrap.querySelectorAll('.tabbar .tab')];
    const panes = [...wrap.querySelectorAll('.tabpane')];
    const show = (id) => {
      tabs.forEach(t => {
        const active = t.dataset.tab === id;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panes.forEach(p => p.classList.toggle('active', p.dataset.tab === id));
    };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
  }

  // ---------- public API ----------
  function initAvatarModal({ onPick } = {}) {
    const wrap = buildModal();
    const btnClose = wrap.querySelector('[data-k="close"]');

    // render each category grid
    CATS.forEach(({ id, gen }) => {
      const grid = wrap.querySelector(`#avGrid-${id}`);
      renderCategory(grid, gen);
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.avatar-tile');
        if (!btn) return;
        const img = btn.querySelector('img');
        if (img?.src) onPick?.(img.src);
        hide();
      });
    });

    wireTabs(wrap);

    function show(){ wrap.classList.remove('hidden'); }
    function hide(){ wrap.classList.add('hidden'); }

    btnClose.addEventListener('click', hide);
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

    return { show, hide };
  }

  // expose
  window.Avatars = { initAvatarModal };
})();
