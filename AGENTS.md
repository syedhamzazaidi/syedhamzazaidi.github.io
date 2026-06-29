# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static, client-side site** with **no backend, no build step, and no package manager** (no `package.json`, no lockfiles). It is deployed via GitHub Pages.

### Running / developing
- Serve the repo root with any static file server (a server is required over `file://` because the app uses native ES modules):
  - `python3 -m http.server 8000` (then open `http://localhost:8000/`), or `npx serve .`
- See `README.md` for the canonical run instructions and feature list.

### What runs where
- `index.html` (repo root) is the live product: a single-page resume/portfolio. Assets: `styles/`, `js/theme.js`, `assets/img/`, `assets/pdf/resume.pdf`.
- `archive/index.html` and `archive/vietnam.html` are standalone legacy pages.
- The README-documented **carouselBuilder** app modules live under `assets/js/scrl/` and `assets/css/`, but are **not** currently linked from any HTML page.

### Lint / test / build
- There is **no build, no lint config, and no automated test suite** in this repo. There is nothing to install or compile; "running" means serving the static files.

### Notes
- Google Fonts and Google Analytics are loaded from CDNs at runtime; pages render fine offline with fallback fonts.
