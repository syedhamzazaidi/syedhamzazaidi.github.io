# syedhamzazaidi.github.io

Personal resume and portfolio site, published on [GitHub Pages](https://syedhamzazaidi.github.io). The layout is styled as an academic paper with a swappable theme system. The live site uses the **blueprint** theme.

## Run locally

Static HTML/CSS/JS — no build step. Serve the repo root with any static file server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Theme system

Themes are CSS files under `styles/themes/` that set custom properties on `html[data-theme="…"]`. Shared layout lives in `styles/base.css`.

| Theme | File |
| --- | --- |
| Blueprint (default) | `styles/themes/blueprint.css` |
| arXiv preprint | `styles/themes/arxiv.css` |
| Brutalist | `styles/themes/brutalist.css` |
| Editor / markup | `styles/themes/editor.css` |
| Newspaper | `styles/themes/newspaper.css` |
| Swiss | `styles/themes/swiss.css` |
| Terminal | `styles/themes/terminal.css` |

To try another theme, change both:

1. `data-theme` on the `<html>` element in `index.html`
2. The theme `<link rel="stylesheet">` in `<head>`

`js/theme.js` locks the site to `blueprint` and persists that choice in `localStorage`. To preview other themes locally, comment out or adjust `theme.js`, or swap the stylesheet link as above.

## Blueprint theme features

- **Typography** — DM Sans (body/titles) and DM Mono (headings/meta), loaded from Google Fonts in `index.html`
- **`.paper-shell`** — outer wrapper that reserves left/right gutters for margin callouts on wide viewports (≥1180px)
- **Margin callout cards** — annotated subsections (`paper-subsection--annotated`) with REF·A–E tags, dashed SVG connector lines, and aside cards floated into the page margins:
  - **REF·A** — faff company context note
  - **REF·B** — Salesforce awards
  - **REF·C** — freelance role context
  - **REF·D** — Secure Face Recognition hackathon award
  - **REF·E** — 3D face scan liveness diagram
- **Section order** — Experience → Projects → Education → Technical Skills → References

Other themes use the same HTML; blueprint-specific styling (connectors, face scan, grid background) is scoped under `html[data-theme="blueprint"]`.

## Project structure

```
index.html              Resume content and markup
404.html                Themed not-found page
styles/
  base.css              Shared layout, margin-callout positioning, print rules
  themes/*.css          Per-theme tokens and overrides
js/
  theme.js              Theme persistence (blueprint only)
assets/
  pdf/resume.pdf        Downloadable PDF copy
archive/                Older standalone pages (unchanged)
```

## Deployment

GitHub Pages serves `index.html` from the default branch. Push to `main` to update the live site.
