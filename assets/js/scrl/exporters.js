import { canvasToBlob, downloadBlob, fileExtensionForMime, pickSupportedVideoMime, safeFilename, sleep } from "./utils.js";
import { renderSlide, renderSlideToCanvas, slideHasVideo } from "./renderer.js";

export async function exportSlideImage(project, store, slideIndex, options = {}) {
  const type = options.type || "image/png";
  const quality = Number(options.quality || 0.92);
  const canvas = renderSlideToCanvas(project, store, slideIndex, { exportMode: true });
  const blob = await canvasToBlob(canvas, type, quality);
  const ext = fileExtensionForMime(type);
  return new File([blob], `${safeFilename(project.name)}-slide-${String(slideIndex + 1).padStart(2, "0")}.${ext}`, { type });
}

export async function exportCurrentSlide(project, store, slideIndex, options = {}) {
  const file = await exportSlideImage(project, store, slideIndex, options);
  downloadBlob(file, file.name);
  return file;
}

export async function exportProjectFiles(project, store, options = {}) {
  const files = [];
  for (let i = 0; i < project.slideCount; i++) {
    options.onProgress?.(i / project.slideCount, `Rendering slide ${i + 1}/${project.slideCount}`);
    if (slideHasVideo(project, i) && options.includeVideo !== false) {
      try {
        files.push(await exportVideoSlide(project, store, i, options));
      } catch (error) {
        console.warn(error);
        const poster = await exportSlideImage(project, store, i, { ...options, type: "image/png" });
        poster.warning = error.message;
        files.push(poster);
      }
    } else {
      files.push(await exportSlideImage(project, store, i, options));
    }
  }
  options.onProgress?.(1, "Done");
  return files;
}

export async function downloadProject(project, store, options = {}) {
  const files = await exportProjectFiles(project, store, options);
  if (files.length === 1) {
    downloadBlob(files[0], files[0].name);
    return files;
  }
  try {
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
    const zip = new JSZip();
    files.forEach((file) => zip.file(file.name, file));
    const readme = [
      "iLoveCarousel export",
      "",
      `Project: ${project.name}`,
      `Canvas: ${project.width}x${project.height}`,
      `Slides: ${project.slideCount}`,
      "",
      "Upload carousel files in filename order. All slides share identical dimensions.",
      "Direct Instagram/TikTok API publishing requires a backend; this app exports local files only."
    ].join("\n");
    zip.file("README.txt", readme);
    const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
      options.onProgress?.(metadata.percent / 100, `Zipping ${Math.round(metadata.percent)}%`);
    });
    downloadBlob(blob, `${safeFilename(project.name)}-${project.width}x${project.height}.zip`);
  } catch (error) {
    console.warn("ZIP export unavailable; downloading individual files.", error);
    for (const file of files) {
      downloadBlob(file, file.name);
      await sleep(250);
    }
  }
  return files;
}

export async function shareProject(project, store, options = {}) {
  const files = await exportProjectFiles(project, store, options);
  if (navigator.canShare && navigator.canShare({ files })) {
    await navigator.share({
      title: project.name,
      text: "Created with iLoveCarousel. Upload in slide order for a seamless carousel.",
      files
    });
    return { shared: true, files };
  }
  await downloadProject(project, store, options);
  return { shared: false, files };
}

export async function exportVideoSlide(project, store, slideIndex, options = {}) {
  const mime = pickSupportedVideoMime();
  if (!mime) throw new Error("This browser cannot record canvas video. Exported a still poster instead.");
  const fps = Math.max(12, Math.min(60, Number(options.fps || 30)));
  const seconds = Math.max(1, Math.min(60, Number(options.seconds || 5)));
  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: options.bitrate || 7_000_000
  });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };
  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = () => reject(recorder.error || new Error("Video export failed."));
  });

  const videos = project.layers
    .filter((layer) => layer.visible && layer.type === "video")
    .map((layer) => ({ layer, asset: store.getAsset(layer.assetId) }))
    .filter(({ asset }) => asset?.element instanceof HTMLVideoElement);
  videos.forEach(({ layer, asset }) => {
    const video = asset.element;
    video.muted = true;
    const start = Number(layer.trimStart || 0);
    if (Number.isFinite(start)) video.currentTime = Math.min(start, video.duration || start);
    video.play().catch(() => {});
  });

  recorder.start();
  const totalFrames = Math.ceil(seconds * fps);
  const frameDelay = 1000 / fps;
  for (let frame = 0; frame < totalFrames; frame++) {
    renderSlide(ctx, project, store, slideIndex, { exportMode: true });
    options.onProgress?.(frame / totalFrames, `Recording video slide ${slideIndex + 1}: ${frame + 1}/${totalFrames}`);
    await sleep(frameDelay);
  }
  recorder.stop();
  videos.forEach(({ asset }) => asset.element.pause());
  await stopped;
  const blob = new Blob(chunks, { type: mime.split(";")[0] });
  const ext = fileExtensionForMime(blob.type);
  return new File([blob], `${safeFilename(project.name)}-slide-${String(slideIndex + 1).padStart(2, "0")}.${ext}`, { type: blob.type });
}
