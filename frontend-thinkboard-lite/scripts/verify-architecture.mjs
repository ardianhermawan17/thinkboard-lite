#!/usr/bin/env node
// Architecture analyzer for ThinkBoard Lite — task 000, package D (todo-task-000-split.md §2, §4).
// Dependency-free: Node standard library only. Prints all 29 invariants on every run; exits 1 on any fail.
//
//   node scripts/verify-architecture.mjs            check the real tree
//   node scripts/verify-architecture.mjs --json     machine-readable report for CI
//   node scripts/verify-architecture.mjs --fixtures run the planted-violation suite
//
// ponytail: checks read source text with regexes, not a TypeScript AST. Each one is pinned by a fixture;
// if one gets fooled, move that check to the TypeScript compiler API rather than widening the regex.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const CODE_EXT = /\.(ts|tsx|mts|js|mjs|jsx)$/

// ── blueprint self-check (package B, g7) ────────────────────────────────────
// Supports the JSON Schema subset blueprint.schema.json uses; anything else in the schema is an error.
const SUPPORTED = new Set(["$schema", "$comment", "type", "required", "properties", "additionalProperties", "items", "enum", "const", "minItems", "maxItems", "minLength", "pattern"])

function typeOf(v) {
  if (v === null) return "null"
  if (Array.isArray(v)) return "array"
  if (Number.isInteger(v)) return "integer"
  return typeof v
}

