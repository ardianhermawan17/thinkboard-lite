---
doc_id: thinkboard-lite-task-032
title: Task 032 — Import existing highlights
version: "1.0"
status: proposed
updated: 2026-09-26
task: "032"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-021-leader-import.md"]
authority: "Scope and contract for task 032 only."
---

# Task 032 — Import existing highlights

`032-task-import-existing` · `frontend` · phase G — Integration · depends on [`021`](todo-task-021-leader-import.md) · blocks — (mounts 021 rung 1)

**Main goal —** Import the open PDF's existing annotations as group focus points, review-gated.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Do not** | Upload a file or create an artifact (out of scope). OCR a page with a text layer. Commit without review. |

---

## 1. What can go wrong

- A multi-page scan needs a per-candidate page; a page-constant slug/bbox would be wrong.
- Writing the annotations back onto the same artifact double-marks it; the review and slug dedupe protect against duplicates.

---

## 2. Goals and gate

- `g1` per-candidate page through the review.
- `g2` pdfjs text items -> display boxes.
- `g3` scan the main PDF (rung 1) and review.
- `g4` tests.

**Gate —** a seeded annotated PDF scans, reviews and imports as group highlights.

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| D-02 | defaulted | the import is the note-slot copy; this task imports the OPEN document instead (recorded, not silently re-decided) |
| RULE-19 | standing | rung 1 only; no OCR |
| D-03 | defaulted | the import is the leader's act (group writes) |

---

## 4. Where the work lands

```
src/features/highlight/utils/import-ladder.ts (page on a candidate)
src/features/highlight/utils/pdf-text-boxes.ts
src/features/highlight/components/import-source/
src/features/highlight/components/import-review/ (per-candidate page)
src/app/w/[workspaceId]/workspace-document.tsx (mount)
```

---

## 5. Tests that must exist

- text items map to boxes
- the scan builds per-page candidates from a doc
- the review writes each candidate to its own page

---

## 6. Hand-offs

- the note-slot upload flow (D-02) remains a separate task.

---

## 7. Contract scaffolding

### 7.1 `agent-history/032-task-import-existing/task.json`

```json
{
  "id": "032-task-import-existing",
  "title": "Import the open PDF's existing annotations as group focus points, review-gated",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-26T00:00:00Z",
  "status": "pending",
  "depends_on": ["021-task-leader-import"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 032"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, RULE-19"},
    {"doc": "todo-task-032-import-existing.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "ImportCandidate carries its page; the review writes per candidate", "plan_ref": "tasks 032 g1", "status": "pending"},
    {"id": "g2", "description": "a pdf-text-boxes helper maps pdfjs text items to display boxes", "plan_ref": "tasks 032 g2", "status": "pending"},
    {"id": "g3", "description": "an import-source container scans the main PDF (rung 1) and offers the review", "plan_ref": "tasks 032 g3", "status": "pending"},
    {"id": "g4", "description": "tests", "plan_ref": "tasks 032 g4", "status": "pending"}
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
  "task_id": "032-task-import-existing",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 032"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, RULE-19"},
    {"doc": "todo-task-032-import-existing.md", "section": "full file"}
  ],
  "scope": "Per-candidate pages, the text-box helper, the rung-1 scan of the open document, the mount. Out of scope: uploading/creating an artifact (D-02).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "The review writes each candidate to its own page."},
    {"goal_id": "g2", "text": "Text items become display boxes through the viewport transform."},
    {"goal_id": "g3", "text": "The scan returns per-page candidates for the session's main PDF."},
    {"goal_id": "g4", "text": "Tests pass."}
  ],
  "open_questions": ["D-02: this imports the open document, not a separately uploaded note copy; the upload flow is a follow-up.", "RULE-19: rung 1 only."],
  "risks": ["A page-constant slug/bbox on a multi-page import; re-importing doubles marks (review + slug dedupe)."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "032-task-import-existing",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 032", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, RULE-19", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "032-todo-import-existing",
  "name": "Import existing highlights",
  "goal": "Import the open PDF's existing annotations as group focus points, review-gated.",
  "todo_path": "agent-thinking/todo/032-todo-import-existing/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · **no git write without explicit confirmation** · `npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 032, `01-thinkboard-lite-spec.md` §5.4, RULE-19, `todo-task-021-leader-import.md`.
