import { DEFAULT_PRESET_ID, FONT_OPTIONS, getPreset, PLATFORM_PRESETS } from "./presets.js";
import { applyTemplate, buildGrid, TEMPLATES } from "./templates.js";
import { createLayer, createProject, ProjectStore } from "./state.js";
import { currentSlideFromX, debounce, downloadBlob, fileExtensionForMime, formatBytes, raf, safeFilename, slideRect, uid } from "./utils.js";
import { drawProject, gridStep, hitTest, renderSlideToCanvas, selectionHandleAt, slideHasVideo } from "./renderer.js";
import { downloadProject, exportCurrentSlide, shareProject } from "./exporters.js";

const LAYER_TYPE_LABELS = { image: "Image", video: "Video", placeholder: "Placeholder", text: "Text", sticker: "Sticker", shape: "Shape", drawing: "Drawing" };

const LAYER_ICONS = {
  image: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M5 19l5-5 4 4 2-2 3 3"/></svg>`,
  video: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>`,
  placeholder: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/></svg>`,
  text: `<svg viewBox="0 0 24 24"><path d="M5 6h14M12 6v12M9 18h6"/></svg>`,
  sticker: `<svg viewBox="0 0 24 24"><path d="M12 3l2.4 5.3L20 9l-4 3.9.9 5.6L12 16l-4.9 2.5L8 12.9 4 9l5.6-.7z"/></svg>`,
  shape: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>`,
  drawing: `<svg viewBox="0 0 24 24"><path d="M4 20l4-1L19 8l-3-3L5 16z"/></svg>`
};

const ICON_EYE = `<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_EYE_OFF = `<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 6.1A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.8"/><path d="M6.5 6.6A16.6 16.6 0 0 0 2 12s4 7 10 7a9.5 9.5 0 0 0 3.9-.8"/></svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
const ICON_UNLOCK = `<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5A4 4 0 0 1 15.5 6"/></svg>`;
const ICON_TRASH = `<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5.2A1.8 1.8 0 0 1 10.8 3.4h2.4A1.8 1.8 0 0 1 15 5.2V7M7 7l.9 12.4A1.7 1.7 0 0 0 9.6 21h4.8a1.7 1.7 0 0 0 1.7-1.6L17 7"/></svg>`;

const saved = ProjectStore.loadMetadata();
const store = new ProjectStore(saved || createProject(DEFAULT_PRESET_ID));

const dom = {
  presetSelect: qs("#presetSelect"),
  slideCountInput: qs("#slideCountInput"),
  undoBtn: qs("#undoBtn"),
  redoBtn: qs("#redoBtn"),
  previewBtn: qs("#previewBtn"),
  exportBtn: qs("#exportBtn"),
  templateGrid: qs("#templateGrid"),
  templateModal: qs("#templateModal"),
  templatesBtn: qs("#templatesBtn"),
  mediaInput: qs("#mediaInput"),
  uploadBtn: qs("#uploadBtn"),
  mediaGrid: qs("#mediaGrid"),
  layerList: qs("#layerList"),
  canvas: qs("#editorCanvas"),
  workspace: qs("#workspace"),
  stageWrap: qs("#stageWrap"),
  slideStrip: qs("#slideStrip"),
  projectMeta: qs("#projectMeta"),
  selectionLabel: qs("#selectionLabel"),
  projectInspector: qs("#projectInspector"),
  layerInspector: qs("#layerInspector"),
  projectNameInput: qs("#projectNameInput"),
  projectWidthInput: qs("#projectWidthInput"),
  projectHeightInput: qs("#projectHeightInput"),
  projectBgInput: qs("#projectBgInput"),
  showGrid: qs("#showGrid"),
  showSafeZones: qs("#showSafeZones"),
  snapToggle: qs("#snapToggle"),
  zoomLabel: qs("#zoomLabel"),
  zoomIn: qs("#zoomIn"),
  zoomOut: qs("#zoomOut"),
  zoomReset: qs("#zoomReset"),
  penPopover: qs("#penPopover"),
  drawColor: qs("#drawColor"),
  drawSize: qs("#drawSize"),
  previewModal: qs("#previewModal"),
  previewCanvas: qs("#previewCanvas"),
  previewCaption: qs("#previewCaption"),
  prevSlidePreview: qs("#prevSlidePreview"),
  nextSlidePreview: qs("#nextSlidePreview"),
  exportModal: qs("#exportModal"),
  exportImageType: qs("#exportImageType"),
  exportQuality: qs("#exportQuality"),
  exportFps: qs("#exportFps"),
  exportSeconds: qs("#exportSeconds"),
  downloadAllBtn: qs("#downloadAllBtn"),
  shareAllBtn: qs("#shareAllBtn"),
  downloadCurrentBtn: qs("#downloadCurrentBtn"),
  exportProgress: qs("#exportProgress"),
  exportLog: qs("#exportLog"),
  toast: qs("#toast")
};

const inspector = {
  name: qs("#layerName"),
  x: qs("#layerX"),
  y: qs("#layerY"),
  w: qs("#layerW"),
  h: qs("#layerH"),
  rotation: qs("#layerRotation"),
  opacity: qs("#layerOpacity"),
  locked: qs("#layerLocked"),
  visible: qs("#layerVisible"),
  forward: qs("#layerForward"),
  backward: qs("#layerBackward"),
  duplicate: qs("#layerDuplicate"),
  delete: qs("#layerDelete"),
  media: qs("#mediaInspector"),
  fit: qs("#layerFit"),
  border: qs("#layerBorder"),
  borderColor: qs("#layerBorderColor"),
  stroke: qs("#layerStroke"),
  blurBg: qs("#layerBlurBg"),
  brightness: qs("#filterBrightness"),
  contrast: qs("#filterContrast"),
  saturate: qs("#filterSaturate"),
  blur: qs("#filterBlur"),
  videoControls: qs("#videoControls"),
  videoTime: qs("#videoTime"),
  videoPlayPause: qs("#videoPlayPause"),
  videoPoster: qs("#videoPoster"),
  text: qs("#textInspector"),
  textContent: qs("#textContent"),
  textFont: qs("#textFont"),
  textSize: qs("#textSize"),
  textWeight: qs("#textWeight"),
  textColor: qs("#textColor"),
  textAlign: qs("#textAlign"),
  shape: qs("#shapeInspector"),
  shapeKind: qs("#shapeKind"),
  shapeFill: qs("#shapeFill"),
  shapeStroke: qs("#shapeStroke"),
  shapeStrokeWidth: qs("#shapeStrokeWidth")
};

const state = {
  tool: "select",
  viewport: { x: 0, y: 0, scale: 1 },
  dragging: null,
  spacePan: false,
  shiftSnapping: false,
  previewSlide: 0,
  raf: 0,
  hasFitOnce: false,
  renderThumbnailsSoon: debounce(renderThumbnails, 220)
};

init();

function init() {
  buildPresetOptions();
  buildTemplateGrid();
  buildFontOptions();
  bindTabsAndTools();
  bindProjectControls();
  bindInspector();
  bindCanvas();
  bindMediaImport();
  bindExports();
  store.addEventListener("change", renderAll);
  window.addEventListener("resize", () => {
    fitCanvasToStage(false);
    requestRender();
  });
  dom.templatesBtn.addEventListener("click", openTemplateChooser);
  fitCanvasToStage(true);
  renderAll();
  if (!saved) {
    openTemplateChooser();
  } else {
    toast("Welcome back — your last design was restored.");
  }
}

function buildPresetOptions() {
  dom.presetSelect.innerHTML = PLATFORM_PRESETS.map((preset) => `<option value="${preset.id}">${preset.platform} · ${preset.name} (${preset.width}×${preset.height})</option>`).join("");
}

function buildTemplateGrid() {
  dom.templateGrid.innerHTML = TEMPLATES.map((template) => {
    const blocks = (template.preview || []).map((block) => `<i class="tpl-block tpl-${block.kind}" style="left:${block.x}%;top:${block.y}%;width:${block.w}%;height:${block.h}%"></i>`).join("");
    return `
    <button class="template-card" data-template="${template.id}" style="--template-accent:${template.accent}">
      <span class="template-mini">${blocks}</span>
      <span><strong>${template.name}</strong><span>${template.description}</span></span>
    </button>
  `;
  }).join("");
  dom.templateModal.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template]");
    if (!button) return;
    if (button.dataset.template === "__blank__") chooseBlank();
    else chooseTemplate(button.dataset.template);
  });
}

