// Task 003 g4/g5: uploads a generated placeholder PDF for the seeded artifact, signed in as the seeded leader,
// so the storage policy (leader-write) is what authorises it — no secret key. Run by `npm run db:seed` after the reset.
// No dependencies: node fetch + the local stack's own keys from `supabase status`.
import { spawnSync } from "node:child_process"

const PAGES = 3

// A minimal valid PDF: Catalog, Pages, one Helvetica font, then a page + content stream per page. ASCII text only.
// ponytail: hand-rolled and text-only; swap for a real fixture PDF if a task needs images or a text layer to test against.
function placeholderPdf(pages) {
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, i) => `${4 + i * 2} 0 R`).join(" ")}] /Count ${pages} >>`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
  for (let i = 1; i <= pages; i++) {
    const text = `BT /F1 24 Tf 72 700 Td (ThinkBoard placeholder report - page ${i} of ${pages}) Tj ET`
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + (i - 1) * 2} 0 R >>`)
    objs.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`)
  }
  let out = "%PDF-1.4\n"
  const offsets = objs.map((o, i) => { const at = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return at })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, "latin1")
}

const status = spawnSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8", shell: true })
if (status.status !== 0) throw new Error(`supabase status failed (is the stack up? npm run start): ${status.stderr}`)
const env = JSON.parse(status.stdout.slice(status.stdout.indexOf("{")))
const base = env.API_URL
const apikey = env.PUBLISHABLE_KEY ?? env.ANON_KEY
if (!base || !apikey) throw new Error("supabase status gave no API_URL / publishable key")

async function call(path, init, token) {
  const res = await fetch(`${base}${path}`, { ...init, headers: { apikey, ...(token && { authorization: `Bearer ${token}` }), ...init.headers } })
  if (!res.ok) throw new Error(`${init.method} ${path} -> ${res.status} ${await res.text()}`)
  return res
}

const login = await call("/auth/v1/token?grant_type=password", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "leader@thinkboard.test", password: "password" }),
})
const { access_token } = await login.json()

const [artifact] = await (await call("/rest/v1/artifacts?select=id,session_id&kind=eq.pdf&slot=eq.main", { method: "GET", headers: {} }, access_token)).json()
if (!artifact) throw new Error("no seeded artifact found — did seed.sql run?")

const name = `${artifact.session_id}/${artifact.id}.pdf`
await call(`/storage/v1/object/artifacts/${name}`, { method: "POST", headers: { "content-type": "application/pdf", "x-upsert": "true" }, body: placeholderPdf(PAGES) }, access_token)
await call(`/rest/v1/artifacts?id=eq.${artifact.id}`, {
  method: "PATCH", headers: { "content-type": "application/json" },
  body: JSON.stringify({ storage_path: `artifacts/${name}`, page_count: PAGES }),
}, access_token)
console.log(`seeded PDF uploaded: artifacts/${name}`)
