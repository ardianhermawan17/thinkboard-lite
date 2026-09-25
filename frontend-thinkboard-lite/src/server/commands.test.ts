import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"

// The gate (spec §4.3): the four declared commands are the only endpoints, and the route layer owns no domain
// branch — every table read and every RPC call lives in a service. verify:arch's I15 checks the same trace from
// the other side (it fails on a route not in blueprint.commands[]); this pins the count and the layering.
const ROOT = process.cwd()
const bp = JSON.parse(readFileSync(join(ROOT, "architecture.blueprint.json"), "utf8")) as { commands: { name: string; route: string }[] }

function routeFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return routeFiles(full)
    return entry.name === "route.ts" ? [full] : []
  })
}

const onDisk = routeFiles(join(ROOT, "src/app/api")).map((f) => relative(ROOT, f).replace(/\\/g, "/"))
const declared = bp.commands.map((c) => c.route)

describe("the four command endpoints (g1, gate)", () => {
  it("declares exactly four commands", () => {
    expect(bp.commands).toHaveLength(4)
  })

  it("each declared route exists on disk, and no undeclared route does", () => {
    for (const route of declared) expect(onDisk, `${route} is missing`).toContain(route)
    expect(onDisk.filter((f) => !declared.includes(f))).toEqual([])
  })
})

describe("no domain branch in the route layer (g2)", () => {
  const forbidden = [".from(", ".rpc(", "can_lead_session", "pipeline_runs", "profile_identities", "supabase"]

  it.each(declared)("%s never touches the database itself", (route) => {
    const text = readFileSync(join(ROOT, route), "utf8")
    for (const needle of forbidden) expect(text.includes(needle), `${route} must not contain "${needle}"`).toBe(false)
  })
})
