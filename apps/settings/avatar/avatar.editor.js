  // avatar.editor.js
  // Auto-split from apps/settings/avatar.js (no behavior changes)
  (function () {
    const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});
    const {
  $, Modal, toSvgDataUrl,
  HairPngCache, pngToDataUrl, fillSelect,
  SKINS, HAIRS, HAIR_COLORS, HAIR_COLOR_MAP,
  OUTFIT_COLORS, BG_COLORS, EYES, MOUTHS, OUTFITS, ACCESSORIES,
  randPick, defaultConfig, hairPngPath,
  svgAvatar,
} = A;
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
    A.initEditor = initEditor;
  })();
