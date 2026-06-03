import { createRoundRectPath, drawCheckerboard, fitRect, getElementSize, layerCenter, pointInRect, slideRect } from "./utils.js";
import { getPreset } from "./presets.js";

export function drawProject(ctx, project, store, options = {}) {
  const {
    viewport = { x: 0, y: 0, scale: 1 },
    selectedId = null,
    editor = false,
    currentSlide = 0,
    showGrid = project.showGrid,
    showSafeZones = project.showSafeZones
  } = options;
  const worldW = project.width * project.slideCount;
  const worldH = project.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawCheckerboard(ctx, ctx.canvas.width, ctx.canvas.height);
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.scale, viewport.scale);
  drawWorldBackground(ctx, project, worldW, worldH);
  if (editor && showGrid) drawGrid(ctx, project);
  drawLayers(ctx, project, store, { editor });
  if (editor) {
    drawSlideGuides(ctx, project, currentSlide);
    if (showSafeZones) drawSafeZones(ctx, project);
    const selected = project.layers.find((layer) => layer.id === selectedId);
    if (selected) drawSelection(ctx, selected);
  }
  ctx.restore();
}

export function renderSlideToCanvas(project, store, slideIndex, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext("2d", { alpha: true });
  renderSlide(ctx, project, store, slideIndex, options);
  return canvas;
}

export function renderSlide(ctx, project, store, slideIndex, options = {}) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = project.background || "#11111a";
  ctx.fillRect(0, 0, project.width, project.height);
  ctx.translate(-slideIndex * project.width, 0);
  drawLayers(ctx, project, store, { editor: false, exportMode: true, ...options });
  ctx.restore();
}

export function drawLayer(ctx, layer, store, options = {}) {
  if (!layer.visible) return;
  ctx.save();
  ctx.globalAlpha *= layer.opacity ?? 1;
  const center = layerCenter(layer);
  ctx.translate(center.x, center.y);
  ctx.rotate((layer.rotation || 0) * Math.PI / 180);
  ctx.translate(-layer.w / 2, -layer.h / 2);
  if (layer.type === "image" || layer.type === "video" || layer.type === "placeholder") drawMediaLikeLayer(ctx, layer, store, options);
  else if (layer.type === "text" || layer.type === "sticker") drawTextLayer(ctx, layer);
  else if (layer.type === "shape") drawShapeLayer(ctx, layer);
  else if (layer.type === "drawing") drawDrawingLayer(ctx, layer);
  ctx.restore();
}

export function hitTest(project, point, includeLocked = false) {
  const layers = [...project.layers].sort((a, b) => (b.z || 0) - (a.z || 0));
  return layers.find((layer) => layer.visible && (includeLocked || !layer.locked) && pointInRotatedLayer(point, layer)) || null;
}

export function selectionHandleAt(layer, point, screenScale = 1) {
  if (!layer) return null;
  const handles = selectionHandles(layer);
  const pad = 10 / screenScale;
  return handles.find((handle) => pointInRect(point, { x: handle.x - pad, y: handle.y - pad, w: pad * 2, h: pad * 2 }))?.name || null;
}

export function layerTouchesSlide(project, layer, slideIndex) {
  const r = slideRect(project, slideIndex);
  return !(layer.x + layer.w < r.x || layer.x > r.x + r.w || layer.y + layer.h < 0 || layer.y > project.height);
}

export function slideHasVideo(project, slideIndex) {
  return project.layers.some((layer) => layer.visible && layer.type === "video" && layerTouchesSlide(project, layer, slideIndex));
}

