---
doc_id: thinkboard-lite-task-040
title: Task 040 — PWA (installable + offline)
version: "1.0"
status: done
updated: 2026-09-26
task: "040"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-016-offline-and-export.md", "todo-task-037-web-identity-a11y.md", "todo-task-039-ui-rework.md"]
authority: "Scope and contract for task 040 only."
---

# Task 040 — PWA

`040-task-pwa` · `frontend` · phase G — Integration · depends on [`016`](todo-task-016-offline-and-export.md), [`037`](todo-task-037-web-identity-a11y.md) · blocks —

**Main goal —** the workspace installs on a tablet and opens with the network down.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Enable navigation preload; precache nothing and assume documents are covered; ship a manifest whose icons do not exist. |

---

## 1. What was already there, and what was missing

`@serwist/next` was wired (build-only, since it is a webpack plugin), and task 037 added a manifest. Missing for a real
PWA: **icons** (the manifest pointed at `favicon.ico`), any **precached document**, and a designed **offline
fallback**. Serwist precaches the build's static assets; documents are not part of that manifest.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | A real icon set (192 / 512 / maskable 512 / apple-touch 180) and a manifest that names them, with a stable `id`, `lang`, `dir` and categories. |
| **g2** | iOS installability: `appleWebApp` metadata and an `apple-touch-icon`. |
| **g3** | Offline: the app shell is precached, every navigation the cache cannot answer gets the shell, and a designed `/~offline` page exists for a direct visit. |
| **g4** | `npm run verify` green, a production build clean, and a **real offline navigation** proving both `/w` and a deep link render with the server stopped. |

**Gate.** verify + build + an offline reload with the production server killed.

---

## 3. Contract scaffolding

- `next.config.ts` → `additionalPrecacheEntries: ["/w", "/~offline"]`: documents are not in the build's asset manifest.
- `src/app/sw.ts` → the worker: preload off, `navigateFallback: "/w"`.
- `src/app/manifest.ts`, `src/app/layout.tsx` (metadata + icons) → the identity.
- `public/icons/*.png` → generated, tracked; `public/sw.js` stays a build artifact (untracked).

---

## 4. Findings (each cost a build to learn)

1. **`fallbacks` alone does not work.** Serwist's `fallbacks.entries` are handed to a `PrecacheFallbackPlugin` and
   attached to the runtime handlers — they are **not** added to the precache, and the plugin only runs for a handler
   that actually matched. An uncached navigation matched nothing and the browser showed its own error.
2. **Navigation preload can never be turned off from the config.** Serwist only ever calls
   `enableNavigationPreload()`; the setting lives on the *registration*, so a worker that once enabled it keeps it
   until something calls `disable`. With it on, an offline navigation is answered by the **failed preload response**
   (a blank document) instead of the cache. `sw.ts` now disables it explicitly on activate.
3. **For a client-rendered app, the shell is the right fallback, not an offline page.** Serving the precached `/w`
   for any navigation lets the app boot and its router read the path, so a deep link to `/w/[workspaceId]` renders
   the workspace **from the local database** offline. `/~offline` stays precached and reachable, but it is not the
   navigation fallback.

---

## 5. Evidence

- `npm run verify`: **374 passed / 14 skipped**, arch 18/0, lint 0 errors, typecheck clean; `npm run build` clean.
- Production (`next start`, port 3200): `/manifest.webmanifest` 200 with the three icons; `/icons/*.png` 200
  `image/png`; `/sw.js` 200; `/~offline` 200. The worker registers, reaches `activated`, and **controls** the page;
  the precache holds `/w` and `/~offline`; `registration.navigationPreload.getState()` reports `enabled: false`.
- **Offline, with the production server killed**: navigating to `/w` renders the app shell (31,655 bytes, "Sign in");
  navigating to the deep link `/w/f05e17f9-…` also renders the shell (31,731 bytes) — the worker answered both.
- A real sign-in on the production build opened the seeded workspace.

---

## 6. Not done (deliberately) / follow-ups

- No background sync, no push: the app's offline writes already ride the Dexie outbox (task 016).
- The icon set is generated from the in-app motif; a designer's master would replace it.
- A `maskable` icon exists; a real Android "install" prompt check needs a phone.
