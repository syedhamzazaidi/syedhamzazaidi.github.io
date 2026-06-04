import { createLayer } from "./state.js";

const palette = {
  ink: "#0f1020",
  paper: "#f8f4ed",
  pink: "#ff6bcb",
  cyan: "#67e8f9",
  lime: "#bef264",
  amber: "#fde68a",
  violet: "#a78bfa",
  red: "#cf1f2e",
  redDeep: "#a8121f",
  blush: "#f3c4cb",
  blushDeep: "#e08a98",
  cream: "#f7f1e6",
  noir: "#141118"
};

const SERIF = "Playfair Display";
const SANS = "Plus Jakarta Sans";

function pill(text, x, y, w, h, opts = {}) {
  return createLayer("text", {
    name: opts.name || "Label",
    text,
    x, y, w, h,
    background: opts.bg || palette.red,
    radius: h / 2,
    color: opts.color || "#ffffff",
    fontFamily: opts.font || SANS,
    fontWeight: opts.weight || 700,
    fontSize: opts.size || h * 0.42,
    align: "center",
    valign: "middle",
    lineHeight: 1.05
  });
}

function heading(text, x, y, w, h, opts = {}) {
  return createLayer("text", {
    name: opts.name || "Heading",
    text,
    x, y, w, h,
    fontFamily: opts.font || SERIF,
    fontWeight: opts.weight || 700,
    fontSize: opts.size || h * 0.5,
    color: opts.color || "#ffffff",
    align: opts.align || "left",
    valign: opts.valign || "top",
    lineHeight: opts.lh || 0.98
  });
}

function body(text, x, y, w, h, opts = {}) {
  return createLayer("text", {
    name: opts.name || "Text",
    text,
    x, y, w, h,
    fontFamily: opts.font || SANS,
    fontWeight: opts.weight || 600,
    fontSize: opts.size || h * 0.16,
    color: opts.color || "#ffffff",
    align: opts.align || "left",
    valign: opts.valign || "top",
    lineHeight: opts.lh || 1.3,
    background: opts.bg || "transparent",
    radius: opts.radius || 0
  });
}

function framedPhoto(name, x, y, w, h, opts = {}) {
  return createLayer("placeholder", {
    name,
    x, y, w, h,
    border: opts.border ?? 0,
    borderColor: opts.borderColor || "#ffffff",
    rotation: opts.rotation || 0,
    radius: opts.radius ?? 16
  });
}

