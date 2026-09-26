// Task 002: runs rls.sql through psql in the local Lite stack's db container. Run: npm test
// Needs the stack up (npm run start). No dependencies: node:test + docker exec.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { test } from "node:test"

const DB = "supabase_db_database-thinkboard-lite" // supabase_db_<project_id from config.toml>
const here = (f) => new URL(f, import.meta.url)
const psql = (input) =>
  spawnSync("docker", ["exec", "-i", DB, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"], { input, encoding: "utf8" })

const run = psql(readFileSync(here("rls.sql"), "utf8"))
const lines = run.stdout.split("\n")
const fails = lines.filter((l) => l.startsWith("FAIL"))

test("every check passes and the suite exits 0", () => {
  assert.deepEqual(fails, [], run.stderr)
  assert.equal(run.status, 0, run.stderr)
})

// g13 is the re-apply below; g1..g18 otherwise each need at least one passing check
// (g17/g18 are task 030: anon EXECUTE revoked, teammate profile-name reads)
for (let n = 1; n <= 18; n++) {
  if (n === 13) continue
  test(`g${n} has passing checks`, () => assert.ok(lines.some((l) => new RegExp(`^ok\\s+g${n}\\b`).test(l)), `no "ok g${n}" line`))
}

test("g13 0004_lite.sql applied a second time raises no error", () => {
  const again = psql(readFileSync(new URL("../migrations/0004_lite.sql", import.meta.url), "utf8"))
  assert.equal(again.status, 0, again.stderr)
})