function openTemplateChooser() {
  if (!dom.templateModal.open) dom.templateModal.showModal();
}

function hasUnsavedDesign() {
  return !store.project.pristine && store.project.layers.length > 0;
}

function chooseTemplate(id) {
  if (hasUnsavedDesign() && !confirm("Replace your current design with this template?")) return;
  store.mutate((project) => {
    applyTemplate(project, id);
    project.templateId = id;
    project.pristine = true;
  }, { markDirty: false });
  store.selectedId = null;
  store.currentSlide = 0;
  dom.templateModal.close();
  fitCanvasToStage(true);
  toast("Template ready. Drop your media into the placeholders.");
}

function chooseBlank() {
  if (hasUnsavedDesign() && !confirm("Clear your current design and start blank?")) return;
  store.mutate((project) => {
    project.layers = [];
    project.templateId = null;
    project.pristine = true;
  }, { markDirty: false });
  store.selectedId = null;
  store.currentSlide = 0;
  dom.templateModal.close();
  fitCanvasToStage(true);
  toast("Blank canvas ready. Add layers from the toolbar or import media.");
}

function applySlideCount(value) {
  const next = Math.max(1, Math.min(20, Number(value) || 1));
  const project = store.project;
  if (project.pristine && project.templateId) {
    store.mutate((proj) => {
      proj.slideCount = next;
      applyTemplate(proj, proj.templateId);
      proj.pristine = true;
    }, { markDirty: false });
  } else {
    store.setSlideCount(next);
  }
  fitCanvasToStage(true);
}

function buildFontOptions() {
  inspector.textFont.innerHTML = FONT_OPTIONS.map((font) => `<option value="${font}">${font}</option>`).join("");
}