export const TEMPLATES = [
  {
    id: "editorial-story",
    name: "Editorial story",
    description: "Big headline, captions, and full-bleed photos.",
    accent: palette.cyan,
    preview: [
      { kind: "text", x: 10, y: 12, w: 58, h: 9 },
      { kind: "text", x: 10, y: 26, w: 40, h: 6 },
      { kind: "media", x: 10, y: 42, w: 80, h: 46 }
    ],
    apply: (project) => editorialStory(project)
  },
  {
    id: "seamless-panorama",
    name: "Seamless panorama",
    description: "One wide photo, full-bleed and split edge-to-edge across every slide.",
    accent: palette.cyan,
    preview: [
      { kind: "media", x: 0, y: 0, w: 100, h: 100 },
      { kind: "frame", x: 33, y: 0, w: 1.5, h: 100 },
      { kind: "frame", x: 66, y: 0, w: 1.5, h: 100 }
    ],
    apply: (project) => seamlessPanorama(project)
  },
  {
    id: "white-border-dump",
    name: "White-border dump",
    description: "Framed photos with even, feed-safe spacing.",
    accent: palette.paper,
    preview: [
      { kind: "frame", x: 14, y: 12, w: 72, h: 76 },
      { kind: "media", x: 21, y: 20, w: 58, h: 60 }
    ],
    apply: (project) => whiteBorderDump(project)
  },
  {
    id: "grid-collage",
    name: "Grid collage",
    description: "Tidy photo grids with consistent gaps.",
    accent: palette.lime,
    preview: [
      { kind: "media", x: 10, y: 12, w: 36, h: 36 },
      { kind: "media", x: 54, y: 12, w: 36, h: 36 },
      { kind: "media", x: 10, y: 52, w: 36, h: 36 },
      { kind: "media", x: 54, y: 52, w: 36, h: 36 }
    ],
    apply: (project) => gridCollage(project)
  },
  {
    id: "quote-cards",
    name: "Quote + image",
    description: "Alternate punchy quotes with photos.",
    accent: palette.violet,
    preview: [
      { kind: "text", x: 16, y: 26, w: 68, h: 8 },
      { kind: "text", x: 26, y: 40, w: 48, h: 8 },
      { kind: "accent", x: 30, y: 62, w: 40, h: 5 }
    ],
    apply: (project) => quoteCards(project)
  },
  {
    id: "product-showcase",
    name: "Product showcase",
    description: "Hero shot, features, and a clear call to action.",
    accent: palette.amber,
    preview: [
      { kind: "media", x: 18, y: 12, w: 64, h: 44 },
      { kind: "text", x: 22, y: 62, w: 56, h: 7 },
      { kind: "accent", x: 28, y: 78, w: 44, h: 9 }
    ],
    apply: (project) => productShowcase(project)
  },
  {
    id: "before-after",
    name: "Before / after",
    description: "Side-by-side comparison with bold labels.",
    accent: palette.cyan,
    preview: [
      { kind: "text", x: 10, y: 8, w: 30, h: 5 },
      { kind: "text", x: 58, y: 8, w: 30, h: 5 },
      { kind: "media", x: 8, y: 20, w: 38, h: 62 },
      { kind: "media", x: 54, y: 20, w: 38, h: 62 }
    ],
    apply: (project) => beforeAfter(project)
  },
  {
    id: "vertical-cover",
    name: "Story / Reel cover",
    description: "Full-screen title that stays inside safe zones.",
    accent: palette.violet,
    preview: [
      { kind: "media", x: 8, y: 8, w: 84, h: 84 },
      { kind: "frame", x: 16, y: 60, w: 68, h: 24 },
      { kind: "text", x: 26, y: 68, w: 48, h: 8 }
    ],
    apply: (project) => verticalCover(project)
  },
  {
    id: "howto-playbook",
    name: "How-to playbook",
    description: "Bold red editorial how-to with step pills and swipe arrows.",
    accent: palette.red,
    preview: [
      { kind: "accent", x: 10, y: 12, w: 30, h: 8 },
      { kind: "text", x: 10, y: 26, w: 72, h: 9 },
      { kind: "text", x: 10, y: 40, w: 52, h: 7 },
      { kind: "media", x: 12, y: 56, w: 76, h: 34 }
    ],
    apply: (project) => howToPlaybook(project)
  },
  {
    id: "results-story",
    name: "Results story",
    description: "Dark, serif claim with photo cut-outs and number badges.",
    accent: palette.red,
    preview: [
      { kind: "text", x: 10, y: 14, w: 64, h: 9 },
      { kind: "text", x: 10, y: 30, w: 40, h: 7 },
      { kind: "media", x: 10, y: 46, w: 80, h: 30 },
      { kind: "accent", x: 64, y: 64, w: 22, h: 22 }
    ],
    apply: (project) => resultsStory(project)
  },
  {
    id: "weekly-diary",
    name: "Weekly diary",
    description: "Soft-pink day-by-day diary with taped photos and notes.",
    accent: palette.blushDeep,
    preview: [
      { kind: "media", x: 14, y: 12, w: 66, h: 44 },
      { kind: "accent", x: 12, y: 62, w: 34, h: 9 },
      { kind: "text", x: 12, y: 76, w: 74, h: 12 }
    ],
    apply: (project) => weeklyDiary(project)
  },
  {
    id: "personal-brand",
    name: "Personal brand",
    description: "Blush announcement with a boxed headline and comment CTA.",
    accent: palette.red,
    preview: [
      { kind: "text", x: 10, y: 12, w: 70, h: 9 },
      { kind: "accent", x: 10, y: 28, w: 52, h: 13 },
      { kind: "media", x: 14, y: 48, w: 72, h: 42 }
    ],
    apply: (project) => personalBrand(project)
  }
];

export function applyTemplate(project, templateId) {
  const template = TEMPLATES.find((item) => item.id === templateId) || TEMPLATES[0];
  project.layers = template.apply(project).map((layer, index) => ({ ...layer, z: index + 1 }));
}

