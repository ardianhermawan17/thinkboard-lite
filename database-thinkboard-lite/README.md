# database-thinkboard-lite

The Supabase project for ThinkBoard Lite: migrations, RLS and its tests. The schema's source of truth is
[`../02-database-architecture.md`](../02-database-architecture.md) §8.1; `0004_lite.sql` is byte-identical to it.
Later a Go backend will be a **sibling** folder (`backend-thinkboard-lite/`), not part of this one: this folder owns
the schema, migrations, seed and tests, and nothing else.

```
supabase/config.toml        ports 553xx, so it can run beside the Full project's stack (543xx)
supabase/migrations/        0001-0003 from the Full project, unchanged; 0004_lite.sql is the Lite delta
supabase/tests/             rls.sql + rls.test.mjs — the access-model proof (task 002)
supabase/seed.sql           task 003
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
| `start` | the stack without storage, studio, edge-runtime and the other services these tasks do not use |
| `reset` | `supabase db reset` — applies every migration from scratch |
| `test` | runs `rls.sql` in the db container, then re-applies `0004` |
| `stop` | stops the stack |

Keys: use the publishable and secret key names from `supabase status` — `anon` / `service_role` are the deprecated
ones (README §7 of the architecture repo). The client never gets a secret key (RULE-01).
