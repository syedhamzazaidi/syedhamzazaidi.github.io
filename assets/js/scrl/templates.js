import { createLayer } from "./state.js";

const palette = {
  ink: "#0f1020",
  paper: "#f8f4ed",
  pink: "#ff6bcb",
  cyan: "#67e8f9",
  lime: "#bef264",
  amber: "#fde68a",
  violet: "#a78bfa"
};

export const TEMPLATES = [
  {
    id: "editorial-story",
    name: "Editorial story",
    description: "Magazine-style carousel with headline, captions, and full-bleed media.",
    accent: palette.pink,
    apply: (project) => editorialStory(project)
  },
  {
    id: "seamless-panorama",
    name: "Seamless panorama",
    description: "A continuous band intended for one wide image or connected collage.",
    accent: palette.cyan,
    apply: (project) => seamlessPanorama(project)
  },
  {
    id: "white-border-dump",
    name: "White-border photo dump",
    description: "Gallery borders, outlines, and consistent feed-safe spacing.",
    accent: palette.paper,
    apply: (project) => whiteBorderDump(project)
  },
  {
    id: "grid-collage",
    name: "Grid collage",
    description: "Structured placeholders with gaps, frames, and rhythm.",
    accent: palette.lime,
    apply: (project) => gridCollage(project)
  },
  {
    id: "quote-cards",
    name: "Quote + image",
    description: "Alternating quotes and images for a swipeable story deck.",
    accent: palette.violet,
    apply: (project) => quoteCards(project)
  },
  {
    id: "product-showcase",
    name: "Product showcase",
    description: "Hero product, feature callouts, and clean commerce slides.",
    accent: palette.amber,
    apply: (project) => productShowcase(project)
  },
  {
    id: "before-after",
    name: "Before / after",
    description: "Split-screen comparison slides with bold labels.",
    accent: palette.cyan,
    apply: (project) => beforeAfter(project)
  },
  {
    id: "vertical-cover",
    name: "TikTok/Reel cover",
    description: "Full-screen vertical title, safe-zone friendly.",
    accent: palette.pink,
    apply: (project) => verticalCover(project)
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
    createLayer("text", { name: "Deck title", text: "A visual story\\nin motion", x: w * .11, y: h * .15, w: w * .78, h: h * .25, fontFamily: "Playfair Display", fontSize: h * .105, fontWeight: 500, color: palette.ink, lineHeight: .94 }),
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
    createLayer("shape", { name: "Night background", x: 0, y: 0, w: w * slideCount, h, fill: "#08080f", shape: "rect" }),
    createLayer("placeholder", { name: "Continuous panorama placeholder", x: w * .08, y: h * .19, w: w * (slideCount - .16), h: h * .54, border: 0 }),
    createLayer("shape", { name: "Gradient trail", x: w * .3, y: h * .68, w: w * (slideCount - .6), h: h * .08, fill: palette.cyan, opacity: .72, radius: 80 }),
    createLayer("text", { name: "Panorama instruction", text: "Drop a wide photo, then export sliced slides.", x: w * .18, y: h * .78, w: w * 1.2, h: h * .09, fontSize: h * .034, fontWeight: 800, color: "#ffffff" })
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
      layers.push(createLayer("text", { name: `Quote ${i + 1}`, text: "“Make the swipe\\nfeel intentional.”", x: i * w + w * .12, y: h * .28, w: w * .76, h: h * .3, fontFamily: "Playfair Display", fontSize: h * .085, fontWeight: 500, color: "#ffffff", align: "center", lineHeight: .98 }));
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
    createLayer("text", { name: "Cover title", text: "HOOK\\nGOES HERE", x: w * .12, y: h * .61, w: w * .76, h: h * .16, fontSize: h * .063, fontWeight: 950, color: "#ffffff", align: "center", lineHeight: .92 }),
    createLayer("text", { name: "Safe zone note", text: "Safe for TikTok/Reels UI", x: w * .12, y: h * .79, w: w * .76, h: h * .04, fontSize: h * .022, fontWeight: 700, color: "#d8b4fe", align: "center" })
  ];
}