export function buildGrid(project, rows = 2, cols = 2, slideIndex = 0, gap = 34) {
  const x0 = slideIndex * project.width + gap;
  const y0 = gap;
  const cellW = (project.width - gap * (cols + 1)) / cols;
  const cellH = (project.height - gap * (rows + 1)) / rows;
  const layers = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      layers.push(createLayer("placeholder", {
        name: `Grid ${row + 1}.${col + 1}`,
        x: x0 + col * (cellW + gap),
        y: y0 + row * (cellH + gap),
        w: cellW,
        h: cellH,
        border: Math.max(10, gap * .45),
        borderColor: "#ffffff"
      }));
    }
  }
  return layers;
}

function editorialStory(project) {
  const { width: w, height: h, slideCount } = project;
  const layers = [
    createLayer("shape", { name: "Warm paper", x: 0, y: 0, w: w * slideCount, h, fill: palette.paper, opacity: 1, shape: "rect" }),
    createLayer("text", { name: "Deck title", text: "A visual story\nin motion", x: w * .11, y: h * .15, w: w * .78, h: h * .25, fontFamily: "Playfair Display", fontSize: h * .105, fontWeight: 500, color: palette.ink, lineHeight: .94 }),
    createLayer("text", { name: "Deck subtitle", text: "Seamless slides · local media · platform exports", x: w * .13, y: h * .48, w: w * .72, h: h * .08, fontSize: h * .023, fontWeight: 700, color: "#6b5f64", align: "center" }),
    createLayer("placeholder", { name: "Wide hero media", x: w * 1.08, y: h * .12, w: w * 1.35, h: h * .52, border: 0 }),
    createLayer("placeholder", { name: "Detail 1", x: w * 2.62, y: h * .18, w: w * .58, h: h * .58, border: 22 }),
    createLayer("placeholder", { name: "Detail 2", x: w * 3.22, y: h * .42, w: w * .54, h: h * .42, border: 18 }),
    createLayer("shape", { name: "Accent ribbon", x: w * 1.8, y: h * .68, w: w * 2.2, h: h * .05, fill: palette.pink, rotation: -2, radius: 50 }),
    createLayer("text", { name: "Closing line", text: "Export each frame. Upload in order. Keep the flow.", x: w * Math.max(0, slideCount - 1) + w * .12, y: h * .74, w: w * .76, h: h * .12, fontSize: h * .04, fontWeight: 800, color: palette.ink, align: "center" })
  ];
  return layers;
}

function seamlessPanorama(project) {
  const { width: w, height: h, slideCount } = project;
  return [
    createLayer("placeholder", {
      name: "Panorama photo",
      placeholder: "Drop one wide photo",
      x: 0,
      y: 0,
      w: w * slideCount,
      h,
      fit: "cover",
      border: 0
    })
  ];
}

function whiteBorderDump(project) {
  const layers = [createLayer("shape", { name: "Soft white background", x: 0, y: 0, w: project.width * project.slideCount, h: project.height, fill: "#f8f8f6", shape: "rect" })];
  for (let i = 0; i < project.slideCount; i++) {
    const odd = i % 2;
    layers.push(createLayer("placeholder", {
      name: `Bordered photo ${i + 1}`,
      x: i * project.width + project.width * (odd ? .18 : .11),
      y: project.height * (odd ? .17 : .12),
      w: project.width * .72,
      h: project.height * .64,
      rotation: odd ? 2.4 : -1.8,
      border: Math.round(project.width * .04),
      borderColor: "#ffffff",
      strokeWidth: 3,
      strokeColor: "#e8e2da"
    }));
  }
  layers.push(createLayer("text", { name: "Photo dump label", text: "photo dump", x: project.width * .15, y: project.height * .82, w: project.width * .7, h: project.height * .07, fontFamily: "Playfair Display", fontSize: project.height * .065, color: "#18181b", align: "center" }));
  return layers;
}

function gridCollage(project) {
  const layers = [createLayer("shape", { name: "Graphite background", x: 0, y: 0, w: project.width * project.slideCount, h: project.height, fill: "#12121f", shape: "rect" })];
  for (let i = 0; i < project.slideCount; i++) {
    layers.push(...buildGrid(project, i % 2 ? 3 : 2, 2, i, Math.round(project.width * .035)));
  }
  layers.push(createLayer("text", { name: "Grid title", text: "Structured collage", x: project.width * .12, y: project.height * .06, w: project.width * .76, h: project.height * .08, fontSize: project.height * .045, fontWeight: 850, color: "#ffffff", align: "center" }));
  return layers;
}

