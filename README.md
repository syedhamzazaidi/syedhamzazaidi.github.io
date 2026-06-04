# Swipe Studio

A private, client-side designer for social carousels, collages, panoramas, and slide decks. Build multi-slide layouts for Instagram, TikTok, LinkedIn, Pinterest, and more, then export platform-ready images and video — entirely in the browser.

**Everything runs locally.** Your photos and videos are loaded with in-browser object URLs and are never uploaded to a server. There is no backend.

## Features

- **Template chooser** — start from a layout (editorial story, full-bleed panorama, white-border dump, grid collage, quote cards, product showcase, before/after, Story/Reel cover) or a blank canvas.
- **Smart slide reflow** — while a design is untouched, changing the slide count re-flows the chosen template to fit; once you start editing, your work is preserved.
- **Full-bleed panorama** — drop one wide photo and have it split edge-to-edge across every slide.
- **Floating canvas toolbar** — select, hand/pan, freehand brush, vector pen, text, shape, sticker, and photo-grid tools, each with a keyboard shortcut.
- **Two drawing tools** — a freehand **Brush** and a **Pen** that builds editable vector paths from anchor points (click to add points, drag to curve, click the first point or press Enter to finish).
- **Layers panel** — type icons, show/hide, lock, delete, and drag-to-reorder.
- **Inspector** — position, size, rotation, opacity, fit, borders, outlines, background blur, image filters, text and shape styling, and video scrubbing.
- **Canvas aids** — grid overlay, platform safe-zone guides, smart edge/center snapping, and hold-Shift snap-to-grid.
- **Pan & zoom** — hand tool, hold-Space to pan, middle-mouse drag, and scroll-to-zoom.
- **Export & share** — per-slide or full-carousel export, PNG/JPEG stills, MP4/WebM video where supported, ZIP bundling, and the native share sheet when available.
- **Local persistence** — your project is saved to the browser between visits.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `V` | Select & move |
| `H` | Hand / pan |
| `B` | Brush (freehand draw) |
| `P` | Pen (vector path) |
| `T` | Add text |
| `R` | Add shape |
| `E` | Add sticker |
| `G` | Add photo grid |
| Hold `Space` | Temporarily pan with any tool |
| Hold `Shift` while dragging/resizing | Snap to the grid |
| `Ctrl`/`Cmd` + `Z` | Undo |
| `Ctrl`/`Cmd` + `Shift` + `Z` | Redo |
| `Ctrl`/`Cmd` + `D` | Duplicate selected layer |
| `Delete` / `Backspace` | Delete selected layer |
| Scroll wheel | Zoom · Middle-mouse drag pans |

## Getting started

The app is a static site with no build step. To run it locally, serve the repository root with any static file server (a server is recommended over opening the file directly, because the app uses native ES modules):

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000/`.

## Deployment

This is published with **GitHub Pages** straight from the repository — `index.html` at the root is the app, and `.nojekyll` disables Jekyll processing so the `assets/` directory is served as-is. Pushing to the default branch updates the live site.

## Project structure

```
index.html                     App shell and markup
assets/css/social-design.css   Design system and all styling
assets/js/scrl/
  app.js          UI wiring, canvas interaction, and render orchestration
  state.js        ProjectStore: state, undo/redo history, localStorage persistence
  renderer.js     Canvas drawing (layers, grid, guides, selection) and hit testing
  exporters.js    Image/video/ZIP export and Web Share integration
  presets.js      Platform presets and font options
  templates.js    Starter templates, their previews, and the grid builder
  utils.js        Shared helpers (geometry, formatting, file/canvas utilities)
```

### How it fits together

- `state.js` holds the single source of truth in a `ProjectStore`. Every change goes through `mutate()`, which clamps the project, records undo history, persists to `localStorage`, and emits a `change` event. A `pristine` flag and `templateId` drive the template-reflow behavior.
- `app.js` subscribes to `change` and re-renders the DOM panels and the canvas. It owns all pointer/keyboard interaction, the viewport (pan/zoom), tool selection, and the template chooser.
- `renderer.js` draws the project to a canvas for both the live editor and exports, and provides hit testing and the shared grid step used by snap-to-grid.
- `exporters.js` renders each slide to offscreen canvases and packages the results as files, a ZIP, or a share payload.

### Technical notes

- **No framework, no build step.** Plain ES modules, the Canvas 2D API, and CSS custom properties.
- **Rendering.** The editor and exports share the same drawing code, so what you see matches what you export. Safe-zone and grid overlays are editor-only and never exported.
- **Persistence.** Projects are stored under the `localStorage` key `swipe-studio-project-v2`.
- **Video export** depends on the browser's `MediaRecorder` support: MP4 where available, otherwise WebM, with a still-poster fallback.

## Privacy

Swipe Studio is local-first. Media never leaves the browser; direct posting to social platforms is intentionally out of scope because it would require a server. Exports are produced locally and handed to a download or the native share sheet.

## Browser support

Works in current versions of Chromium-based browsers, Firefox, and Safari. Some capabilities (notably MP4 video export and the native share sheet) vary by browser and platform and degrade gracefully.
