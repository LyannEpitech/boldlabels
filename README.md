# BoldLabels

Label design and batch PDF generation tool. Design templates visually, import CSV data, generate print-ready PDFs.

Available as a **web app** and a **desktop app** (Electron — Linux, Windows).

---

## Repositories

| Repo | Description |
|---|---|
| [BoldLabels_local](https://github.com/LyannEpitech/BoldLabels_local) | Web app + Electron desktop — React 19 / Vite / electron-builder |
| [BoldLabels-API](https://github.com/LyannEpitech/BoldLabels-API) | NestJS backend — Clerk auth, Electron token endpoint |
| [BoldLabels-landing](https://github.com/LyannEpitech/BoldLabels-landing) | Marketing landing page + changelog — Vanilla JS / Vite |

---

## What it does

| Screen | Description |
|---|---|
| **Library** | Manage label templates — create, rename, duplicate, import/export, delete |
| **Editor** | Canvas-based WYSIWYG editor — drag, resize, rotate, pixel-accurate rulers |
| **Mapping** | Import one or more CSV files, map columns to template fields, set filters |
| **Generate** | Layout labels on A4/Letter/A5 pages, export a print-ready PDF |

**Supported elements:** Text (with `{{ variable }}` tokens), QR code, Barcode (100+ formats), Image, Rectangle, Circle.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full breakdown of how the services fit together, the authentication flow, and the deployment pipeline.

---

## Live URLs

| Service | URL |
|---|---|
| Web app (prod) | https://boldlabels-local.pages.dev |
| Web app (staging) | https://dev.boldlabels-local.pages.dev |
| API | https://bold-label-api.fly.dev |
| Landing | `https://boldlabels.app` *(pending domain setup)* |
