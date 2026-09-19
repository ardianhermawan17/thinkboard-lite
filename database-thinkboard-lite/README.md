# database-thinkboard-lite

The Supabase project for ThinkBoard Lite: migrations, RLS and its tests. The schema's source of truth is
[`../02-database-architecture.md`](../02-database-architecture.md) §8.1; `0004_lite.sql` is byte-identical to it.
Later a Go backend will be a **sibling** folder (`backend-thinkboard-lite/`), not part of this one: this folder owns
the schema, migrations, seed and tests, and nothing else.

```
supabase/config.toml        ports 553xx, so it can run beside the Full project's stack (543xx)
supabase/migrations/        0001-0003 from the Full project, unchanged; 0004_lite.sql is the Lite delta;
                            0005_storage_artifacts.sql is the `artifacts` bucket + its policy (task 003, DB-Q11)
supabase/tests/             rls.sql + rls.test.mjs — the access-model proof (task 002)
supabase/tests/seed/        seed.test.mjs — the seed and storage-policy checks (task 003)
supabase/seed.sql           the local dev seed: one team, leader, two members, board/column/session, one pdf artifact
supabase/seed/              upload-pdf.mjs — uploads a generated placeholder PDF as the seeded leader
```

Needs Docker running.

```bash
npm install
```

```bash
npm run start
```

```bash
npm test
```

| Script | Does |
|---|---|
| `start` | the stack with storage, without studio, edge-runtime and the other services these tasks do not use |
| `reset` | `supabase db reset` — applies every migration and `seed.sql` from scratch |
| `db:seed` | `reset`, then uploads the placeholder PDF: a fresh stack to the seeded state in one command. Local logins: `leader@`, `member-a@`, `member-b@thinkboard.test`, password `password` |
| `test` | runs `rls.sql` in the db container, then re-applies `0004` |
| `test:seed` | the seed and storage-policy checks; re-runs `db:seed`, so run it alone, not beside `test` |
| `stop` | stops the stack |

Keys: use the publishable and secret key names from `supabase status` — `anon` / `service_role` are the deprecated
ones (README §7 of the architecture repo). The client never gets a secret key (RULE-01).