export function validateSchema(value, schema, path = "$", errors = []) {
  for (const k of Object.keys(schema)) if (!SUPPORTED.has(k)) errors.push(`${path}: schema keyword "${k}" is not supported by the self-check`)
  if (schema.type) {
    const types = [].concat(schema.type)
    const t = typeOf(value)
    if (!types.includes(t) && !(t === "integer" && types.includes("number"))) {
      errors.push(`${path}: expected ${types.join("|")}, got ${t}`)
      return errors
    }
  }
  if ("const" in schema && value !== schema.const) errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`)
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: ${JSON.stringify(value)} is not one of ${schema.enum.join(", ")}`)
  if (typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) errors.push(`${path}: shorter than ${schema.minLength}`)
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: "${value}" does not match ${schema.pattern}`)
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: ${value.length} items, needs ≥ ${schema.minItems}`)
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: ${value.length} items, allows ≤ ${schema.maxItems}`)
    if (schema.items) value.forEach((v, i) => validateSchema(v, schema.items, `${path}[${i}]`, errors))
  }
  if (typeOf(value) === "object") {
    for (const r of schema.required ?? []) if (!(r in value)) errors.push(`${path}: missing "${r}"`)
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) validateSchema(v, schema.properties[k], `${path}.${k}`, errors)
      else if (schema.additionalProperties === false) errors.push(`${path}: unknown key "${k}"`)
    }
  }
  return errors
}

function dupes(list) {
  return list.filter((x, i) => list.indexOf(x) !== i)
}

export function selfCheck(bp, schema) {
  const errors = validateSchema(bp, schema)
  if (errors.length) return errors // cross-checks below assume the shape is right
  const domain = new Set(bp.domainTables.map((t) => t.name))
  const local = new Set(bp.localFirst.tables.map((t) => t.name))
  for (const [what, list] of [["context", bp.contexts.map((c) => c.name)], ["domain table", bp.domainTables.map((t) => t.name)],
    ["Dexie table", bp.localFirst.tables.map((t) => t.name)], ["command", bp.commands.map((c) => c.name)], ["canvas leaf", bp.canvasLeaves.map((l) => l.name)],
    ["invariant", bp.invariants.map((i) => i.id)], ["open question", bp.openQuestions.map((q) => q.id)]])
    for (const d of new Set(dupes(list))) errors.push(`duplicate ${what} "${d}"`)
  for (let n = 1; n <= 29; n++) if (!bp.invariants.some((i) => i.id === `I${n}`)) errors.push(`invariant I${n} is missing`)
  for (const t of bp.localFirst.tables) {
    for (const m of t.mirrors) if (!domain.has(m)) errors.push(`localFirst table "${t.name}" mirrors "${m}", which is not in domainTables`)
    if (t.localOnly !== (t.mirrors.length === 0)) errors.push(`localFirst table "${t.name}": localOnly must be true exactly when it mirrors nothing`)
  }
  for (const t of bp.domainTables) if (t.dexie && !local.has(t.dexie)) errors.push(`domain table "${t.name}" points at Dexie table "${t.dexie}", which is not in localFirst.tables`)
  for (const c of bp.commands) {
    const route = `src/app${c.baseUrl}${c.url.replace(/:(\w+)/g, "[$1]")}/route.ts`
    if (c.route !== route) errors.push(`command "${c.name}": route ${c.route} does not match baseUrl + url (${route})`)
  }
  for (const l of bp.canvasLeaves) if (l.status === "conditional" && !l.gatedBy) errors.push(`canvas leaf "${l.name}" is conditional but names no gatedBy task`)
  return errors
}

// ── tree helpers ───────────────────────────────────────────────────────────
function walk(dir, root = dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, root, out)
    else out.push(relative(root, p).split(sep).join("/"))
  }
  return out
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length

function subdirs(root, rel) {
  const d = join(root, rel)
  return existsSync(d) ? readdirSync(d).filter((n) => statSync(join(d, n)).isDirectory()).map((n) => `${rel}/${n}`) : []
}

// String-aware: a "/*" inside a JSON string (the "@app/*" path aliases, "**/*.ts" globs) is not a comment.
function jsonc(text) {
  let out = ""
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const next = text[i + 1]
    if (inString) {
      out += c
      if (c === "\\") out += text[++i]
      else if (c === '"') inString = false
    } else if (c === '"') {
      inString = true
      out += c
    } else if (c === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++
      out += "\n"
    } else if (c === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2)
      i = end < 0 ? text.length : end + 1
    } else out += c
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"))
}

const importsOf = (text) => [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)].map((m) => ({ spec: m[1], index: m.index }))

function makeCtx(root) {
  const files = walk(join(root, "src"), root).filter((f) => CODE_EXT.test(f)) // already root-relative: "src/…"
  const cache = new Map()
  const read = (rel) => {
    // normalise CRLF (git autocrlf on Windows) so every regex below sees one line ending
    if (!cache.has(rel)) cache.set(rel, existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n") : null)
    return cache.get(rel)
  }
  const createApis = files.map((f) => ({ file: f, text: read(f) })).filter((x) => /\bcreateApi\s*\(/.test(x.text))
  return { root, files, read, createApis, under: (prefix) => files.filter((f) => f.startsWith(prefix)) }
}

function grepFiles(ctx, files, re, message) {
  const out = []
  for (const f of files) {
    const text = ctx.read(f)
    for (const m of text.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")))
      out.push({ file: f, line: lineOf(text, m.index), message: message(m) })
  }
  return out
}

// ── the 15 tree-only checks (package D, g12) ────────────────────────────────
const STORE = "src/shared/config/redux/store.ts"
const PERSIST_FILES = ["src/shared/config/redux/persist.ts", STORE]

function persistConfig(ctx) {
  for (const f of PERSIST_FILES) {
    const text = ctx.read(f)
    const m = text && /whitelist\s*:\s*\[([^\]]*)\]/.exec(text)
    if (m) return { file: f, text, line: lineOf(text, m.index), whitelist: [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((x) => x[1]) }
  }
  return null
}

const TREE_CHECKS = {
  I1(ctx) {
    const folders = [...subdirs(ctx.root, "src/shared/components/template"), ...subdirs(ctx.root, "src/shared/components/canvas"),
      ...subdirs(ctx.root, "src/features").flatMap((f) => subdirs(ctx.root, `${f}/components`))]
    return folders.filter((d) => !existsSync(join(ctx.root, d, "index.ts"))).map((d) => ({ file: d, line: 0, message: "component folder has no index.ts" }))
  },
  I2(ctx) {
    const tsx = ctx.files.filter((f) => f.endsWith(".tsx") && !/\.(test|stories)\.tsx$/.test(f))
    const hasSiblingHook = (f) => {
      const dir = f.slice(0, f.lastIndexOf("/") + 1)
      return ctx.files.some((g) => g.startsWith(dir + "use-") && g.endsWith(".ts") && !g.slice(dir.length).includes("/"))
    }
    return grepFiles(ctx, tsx.filter(hasSiblingHook), /\b(useState|useEffect|useAppSelector|useAppDispatch|useQuery|useMutation|useLiveQuery)\b/,
      (m) => `${m[1]} in a .tsx that has a sibling use-*.ts — move it to the hook`)
  },
  I4(ctx) {
    return grepFiles(ctx, ctx.under("src/app/"), /\b(useAppSelector|useAppDispatch)\b/, (m) => `${m[1]} under src/app — routes compose, never orchestrate`)
  },
  I5(ctx) {
    if (!ctx.createApis.length) return []
    const store = ctx.read(STORE)
    const out = []
    for (const { file, text } of ctx.createApis) {
      const name = /const\s+(\w+)\s*=\s*createApi\s*\(/.exec(text)?.[1]
      if (!name) { out.push({ file, line: 0, message: "createApi result is not assigned to a named const" }); continue }
      if (!store) { out.push({ file, line: 0, message: `${name} exists but ${STORE} does not` }); continue }
      if (!store.includes(`${name}.reducerPath`)) out.push({ file: STORE, line: 0, message: `${name}.reducerPath is not in rootReducer` })
      if (!new RegExp(`\\.concat\\([^)]*\\b${name}\\.middleware`).test(store)) out.push({ file: STORE, line: 0, message: `${name}.middleware is not in .concat()` })
    }
    const paths = ctx.createApis.map((x) => /reducerPath\s*:\s*["'`]([^"'`]+)/.exec(x.text)?.[1]).filter(Boolean)
    for (const d of new Set(dupes(paths))) out.push({ file: STORE, line: 0, message: `reducerPath "${d}" is declared twice` })
    return out
  },
  I7(ctx) {
    const ts = ctx.read("tsconfig.json")
    if (!ts) return [{ file: "tsconfig.json", line: 0, message: "tsconfig.json not found" }]
    const keys = Object.keys(jsonc(ts).compilerOptions?.paths ?? {}).map((k) => k.replace(/\/\*$/, ""))
    const vitest = ctx.read("vitest.config.mts")
    if (!vitest) return keys.length ? [{ file: "vitest.config.mts", line: 0, message: "vitest.config.mts not found — tsconfig aliases must be mirrored there" }] : []
    const vkeys = new Set([...vitest.matchAll(/["'](@[\w-]+)(?:\/\*)?["']/g)].map((m) => m[1]))
    return keys.filter((k) => !vkeys.has(k)).map((k) => ({ file: "vitest.config.mts", line: 0, message: `alias ${k} is in tsconfig.json but not in vitest.config.mts` }))
  },
  I8(ctx) {
    const out = []
    for (const f of ctx.files) {
      const text = ctx.read(f)
      for (const { spec, index } of importsOf(text)) {
        if (spec.startsWith(".")) continue
        const seg = spec.split("/")
        if (seg.some((s, i) => i > 0 && s === seg[i - 1])) out.push({ file: f, line: lineOf(text, index), message: `"${spec}" repeats a path segment — import the barrel` })
      }
    }
    return out
  },
  I9(ctx) {
    const files = ctx.under("src/shared/types/domain/").filter((f) => !f.endsWith("/common.ts"))
    return grepFiles(ctx, files, /^\s*((?:\w+_)?id|\w+_at)\??\s*:\s*string\b/m, (m) => `${m[1]} is a bare string — use a branded type from ./common`)
  },
  I10(ctx) {
    const slices = ctx.files.filter((f) => /^src\/features\/[^/]+\/stores\/[^/]+-slice\.ts$/.test(f))
    return grepFiles(ctx, slices, /\b(?:type|interface)\s+(\w*State)\b/, (m) => `${m[1]} is declared in the slice file — move it to types/redux.ts`)
  },
  I11(ctx) {
    const files = ctx.files.filter((f) => /^src\/features\/[^/]+\/types\/redux\.ts$/.test(f))
    return grepFiles(ctx, files, /from\s*["'][^"']*types\/domain[^"']*["']/, () => "slice state imports a domain row type — slices hold ids and phase")
  },
  I12(ctx) {
    const p = persistConfig(ctx)
    if (!p) return []
    const reducerPaths = ctx.createApis.map((x) => /reducerPath\s*:\s*["'`]([^"'`]+)/.exec(x.text)?.[1]).filter(Boolean)
    return p.whitelist.filter((w) => w === "entities" || reducerPaths.includes(w))
      .map((w) => ({ file: p.file, line: p.line, message: `whitelist holds "${w}" — never entities, never a reducerPath` }))
  },
  I14(ctx) {
    const files = ctx.files.filter((f) => /^src\/features\/[^/]+\/components\//.test(f))
    return grepFiles(ctx, files, /\{[^}]*\bdata\b[^}]*\}\s*=\s*use\w+(?:Query|Mutation)\s*\(/, () => "data destructured from a command hook — a command returns an id or a status")
  },
  I16(ctx) {
    const p = persistConfig(ctx)
    if (!p) return []
    const out = []
    if (!/transforms\s*:\s*\[[^\]]*\bstripUi\b/.test(p.text)) out.push({ file: p.file, line: p.line, message: "stripUi is not registered in persistConfig.transforms" })
    const reduxTypes = ctx.files.filter((f) => /^src\/features\/[^/]+\/types\/redux\.ts$/.test(f)).map((f) => ctx.read(f)).join("\n")
    const reducerPaths = ctx.createApis.map((x) => /reducerPath\s*:\s*["'`]([^"'`]+)/.exec(x.text)?.[1]).filter(Boolean)
    for (const w of p.whitelist.filter((x) => x !== "entities" && !reducerPaths.includes(x))) { // those are I12's, not slices
      const name = w[0].toUpperCase() + w.slice(1) + "State"
      const body = new RegExp(`type\\s+${name}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`).exec(reduxTypes)?.[1]
      if (!body || !/\bui\s*:/.test(body)) out.push({ file: p.file, line: p.line, message: `persisted slice "${w}" has no ${name} with a ui key in types/redux.ts` })
    }
    return out
  },
  I17(ctx) {
    const files = ctx.files.filter((f) => !f.endsWith(".painter.ts"))
    return grepFiles(ctx, files, /\bbatchDraw\s*\(|\bnew\s+Konva\.|\.getLayer\s*\(\s*\)/, (m) => `imperative Konva (${m[0].trim()}) outside a *.painter.ts`)
  },
  I22(ctx) {
    const f = "src/features/sync/realtime/channel.ts"
    const text = ctx.read(f)
    if (!text) return []
    const sub = text.search(/\.subscribe\s*\(/)
    const auth = text.search(/\bsetAuth\s*\(/)
    return sub !== -1 && (auth === -1 || auth > sub) ? [{ file: f, line: lineOf(text, sub), message: "subscribe() before realtime.setAuth()" }] : []
  },
  I24(ctx) {
    const files = ctx.under("src/shared/components/canvas/").filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$|\/(types|index)\.ts$/.test(f))
    return files.filter((f) => !/^\s*["']use client["']/.test(ctx.read(f))).map((f) => ({ file: f, line: 1, message: 'canvas file does not begin with "use client"' }))
  },
}

// ── the 3 blueprint cross-checks (package D, g13) ───────────────────────────
const normUrl = (u) => u.replace(/\$\{[^}]+\}/g, ":id").replace(/:\w+/g, ":id")

const BLUEPRINT_CHECKS = {
  I13(ctx, bp) {
    if (!ctx.read(bp.localFirst.db)) return [] // the Dexie kernel is not built yet (task 006)
    const queries = ctx.under("src/features/entities/queries/").map((f) => ctx.read(f)).join("\n")
    return bp.localFirst.tables.filter((t) => !new RegExp(`\\bdb\\.${t.name}\\b`).test(queries))
      .map((t) => ({ file: "src/features/entities/queries/", line: 0, message: `Dexie table "${t.name}" has no query hook` }))
  },
  I15(ctx, bp) {
    const out = []
    const known = new Set(bp.commands.map((c) => normUrl(c.url)))
    for (const { file, text } of ctx.createApis) {
      for (const m of text.matchAll(/\burl\s*:\s*[`"']([^`"']+)[`"']|\bquery\s*:\s*\([^)]*\)\s*=>\s*[`"']([^`"']+)[`"']/g)) {
        let url = m[1] ?? m[2]
        for (const c of bp.commands) if (url.startsWith(c.baseUrl + "/")) url = url.slice(c.baseUrl.length)
        if (!known.has(normUrl(url))) out.push({ file, line: lineOf(text, m.index), message: `endpoint ${url} is not in blueprint.commands[]` })
      }
    }
    const routes = new Set(bp.commands.map((c) => c.route))
    for (const f of ctx.under("src/app/api/")) if (f.endsWith("/route.ts") && !routes.has(f)) out.push({ file: f, line: 0, message: "route handler is not in blueprint.commands[] — no fifth endpoint" })
    return out
  },
  I25(ctx, bp) {
    const out = []
    const leaves = new Map(bp.canvasLeaves.map((l) => [l.name, l]))
    for (const f of ctx.files.filter((x) => x.endsWith(".painter.ts"))) {
      const m = /^src\/shared\/components\/canvas\/([^/]+)\/\1\.painter\.ts$/.exec(f)
      const leaf = m && leaves.get(m[1])
      if (!leaf || !leaf.hasPainter) out.push({ file: f, line: 0, message: "painter does not trace to a blueprint canvas leaf with hasPainter: true" })
      else if (leaf.status === "not-needed") out.push({ file: f, line: 0, message: `painter for leaf "${leaf.name}", which is not-needed` })
    }
    for (const l of bp.canvasLeaves) {
      if (!l.hasPainter || l.status !== "active") continue // conditional and not-needed leaves are skipped (split §3 C4)
      const dir = `src/shared/components/canvas/${l.name}`
      if (existsSync(join(ctx.root, dir)) && !ctx.read(`${dir}/${l.name}.painter.ts`)) out.push({ file: dir, line: 0, message: `leaf "${l.name}" has hasPainter: true but no ${l.name}.painter.ts` })
    }
    return out
  },
}

const NOT_SCRIPTED = {
  eslint: "enforced by eslint.architecture.mjs",
  review: "human review gate — AGENTS.md review checklist",
  deferred: "deferred to task 012 — a named Playwright story test",
  void: "void — replaced by I13; never reassign this number",
}

// ── harness (package D, g11 + g15) ──────────────────────────────────────────
export function verify(root) {
  const rows = []
  const findings = []
  const bpPath = join(root, "architecture.blueprint.json")
  const schemaPath = join(root, "blueprint.schema.json")
  let bp = null
  let bpErrors = []
  try {
    if (!existsSync(bpPath) || !existsSync(schemaPath)) throw new Error("architecture.blueprint.json or blueprint.schema.json not found")
    bp = JSON.parse(readFileSync(bpPath, "utf8"))
    bpErrors = selfCheck(bp, JSON.parse(readFileSync(schemaPath, "utf8")))
  } catch (e) {
    bpErrors = [e.message]
  }
  const hasSrc = existsSync(join(root, "src"))
  const ctx = hasSrc ? makeCtx(root) : null
  const classOf = Object.fromEntries((bp?.invariants ?? []).map((i) => [i.id, i.enforcedBy]))
  for (let n = 1; n <= 29; n++) {
    const id = `I${n}`
    const check = TREE_CHECKS[id] ?? BLUEPRINT_CHECKS[id]
    let status
    let message
    let found = []
    if (check) {
      if (!hasSrc) [status, message] = ["fail", "src/ not found — an absent tree is a failure, not an empty pass"]
      else if (BLUEPRINT_CHECKS[id] && bpErrors.length) [status, message] = ["fail", `blueprint self-check failed (${bpErrors.length} error${bpErrors.length > 1 ? "s" : ""})`]
      else {
        found = check(ctx, bp)
        ;[status, message] = found.length ? ["fail", `${found.length} violation${found.length > 1 ? "s" : ""}`] : ["pass", ""]
      }
    } else {
      const cls = classOf[id] ?? (id === "I6" ? "void" : "eslint")
      ;[status, message] = [cls === "void" ? "void" : "skipped", NOT_SCRIPTED[cls] ?? cls]
    }
    rows.push({ id, status, message })
    for (const f of found) findings.push({ id, status: "fail", ...f })
  }
  for (const e of bpErrors) findings.push({ id: "blueprint", status: "fail", file: "architecture.blueprint.json", line: 0, message: e })
  return { ok: rows.every((r) => r.status !== "fail") && !bpErrors.length, rows, findings }
}

function print(report) {
  for (const r of report.rows) console.log(`${r.id.padEnd(4)} ${r.status.padEnd(8)} ${r.message}`)
  if (report.findings.length) console.log("")
  for (const f of report.findings) console.log(`${f.file}${f.line ? `:${f.line}` : ""}  ${f.id}  ${f.message}`)
  const count = (s) => report.rows.filter((r) => r.status === s).length
  console.log(`\n${report.ok ? "OK" : "FAILED"} — ${count("pass")} pass, ${count("fail")} fail, ${count("skipped")} skipped, ${count("void")} void`)
}

// ── fixture suite (package D, g14) ──────────────────────────────────────────
// Fixture trees are data, written to os.tmpdir() per run, so no planted violation ever enters the
// project tree where `npm run lint` or `tsc` would see it.
export function materialise(files, base = join(SCRIPT_DIR, "..")) {
  const dir = mkdtempSync(join(tmpdir(), "tb-arch-"))
  for (const name of ["architecture.blueprint.json", "blueprint.schema.json"]) writeFileSync(join(dir, name), readFileSync(join(base, name)))
  for (const [rel, text] of Object.entries(files)) {
    if (text === null) continue // null removes a file from the clean tree
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), text)
  }
  return dir
}

export async function runFixtures(base = join(SCRIPT_DIR, "..")) {
  const { clean, cases } = await import(pathToFileURL(join(SCRIPT_DIR, "verify-architecture.fixtures.mjs")).href)
  const results = []
  for (const c of [{ id: null, files: {} }, ...cases]) {
    const dir = materialise({ ...clean, ...c.files }, base)
    try {
      const failing = verify(dir).rows.filter((r) => r.status === "fail").map((r) => r.id)
      const ok = c.id === null ? failing.length === 0 : failing.length === 1 && failing[0] === c.id
      results.push({ fixture: c.id ?? "clean", expected: c.id ?? "no failures", failing, ok })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }
  return results
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2)
  if (args.includes("--fixtures")) {
    const results = await runFixtures()
    for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.fixture.padEnd(6)} expected ${r.expected}; failing: ${r.failing.join(", ") || "none"}`)
    process.exitCode = results.every((r) => r.ok) ? 0 : 1
  } else {
    const root = args.includes("--root") ? args[args.indexOf("--root") + 1] : join(SCRIPT_DIR, "..")
    const report = verify(root)
    if (args.includes("--json")) console.log(JSON.stringify(report, null, 2))
    else print(report)
    process.exitCode = report.ok ? 0 : 1
  }
}
