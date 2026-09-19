import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { localTable, toRow, toRunRow, toWire, wireTable } from "./mappers"

// The column list is the GENERATED domain type (npm run gen:types), so a migration that adds a column fails here
// until the mapper and the row agree again.
// (relative to the project root, where vitest runs: import.meta.url is not a real file URL in the jsdom project)
const columns = (file: string): string[] =>
  [...readFileSync(join(process.cwd(), "src/shared/types/domain", `${file}.ts`), "utf8").matchAll(/^ {2}(\w+):/gm)].map((m) => m[1])

const wireRow = (file: string) => Object.fromEntries(columns(file).map((c) => [c, `v:${c}`]))

describe("mappers (g4): the key set is the column list", () => {
  it.each([
    ["highlights", "highlights"],
    ["notes", "highlight-notes"],
    ["artifacts", "artifacts"],
    ["miniConclusions", "mini-conclusions"],
  ])("%s: toWire(toRow(wire)) is the wire row again, with exactly the generated columns", (_table, file) => {
    const wire = wireRow(file)
    const row = toRow(wire, "pending")
    expect(Object.keys(row).some((k) => k.includes("_") && k !== "_sync")).toBe(false) // camelCase, except the flag
    const back = toWire(row)
    expect(back).toEqual(wire)
    expect(Object.keys(back).sort()).toEqual(columns(file).sort())
  })

  it("never lets _sync, seq or state cross into a Postgres write", () => {
    expect(toWire({ id: "1", sessionId: "s", _sync: "pending", seq: 3, state: "queued" })).toEqual({ id: "1", session_id: "s" })
  })

  it("keeps a jsonb value's own key case (bbox, ink)", () => {
    expect(toWire({ bbox: { xMin: 1, yMax: 2 } })).toEqual({ bbox: { xMin: 1, yMax: 2 } })
    expect(toRow({ bbox: { xMin: 1 } })).toEqual({ bbox: { xMin: 1 } })
  })

  it("maps notes <-> highlight_notes and camelCases the other Postgres tables", () => {
    expect(wireTable("notes")).toBe("highlight_notes")
    expect(wireTable("highlights")).toBe("highlights")
    expect(localTable("highlight_notes")).toBe("notes")
    expect(localTable("mini_conclusions")).toBe("miniConclusions")
    expect(localTable("artifacts")).toBe("artifacts")
  })

  it("caches a run and its children as one row", () => {
    const run = toRunRow({ id: "r", session_id: "s", owner_profile_id: null }, { points: [{ id: "p", run_id: "r" }], conclusions: [], renderings: [{ id: "x", run_id: "r" }] })
    expect(run).toMatchObject({ id: "r", sessionId: "s", ownerProfileId: null })
    expect(run.points).toEqual([{ id: "p", runId: "r" }])
    expect(run.renderings).toEqual([{ id: "x", runId: "r" }])
    expect(run.conclusions).toEqual([])
  })
})