function quoteCards(project) {
  const { width: w, height: h } = project;
  const layers = [createLayer("shape", { name: "Quote background", x: 0, y: 0, w: w * project.slideCount, h, fill: "#15111f", shape: "rect" })];
  for (let i = 0; i < project.slideCount; i++) {
    if (i % 2 === 0) {
      layers.push(createLayer("text", { name: `Quote ${i + 1}`, text: "“Make the swipe\nfeel intentional.”", x: i * w + w * .12, y: h * .28, w: w * .76, h: h * .3, fontFamily: "Playfair Display", fontSize: h * .085, fontWeight: 500, color: "#ffffff", align: "center", lineHeight: .98 }));
      layers.push(createLayer("shape", { name: `Quote accent ${i + 1}`, x: i * w + w * .25, y: h * .64, w: w * .5, h: h * .035, fill: palette.violet, radius: 40 }));
    } else {
      layers.push(createLayer("placeholder", { name: `Quote image ${i + 1}`, x: i * w + w * .12, y: h * .13, w: w * .76, h: h * .66, border: 18, borderColor: "#ffffff" }));
    }
  }
  return layers;
}

function productShowcase(project) {
  const { width: w, height: h, slideCount } = project;
  return [
    createLayer("shape", { name: "Cream background", x: 0, y: 0, w: w * slideCount, h, fill: "#fff7ed", shape: "rect" }),
    createLayer("placeholder", { name: "Hero product", x: w * .18, y: h * .18, w: w * .64, h: h * .42, border: 0 }),
    createLayer("text", { name: "Product headline", text: "Launch story", x: w * .12, y: h * .66, w: w * .76, h: h * .09, fontSize: h * .06, fontWeight: 900, color: "#111827", align: "center" }),
    ...Array.from({ length: Math.max(1, slideCount - 1) }, (_, i) => createLayer("placeholder", { name: `Feature media ${i + 1}`, x: (i + 1) * w + w * .13, y: h * .16, w: w * .74, h: h * .5, border: 20, borderColor: "#ffffff" })),
    createLayer("shape", { name: "CTA pill", x: w * (slideCount - .78), y: h * .75, w: w * .56, h: h * .075, fill: palette.amber, radius: 90 }),
    createLayer("text", { name: "CTA", text: "save · share · shop", x: w * (slideCount - .78), y: h * .762, w: w * .56, h: h * .06, fontSize: h * .026, fontWeight: 900, color: "#111827", align: "center" })
  ];
}

function beforeAfter(project) {
  const { width: w, height: h } = project;
  const layers = [createLayer("shape", { name: "Split background", x: 0, y: 0, w: w * project.slideCount, h, fill: "#0b1220", shape: "rect" })];
  for (let i = 0; i < project.slideCount; i++) {
    layers.push(createLayer("placeholder", { name: `Before ${i + 1}`, x: i * w + w * .055, y: h * .14, w: w * .43, h: h * .7, border: 10, borderColor: "#ffffff" }));
    layers.push(createLayer("placeholder", { name: `After ${i + 1}`, x: i * w + w * .515, y: h * .14, w: w * .43, h: h * .7, border: 10, borderColor: "#ffffff" }));
    layers.push(createLayer("text", { name: `Before label ${i + 1}`, text: "BEFORE", x: i * w + w * .12, y: h * .075, w: w * .3, h: h * .05, fontSize: h * .027, fontWeight: 900, color: "#ffffff", align: "center" }));
    layers.push(createLayer("text", { name: `After label ${i + 1}`, text: "AFTER", x: i * w + w * .58, y: h * .075, w: w * .3, h: h * .05, fontSize: h * .027, fontWeight: 900, color: palette.cyan, align: "center" }));
  }
  return layers;
}

