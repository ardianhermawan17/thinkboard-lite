---
type: meta
title: "Hot Cache"
created: 2026-09-22
updated: 2026-09-25
status: developing
tags:
  - meta
  - hot-cache
---

# Recent Context

## Last Updated

2026-09-26 -- the live database stack now runs: the Lite ports moved 553xx -> 563xx (Windows reserves 55262-55361 here) and **task 030's live RLS suite passed 19/19** plus the seed/storage suite 6/6. The board matches `agent-history/running-process.json`: 23 of 33 done, 012/015/018 blocked, 024 conditional. No agent-startable task remains.

## Key Recent Facts

- 23 of 33 done (000-011, 016, 017, 021, 025-032); blocked: 012 (device test), 015 (live two-browser latency), 018 (D-12); conditional: 024.
- `/w/[workspaceId]` mounts the document view (025), a notes rail (026, with re-import), an Export control (027), a presence rail (028), peer cursors (031) and import-existing (032).
- Everything left is gated on a human/hardware/stack decision: Q7/Q8/Q9 (012), D-12 (018), C6, the live gates, or D-02's upload flow.
- Committed/pushed: 011, 016, 017, 021, 015, 025-031. 032 is the working tree.

## Live verification (2026-09-26)

- Lite stack on **563xx** (Windows reserves 55262–55361). `npm run db:seed` applies 0001–0008.
- **Database:** RLS suite **19/19** (task 030 g17/g18 asserted), seed/storage suite **6/6**.
- **Frontend:** `sync-engine.live.test.ts` **4/4** and `workspace-remote.test.ts` **6/6** against the stack.
- Still live-only: 017's 403 under real RLS, 015 g5 two-browser latency, 016 airplane mode, 021/032 annotated-PDF.

## Recent Changes

- Closed [[Task 031 - Peer cursors]] (4/4): one presence provider, a cursor-painting layer, and a throttled/normalized publish from the page. `npm run verify` green (354 tests), production build ok.
- Committed and pushed task 030 (`origin/task/030-db-housekeeping`).
- Added 031 to [[Progress Board]], [[Kanban Board]], `README.md` and a new task page; updated the review postscript.

## Active Threads

- Mount 021's import review (the last integration surface); run the live gates (030 RLS, 015/031 two-browser).
- Human actions still gate the rest: run 012's device test (Q7), answer D-12 for 018.
