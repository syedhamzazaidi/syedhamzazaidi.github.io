import { duplicatePlain, uid, clamp } from "./utils.js";
import { DEFAULT_PRESET_ID, getPreset } from "./presets.js";

const STORAGE_KEY = "swipe-studio-project-v2";

export function createProject(presetId = DEFAULT_PRESET_ID) {
  const preset = getPreset(presetId);
  const project = {
    id: uid("project"),
    name: "Untitled carousel",
    presetId: preset.id,
    platform: preset.platform,
    width: preset.width,
    height: preset.height,
    slideCount: preset.slideCount,
    background: "#11111a",
    showGrid: true,
    showSafeZones: true,
    snap: true,
    templateId: null,
    pristine: true,
    layers: []
  };
  project.layers = starterLayers(project);
  return project;
}

function starterLayers(project) {
  const w = project.width;
  const h = project.height;
  return [
    createLayer("shape", {
      name: "Ambient glow",
      x: w * .08,
      y: h * .08,
      w: w * 1.35,
      h: h * .58,
      rotation: -7,
      opacity: .85,
      fill: "#16263f",
      stroke: "transparent",
      strokeWidth: 0,
      radius: 90
    }),
    createLayer("shape", {
      name: "Cyan accent",
      x: w * 2.7,
      y: h * .55,
      w: w * 1.2,
      h: h * .32,
      rotation: 4,
      opacity: .7,
      fill: "#5fe3ff",
      stroke: "transparent",
      strokeWidth: 0,
      radius: 80
    }),
    createLayer("text", {
      name: "Hero headline",
      text: "Design a seamless\ncarousel in your browser",
      x: w * .12,
      y: h * .24,
      w: w * .74,
      h: h * .3,
      fontSize: Math.round(h * .07),
      fontWeight: 800,
      color: "#ffffff",
      lineHeight: 1.05
    }),
    createLayer("text", {
      name: "Slide note",
      text: "Import photos/videos • add borders • export platform-ready slides",
      x: w * 1.15,
      y: h * .68,
      w: w * .7,
      h: h * .12,
      fontSize: Math.round(h * .026),
      fontWeight: 600,
      color: "#aab6c8",
      align: "center"
    })
  ];
}

export function createLayer(type, overrides = {}) {
  const base = {
    id: uid("layer"),
    type,
    name: `${type[0].toUpperCase()}${type.slice(1)} layer`,
    x: 120,
    y: 120,
    w: 420,
    h: 420,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    z: Date.now(),
    slideScope: "world"
  };

  const byType = {
    image: {
      assetId: null,
      fit: "cover",
      border: 0,
      borderColor: "#ffffff",
      strokeWidth: 0,
      strokeColor: "#111111",
      blurBackground: 0,
      filters: { brightness: 1, contrast: 1, saturate: 1, grayscale: 0, blur: 0 }
    },
    video: {
      assetId: null,
      fit: "cover",
      border: 0,
      borderColor: "#ffffff",
      strokeWidth: 0,
      strokeColor: "#111111",
      blurBackground: 0,
      currentTime: 0,
      trimStart: 0,
      trimEnd: null,
      muted: true,
      filters: { brightness: 1, contrast: 1, saturate: 1, grayscale: 0, blur: 0 }
    },
    text: {
      text: "Double click to edit",
      fontFamily: "Inter",
      fontSize: 86,
      fontWeight: 800,
      color: "#ffffff",
      align: "left",
      lineHeight: 1.12,
      letterSpacing: 0,
      background: "transparent",
      radius: 28
    },
    shape: {
      shape: "roundRect",
      fill: "#ffffff",
      stroke: "#ffffff",
      strokeWidth: 0,
      radius: 48
    },
    sticker: {
      text: "✨",
      fontFamily: "Inter",
      fontSize: 180,
      fontWeight: 800,
      color: "#ffffff",
      align: "center",
      lineHeight: 1
    },
    drawing: {
      paths: [],
      stroke: "#ffffff",
      strokeWidth: 16
    },
    placeholder: {
      placeholder: "Drop media",
      fit: "cover",
      border: 22,
      borderColor: "#ffffff",
      strokeWidth: 0,
      strokeColor: "#111111",
      blurBackground: 0,
      filters: { brightness: 1, contrast: 1, saturate: 1, grayscale: 0, blur: 0 }
    }
  };

  return { ...base, ...(byType[type] || {}), ...overrides };
}

export class ProjectStore extends EventTarget {
  constructor(project = createProject()) {
    super();
    this.project = project;
    this.assets = new Map();
    this.selectedId = null;
    this.currentSlide = 0;
    this.history = [];
    this.future = [];
    this.saveHistory();
  }

