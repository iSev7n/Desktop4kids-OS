// avatar.options.js
// Auto-split from apps/settings/avatar.js (no behavior changes)
(function () {
  const A = (window.__D4K_AVATAR__ = window.__D4K_AVATAR__ || {});

  // =========================
// Options
// =========================
A.SKINS = [
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
A.HAIRS = [
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
A.HAIR_COLORS = [
  { id: "black", name: "Black" },
  { id: "blonde", name: "Blonde" },
  { id: "blue", name: "Blue" },
  { id: "brown", name: "Brown" },
  { id: "green", name: "Green" },
  { id: "grey", name: "Grey" },
  { id: "purple", name: "Purple" },
  { id: "red", name: "Red" },
];
A.HAIR_COLOR_MAP = {
  black: "#1a1a1a",
  brown: "#5A3A22",
  blonde: "#D6A94E",
  blue: "#2E6BFF",
  green: "#2F9E44",
  grey: "#7A7A7A",
  purple: "#7C4DFF",
  red: "#B83232",
};
A.OUTFIT_COLORS = [
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
A.BG_COLORS = [
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
A.EYES = [
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
A.MOUTHS = [
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
A.OUTFITS = [
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
A.ACCESSORIES = [
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

})();
