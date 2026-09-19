# Procedure — pushing ThinkBoard Lite work to ClickUp and Notion via MCP

Audience: an AI agent (Claude) working in this repo. Follow it top to bottom whenever a task is opened, progressed, or closed, or when the human says "update ClickUp / Notion".

## 0. Principles

1. **The repo is the source of truth; ClickUp and Notion are mirrors.** Read state from files, never from memory of earlier chats.
2. **Never invent status.** Status comes only from `agent-history/running-process.json` and `agent-thinking/tracking-todo.json`.
3. **ClickUp = what is done / ongoing / to do (live). Notion = history and decisions (append-mostly).**
4. **Do not touch git.** These MCP pushes do not require commits; ask before any git write (repo rule).
5. **Update, don't duplicate.** Look up the existing ClickUp task / Notion page first; create only if missing.
6. If an MCP tool is unavailable or fails 2–3 times, stop and tell the human what is unsynced. Do not fabricate a success. (ClickUp/Notion tools are deferred: load them with ToolSearch first, e.g. `select:mcp__ClickUp__clickup_update_task,...`.)

## 1. Sources to read (in this order)

| Need | File |
|---|---|
| Which task is open / done | `agent-history/running-process.json` (`current_task_id`, `task_sequence[].status`) |
| Task tracking + goal sentence | `agent-thinking/tracking-todo.json` |
| Master task definitions (goals, gate, blocks) | `06-whole-apps-task.md` → `### NNN-task-<slug>` |
| Parsed per-task plan (goals with sources, decisions D-/Q-, hand-offs) | `todo-task-NNN-<slug>.md` |
| What a finished task produced | `agent-history/NNN-task-<slug>/result.json` (`final_status`, `goals_summary`, `artifacts`, `follow_up_tasks`), `validate.json` |
| Decisions made while coding | `agent-history/NNN-task-<slug>/code.json` → `decisions` |
| Commits | `git log --oneline` (read only) |
| Board snapshot | `clickup.md`, `notion.md` in the repo root |

## 2. ClickUp

### 2.1 Identifiers (current)

- Workspace `1100340000008041` · Space `1100340000040153` · List `1100340000052535`.
- Statuses: `to do`, `in progress`, `complete` (exact strings, lowercase).
- Task naming: `NNN <Title>` matching the task id (`NNN-task-<slug>`). Non-plan work: `Housekeeping: …`.
- Task ids are stored in the table in `clickup.md`. If ids are missing, find them with `clickup_filter_tasks` (`list_ids`, `include_closed: true` — closed tasks are hidden otherwise) or `clickup_search`.

### 2.2 Tools (load via ToolSearch before use)

`clickup_filter_tasks`, `clickup_get_task`, `clickup_create_task`, `clickup_update_task`, `clickup_add_task_dependency`, `clickup_create_task_comment`, `clickup_get_workspace_hierarchy`.

### 2.3 Task description template (markdown)

```
**<STATUS>** · <frontend|supabase|backend> · Phase <A–F> · depends on <ids> · blocks <ids>

**Refs**
- Master plan: `06-whole-apps-task.md` → `### NNN-task-<slug>`
- Plan doc: `todo-task-NNN-<slug>.md`
- Agent history: `agent-history/NNN-task-<slug>/`   (only once opened)

**Main goal:** <verbatim from 06>

**Mini-goals**
- [ ] g1 …        (use [x] once validate.json says pass)

