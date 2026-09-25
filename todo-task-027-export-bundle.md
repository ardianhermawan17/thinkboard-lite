---
doc_id: thinkboard-lite-task-027
title: Task 027 — Export the workspace bundle
version: "1.0"
status: proposed
updated: 2026-09-26
task: "027"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["01-thinkboard-lite-spec.md", "todo-task-016-offline-and-export.md"]
authority: "Scope and contract for task 027 only. Process law stays in 07-agent-working.md."
---

# Task 027 — Export the workspace bundle

`027-task-export-bundle` · `frontend` · phase G — Integration · depends on [`016`](todo-task-016-offline-and-export.md), [`026`](todo-task-026-workspace-context.md) · blocks — (closes 016's follow-up)

**Main goal —** A member exports the open workspace from the shell as the portable bundle.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Starts when** | 016 and 026 are done (both are). |
| **On conflict** | `07-agent-working.md` on process; `01-thinkboard-lite-spec.md` §5.6 on the bundle format (the spec stays the schema). |
| **Do not** | Re-render a PDF page; invent a bundle file; write a second bundle format. |

---

## 1. What can go wrong

- Re-rendering a page instead of appending annotations destroys the text layer (spec §5.6) — `appendHighlightsToPdf` already appends.
- A highlight with no slug cannot be anchored; it is skipped, not mis-anchored.
- Exporting before the PDF bytes are cached must still work (it downloads on demand).

---

## 2. Goals and gate

- `g1` `use-notes-for-session` beside `use-highlights-for-session`.
- `g2` `use-export-workspace` assembles `BundleInput`, appends, zips and downloads.
- `g3` `shared/lib/download.ts` `downloadBytes`.
- `g4` an Export control in the shell header.

**Gate —** with a seeded workspace, Export downloads a zip holding `document.pdf` (annotated), `notes.md` (anchored) and `thinkboard.json`.

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| D-02 | defaulted | the export is the workspace's main document (the leader's note copy is not exported by default) |
| D-10 | defaulted | the bundle reads local Dexie rows; it does not require the group document to be cached |
| RULE-25 | standing | the HTML comment stays the only identity anchor; the bundle writing is unchanged from 016 |

---

## 4. Where the work lands

```
src/shared/lib/download.ts
src/features/entities/queries/use-notes-for-session.ts
src/features/workspace/components/export-workspace/
src/features/workspace/components/app-header/  (mount the control)
```

The bundle seam (`shared/lib/bundle.ts`) already exists and is not rewritten.

---

## 5. Tests that must exist

- `downloadBytes` creates a blob URL, clicks an anchor and revokes the URL
- the export hook maps rows, skips slug-less highlights, and calls append -> zip -> download
- the control renders and disables while busy

---

## 6. Hand-offs

- 023 (pilot hardening) exercises export under a broken network.

---

## 7. Contract scaffolding

### 7.1 `agent-history/027-task-export-bundle/task.json`

```json
{
  "id": "027-task-export-bundle",
  "title": "A member exports the open workspace from the shell as the portable bundle",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-26T00:00:00Z",
  "status": "pending",
  "depends_on": ["016-task-offline-and-export", "026-task-workspace-context"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 027"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.6, RULE-25"},
    {"doc": "todo-task-027-export-bundle.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "a session-wide notes read (use-notes-for-session) beside 026's highlights read", "plan_ref": "tasks 027 g1", "status": "pending"},
    {"id": "g2", "description": "use-export-workspace maps the session's rows and the main PDF bytes into BundleInput, appends annotations, zips and downloads", "plan_ref": "tasks 027 g2; spec §5.6", "status": "pending"},
    {"id": "g3", "description": "a downloadBytes helper in shared/lib/download.ts", "plan_ref": "tasks 027 g3", "status": "pending"},
    {"id": "g4", "description": "an Export control in the shell header", "plan_ref": "tasks 027 g4", "status": "pending"}
  ],
  "phases": {
    "analyze": {"file": "analyze.json", "status": "not_started"},
    "code": {"file": "code.json", "status": "not_started"},
    "test": {"file": "test.json", "status": "not_started"},
    "validate": {"file": "validate.json", "status": "not_started"},
    "result": {"file": "result.json", "status": "not_started"}
  }
}
```

### 7.2 `analyze.json` — the shape to fill

```json
{
  "task_id": "027-task-export-bundle",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 027"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.6, RULE-25"},
    {"doc": "todo-task-027-export-bundle.md", "section": "full file"}
  ],
  "scope": "The session-wide notes read, the export hook, the download helper and the header control. Out of scope: re-import (016's, unchanged); the ink SVG (waits on 024).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Notes return for the session's highlights."},
    {"goal_id": "g2", "text": "A slug-less highlight is skipped; the zip holds the three files."},
    {"goal_id": "g3", "text": "downloadBytes revokes the object URL."},
    {"goal_id": "g4", "text": "The header control triggers the export and disables while busy."}
  ],
  "open_questions": ["D-02/D-10 defaulted.", "The ink SVG is deferred to 024."],
  "risks": ["Re-rendering a page would destroy the text layer; appendHighlightsToPdf already avoids it.", "A missing PDF artifact must say why, not throw silently."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "027-task-export-bundle",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 027", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.6, RULE-25", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "027-todo-export-bundle",
  "name": "Export the workspace bundle",
  "goal": "A member exports the open workspace from the shell as the portable bundle.",
  "todo_path": "agent-thinking/todo/027-todo-export-bundle/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · **no git write without explicit confirmation, every time** · `npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 027, `01-thinkboard-lite-spec.md` §5.6, RULE-25, `todo-task-016-offline-and-export.md`.
