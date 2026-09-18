// Tests for the task 000 contract artifacts. Run: node --test "scripts/*.test.mjs"
import assert from "node:assert/strict"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { cases, clean } from "./verify-architecture.fixtures.mjs"
import { materialise, runFixtures, selfCheck, verify } from "./verify-architecture.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const bp = JSON.parse(readFileSync(join(ROOT, "architecture.blueprint.json"), "utf8"))
const schema = JSON.parse(readFileSync(join(ROOT, "blueprint.schema.json"), "utf8"))

function withTree(files, blueprint, fn) {
  const dir = materialise({ ...clean, ...files }, ROOT)
  try {
    if (blueprint) writeFileSync(join(dir, "architecture.blueprint.json"), JSON.stringify(blueprint))
    return fn(verify(dir))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
const statusOf = (report, id) => report.rows.find((r) => r.id === id).status

// ── package B ─────────────────────────────────────────────────────────────
test("g7: the real blueprint passes its self-check", () => {
  assert.deepEqual(selfCheck(bp, schema), [])
})

test("g4: localFirst matches 02-database-architecture.md §6.1 — 7 tables, compound index, _sync", () => {
  assert.deepEqual(bp.localFirst.tables.map((t) => t.name), ["meta", "artifacts", "highlights", "notes", "miniConclusions", "runs", "outbox"])
  assert.equal(bp.localFirst.tables.find((t) => t.name === "highlights").schema, "id, [artifactId+page], layer, _sync")
  assert.deepEqual(bp.localFirst.rowFlag.values, ["clean", "pending", "failed"])
})

test("g5: commands carry baseUrl; five canvas leaves; ink-pad is conditional on 024", () => {
  assert.equal(bp.commands.length, 4)
  assert.ok(bp.commands.every((c) => c.baseUrl === "/api"))
  assert.equal(bp.canvasLeaves.length, 5)
  assert.deepEqual(bp.canvasLeaves.find((l) => l.name === "ink-pad"), { name: "ink-pad", layer: "modal", hasPainter: true, status: "conditional", gatedBy: "024" })
})

test("g6 / g2 / g3: invariants and decisions arrive as arrays with the registry's totals", () => {
  const by = (list, key) => list.reduce((m, x) => ({ ...m, [x[key]]: (m[x[key]] ?? 0) + 1 }), {})
  assert.deepEqual(by(bp.invariants, "enforcedBy"), { script: 18, eslint: 7, review: 2, deferred: 1, void: 1 })
  assert.equal(bp.openQuestions.length, 35)
  assert.deepEqual(by(bp.openQuestions, "state"), { defaulted: 27, unanswered: 4, confirmed: 4 })
  assert.deepEqual(bp.openQuestions.filter((q) => q.state === "unanswered").map((q) => q.id), ["D-12", "Q7", "Q8", "Q9"])
})

test("g7: a wrong table name fails the self-check, and the blueprint cross-checks fail instead of passing vacuously", () => {
  const bad = structuredClone(bp)
  bad.localFirst.tables.find((t) => t.name === "notes").mirrors = ["highlight_note"]
  assert.match(selfCheck(bad, schema).join("\n"), /mirrors "highlight_note", which is not in domainTables/)
  withTree({}, bad, (report) => {
    assert.equal(report.ok, false)
    for (const id of ["I13", "I15", "I25"]) assert.equal(statusOf(report, id), "fail")
  })
})

// ── package D ─────────────────────────────────────────────────────────────
test("g14: every planted violation is caught under its own id, and the clean tree is green", async () => {
  const results = await runFixtures(ROOT)
  assert.deepEqual(results.filter((r) => !r.ok), [])
})

test("g12 / g13: every script-class invariant has a fixture", () => {
  const scripted = bp.invariants.filter((i) => i.enforcedBy === "script").map((i) => i.id).sort()
  assert.deepEqual(cases.map((c) => c.id).sort(), scripted)
})

test("g11 / g15: a missing src/ fails, and the report always has 29 rows", () => {
  const dir = materialise({}, ROOT)
  try {
    const report = verify(dir)
    assert.equal(report.ok, false)
    assert.equal(report.rows.length, 29)
    assert.equal(report.rows.filter((r) => r.status === "fail").length, 18)
    assert.equal(report.rows.filter((r) => r.status === "skipped").length, 10)
    assert.equal(statusOf(report, "I6"), "void")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  withTree({}, null, (report) => assert.equal(report.rows.length, 29))
})

test("g13: I25 skips a conditional leaf, passes a not-needed leaf with no painter, fails a not-needed leaf that has one", () => {
  const leaf = "src/shared/components/canvas/ink-pad"
  const notNeeded = structuredClone(bp)
  notNeeded.canvasLeaves.find((l) => l.name === "ink-pad").status = "not-needed"
  const folder = { [`${leaf}/ink-pad.tsx`]: '"use client"\nexport function InkPad() { return null }\n', [`${leaf}/index.ts`]: 'export * from "./ink-pad"\n' }
  withTree(folder, null, (report) => assert.equal(statusOf(report, "I25"), "pass"))
  withTree(folder, notNeeded, (report) => assert.equal(statusOf(report, "I25"), "pass"))
  withTree({ ...folder, [`${leaf}/ink-pad.painter.ts`]: '"use client"\nexport function p(l) { l.batchDraw() }\n' }, notNeeded,
    (report) => assert.equal(statusOf(report, "I25"), "fail"))
})

// ── package C ─────────────────────────────────────────────────────────────
test("g8: AGENTS.md keeps the Next.js block and copies the placement tree and import law byte-for-byte", (t) => {
  const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8")
  assert.match(agents, /^<!-- BEGIN:nextjs-agent-rules -->[\s\S]*<!-- END:nextjs-agent-rules -->/)
  const source = join(ROOT, "..", "04-frontend-folder-architecture.md")
  if (!existsSync(source)) return t.skip("04-frontend-folder-architecture.md is not beside this app")
  const ffa = readFileSync(source, "utf8")
  // git autocrlf may give either file CRLF on checkout; compare content, not line endings
  const block = (text, heading) => /```[a-z]*\n([\s\S]*?)```/.exec(text.replace(/\r\n/g, "\n").slice(text.replace(/\r\n/g, "\n").indexOf(heading)))[1]
  assert.equal(block(agents, "## 2. Placement decision tree"), block(ffa, "## 8. Placement decision tree"))
  assert.equal(block(agents, "## 1. Import direction"), block(ffa, "## 9. Import direction law"))
})

test("g9 / g10: AGENTS.md states the escalation procedure and the review checklist", () => {
  const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8")
  assert.match(agents, /openQuestions\[\]/)
  assert.match(agents, /\*\*Never pick\*\*/)
  for (const id of ["I19", "I27", "I28"]) assert.match(agents, new RegExp(`^\\| ${id}\\b.*\\| task 0\\d\\d`, "m"))
})
