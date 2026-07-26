# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

Static GitHub Pages site (`syedhamzazaidi.github.io`) with no build step, package manager, or backend.

| Page | Path | Description |
|------|------|-------------|
| **Swipe Studio** | `index.html` | Client-side carousel/collage/social designer (vanilla ES modules + Canvas) |
| **Vietnam Itinerary** | `vietnam.html` | Standalone travel itinerary page |
| **404** | `404.html` | GitHub Pages not-found page |

App modules live under `assets/js/scrl/` (`app.js`, `state.js`, `renderer.js`, `exporters.js`, etc.).

## Cursor Cloud specific instructions

### Dependencies

There are **no installable dependencies** (no `package.json`, `Gemfile`, Docker, or Makefile). The repo is plain HTML/CSS/JS.

### Running locally

ES modules require HTTP — do **not** open files via `file://`.

```bash
python3 -m http.server 8080 --directory /workspace
```

| URL | App |
|-----|-----|
| http://localhost:8080/ | Swipe Studio |
| http://localhost:8080/vietnam.html | Vietnam itinerary |

Use a modern browser (Chrome/Firefox/Edge). Internet access is optional but needed for Google Fonts and JSZip CDN (multi-slide ZIP export).

### Lint / test / build

This repo has **no** configured linter, test runner, or build pipeline. Verification is manual: serve over HTTP and exercise the UI in a browser.

Suggested smoke test for Swipe Studio:

1. Load `http://localhost:8080/`
2. Apply a starter template (Templates tab)
3. Open Preview, then Export / Share modals

### Environment variables

None required for local development.

### Gotchas

- `.nojekyll` disables Jekyll on GitHub Pages; there is no Jekyll build locally.
- Project state persists in browser `localStorage` under key `swipe-studio-project-v1`.
- Media import uses local object URLs only; nothing is uploaded to a server.