function bindTabsAndTools() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      qs(`#tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
  document.querySelectorAll("[data-tool]").forEach((tool) => {
    tool.addEventListener("click", () => setTool(tool.dataset.tool));
  });
  qs("#addTextBtn").addEventListener("click", addText);
  qs("#addShapeBtn").addEventListener("click", addShape);
  qs("#addStickerBtn").addEventListener("click", addSticker);
  qs("#addGridBtn").addEventListener("click", addGrid);
  dom.undoBtn.addEventListener("click", () => store.undo());
  dom.redoBtn.addEventListener("click", () => store.redo());
  document.addEventListener("keydown", handleKeys);
  document.addEventListener("keyup", handleKeyUp);
}

function bindProjectControls() {
  dom.presetSelect.addEventListener("change", () => {
    store.applyPreset(dom.presetSelect.value);
    fitCanvasToStage(true);
  });
  dom.slideCountInput.addEventListener("change", () => applySlideCount(dom.slideCountInput.value));
  document.querySelectorAll(".stepper-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.step) || 0;
      applySlideCount((Number(dom.slideCountInput.value) || 1) + step);
    });
  });
  dom.projectNameInput.addEventListener("input", () => store.mutate((project) => { project.name = dom.projectNameInput.value; }, { history: false, markDirty: false }));
  dom.projectWidthInput.addEventListener("change", () => resizeProject(Number(dom.projectWidthInput.value), store.project.height));
  dom.projectHeightInput.addEventListener("change", () => resizeProject(store.project.width, Number(dom.projectHeightInput.value)));
  dom.projectBgInput.addEventListener("input", () => store.mutate((project) => { project.background = dom.projectBgInput.value; }, { history: false, markDirty: false }));
  dom.showGrid.addEventListener("change", () => store.mutate((project) => { project.showGrid = dom.showGrid.checked; }, { history: false, markDirty: false }));
  dom.showSafeZones.addEventListener("change", () => store.mutate((project) => { project.showSafeZones = dom.showSafeZones.checked; }, { history: false, markDirty: false }));
  dom.snapToggle.addEventListener("change", () => store.mutate((project) => { project.snap = dom.snapToggle.checked; }, { history: false, markDirty: false }));
  dom.zoomIn.addEventListener("click", () => setZoomPercent(currentZoomPercent() * 1.25));
  dom.zoomOut.addEventListener("click", () => setZoomPercent(currentZoomPercent() / 1.25));
  dom.zoomReset.addEventListener("click", () => fitCanvasToStage(true));
}

function bindInspector() {
  const map = [
    [inspector.name, "name", "input"],
    [inspector.x, "x", "number"],
    [inspector.y, "y", "number"],
    [inspector.w, "w", "number"],
    [inspector.h, "h", "number"],
    [inspector.rotation, "rotation", "number"],
    [inspector.opacity, "opacity", "number"],
    [inspector.locked, "locked", "checked"],
    [inspector.visible, "visible", "checked"],
    [inspector.fit, "fit", "input"],
    [inspector.border, "border", "number"],
    [inspector.borderColor, "borderColor", "input"],
    [inspector.stroke, "strokeWidth", "number"],
    [inspector.blurBg, "blurBackground", "number"],
    [inspector.textContent, "text", "input"],
    [inspector.textFont, "fontFamily", "input"],
    [inspector.textSize, "fontSize", "number"],
    [inspector.textWeight, "fontWeight", "number"],
    [inspector.textColor, "color", "input"],
    [inspector.textAlign, "align", "input"],
    [inspector.shapeKind, "shape", "input"],
    [inspector.shapeFill, "fill", "input"],
    [inspector.shapeStroke, "stroke", "input"],
    [inspector.shapeStrokeWidth, "strokeWidth", "number"]
  ];
  map.forEach(([el, prop, type]) => {
    el.addEventListener(type === "input" || type === "checked" ? "input" : "change", () => updateSelected({ [prop]: type === "checked" ? el.checked : type === "number" ? Number(el.value) : el.value }, { history: false }));
    el.addEventListener("change", () => store.saveHistory());
  });
  const filterMap = [
    [inspector.brightness, "brightness"],
    [inspector.contrast, "contrast"],
    [inspector.saturate, "saturate"],
    [inspector.blur, "blur"]
  ];
  filterMap.forEach(([el, prop]) => {
    el.addEventListener("input", () => {
      const layer = store.selectedLayer();
      if (!layer) return;
      updateSelected({ filters: { ...(layer.filters || {}), [prop]: Number(el.value) } }, { history: false });
    });
    el.addEventListener("change", () => store.saveHistory());
  });
  inspector.forward.addEventListener("click", () => store.moveLayer(store.selectedId, 1));
  inspector.backward.addEventListener("click", () => store.moveLayer(store.selectedId, -1));
  inspector.duplicate.addEventListener("click", () => store.duplicateLayer(store.selectedId));
  inspector.delete.addEventListener("click", () => store.removeLayer(store.selectedId));
  inspector.videoTime.addEventListener("input", () => scrubSelectedVideo(Number(inspector.videoTime.value)));
  inspector.videoPlayPause.addEventListener("click", toggleSelectedVideo);
  inspector.videoPoster.addEventListener("click", () => toast("The current frame becomes the still poster on export."));
}

function bindCanvas() {
  const canvas = dom.canvas;
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("dblclick", () => {
    const layer = store.selectedLayer();
    if (layer?.type === "text" || layer?.type === "sticker") inspector.textContent.focus();
  });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? .92 : 1.08;
    state.viewport.scale = Math.max(.02, Math.min(4, state.viewport.scale * factor));
    updateZoomLabel();
    requestRender();
  }, { passive: false });
  dom.stageWrap.addEventListener("dragover", (event) => {
    event.preventDefault();
    dom.stageWrap.classList.add("dragging");
  });
  dom.stageWrap.addEventListener("dragleave", () => dom.stageWrap.classList.remove("dragging"));
  dom.stageWrap.addEventListener("drop", async (event) => {
    event.preventDefault();
    dom.stageWrap.classList.remove("dragging");
    await importFiles([...event.dataTransfer.files]);
  });
}

function bindMediaImport() {
  dom.uploadBtn.addEventListener("click", () => dom.mediaInput.click());
  dom.mediaInput.addEventListener("change", async () => {
    await importFiles([...dom.mediaInput.files]);
    dom.mediaInput.value = "";
  });
}

function bindExports() {
  dom.previewBtn.addEventListener("click", openPreview);
  dom.prevSlidePreview.addEventListener("click", () => setPreviewSlide(state.previewSlide - 1));
  dom.nextSlidePreview.addEventListener("click", () => setPreviewSlide(state.previewSlide + 1));
  dom.exportBtn.addEventListener("click", () => dom.exportModal.showModal());
  dom.downloadCurrentBtn.addEventListener("click", async () => runExport(async (options) => {
    const file = await exportCurrentSlide(store.project, store, store.currentSlide, options);
    return `Downloaded ${file.name}`;
  }));
  dom.downloadAllBtn.addEventListener("click", async () => runExport(async (options) => {
    const files = await downloadProject(store.project, store, options);
    return `Exported ${files.length} file${files.length === 1 ? "" : "s"}.`;
  }));
  dom.shareAllBtn.addEventListener("click", async () => runExport(async (options) => {
    const result = await shareProject(store.project, store, options);
    return result.shared ? "Opened native share sheet." : "Sharing is unavailable here, so files were downloaded instead.";
  }));
}

function renderAll() {
  const project = store.project;
  dom.presetSelect.value = project.presetId;
  dom.slideCountInput.value = project.slideCount;
  dom.projectNameInput.value = project.name || "";
  dom.projectWidthInput.value = Math.round(project.width);
  dom.projectHeightInput.value = Math.round(project.height);
  dom.projectBgInput.value = project.background || "#11111a";
  dom.showGrid.checked = project.showGrid;
  dom.showSafeZones.checked = project.showSafeZones;
  dom.snapToggle.checked = project.snap;
  const preset = getPreset(project.presetId);
  dom.projectMeta.textContent = `${preset.platform} · ${project.width}×${project.height} · ${project.slideCount} slide${project.slideCount === 1 ? "" : "s"}`;
  updateInspector();
  renderLayers();
  renderMediaGrid();
  renderSlideStrip();
  requestRender();
  state.renderThumbnailsSoon();
}

function requestRender() {
  if (state.raf) return;
  state.raf = requestAnimationFrame(() => {
    state.raf = 0;
    const ctx = dom.canvas.getContext("2d");
    resizeEditorCanvas();
    drawProject(ctx, store.project, store, {
      viewport: state.viewport,
      selectedId: store.selectedId,
      editor: true,
      currentSlide: store.currentSlide,
      showGrid: store.project.showGrid || state.shiftSnapping
    });
  });
}

function resizeEditorCanvas() {
  const rect = dom.stageWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(200, Math.round(rect.width * dpr));
  const h = Math.max(200, Math.round(rect.height * dpr));
  if (dom.canvas.width !== w || dom.canvas.height !== h) {
    dom.canvas.width = w;
    dom.canvas.height = h;
    dom.canvas.style.width = `${rect.width}px`;
    dom.canvas.style.height = `${rect.height}px`;
    if (!state.hasFitOnce) fitCanvasToStage(true);
  }
}

function fitCanvasToStage(force = false) {
  resizeEditorCanvas();
  if (!force && state.hasFitOnce) return;
  state.viewport.scale = fitScale();
  centerViewport();
  state.hasFitOnce = true;
  updateZoomLabel();
  requestRender();
}

function currentZoomPercent() {
  const fit = fitScale();
  return fit ? (state.viewport.scale / fit) * 100 : 100;
}

function setZoomPercent(percent) {
  const clamped = Math.max(12, Math.min(400, percent));
  state.viewport.scale = clamped / 100 * fitScale();
  centerViewport();
  updateZoomLabel();
  requestRender();
}

function updateZoomLabel() {
  if (dom.zoomLabel) dom.zoomLabel.textContent = `${Math.round(currentZoomPercent())}%`;
}

function fitScale() {
  const pad = 92;
  return Math.min((dom.canvas.width - pad) / (store.project.width * store.project.slideCount), (dom.canvas.height - pad) / store.project.height);
}

function centerViewport() {
  state.viewport.x = (dom.canvas.width - store.project.width * store.project.slideCount * state.viewport.scale) / 2;
  state.viewport.y = (dom.canvas.height - store.project.height * state.viewport.scale) / 2;
}

function screenToWorld(event) {
  const rect = dom.canvas.getBoundingClientRect();
  const dprX = dom.canvas.width / rect.width;
  const dprY = dom.canvas.height / rect.height;
  const sx = (event.clientX - rect.left) * dprX;
  const sy = (event.clientY - rect.top) * dprY;
  return { x: (sx - state.viewport.x) / state.viewport.scale, y: (sy - state.viewport.y) / state.viewport.scale };
}

function pointerDown(event) {
  dom.canvas.setPointerCapture(event.pointerId);
  if (state.tool === "hand" || state.spacePan || event.button === 1) {
    if (event.button === 1) event.preventDefault();
    state.dragging = { kind: "pan", sx: event.clientX, sy: event.clientY, vx: state.viewport.x, vy: state.viewport.y };
    dom.stageWrap.classList.add("panning");
    return;
  }
  const point = screenToWorld(event);
  store.currentSlide = currentSlideFromX(store.project, point.x);
  if (state.tool === "draw") {
    const layer = createLayer("drawing", {
      name: `Drawing ${store.project.layers.filter((l) => l.type === "drawing").length + 1}`,
      x: 0,
      y: 0,
      w: store.project.width * store.project.slideCount,
      h: store.project.height,
      stroke: dom.drawColor.value,
      strokeWidth: Number(dom.drawSize.value),
      paths: [{ stroke: dom.drawColor.value, strokeWidth: Number(dom.drawSize.value), points: [point] }]
    });
    store.addLayer(layer, true);
    state.dragging = { kind: "draw", layerId: layer.id };
    return;
  }
  const selected = store.selectedLayer();
  const handle = selected ? selectionHandleAt(selected, point, state.viewport.scale) : null;
  if (handle && !selected.locked) {
    state.dragging = { kind: "resize", handle, start: point, layer: structuredClone(selected) };
    return;
  }
  const hit = hitTest(store.project, point);
  if (hit) {
    store.select(hit.id);
    state.dragging = { kind: "move", start: point, layer: structuredClone(hit) };
  } else {
    store.select(null);
  }
}

function pointerMove(event) {
  if (state.dragging?.kind === "pan") {
    const rect = dom.canvas.getBoundingClientRect();
    state.viewport.x = state.dragging.vx + (event.clientX - state.dragging.sx) * (dom.canvas.width / rect.width);
    state.viewport.y = state.dragging.vy + (event.clientY - state.dragging.sy) * (dom.canvas.height / rect.height);
    requestRender();
    return;
  }
  const point = screenToWorld(event);
  if (!state.dragging) return;
  const layer = store.project.layers.find((item) => item.id === state.dragging.layerId || item.id === store.selectedId);
  if (!layer || layer.locked) return;
  if (state.dragging.kind === "draw") {
    const path = layer.paths[layer.paths.length - 1];
    path.points.push(point);
    store.emit();
    return;
  }
  const dx = point.x - state.dragging.start.x;
  const dy = point.y - state.dragging.start.y;
  state.shiftSnapping = event.shiftKey && (state.dragging.kind === "move" || state.dragging.kind === "resize");
  if (state.dragging.kind === "move") {
    let moved = { ...state.dragging.layer, x: state.dragging.layer.x + dx, y: state.dragging.layer.y + dy };
    if (event.shiftKey) {
      const step = gridStep(store.project);
      moved.x = Math.round(moved.x / step) * step;
      moved.y = Math.round(moved.y / step) * step;
    } else {
      moved = snapLayer(moved);
    }
    store.updateLayer(layer.id, { x: moved.x, y: moved.y }, { history: false });
  } else if (state.dragging.kind === "resize") {
    let patch = resizeFromHandle(state.dragging.layer, state.dragging.handle, dx, dy);
    if (event.shiftKey) patch = snapResizeToGrid(patch, state.dragging.handle, gridStep(store.project));
    store.updateLayer(layer.id, patch, { history: false });
  }
}

function pointerUp() {
  if (!state.dragging) return;
  if (state.dragging.kind === "pan") {
    dom.stageWrap.classList.remove("panning");
  } else {
    store.saveHistory();
  }
  state.dragging = null;
  if (state.shiftSnapping) {
    state.shiftSnapping = false;
    requestRender();
  }
}

function snapLayer(layer) {
  if (!store.project.snap) return layer;
  const threshold = 14;
  const snapTargetsX = [];
  const snapTargetsY = [0, store.project.height / 2, store.project.height];
  for (let i = 0; i <= store.project.slideCount; i++) snapTargetsX.push(i * store.project.width);
  for (let i = 0; i < store.project.slideCount; i++) snapTargetsX.push(i * store.project.width + store.project.width / 2);
  const pointsX = [layer.x, layer.x + layer.w / 2, layer.x + layer.w];
  const pointsY = [layer.y, layer.y + layer.h / 2, layer.y + layer.h];
  for (const target of snapTargetsX) {
    for (const point of pointsX) {
      if (Math.abs(point - target) < threshold) layer.x += target - point;
    }
  }
  for (const target of snapTargetsY) {
    for (const point of pointsY) {
      if (Math.abs(point - target) < threshold) layer.y += target - point;
    }
  }
  return layer;
}

function resizeFromHandle(layer, handle, dx, dy) {
  const patch = { x: layer.x, y: layer.y, w: layer.w, h: layer.h };
  if (handle.includes("e")) patch.w = Math.max(24, layer.w + dx);
  if (handle.includes("s")) patch.h = Math.max(24, layer.h + dy);
  if (handle.includes("w")) {
    patch.x = layer.x + dx;
    patch.w = Math.max(24, layer.w - dx);
  }
  if (handle.includes("n")) {
    patch.y = layer.y + dy;
    patch.h = Math.max(24, layer.h - dy);
  }
  return patch;
}

function snapResizeToGrid(patch, handle, step) {
  const snap = (value) => Math.round(value / step) * step;
  if (handle.includes("e")) patch.w = Math.max(step, snap(patch.x + patch.w) - patch.x);
  if (handle.includes("s")) patch.h = Math.max(step, snap(patch.y + patch.h) - patch.y);
  if (handle.includes("w")) {
    const right = patch.x + patch.w;
    patch.x = snap(patch.x);
    patch.w = Math.max(step, right - patch.x);
  }
  if (handle.includes("n")) {
    const bottom = patch.y + patch.h;
    patch.y = snap(patch.y);
    patch.h = Math.max(step, bottom - patch.y);
  }
  return patch;
}

async function importFiles(files) {
  const mediaFiles = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
  if (!mediaFiles.length) return;
  const imported = [];
  for (const file of mediaFiles) {
    const asset = await loadAsset(file);
    store.addAsset(asset);
    imported.push(asset);
  }
  fillPlaceholdersOrAddLayers(imported);
    toast(`Imported ${imported.length} file${imported.length === 1 ? "" : "s"} — placed on the canvas.`);
}

function loadAsset(file) {
  const id = uid("asset");
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => resolve({ id, file, url, type: "image", element: img, width: img.naturalWidth, height: img.naturalHeight, name: file.name, size: file.size });
      img.onerror = reject;
      img.src = url;
    } else {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.onloadedmetadata = () => resolve({ id, file, url, type: "video", element: video, width: video.videoWidth, height: video.videoHeight, duration: video.duration || 0, name: file.name, size: file.size });
      video.onerror = reject;
      video.src = url;
    }
  });
}

function fillPlaceholdersOrAddLayers(assets) {
  const placeholders = store.project.layers.filter((layer) => layer.type === "placeholder" && !layer.assetId);
  let index = 0;
  store.mutate((project) => {
    for (const asset of assets) {
      const placeholder = placeholders[index++];
      if (placeholder) {
        placeholder.type = asset.type;
        placeholder.assetId = asset.id;
        placeholder.name = asset.name;
      } else {
        const r = slideRect(project, Math.min(project.slideCount - 1, store.currentSlide + index - 1));
        project.layers.push(createLayer(asset.type, {
          name: asset.name,
          assetId: asset.id,
          x: r.x + project.width * .12,
          y: project.height * .14,
          w: project.width * .76,
          h: project.height * .62,
          border: project.width * .025,
          borderColor: "#ffffff"
        }));
      }
    }
  });
}

function renderMediaGrid() {
  const assets = [...store.assets.values()];
  dom.mediaGrid.innerHTML = assets.map((asset) => {
    const name = escapeHtml(asset.name);
    return `
    <button class="media-card" data-asset="${asset.id}" title="${name}">
      ${asset.type === "image" ? `<img src="${asset.url}" alt="">` : `<video src="${asset.url}" muted playsinline></video>`}
      <span>${asset.type === "video" ? "▶ " : ""}${name}</span>
    </button>
  `;
  }).join("");
  dom.mediaGrid.querySelectorAll("[data-asset]").forEach((button) => {
    button.addEventListener("click", () => {
      const asset = store.getAsset(button.dataset.asset);
      if (!asset) return;
      fillPlaceholdersOrAddLayers([asset]);
    });
  });
}

let dragLayerId = null;

function renderLayers() {
  const layers = [...store.project.layers].sort((a, b) => (b.z || 0) - (a.z || 0));
  if (!layers.length) {
    dom.layerList.innerHTML = `<div class="layer-empty">No layers yet — add text, a shape, or drop in media.</div>`;
    return;
  }
  dom.layerList.innerHTML = layers.map((layer) => `
    <div class="layer-item ${layer.id === store.selectedId ? "active" : ""} ${layer.visible ? "" : "is-hidden"} ${layer.locked ? "is-locked" : ""}" data-layer="${layer.id}" draggable="true">
      <span class="layer-handle" aria-hidden="true">⠿</span>
      <span class="layer-icon">${LAYER_ICONS[layer.type] || LAYER_ICONS.shape}</span>
      <div class="layer-meta"><strong>${escapeHtml(layer.name)}</strong><small>${LAYER_TYPE_LABELS[layer.type] || layer.type}</small></div>
      <div class="layer-actions">
        <button class="mini-btn icon ${layer.visible ? "" : "on"}" data-action="hide" title="${layer.visible ? "Hide" : "Show"}" aria-label="${layer.visible ? "Hide layer" : "Show layer"}">${layer.visible ? ICON_EYE : ICON_EYE_OFF}</button>
        <button class="mini-btn icon ${layer.locked ? "on" : ""}" data-action="lock" title="${layer.locked ? "Unlock" : "Lock"}" aria-label="${layer.locked ? "Unlock layer" : "Lock layer"}">${layer.locked ? ICON_LOCK : ICON_UNLOCK}</button>
        <button class="mini-btn icon danger" data-action="delete" title="Delete" aria-label="Delete layer">${ICON_TRASH}</button>
      </div>
    </div>
  `).join("");
  dom.layerList.querySelectorAll(".layer-item").forEach((item) => {
    const id = item.dataset.layer;
    item.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      const layer = store.project.layers.find((l) => l.id === id);
      if (!layer) return;
      if (action === "hide") store.updateLayer(id, { visible: !layer.visible });
      else if (action === "lock") store.updateLayer(id, { locked: !layer.locked });
      else if (action === "delete") store.removeLayer(id);
      else store.select(id);
    });
    item.addEventListener("dragstart", (event) => {
      dragLayerId = id;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      try { event.dataTransfer.setData("text/plain", id); } catch (_) {}
    });
    item.addEventListener("dragend", () => {
      dragLayerId = null;
      dom.layerList.querySelectorAll(".layer-item").forEach((el) => el.classList.remove("dragging", "drop-before", "drop-after"));
    });
    item.addEventListener("dragover", (event) => {
      if (!dragLayerId || dragLayerId === id) return;
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      item.classList.toggle("drop-before", !after);
      item.classList.toggle("drop-after", after);
    });
    item.addEventListener("dragleave", () => item.classList.remove("drop-before", "drop-after"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!dragLayerId || dragLayerId === id) return;
      const rect = item.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      const order = [...dom.layerList.querySelectorAll(".layer-item")].map((el) => el.dataset.layer).filter((lid) => lid !== dragLayerId);
      const targetIndex = order.indexOf(id);
      order.splice(after ? targetIndex + 1 : targetIndex, 0, dragLayerId);
      store.reorderLayers(order);
    });
  });
}

function updateInspector() {
  const layer = store.selectedLayer();
  dom.projectInspector.hidden = Boolean(layer);
  dom.layerInspector.hidden = !layer;
  if (!layer) {
    dom.selectionLabel.textContent = "Select a layer to edit its properties.";
    return;
  }
  dom.selectionLabel.textContent = `${layer.name} (${layer.type})`;
  inspector.name.value = layer.name || "";
  inspector.x.value = Math.round(layer.x);
  inspector.y.value = Math.round(layer.y);
  inspector.w.value = Math.round(layer.w);
  inspector.h.value = Math.round(layer.h);
  inspector.rotation.value = Math.round(layer.rotation || 0);
  inspector.opacity.value = layer.opacity ?? 1;
  inspector.locked.checked = Boolean(layer.locked);
  inspector.visible.checked = layer.visible !== false;
  const isMedia = ["image", "video", "placeholder"].includes(layer.type);
  inspector.media.hidden = !isMedia;
  if (isMedia) {
    inspector.fit.value = layer.fit || "cover";
    inspector.border.value = layer.border || 0;
    inspector.borderColor.value = layer.borderColor || "#ffffff";
    inspector.stroke.value = layer.strokeWidth || 0;
    inspector.blurBg.value = layer.blurBackground || 0;
    const filters = layer.filters || {};
    inspector.brightness.value = filters.brightness ?? 1;
    inspector.contrast.value = filters.contrast ?? 1;
    inspector.saturate.value = filters.saturate ?? 1;
    inspector.blur.value = filters.blur ?? 0;
  }
  inspector.videoControls.hidden = layer.type !== "video";
  if (layer.type === "video") {
    const asset = store.getAsset(layer.assetId);
    inspector.videoTime.max = asset?.duration || 10;
    inspector.videoTime.value = asset?.element?.currentTime || layer.currentTime || 0;
  }
  const isText = layer.type === "text" || layer.type === "sticker";
  inspector.text.hidden = !isText;
  if (isText) {
    inspector.textContent.value = layer.text || "";
    inspector.textFont.value = layer.fontFamily || "Inter";
    inspector.textSize.value = Math.round(layer.fontSize || 72);
    inspector.textWeight.value = layer.fontWeight || 700;
    inspector.textColor.value = layer.color || "#ffffff";
    inspector.textAlign.value = layer.align || "left";
  }
  inspector.shape.hidden = layer.type !== "shape";
  if (layer.type === "shape") {
    inspector.shapeKind.value = layer.shape || "roundRect";
    inspector.shapeFill.value = normalizeColor(layer.fill || "#ffffff");
    inspector.shapeStroke.value = normalizeColor(layer.stroke || "#ffffff");
    inspector.shapeStrokeWidth.value = layer.strokeWidth || 0;
  }
}

function renderSlideStrip() {
  if (dom.slideStrip.children.length !== store.project.slideCount) {
    dom.slideStrip.innerHTML = Array.from({ length: store.project.slideCount }, (_, index) => `
      <button class="slide-thumb" data-slide="${index}"><canvas width="120" height="150"></canvas><span>${index + 1}</span></button>
    `).join("");
    dom.slideStrip.querySelectorAll("[data-slide]").forEach((button) => {
      button.addEventListener("click", () => {
        store.currentSlide = Number(button.dataset.slide);
        renderAll();
      });
    });
  }
  dom.slideStrip.querySelectorAll(".slide-thumb").forEach((button, index) => button.classList.toggle("active", index === store.currentSlide));
}

function renderThumbnails() {
  dom.slideStrip.querySelectorAll(".slide-thumb canvas").forEach((canvas, index) => {
    const source = renderSlideToCanvas(store.project, store, index);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / source.width, canvas.height / source.height);
    const w = source.width * scale;
    const h = source.height * scale;
    ctx.drawImage(source, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  });
}

function updateSelected(patch, options) {
  if (!store.selectedId) return;
  store.updateLayer(store.selectedId, patch, options);
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll("[data-tool]").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
  dom.penPopover.hidden = tool !== "draw";
  updateCanvasCursor();
}

function updateCanvasCursor() {
  const panning = state.tool === "hand" || state.spacePan;
  dom.stageWrap.classList.toggle("tool-hand", panning);
  dom.stageWrap.classList.toggle("tool-draw", state.tool === "draw" && !panning);
}

function addText() {
  const r = slideRect(store.project, store.currentSlide);
  store.addLayer(createLayer("text", { name: "Text", text: "Your headline", x: r.x + store.project.width * .12, y: store.project.height * .22, w: store.project.width * .76, h: store.project.height * .18, fontSize: store.project.height * .06, align: "center" }));
}

function addShape() {
  const r = slideRect(store.project, store.currentSlide);
  store.addLayer(createLayer("shape", { name: "Shape", x: r.x + store.project.width * .2, y: store.project.height * .25, w: store.project.width * .6, h: store.project.height * .28, fill: "#67e8f9", opacity: .85 }));
}

function addSticker() {
  const r = slideRect(store.project, store.currentSlide);
  store.addLayer(createLayer("sticker", { name: "Sticker", text: "✨", x: r.x + store.project.width * .36, y: store.project.height * .32, w: store.project.width * .28, h: store.project.height * .16, fontSize: store.project.height * .13 }));
}

function addGrid() {
  store.mutate((project) => {
    project.layers.push(...buildGrid(project, 2, 2, store.currentSlide, Math.round(project.width * .04)));
  });
}

function resizeProject(newW, newH) {
  const old = { w: store.project.width, h: store.project.height };
  store.mutate((project) => {
    const sx = Math.max(100, newW) / old.w;
    const sy = Math.max(100, newH) / old.h;
    project.width = Math.max(100, newW);
    project.height = Math.max(100, newH);
    project.presetId = "custom";
    project.platform = "Custom";
    project.layers.forEach((layer) => {
      layer.x *= sx; layer.y *= sy; layer.w *= sx; layer.h *= sy;
      if (layer.fontSize) layer.fontSize *= sy;
    });
  }, { markDirty: false });
  fitCanvasToStage(true);
}

function openPreview() {
  state.previewSlide = store.currentSlide;
  dom.previewModal.showModal();
  setPreviewSlide(state.previewSlide);
}

function setPreviewSlide(index) {
  state.previewSlide = Math.max(0, Math.min(store.project.slideCount - 1, index));
  const canvas = dom.previewCanvas;
  canvas.width = store.project.width;
  canvas.height = store.project.height;
  const source = renderSlideToCanvas(store.project, store, state.previewSlide);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
  dom.previewCaption.textContent = `Slide ${state.previewSlide + 1} of ${store.project.slideCount} · ${store.project.width}×${store.project.height}${slideHasVideo(store.project, state.previewSlide) ? " · contains video" : ""}`;
}

async function runExport(task) {
  dom.exportProgress.hidden = false;
  dom.exportProgress.value = 0;
  const options = {
    type: dom.exportImageType.value,
    quality: Number(dom.exportQuality.value),
    fps: Number(dom.exportFps.value),
    seconds: Number(dom.exportSeconds.value),
    onProgress: (value, message) => {
      dom.exportProgress.value = value;
      dom.exportLog.textContent = message;
    }
  };
  try {
    const message = await task(options);
    dom.exportProgress.value = 1;
    dom.exportLog.textContent = message;
    toast(message);
  } catch (error) {
    dom.exportLog.textContent = error.message;
    toast(error.message);
  }
}

function scrubSelectedVideo(time) {
  const layer = store.selectedLayer();
  const asset = layer ? store.getAsset(layer.assetId) : null;
  if (!asset?.element) return;
  asset.element.currentTime = time;
  updateSelected({ currentTime: time }, { history: false });
}

function toggleSelectedVideo() {
  const layer = store.selectedLayer();
  const asset = layer ? store.getAsset(layer.assetId) : null;
  if (!asset?.element) return;
  if (asset.element.paused) asset.element.play().catch((error) => toast(error.message));
  else asset.element.pause();
}

function handleKeys(event) {
  const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) store.redo();
    else store.undo();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && store.selectedId) {
    event.preventDefault();
    store.duplicateLayer(store.selectedId);
    return;
  }
  if (!inInput && (event.key === "Delete" || event.key === "Backspace") && store.selectedId) {
    event.preventDefault();
    store.removeLayer(store.selectedId);
    return;
  }
  if (!inInput && event.code === "Space") {
    event.preventDefault();
    if (!state.spacePan) {
      state.spacePan = true;
      updateCanvasCursor();
    }
    return;
  }
  if (!inInput && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const shortcuts = {
      v: () => setTool("select"),
      h: () => setTool("hand"),
      b: () => setTool("draw"),
      t: addText,
      r: addShape,
      e: addSticker,
      g: addGrid
    };
    const handler = shortcuts[event.key.toLowerCase()];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }
}

function handleKeyUp(event) {
  if (event.code === "Space" && state.spacePan) {
    state.spacePan = false;
    updateCanvasCursor();
  }
}

function toast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => dom.toast.classList.remove("show"), 3600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char]);
}

function normalizeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff";
}

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

window.swipeStudio = { store, renderSlideToCanvas, downloadBlob, safeFilename, fileExtensionForMime, formatBytes };
