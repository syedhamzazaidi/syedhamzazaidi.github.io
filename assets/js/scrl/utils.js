export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
export const lerp = (a, b, t) => a + (b - a) * t;
export const round = (value, places = 2) => Number.parseFloat((Number(value) || 0).toFixed(places));
export const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const raf = () => new Promise((resolve) => requestAnimationFrame(resolve));

export function debounce(fn, wait = 120) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render canvas to a downloadable file."));
    }, type, quality);
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function fileExtensionForMime(mime) {
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return "bin";
}

export function fitRect(srcW, srcH, dstW, dstH, mode = "cover") {
  if (!srcW || !srcH || !dstW || !dstH) return { x: 0, y: 0, w: dstW, h: dstH };
  if (mode === "fill") return { x: 0, y: 0, w: dstW, h: dstH };
  const scale = mode === "contain" ? Math.min(dstW / srcW, dstH / srcH) : Math.max(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

export function getElementSize(el) {
  if (!el) return { width: 1, height: 1 };
  if (el instanceof HTMLVideoElement) {
    return { width: el.videoWidth || 1, height: el.videoHeight || 1 };
  }
  return { width: el.naturalWidth || el.width || 1, height: el.naturalHeight || el.height || 1 };
}

export function pointInRect(point, rect, pad = 0) {
  return point.x >= rect.x - pad && point.x <= rect.x + rect.w + pad && point.y >= rect.y - pad && point.y <= rect.y + rect.h + pad;
}

export function slideRect(project, index) {
  return { x: index * project.width, y: 0, w: project.width, h: project.height };
}

export function currentSlideFromX(project, x) {
  return clamp(Math.floor(x / project.width), 0, project.slideCount - 1);
}

export function layerCenter(layer) {
  return { x: layer.x + layer.w / 2, y: layer.y + layer.h / 2 };
}

export function duplicatePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createRoundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function safeFilename(name) {
  return String(name || "swipe-studio")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "swipe-studio";
}

export function canNativeShareFiles(files) {
  return Boolean(navigator.canShare && navigator.canShare({ files }));
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function drawCheckerboard(ctx, w, h, size = 24) {
  ctx.save();
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = ((x / size + y / size) % 2) ? "#151521" : "#101018";
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.restore();
}

export function pickSupportedVideoMime() {
  if (!window.MediaRecorder) return "";
  const options = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}