function verticalCover(project) {
  const { width: w, height: h } = project;
  return [
    createLayer("shape", { name: "Vertical background", x: 0, y: 0, w: w * project.slideCount, h, fill: "#0a0712", shape: "rect" }),
    createLayer("placeholder", { name: "Full screen video/photo", x: 0, y: 0, w, h, border: 0 }),
    createLayer("shape", { name: "Caption shade", x: w * .08, y: h * .58, w: w * .84, h: h * .22, fill: "#000000", opacity: .58, radius: 46 }),
    createLayer("text", { name: "Cover title", text: "HOOK\nGOES HERE", x: w * .12, y: h * .61, w: w * .76, h: h * .16, fontSize: h * .063, fontWeight: 950, color: "#ffffff", align: "center", lineHeight: .92 }),
    createLayer("text", { name: "Safe zone note", text: "Safe for TikTok/Reels UI", x: w * .12, y: h * .79, w: w * .76, h: h * .04, fontSize: h * .022, fontWeight: 700, color: "#d8b4fe", align: "center" })
  ];
}

function howToPlaybook(project) {
  const { width: w, height: h, slideCount: n } = project;
  const layers = [createLayer("shape", { name: "Red background", x: 0, y: 0, w: w * n, h, fill: palette.red, shape: "rect" })];
  layers.push(pill("HOW TO", w * .08, h * .1, w * .34, h * .05, { bg: palette.noir, size: h * .024 }));
  layers.push(heading("Transform\nyour brand\nin 30 days", w * .08, h * .18, w * .84, h * .38, { size: h * .085, color: "#ffffff", lh: 1.0 }));
  layers.push(body("Save this — then keep swiping →", w * .08, h * .62, w * .76, h * .05, { color: palette.cream, size: h * .026 }));
  layers.push(framedPhoto("Hero media", w * .18, h * .7, w * .64, h * .24, { radius: 22 }));
  const steps = [["STEP 01", "Pick one clear offer"], ["STEP 02", "Post with intention"], ["STEP 03", "Show real results"], ["STEP 04", "Make a simple ask"]];
  for (let i = 1; i < n; i++) {
    const x = i * w;
    const step = steps[(i - 1) % steps.length];
    layers.push(pill(step[0], x + w * .08, h * .1, w * .4, h * .06, { bg: palette.noir, size: h * .026 }));
    layers.push(heading(step[1], x + w * .08, h * .2, w * .84, h * .2, { size: h * .058, color: "#ffffff", lh: 1.02 }));
    layers.push(framedPhoto(`Media ${i}`, x + w * .12, h * .44, w * .76, h * .4, { radius: 22 }));
    layers.push(createLayer("sticker", { name: "Swipe arrow", text: "→", x: x + w * .78, y: h * .87, w: w * .16, h: h * .08, fontSize: h * .06, color: palette.cream, align: "center" }));
  }
  return layers;
}

function resultsStory(project) {
  const { width: w, height: h, slideCount: n } = project;
  const layers = [createLayer("shape", { name: "Charcoal background", x: 0, y: 0, w: w * n, h, fill: palette.noir, shape: "rect" })];
  layers.push(heading("I tripled\nmy sales\nin 30 days", w * .08, h * .14, w * .84, h * .34, { size: h * .085, color: "#ffffff", lh: 1.0 }));
  layers.push(heading("because…", w * .08, h * .5, w * .7, h * .08, { weight: 500, size: h * .05, color: palette.blushDeep }));
  layers.push(framedPhoto("Hero portrait", w * .1, h * .6, w * .8, h * .34, { radius: 18 }));
  const claims = ["I shifted my focus to email", "I stopped posting daily", "I built a repeatable system", "I finally made the ask"];
  const badges = ["+200", "+2K", "3x", "#1"];
  for (let i = 1; i < n; i++) {
    const x = i * w;
    layers.push(framedPhoto(`Photo ${i}`, x + w * .08, h * .08, w * .84, h * .48, { radius: 18 }));
    layers.push(pill(claims[(i - 1) % claims.length], x + w * .08, h * .6, w * .84, h * .07, { bg: palette.red, size: h * .026 }));
    const bw = w * .26;
    layers.push(createLayer("shape", { name: "Badge", shape: "circle", x: x + w * .6, y: h * .72, w: bw, h: bw, fill: palette.red }));
    layers.push(createLayer("text", { name: "Badge number", text: badges[(i - 1) % badges.length], x: x + w * .6, y: h * .72, w: bw, h: bw, fontFamily: SANS, fontWeight: 800, fontSize: h * .045, color: "#ffffff", align: "center", valign: "middle" }));
  }
  return layers;
}