  emit() {
    this.dispatchEvent(new CustomEvent("change", { detail: this.project }));
  }

  saveHistory() {
    this.history.push(duplicatePlain(this.project));
    if (this.history.length > 80) this.history.shift();
    this.future = [];
  }

  mutate(fn, { history = true, markDirty = true } = {}) {
    fn(this.project);
    this.project.slideCount = clamp(this.project.slideCount, 1, 20);
    this.currentSlide = clamp(this.currentSlide, 0, this.project.slideCount - 1);
    if (markDirty) this.project.pristine = false;
    if (history) this.saveHistory();
    this.persistMetadata();
    this.emit();
  }

  undo() {
    if (this.history.length <= 1) return;
    const current = this.history.pop();
    this.future.push(current);
    this.project = duplicatePlain(this.history[this.history.length - 1]);
    this.selectedId = this.project.layers.some((l) => l.id === this.selectedId) ? this.selectedId : null;
    this.persistMetadata();
    this.emit();
  }

  redo() {
    if (!this.future.length) return;
    const next = this.future.pop();
    this.project = duplicatePlain(next);
    this.history.push(duplicatePlain(next));
    this.selectedId = this.project.layers.some((l) => l.id === this.selectedId) ? this.selectedId : null;
    this.persistMetadata();
    this.emit();
  }

  select(id) {
    this.selectedId = id;
    this.emit();
  }

  selectedLayer() {
    return this.project.layers.find((layer) => layer.id === this.selectedId) || null;
  }

  addLayer(layer, select = true) {
    this.mutate((project) => {
      layer.z = maxZ(project) + 1;
      project.layers.push(layer);
    });
    if (select) this.selectedId = layer.id;
    this.emit();
  }

  updateLayer(id, patch, options) {
    this.mutate((project) => {
      const layer = project.layers.find((item) => item.id === id);
      if (layer) Object.assign(layer, patch);
    }, options);
  }

  removeLayer(id) {
    this.mutate((project) => {
      project.layers = project.layers.filter((layer) => layer.id !== id);
    });
    if (this.selectedId === id) this.selectedId = null;
    this.emit();
  }

  duplicateLayer(id) {
    const layer = this.project.layers.find((item) => item.id === id);
    if (!layer) return;
    const copy = duplicatePlain(layer);
    copy.id = uid("layer");
    copy.name = `${copy.name} copy`;
    copy.x += 44;
    copy.y += 44;
    copy.z = maxZ(this.project) + 1;
    this.addLayer(copy, true);
  }

  reorderLayers(idsTopFirst) {
    this.mutate((project) => {
      const total = idsTopFirst.length;
      idsTopFirst.forEach((id, index) => {
        const layer = project.layers.find((item) => item.id === id);
        if (layer) layer.z = total - index;
      });
    });
  }

  moveLayer(id, delta) {
    this.mutate((project) => {
      const sorted = [...project.layers].sort((a, b) => a.z - b.z);
      const index = sorted.findIndex((layer) => layer.id === id);
      const swapWith = clamp(index + delta, 0, sorted.length - 1);
      if (index === -1 || index === swapWith) return;
      const z = sorted[index].z;
      sorted[index].z = sorted[swapWith].z;
      sorted[swapWith].z = z;
    });
  }

  applyPreset(presetId) {
    const preset = getPreset(presetId);
    const old = { width: this.project.width, height: this.project.height };
    this.mutate((project) => {
      const sx = preset.width / old.width;
      const sy = preset.height / old.height;
      project.presetId = preset.id;
      project.platform = preset.platform;
      project.width = preset.width;
      project.height = preset.height;
      project.slideCount = Math.min(project.slideCount || preset.slideCount, preset.maxSlides);
      project.layers.forEach((layer) => {
        layer.x *= sx;
        layer.y *= sy;
        layer.w *= sx;
        layer.h *= sy;
        if (layer.fontSize) layer.fontSize *= sy;
      });
    }, { markDirty: false });
  }

  setSlideCount(count) {
    this.mutate((project) => {
      project.slideCount = clamp(count, 1, 20);
    }, { markDirty: false });
  }

  addAsset(asset) {
    this.assets.set(asset.id, asset);
    this.emit();
  }

  getAsset(id) {
    return this.assets.get(id);
  }

  persistMetadata() {
    try {
      const metadata = duplicatePlain(this.project);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    } catch (_) {}
  }

  static loadMetadata() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const project = JSON.parse(raw);
      if (!project || !project.width || !project.height || !Array.isArray(project.layers)) return null;
      return project;
    } catch {
      return null;
    }
  }
}

function maxZ(project) {
  return project.layers.reduce((max, layer) => Math.max(max, layer.z || 0), 0);
}
