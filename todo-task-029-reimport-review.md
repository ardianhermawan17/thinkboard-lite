---
doc_id: thinkboard-lite-task-029
title: Task 029 — Re-import review
version: "1.0"
status: proposed
updated: 2026-09-26
task: "029"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-016-offline-and-export.md"]
authority: "Scope and contract for task 029 only."
---

# Task 029 — Re-import review

`029-task-reimport-review` · `frontend` · phase G — Integration · depends on [`016`](todo-task-016-offline-and-export.md), [`026`](todo-task-026-workspace-context.md) · blocks — (closes 016's re-import follow-up)

**Main goal —** Paste an exported `notes.md` and re-import it without duplicates.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Do not** | Guess an anchor. Use anything but the `<!-- tb id=… -->` comment to identify a section (RULE-25). |

---

## 1. What can go wrong

- A second identity source (a heading, a page number) would break RULE-25.
- Re-importing the same file twice must not duplicate a note.

---

## 2. Goals and gate

- `g1` parse + plan counts (matched / unanchored / orphans / missing).
- `g2` apply matched updates (update the author's note, else insert one).
- `g3` mounted in the notes rail.
- `g4` tests.

**Gate —** export -> edit prose -> paste back -> apply updates and adds none.

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| RULE-15 | standing | a conflict keeps local text as a second note; this task only sets content on a matched anchor |
| RULE-25 | standing | the HTML comment is the only identity anchor; anchorless sections are reported, not imported |

---

## 4. Where the work lands

```
src/features/notes/components/reimport-review/
src/features/notes/components/note-panel/   (mount)
```

The parser/planner is 016's `shared/lib/bundle.ts` and is not rewritten.

---

## 5. Tests that must exist

- plan counts come from `planReimport`
- apply updates an existing matched note once and inserts for a missing one; orphans are ignored
- the component renders the counts and the apply button

---

## 6. Hand-offs

- Applying anchorless sections (creating unanchored notes) remains a follow-up, as 016 recorded.

---

## 7. Contract scaffolding

### 7.1 `agent-history/029-task-reimport-review/task.json`

```json
{
  "id": "029-task-reimport-review",
  "title": "A member can paste an exported notes.md and re-import it without duplicates",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-26T00:00:00Z",
  "status": "pending",
  "depends_on": ["016-task-offline-and-export", "026-task-workspace-context"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 029"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.6, RULE-25"},
    {"doc": "todo-task-029-reimport-review.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "parse pasted markdown via planReimport and show matched/unanchored/orphan/missing counts", "plan_ref": "tasks 029 g1", "status": "pending"},
    {"id": "g2", "description": "apply matched updates (update the author's note, else insert one), never a duplicate", "plan_ref": "tasks 029 g2; RULE-25", "status": "pending"},
    {"id": "g3", "description": "mounted in the notes rail", "plan_ref": "tasks 029 g3", "status": "pending"},
    {"id": "g4", "description": "hook and component tests", "plan_ref": "tasks 029 g4", "status": "pending"}
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
  "task_id": "029-task-reimport-review",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 029"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.6, RULE-25"},
    {"doc": "todo-task-029-reimport-review.md", "section": "full file"}
  ],
  "scope": "The re-import review container and its apply. Out of scope: creating unanchored notes from anchorless sections (016 follow-up); bundle re-import of the PDF.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Counts equal planReimport's arrays."},
    {"goal_id": "g2", "text": "A matched slug with an existing note updates it once; without one it inserts; orphans are skipped."},
    {"goal_id": "g3", "text": "The rail renders the control."},
    {"goal_id": "g4", "text": "Hook and component tests pass."}
  ],
  "open_questions": ["RULE-15 (standing) and RULE-25 (standing) apply; anchorless sections are reported, not applied."],
  "risks": ["A second identity source would break RULE-25.", "Re-applying the same file must not duplicate."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "029-task-reimport-review",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 029", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.6, RULE-25", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "029-todo-reimport-review",
  "name": "Re-import review",
  "goal": "A member can paste an exported notes.md and re-import it without duplicates.",
  "todo_path": "agent-thinking/todo/029-todo-reimport-review/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · **no git write without explicit confirmation** · `npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 029, `01-thinkboard-lite-spec.md` §5.6, RULE-25, `todo-task-016-offline-and-export.md`.
