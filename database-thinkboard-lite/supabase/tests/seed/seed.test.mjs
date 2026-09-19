// Task 003 tests (g2, g4, g5). Run: npm run test:seed — the stack must be up (npm run start) and seeded (npm run db:seed).
// Separate from `npm test` on purpose: the last test re-runs db:seed, which resets the database under any parallel test.
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { test } from "node:test"

const DB = "supabase_db_database-thinkboard-lite"
const sh = (cmd, args, input) => spawnSync(cmd, args, { input, encoding: "utf8", shell: true })
const psql = (sql) => {
  const r = sh("docker", ["exec", "-i", DB, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"], sql)
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.trim()
}
const snapshot = () => psql(`select concat_ws(',',
  (select count(*) from teams), (select count(*) from team_members), (select count(*) from team_members where role = 'leader'),
  (select count(*) from boards), (select count(*) from board_columns), (select count(*) from sessions),
  (select count(*) from artifacts where kind = 'pdf'), (select count(*) from auth.users where email like '%@thinkboard.test'),
  (select count(*) from storage.objects where bucket_id = 'artifacts'),
  (select count(*) from llm_providers), (select count(*) from llm_models))`)

const status = JSON.parse(sh("npx", ["supabase", "status", "-o", "json"]).stdout.replace(/^[^{]*/, ""))
const apikey = status.PUBLISHABLE_KEY ?? status.ANON_KEY
async function api(path, init = {}, token) {
  return fetch(`${status.API_URL}${path}`, { ...init, headers: { apikey, ...(token && { authorization: `Bearer ${token}` }), ...init.headers } })
}
async function signIn(email) {
  const r = await api("/auth/v1/token?grant_type=password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "password" }) })
  assert.equal(r.status, 200, `${email} cannot sign in`)
  return (await r.json()).access_token
}

test("g2 the seed has exactly one team, leader + two members, board, column, session, pdf artifact, three users, one stored object", () => {
  assert.equal(snapshot(), "1,3,1,1,1,1,1,3,1,2,2")
})

test("g2 all three seeded users can sign in, and the leader is the one leader", async () => {
  for (const e of ["leader", "member-a", "member-b"]) await signIn(`${e}@thinkboard.test`)
  assert.equal(psql(`select i.email from team_members m join profile_identities i on i.profile_id = m.profile_id where m.role = 'leader'`), "leader@thinkboard.test")
})

test("g3 only placeholder providers and models are seeded: inactive, non-routable, D-12 pending, no real provider named", () => {
  assert.equal(psql(`select count(*) from llm_providers where key like 'placeholder-%' and not is_active and base_url like '%.invalid' and label like '%D-12 pending%'`), "2")
  assert.equal(psql(`select count(*) from llm_models where model_key = 'placeholder-model' and not is_active and label like '%D-12 pending%'`), "2")
  assert.equal(psql(`select (select count(*) from llm_providers) + (select count(*) from llm_models)`), "4") // nothing else
})

test("g4 a member downloads the PDF through the storage API; it is the 3-page placeholder", async () => {
  const token = await signIn("member-a@thinkboard.test")
  const [a] = await (await api("/rest/v1/artifacts?select=storage_path,page_count&kind=eq.pdf", {}, token)).json()
  assert.match(a.storage_path, /^artifacts\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/)
  assert.equal(a.page_count, 3)
  const r = await api(`/storage/v1/object/authenticated/${a.storage_path}`, {}, token)
  assert.equal(r.status, 200)
  const body = Buffer.from(await r.arrayBuffer()).toString("latin1")
  assert.ok(body.startsWith("%PDF") && body.includes("/Count 3"))
})

test("g4 storage policy: member and leader read, an outsider does not; only the leader writes", () => {
  const as = (uuid) => `reset role; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${uuid}","role":"authenticated"}', true);`
  const A = "00000000-0000-4000-8000-0000000000a2", L = "00000000-0000-4000-8000-0000000000a1", X = "00000000-0000-4000-8000-0000000000f9"
  const out = psql(`begin;
    insert into auth.users (id, email, raw_user_meta_data, aud, role) values ('${X}', 'x@t.test', '{}', 'authenticated', 'authenticated');
    select id as sid from sessions limit 1 \\gset
    create schema tb_seed; grant usage on schema tb_seed to authenticated;
    create function tb_seed.try(stmt text) returns text language plpgsql as $$ begin execute stmt; return 'allowed'; exception when others then return 'denied'; end $$;
    grant execute on function tb_seed.try(text) to authenticated;
    ${as(A)} select 'member_read|' || count(*) from storage.objects where bucket_id = 'artifacts';
    select 'member_write|' || tb_seed.try(format($q$insert into storage.objects (bucket_id, name) values ('artifacts', '%s/m.pdf')$q$, :'sid'));
    ${as(X)} select 'outsider_read|' || count(*) from storage.objects where bucket_id = 'artifacts';
    select 'outsider_write|' || tb_seed.try(format($q$insert into storage.objects (bucket_id, name) values ('artifacts', '%s/x.pdf')$q$, :'sid'));
    ${as(L)} select 'leader_read|' || count(*) from storage.objects where bucket_id = 'artifacts';
    select 'leader_write|' || tb_seed.try(format($q$insert into storage.objects (bucket_id, name) values ('artifacts', '%s/l.pdf')$q$, :'sid'));
    rollback;`)
  const got = Object.fromEntries(out.split("\n").filter((l) => l.includes("|")).map((l) => l.split("|")))
  assert.deepEqual(got, { member_read: "1", member_write: "denied", outsider_read: "0", outsider_write: "denied", leader_read: "1", leader_write: "allowed" })
})

test("g5 db:seed twice: same row counts, same state", () => {
  const before = snapshot()
  const r = sh("npm", ["run", "db:seed"])
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.equal(snapshot(), before)
})