function weeklyDiary(project) {
  const { width: w, height: h, slideCount: n } = project;
  const layers = [createLayer("shape", { name: "Pink background", x: 0, y: 0, w: w * n, h, fill: palette.blush, shape: "rect" })];
  layers.push(pill("DIARIES", w * .08, h * .08, w * .34, h * .05, { bg: palette.red, size: h * .024 }));
  layers.push(heading("this\nweek", w * .08, h * .16, w * .8, h * .26, { size: h * .11, color: palette.noir, lh: .9 }));
  layers.push(body("a week as a social media manager", w * .08, h * .46, w * .8, h * .06, { color: palette.redDeep, size: h * .026 }));
  layers.push(framedPhoto("Hero media", w * .1, h * .56, w * .8, h * .36, { border: Math.round(h * .012), rotation: -2, radius: 8 }));
  const days = ["MON.", "TUE.", "WED.", "THU.", "FRI.", "SAT.", "SUN."];
  for (let i = 1; i < n; i++) {
    const x = i * w;
    const odd = i % 2;
    layers.push(framedPhoto(`Photo ${i}`, x + w * (odd ? .16 : .1), h * .1, w * .72, h * .5, { border: Math.round(h * .012), rotation: odd ? 2.5 : -2, radius: 8 }));
    layers.push(heading(days[(i - 1) % days.length], x + w * .1, h * .64, w * .6, h * .1, { weight: 800, size: h * .07, color: palette.red }));
    layers.push(body("The best part of this week was…", x + w * .1, h * .76, w * .8, h * .16, { color: palette.noir, size: h * .026, bg: palette.cream, radius: 18, lh: 1.3 }));
  }
  return layers;
}

function personalBrand(project) {
  const { width: w, height: h, slideCount: n } = project;
  const layers = [createLayer("shape", { name: "Blush background", x: 0, y: 0, w: w * n, h, fill: palette.blush, shape: "rect" })];
  layers.push(heading("2025 is the\nyear of the", w * .08, h * .12, w * .84, h * .2, { weight: 600, size: h * .06, color: palette.noir, lh: 1.0 }));
  layers.push(createLayer("text", { name: "Boxed word", text: "PERSONAL\nBRAND", x: w * .08, y: h * .34, w: w * .72, h: h * .18, background: palette.red, radius: 8, color: "#ffffff", fontFamily: SERIF, fontWeight: 800, fontSize: h * .062, align: "center", valign: "middle", lineHeight: .98 }));
  layers.push(framedPhoto("Hero portrait", w * .12, h * .56, w * .76, h * .36, { border: Math.round(h * .012), radius: 10 }));
  for (let i = 1; i < n; i++) {
    const x = i * w;
    if (i === n - 1) {
      layers.push(heading("comment", x + w * .1, h * .15, w * .8, h * .07, { weight: 600, size: h * .045, color: palette.noir, align: "center" }));
      layers.push(createLayer("shape", { name: "CTA oval", shape: "circle", x: x + w * .2, y: h * .25, w: w * .6, h: h * .15, fill: "#ffffff", stroke: palette.red, strokeWidth: 6 }));
      layers.push(createLayer("text", { name: "CTA word", text: "BRAND", x: x + w * .2, y: h * .25, w: w * .6, h: h * .15, fontFamily: SERIF, fontWeight: 800, fontSize: h * .05, color: palette.red, align: "center", valign: "middle" }));
      layers.push(framedPhoto("Closing media", x + w * .18, h * .48, w * .64, h * .42, { border: Math.round(h * .012), radius: 10 }));
    } else {
      layers.push(framedPhoto(`Photo ${i}`, x + w * .1, h * .1, w * .8, h * .5, { border: Math.round(h * .012), radius: 10 }));
      layers.push(body("Show your audience the results, the numbers, the transformations.", x + w * .12, h * .66, w * .76, h * .24, { color: palette.noir, size: h * .03, align: "center", lh: 1.35 }));
    }
  }
  return layers;
}
