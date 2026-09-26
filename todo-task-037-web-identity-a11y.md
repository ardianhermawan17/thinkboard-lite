---
doc_id: thinkboard-lite-task-037
title: Task 037 — Web app identity and accessibility (Lighthouse pass)
version: "1.0"
status: done
updated: 2026-09-26
task: "037"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["05-feature-architecture.md", "task-review-2026-09-25.md"]
authority: "Scope and contract for task 037 only."
---

# Task 037 — Web app identity and accessibility

`037-task-web-identity-a11y` · `frontend` · phase G — Integration · depends on [`005`](todo-task-005-design-system.md), [`036`](todo-task-036-motion.md) · blocks —

**Main goal —** the app has a document identity and installs, and its controls are announced correctly.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Build a *tab* control without panels; invent product copy beyond the workspace's own words. |

---

## 1. What the audit found

`jev-ultrafast` (the browser MCP, a headless Chrome over CDP) ran Lighthouse against the live workspace at
`/w/[workspaceId]`:

| category | score | failure |
|---|---|---|
| Accessibility | **0.89** | `aria-valid-attr-value`, `document-title`, `heading-order`, `label-content-name-mismatch` |
| Best practices | 1.00 | — |
| SEO | **0.40** | `document-title`, `meta-description`, `robots-txt` |

The ARIA failure was the interesting one: the header's mode switch was built from Radix **Tabs**, but it renders no
`TabsContent`, so every trigger's `aria-controls` pointed at an element that does not exist. It is a segmented
control, not a tab set.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | A real document identity: `<title>`, meta description, application name, theme colour for light and dark, plus `manifest.webmanifest` and a valid `robots.txt`. |
| **g2** | The accessibility failures are fixed: the mode switch becomes a toggle group, the notes heading is an `h2`, and the rotate control's visible label matches its accessible name. |
| **g3** | `npm run verify` stays green. |
| **g4** | The same tool re-evaluates: Accessibility, Best Practices and SEO at 1.00 with no failures. |

**Gate.** `npm run verify` green **and** a Lighthouse re-run with no failing audits.

---

## 3. Contract scaffolding

- `src/app/layout.tsx` exports `metadata` and `viewport`; `src/app/manifest.ts` and `src/app/robots.ts` are the
  route-file forms Next serves at `/manifest.webmanifest` and `/robots.txt`.
- The segmented control is a shadcn primitive: `shared/components/ui/toggle-group.tsx` (Radix ToggleGroup). Tabs stay
  for the right rail, which really does have panels.
- The pilot is private: `robots.txt` disallows everything rather than inviting crawlers.

---

## 4. Decisions

- **Toggle group over tabs** for a mode switch: `role="group"` with `aria-pressed` items cannot dangle.
- **Manifest, not just meta**: the pilot runs on tablets, so an installable, standalone window is worth the one file.
- **No invented copy**: the title and description describe what the workspace is; they are not marketing.

---

## 5. Evidence (jev-ultrafast, before → after)

| category | before | after |
|---|---|---|
| Accessibility | 0.89 | **1.00** |
| Best practices | 1.00 | **1.00** |
| SEO | 0.40 | **1.00** |
| failing audits | 6 | **0** |

Live checks on the running app: `document.title` set; the description and theme-colour meta present;
`/manifest.webmanifest` returns 200 with `name: ThinkBoard Lite`, `display: standalone`; `/robots.txt` returns 200
with `User-Agent: * / Disallow: /`; one `h1` and the notes `h2`.

---

## 6. Follow-ups

- A real icon set for the manifest (today it points at `favicon.ico`); 512 px PNG + maskable is the usual pair.
- Lighthouse's performance category was not scored in this run (dev build); a production `next build` measurement is
  the honest place for it.
