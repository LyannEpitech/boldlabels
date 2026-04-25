# Architecture

## Services

```
┌─────────────────────────────────────────────────────────┐
│                    User's machine                        │
│                                                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │            Electron desktop app                  │  │
│   │  (BoldLabels_local — packaged with electron-     │  │
│   │   builder, loads web app in a BrowserWindow)     │  │
│   └───────────────────────┬──────────────────────────┘  │
│                           │ opens system browser         │
└───────────────────────────┼──────────────────────────────┘
                            │
          ┌─────────────────▼──────────────────┐
          │         Web app                     │
          │  Cloudflare Pages                   │
          │  prod:    boldlabels-local.pages.dev │
          │  staging: dev.boldlabels-local.pages.dev
          └─────────────────┬──────────────────┘
                            │ POST /api/auth/electron-token
          ┌─────────────────▼──────────────────┐
          │         BoldLabels API              │
          │  Fly.io — bold-label-api.fly.dev    │
          │  NestJS 11 / TypeScript             │
          └────────────────────────────────────┘
```

---

## Tech stack per service

| Service | Stack | Hosting |
|---|---|---|
| Web app + Electron | React 19, Vite, Clerk React, jsPDF, bwip-js, electron-builder | Cloudflare Pages (web) / GitHub Releases (desktop) |
| API | NestJS 11, TypeScript, `@clerk/backend` | Fly.io (cdg — Paris) |
| Landing | Vanilla JS, Vite | GitHub Pages |

---

## Authentication flow (Electron)

The Electron app cannot use a standard browser OAuth redirect — it loads a local HTML file. The flow works around this using a one-shot local HTTP server:

```
Electron app (packaged)
  │
  │  1. User clicks "Sign in"
  │     → IPC open-web-auth
  │     → main process starts a local HTTP server on a random port (e.g. 38291)
  │     → opens system browser: https://<web-app>?source=electron&auth_port=38291
  │
  ▼
Browser (web app)
  │  2. Web app stores bl_electron_auth + bl_auth_port in sessionStorage
  │     (before Clerk's sign-in redirect wipes the URL params)
  │
  │  3. User signs in via Clerk
  │
  │  4. ElectronRedirect fires (user is now signed in):
  │     → calls POST /api/auth/electron-token with Clerk session Bearer token
  │     → API validates token, calls Clerk signInTokens.create()
  │     → returns a one-time sign-in token (expires in 60s)
  │
  │  5. Web app POSTs { token } to http://127.0.0.1:38291
  │
  ▼
Electron (local server)
  │  6. Receives the token, closes the server
  │     → delivers token via IPC to the renderer
  │
  ▼
Electron (renderer / AuthGate)
     7. signIn.create({ strategy: 'ticket', ticket: token })
        → session activated, user is signed in in the desktop app
```

**Fallback:** if the app was closed when auth completed (cold-start), the `boldlabels://auth?token=...` deep link is used instead (registered via electron-builder `protocols`).

---

## Deployment pipeline

```
feature/* ──→ PR → dev
                    │
                    ├── CI: lint / build / test (API)
                    ├── Cloudflare Pages: staging deploy (web app)
                    └── GitHub Actions artifact: Electron build with staging URL baked in
                              (download from Actions tab to test)
                    │
                    ▼
              PR dev → main
                    │
                    ├── Cloudflare Pages: prod deploy (web app)
                    ├── Fly.io: API deploy
                    └── auto-tag.yml: creates vX.Y.Z tag
                                          │
                                          ▼
                                    build.yml (on tag)
                                    → Electron build with boldlabels.app baked in
                                    → published to GitHub Releases
                                    → latest.yml for auto-updater
```

### Versioning

Tag bumping is automatic on `dev → main` merge, based on the PR title:
- `feat: ...` → minor bump (`v1.2.0` → `v1.3.0`)
- anything else → patch bump (`v1.2.0` → `v1.2.1`)

---

## Environment variables

### BoldLabels_local (GitHub Secrets)

| Secret | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key — injected at Vite build time |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `PAT_TOKEN` | GitHub PAT with `repo` scope — lets auto-tag trigger build.yml |

### BoldLabels-API (Fly.io secrets)

| Variable | Description |
|---|---|
| `CLERK_SECRET_KEY` | Clerk secret key — used to verify tokens and create sign-in tokens |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g. `https://boldlabels-local.pages.dev,https://dev.boldlabels-local.pages.dev`) |

---

## Branch strategy (all repos)

```
main      ← production
dev       ← integration / staging
feature/* ← feature branches → PR into dev
fix/*     ← hotfixes → PR into dev (or main for critical)
```