function drawWorldBackground(ctx, project, w, h) {
  ctx.save();
  ctx.fillStyle = project.background || "#11111a";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawLayers(ctx, project, store, options) {
  [...project.layers].sort((a, b) => (a.z || 0) - (b.z || 0)).forEach((layer) => drawLayer(ctx, layer, store, options));
}

function drawMediaLikeLayer(ctx, layer, store, options) {
  const asset = layer.assetId ? store.getAsset(layer.assetId) : null;
  const element = asset?.element || null;
  ctx.save();
  clipRounded(ctx, 0, 0, layer.w, layer.h, Math.min(layer.radius || 0, Math.min(layer.w, layer.h) / 2));

  if (layer.blurBackground > 0 && element) {
    const { width, height } = getElementSize(element);
    const cover = fitRect(width, height, layer.w, layer.h, "cover");
    ctx.save();
    ctx.filter = `blur(${layer.blurBackground}px) saturate(1.2)`;
    ctx.globalAlpha *= .72;
    drawElement(ctx, element, cover.x - layer.blurBackground, cover.y - layer.blurBackground, cover.w + layer.blurBackground * 2, cover.h + layer.blurBackground * 2);
    ctx.restore();
  }

  if (element) {
    const inset = layer.border || 0;
    const drawArea = { x: inset, y: inset, w: Math.max(1, layer.w - inset * 2), h: Math.max(1, layer.h - inset * 2) };
    if (inset > 0) {
      ctx.fillStyle = layer.borderColor || "#fff";
      ctx.fillRect(0, 0, layer.w, layer.h);
    }
    const { width, height } = getElementSize(element);
    const fit = fitRect(width, height, drawArea.w, drawArea.h, layer.fit || "cover");
    ctx.save();
    ctx.beginPath();
    ctx.rect(drawArea.x, drawArea.y, drawArea.w, drawArea.h);
    ctx.clip();
    const f = layer.filters || {};
    ctx.filter = `brightness(${f.brightness ?? 1}) contrast(${f.contrast ?? 1}) saturate(${f.saturate ?? 1}) grayscale(${f.grayscale ?? 0}) blur(${f.blur ?? 0}px)`;
    drawElement(ctx, element, drawArea.x + fit.x, drawArea.y + fit.y, fit.w, fit.h);
    ctx.restore();
  } else {
    drawPlaceholder(ctx, layer, options);
  }

  ctx.restore();
  if ((layer.strokeWidth || 0) > 0) {
    ctx.lineWidth = layer.strokeWidth;
    ctx.strokeStyle = layer.strokeColor || "#111";
    createRoundRectPath(ctx, layer.strokeWidth / 2, layer.strokeWidth / 2, layer.w - layer.strokeWidth, layer.h - layer.strokeWidth, Math.min(28, layer.w / 8));
    ctx.stroke();
  }
}

function drawElement(ctx, element, x, y, w, h) {
  try {
    ctx.drawImage(element, x, y, w, h);
  } catch {
    ctx.fillStyle = "#181827";
    ctx.fillRect(x, y, w, h);
  }
}

function drawPlaceholder(ctx, layer, options) {
  const grad = ctx.createLinearGradient(0, 0, layer.w, layer.h);
  grad.addColorStop(0, "rgba(255, 107, 203, .34)");
  grad.addColorStop(1, "rgba(103, 232, 249, .2)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, layer.w, layer.h);
  if (!options.exportMode) {
    ctx.setLineDash([18, 14]);
    ctx.lineWidth = Math.max(2, Math.min(layer.w, layer.h) * .01);
    ctx.strokeStyle = "rgba(255,255,255,.62)";
    ctx.strokeRect(12, 12, layer.w - 24, layer.h - 24);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,.84)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.max(18, Math.min(layer.w, layer.h) * .07)}px Inter, sans-serif`;
    ctx.fillText(layer.placeholder || "Drop media", layer.w / 2, layer.h / 2);
  }
}

function drawTextLayer(ctx, layer) {
  if (layer.background && layer.background !== "transparent") {
    ctx.fillStyle = layer.background;
    createRoundRectPath(ctx, 0, 0, layer.w, layer.h, layer.radius || 20);
    ctx.fill();
  }
  ctx.fillStyle = layer.color || "#fff";
  ctx.textAlign = layer.align || "left";
  ctx.textBaseline = "top";
  ctx.font = `${layer.fontWeight || 700} ${layer.fontSize || 72}px "${layer.fontFamily || "Inter"}", Inter, sans-serif`;
  const lines = wrapText(ctx, layer.text || "", layer.w, layer.fontSize || 72);
  const lineH = (layer.fontSize || 72) * (layer.lineHeight || 1.15);
  const x = layer.align === "center" ? layer.w / 2 : layer.align === "right" ? layer.w : 0;
  lines.forEach((line, index) => ctx.fillText(line, x, index * lineH));
}

function drawShapeLayer(ctx, layer) {
  ctx.fillStyle = layer.fill || "transparent";
  ctx.strokeStyle = layer.stroke || "transparent";
  ctx.lineWidth = layer.strokeWidth || 0;
  if (layer.shape === "circle") {
    ctx.beginPath();
    ctx.ellipse(layer.w / 2, layer.h / 2, Math.abs(layer.w / 2), Math.abs(layer.h / 2), 0, 0, Math.PI * 2);
  } else if (layer.shape === "line") {
    ctx.beginPath();
    ctx.moveTo(0, layer.h / 2);
    ctx.lineTo(layer.w, layer.h / 2);
  } else if (layer.shape === "roundRect" || layer.radius) {
    createRoundRectPath(ctx, 0, 0, layer.w, layer.h, layer.radius || 40);
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, layer.w, layer.h);
  }
  if (layer.shape !== "line" && layer.fill !== "transparent") ctx.fill();
  if ((layer.strokeWidth || 0) > 0 || layer.shape === "line") ctx.stroke();
}

function drawDrawingLayer(ctx, layer) {
  ctx.strokeStyle = layer.stroke || "#fff";
  ctx.lineWidth = layer.strokeWidth || 12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const path of layer.paths || []) {
    if (!path.points?.length) continue;
    ctx.beginPath();
    path.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = path.stroke || layer.stroke || "#fff";
    ctx.lineWidth = path.strokeWidth || layer.strokeWidth || 12;
    ctx.stroke();
  }
}

function drawGrid(ctx, project) {
  const step = Math.max(40, Math.round(project.width / 12));
  const worldW = project.width * project.slideCount;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= worldW; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, project.height);
    ctx.stroke();
  }
  for (let y = 0; y <= project.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(worldW, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlideGuides(ctx, project, currentSlide) {
  ctx.save();
  for (let i = 0; i < project.slideCount; i++) {
    const x = i * project.width;
    ctx.lineWidth = i === currentSlide ? 8 : 3;
    ctx.strokeStyle = i === currentSlide ? "rgba(103,232,249,.95)" : "rgba(255,255,255,.24)";
    ctx.strokeRect(x, 0, project.width, project.height);
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,107,203,.82)";
      ctx.setLineDash([22, 18]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, project.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(x + 18, 18, 96, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillText(`Slide ${i + 1}`, x + 30, 44);
  }
  ctx.restore();
}

function drawSafeZones(ctx, project) {
  const preset = getPreset(project.presetId);
  const zone = preset.safeZones;
  ctx.save();
  ctx.fillStyle = "rgba(245,158,11,.08)";
  ctx.strokeStyle = "rgba(245,158,11,.55)";
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 12]);
  for (let i = 0; i < project.slideCount; i++) {
    const x = i * project.width + zone.left;
    const y = zone.top;
    const w = project.width - zone.left - zone.right;
    const h = project.height - zone.top - zone.bottom;
    ctx.strokeRect(x, y, w, h);
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSelection(ctx, layer) {
  ctx.save();
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(layer.x, layer.y, layer.w, layer.h);
  ctx.setLineDash([]);
  for (const handle of selectionHandles(layer)) {
    ctx.fillStyle = "#0b1020";
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function selectionHandles(layer) {
  return [
    { name: "nw", x: layer.x, y: layer.y },
    { name: "ne", x: layer.x + layer.w, y: layer.y },
    { name: "sw", x: layer.x, y: layer.y + layer.h },
    { name: "se", x: layer.x + layer.w, y: layer.y + layer.h }
  ];
}

function pointInRotatedLayer(point, layer) {
  const c = layerCenter(layer);
  const angle = -(layer.rotation || 0) * Math.PI / 180;
  const dx = point.x - c.x;
  const dy = point.y - c.y;
  const local = {
    x: Math.cos(angle) * dx - Math.sin(angle) * dy + layer.w / 2,
    y: Math.sin(angle) * dx + Math.cos(angle) * dy + layer.h / 2
  };
  return local.x >= 0 && local.x <= layer.w && local.y >= 0 && local.y <= layer.h;
}

function clipRounded(ctx, x, y, w, h, radius) {
  if (!radius) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    return;
  }
  createRoundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
}

function wrapText(ctx, text, maxWidth, fontSize) {
  const hardLines = String(text).split("\n");
  const result = [];
  for (const hardLine of hardLines) {
    const words = hardLine.split(/\s+/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    result.push(line || "");
  }
  return result.slice(0, Math.max(1, Math.floor(2000 / Math.max(fontSize, 1))));
}