**Gate:** <verbatim from 06>
**Follow-ups:** <from result.json.follow_up_tasks, when closed>
```

### 2.3.1 Status mapping

| Repo state | ClickUp status |
|---|---|
| Task in `task_sequence` with `status: done` | `complete` (tick every goal; add closed date + goals_summary) |
| `current_task_id` == this task | `in progress` |
| Not yet opened | `to do` |
| `blocked` / waiting on a decision | keep `to do` (or `in progress` if opened), put `BLOCKED on <D-xx>` in the name and description |
| Conditional (024) | `to do`, description says "only if 012 g6 failed" |

### 2.4 Workflow

**A. Task opened (Gate 3)** → `clickup_update_task(task_id, status="in progress")`. Optionally `clickup_create_task_comment`: "Opened <date>; history: agent-history/NNN-…/".

**B. Goal passes validation** → update description: tick the goal (`- [x]`). Use one update per phase end, not per keystroke.

**C. Task closed (Gate 5)** → in one `clickup_update_task`: `status="complete"`, description with all goals ticked, `Artifacts` from `result.json`, `Follow-ups`, gate result. If `follow_up_tasks` name new work, create tasks (see D) or update existing ones' descriptions.

**D. New task / new follow-up** → first `clickup_filter_tasks` (include_closed) to make sure it doesn't exist; then `clickup_create_task` with `list_id: 1100340000052535`, name `NNN <Title>`, `status: "to do"`, description from the template. Priority: `high` for critical-path or ready-now, `low` for conditional.

**E. Blocked / unblocked decisions (D-12 etc.)** → edit the task name and description; keep the reason in one line.

**F. Housekeeping / owner decisions** → the single task `Housekeeping: …` holds a checklist; tick items as resolved.

**G. Dependencies (optional)** → `clickup_add_task_dependency(task_id, depends_on, "waiting_on")` following the `depends_on` field of the plan doc. Do this once per edge; skip if already present (`clickup_get_task include:["dependencies"]`).

### 2.5 Verify

After any batch: `clickup_filter_tasks(list_ids=[...], include_closed=true)` and confirm count and statuses match `running-process.json`. Report mismatches.

## 3. Notion

### 3.1 Where

- Parent page: **Thinkboard Lite** — `3e02a7f0-9f4c-808c-a720-cc6012959590`.
- Child page: **Work log and historical reference (2026-09)** — `3e02a7f0-9f4c-81f8-bfe8-cdac7dd20a10` (created from `notion.md`).
- If the human names a different destination, use that. Otherwise create under the parent above; if nothing exists, use `creation_mode: "draft"` (private) and say so.

### 3.2 Tools (load via ToolSearch)

`notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`. Read `notion://docs/enhanced-markdown-spec` (via `notion-fetch` on that URI) before writing anything with tables/callouts.

### 3.3 What goes in Notion

Historical, decision-oriented content only — not a live task list:
- Timeline (commits) · Completed tasks (what was delivered, artifacts) · Key decisions and why · Lessons/gotchas · Open follow-ups · Where things live.

### 3.4 Workflow

1. `notion-search` (query "ThinkBoard" / the page title) → `notion-fetch` the page to see current content.
2. **New completed task** → append a `### NNN — <Title> (goals, closed date)` section under *Completed tasks*, add a Timeline bullet with the commit hash, and add any new decisions/lessons. Use `notion-update-page` (insert/append content); do not rewrite the whole page unless the human asks.
3. **New phase or period** → create a new child page `Work log (YYYY-MM)` under the parent; keep the older page intact.
4. **Decision changes** (a D-/C-/DB- item resolved) → add a dated line under *Key decisions*; never delete the earlier statement, mark it superseded.
5. Keep `notion.md` in the repo identical to what was pushed (regenerate the file from the same content, then push).

### 3.5 Verify

`notion-fetch` the page after writing and check the new section exists. Return the page URL.

## 4. Session routine (checklist for the agent)

1. Read `running-process.json` → note done / current / pending.
2. Read `result.json` for any task closed since the last sync (compare against `notion.md` / `clickup.md` "Snapshot" date).
3. Load ClickUp + Notion tools with one ToolSearch call.
4. ClickUp: apply §2.4 A–G for each change; verify (§2.5).
5. Notion: apply §3.4; verify (§3.5).
6. Regenerate `clickup.md` (statuses, counts, ids) and `notion.md`; write them to the repo root (do not commit; ask first).
7. Report in ≤5 lines: what changed in each tool, what could not be synced, and any decision that needs the human.

## 5. Guardrails

- Confirm before **deleting** any ClickUp task or Notion page, and before merging tasks (`clickup_merge_tasks`).
- Do not put secrets, `.env` values, Supabase keys or personal data in either tool.
- Perhutani document content must not be pasted into tasks or pages; reference file paths only (D-12 concern).
- Do not change a task's `complete` status back to open unless the repo state (a reopened `task.json`) says so.
- Names and ids in this file are a snapshot; if a call reports not-found, re-discover with `clickup_filter_tasks` / `notion-search` and update this file.
