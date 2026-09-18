-- 0004_lite.sql — ThinkBoard Lite delta (02-database-architecture.md §8.1, rev 1.2)
-- Re-runnable: every statement is guarded, so a second apply is a no-op.

-- ── enums ───────────────────────────────────────────────────────────────
do $$ begin create type note_visibility as enum ('individual','group');
  exception when duplicate_object then null; end $$;
do $$ begin create type note_input_mode as enum ('keyboard','ink','stylus_os');    -- DB-F1 (C6)
  exception when duplicate_object then null; end $$;
do $$ begin create type highlight_layer as enum ('individual','group');
  exception when duplicate_object then null; end $$;

-- ── highlights: layer, promotion, slug, updated_at ──────────────────────
alter table highlights add column if not exists layer      highlight_layer not null default 'individual';
alter table highlights add column if not exists shared_at  timestamptz;             -- null = private
alter table highlights add column if not exists slug       text;
alter table highlights add column if not exists updated_at timestamptz not null default now();
create unique index if not exists highlights_slug_idx   on highlights (artifact_id, slug) where slug is not null;
create index        if not exists highlights_layer_idx  on highlights (artifact_id, layer);
create index        if not exists highlights_shared_idx on highlights (artifact_id) where shared_at is not null;

-- ── notes: the one new table ────────────────────────────────────────────
create table if not exists highlight_notes (
  id             uuid primary key default gen_random_uuid(),   -- client supplies uuidv7
  highlight_id   uuid not null references highlights(id) on delete cascade,
  profile_id     uuid not null references profiles(id)   on delete cascade,
  visibility     note_visibility not null default 'individual',
  input_mode     note_input_mode not null default 'keyboard',
  content        text not null default '',
  ink            jsonb,                                        -- strokes, only when input_mode = 'ink'
  transcribed_at timestamptz,                                  -- null = not yet tried
  transcribed_by text check (transcribed_by in ('os','local','model')),   -- DB-F1; null = no transcript
  version        int  not null default 1,                      -- optimistic concurrency
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists highlight_notes_highlight_idx on highlight_notes (highlight_id, visibility);
create index if not exists highlight_notes_profile_idx   on highlight_notes (profile_id);
grant select, insert, update, delete on highlight_notes to authenticated;          -- DB-F10

-- ── pipeline: trace a point, and whose result this is ───────────────────
alter table points        add column if not exists highlight_id     uuid references highlights(id) on delete set null;
alter table pipeline_runs add column if not exists owner_profile_id uuid references profiles(id)   on delete cascade;  -- DB-F9
create index if not exists points_highlight_idx    on points (highlight_id);
create index if not exists pipeline_runs_owner_idx on pipeline_runs (session_id, owner_profile_id);

-- ── helpers ─────────────────────────────────────────────────────────────
create or replace function can_lead_session(target_session uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sessions s
    join board_columns c on c.id = s.column_id
    join boards b        on b.id = c.board_id
    where s.id = target_session and is_team_leader(b.team_id));
$$;

-- a run the caller may write: their own, or the group's when they lead (D-03)
create or replace function can_own_run(p_session uuid, p_owner uuid) returns boolean
language sql stable as $$
  select can_access_session(p_session)
     and (p_owner = current_profile_id() or (p_owner is null and can_lead_session(p_session)));
$$;

create or replace function can_write_run(p_run uuid) returns boolean
language sql stable as $$
  select exists (select 1 from pipeline_runs r
                  where r.id = p_run and can_own_run(r.session_id, r.owner_profile_id));
$$;

-- ── highlights RLS ── ⚠️ NON-ADDITIVE: Full's policies are workspace-wide ──
drop policy if exists "artifact highlights"   on highlights;
drop policy if exists "highlight conclusions" on mini_conclusions;

drop policy if exists "private highlights" on highlights;
create policy "private highlights" on highlights for all
  using      (layer = 'individual' and profile_id = current_profile_id())
  with check (layer = 'individual' and profile_id = current_profile_id()
              and exists (select 1 from artifacts a                            -- DB-F4
                           where a.id = artifact_id and can_access_session(a.session_id)));

drop policy if exists "promoted highlights read" on highlights;
create policy "promoted highlights read" on highlights for select
  using (layer = 'individual' and shared_at is not null and exists (
    select 1 from artifacts a where a.id = artifact_id and can_access_session(a.session_id)));

drop policy if exists "group highlights read" on highlights;
create policy "group highlights read" on highlights for select
  using (layer = 'group' and exists (
    select 1 from artifacts a where a.id = artifact_id and can_access_session(a.session_id)));

drop policy if exists "leader writes group highlights" on highlights;
create policy "leader writes group highlights" on highlights for all
  using      (layer = 'group' and exists (
    select 1 from artifacts a where a.id = artifact_id and can_lead_session(a.session_id)))
  with check (layer = 'group' and exists (
    select 1 from artifacts a where a.id = artifact_id and can_lead_session(a.session_id)));

-- a mini-conclusion is visible only if its highlight is (write scope: DB-Q8)
create policy "highlight conclusions" on mini_conclusions for all using (exists (
  select 1 from highlights h join artifacts a on a.id = h.artifact_id
  where h.id = highlight_id
    and can_access_session(a.session_id)
    and (h.layer = 'group' or h.shared_at is not null or h.profile_id = current_profile_id())));

-- ── notes RLS ───────────────────────────────────────────────────────────
alter table highlight_notes enable row level security;

-- the highlights subquery is itself RLS-filtered: a group note is readable only on a highlight you can see
drop policy if exists "read notes" on highlight_notes;
create policy "read notes" on highlight_notes for select using (
  profile_id = current_profile_id()
  or (visibility = 'group' and exists (
        select 1 from highlights h join artifacts a on a.id = h.artifact_id
        where h.id = highlight_id and can_access_session(a.session_id))));

drop policy if exists "write own notes" on highlight_notes;
create policy "write own notes" on highlight_notes for all
  using      (profile_id = current_profile_id())
  with check (profile_id = current_profile_id() and exists (                  -- DB-F4
    select 1 from highlights h join artifacts a on a.id = h.artifact_id
     where h.id = highlight_id and can_access_session(a.session_id)));

-- ── memory: 0001 has only a select policy; the leader writes the minutes and the initial ideas (DB-Q10) ──
drop policy if exists "leader writes memory" on memory_entries;
create policy "leader writes memory" on memory_entries for all
  using      ((scope = 'group' and is_team_leader(team_id)) or (scope = 'initial' and can_lead_session(session_id)))
  with check ((scope = 'group' and is_team_leader(team_id)) or (scope = 'initial' and can_lead_session(session_id)));

-- ── results: individual runs are private (DB-F6); the requester's JWT writes them (DB-F7) ──
-- Permissive policies grant; restrictive ones narrow whatever 0001 grants and can never widen it.
drop policy if exists "runs readable by members" on pipeline_runs;
create policy "runs readable by members" on pipeline_runs for select
  using (can_access_session(session_id));
drop policy if exists "individual runs private" on pipeline_runs;
create policy "individual runs private" on pipeline_runs as restrictive for select
  using (owner_profile_id is null or owner_profile_id = current_profile_id());
drop policy if exists "runs written by owner or leader" on pipeline_runs;
create policy "runs written by owner or leader" on pipeline_runs for all
  using (can_own_run(session_id, owner_profile_id)) with check (can_own_run(session_id, owner_profile_id));
drop policy if exists "only owner or leader inserts runs" on pipeline_runs;
create policy "only owner or leader inserts runs" on pipeline_runs as restrictive for insert
  with check (can_own_run(session_id, owner_profile_id));
drop policy if exists "only owner or leader updates runs" on pipeline_runs;
create policy "only owner or leader updates runs" on pipeline_runs as restrictive for update
  using (can_own_run(session_id, owner_profile_id)) with check (can_own_run(session_id, owner_profile_id));
drop policy if exists "only owner or leader deletes runs" on pipeline_runs;
create policy "only owner or leader deletes runs" on pipeline_runs as restrictive for delete
  using (can_own_run(session_id, owner_profile_id));

-- children keyed by run_id: readable iff the run is (pipeline_runs is RLS-filtered inside exists).
-- 0001 grants every member `for all` on them ("run stages", "run points", ...), so writes are narrowed too
-- (task 001 verify, §11 DB-F11): only the run's owner, or the leader for a group run, may insert/update/delete.
do $$
declare t text;
begin
  foreach t in array array['pipeline_stages','points','run_renderings'] loop
    execute format('drop policy if exists "run visible" on %I', t);
    execute format('create policy "run visible" on %I for select
                      using (exists (select 1 from pipeline_runs r where r.id = run_id))', t);
    execute format('drop policy if exists "run private" on %I', t);
    execute format('create policy "run private" on %I as restrictive for select
                      using (exists (select 1 from pipeline_runs r where r.id = run_id))', t);
    execute format('drop policy if exists "run written by owner or leader" on %I', t);
    execute format('create policy "run written by owner or leader" on %I for all
                      using (can_write_run(run_id)) with check (can_write_run(run_id))', t);
    execute format('drop policy if exists "run insert guard" on %I', t);
    execute format('create policy "run insert guard" on %I as restrictive for insert
                      with check (can_write_run(run_id))', t);
    execute format('drop policy if exists "run update guard" on %I', t);
    execute format('create policy "run update guard" on %I as restrictive for update
                      using (can_write_run(run_id)) with check (can_write_run(run_id))', t);
    execute format('drop policy if exists "run delete guard" on %I', t);
    execute format('create policy "run delete guard" on %I as restrictive for delete
                      using (can_write_run(run_id))', t);
  end loop;
end $$;

drop policy if exists "run visible" on point_conclusions;
create policy "run visible" on point_conclusions for select
  using (exists (select 1 from points p where p.id = point_id));
drop policy if exists "run private" on point_conclusions;
create policy "run private" on point_conclusions as restrictive for select
  using (exists (select 1 from points p where p.id = point_id));
drop policy if exists "run written by owner or leader" on point_conclusions;
create policy "run written by owner or leader" on point_conclusions for all
  using      (can_write_run((select p.run_id from points p where p.id = point_id)))
  with check (can_write_run((select p.run_id from points p where p.id = point_id)));
drop policy if exists "run insert guard" on point_conclusions;
create policy "run insert guard" on point_conclusions as restrictive for insert
  with check (can_write_run((select p.run_id from points p where p.id = point_id)));
drop policy if exists "run update guard" on point_conclusions;
create policy "run update guard" on point_conclusions as restrictive for update
  using      (can_write_run((select p.run_id from points p where p.id = point_id)))
  with check (can_write_run((select p.run_id from points p where p.id = point_id)));
drop policy if exists "run delete guard" on point_conclusions;
create policy "run delete guard" on point_conclusions as restrictive for delete
  using (can_write_run((select p.run_id from points p where p.id = point_id)));

-- ── promotion: atomic over highlight + note (RULE-05) ───────────────────
create or replace function promote_highlight(p_highlight uuid, p_note uuid default null)
returns highlights
language plpgsql security invoker as $$        -- invoker: RLS still guards it
declare h highlights;
begin
  update highlights set shared_at = now(), updated_at = now()
   where id = p_highlight
     and profile_id = current_profile_id()
     and layer = 'individual'
   returning * into h;
  if not found then raise exception 'not yours to share'; end if;

  update highlight_notes
     set visibility = 'group', updated_at = now(), version = version + 1
   where highlight_id = p_highlight
     and profile_id = current_profile_id()
     and (p_note is null or id = p_note);

  -- re-fire the broadcast so an existing mini-conclusion reaches ws:{sessionId} (DB-F5)
  update mini_conclusions set content = content where highlight_id = p_highlight;
  return h;
end $$;

-- ── workspace RPCs: teams and team_members are select-only for clients (0001), so these run as definer ──
-- create_workspace (DB-Q6): team + leader + board + column + session in one transaction; returns the session id.
create or replace function create_workspace(p_name text, p_title text, p_goal text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := current_profile_id(); t uuid := gen_random_uuid(); b uuid; c uuid; s uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  insert into teams (id, name, slug, created_by)
    values (t, p_name, trim(both '-' from lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || left(t::text, 8), me);
  insert into team_members (team_id, profile_id, role) values (t, me, 'leader');
  insert into boards (team_id, name) values (t, p_name) returning id into b;
  insert into board_columns (board_id, name) values (b, 'Workspace') returning id into c;
  insert into sessions (column_id, title, initial_question, internet_ratio, created_by)
    values (c, p_title, p_goal, 0, me) returning id into s;             -- 0.00: no RAG in Lite
  return s;
end $$;

-- transfer_leadership (D-09): the current leader hands the role to an existing member.
create or replace function transfer_leadership(p_team uuid, p_to_profile uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_team_leader(p_team) then raise exception 'only the leader can transfer leadership'; end if;
  if not exists (select 1 from team_members where team_id = p_team and profile_id = p_to_profile) then
    raise exception 'the new leader must already be a member';
  end if;
  update team_members set role = 'member' where team_id = p_team and role = 'leader';        -- demote first,
  update team_members set role = 'leader' where team_id = p_team and profile_id = p_to_profile; -- one leader
end $$;

-- ── touch triggers (reconnect reconciliation depends on updated_at) ─────
create or replace function tb_touch() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create or replace trigger highlights_touch      before update on highlights
  for each row execute function tb_touch();
create or replace trigger highlight_notes_touch before update on highlight_notes
  for each row execute function tb_touch();

-- ── realtime: topic chosen per row (RULE-03) ────────────────────────────
-- A row goes to ws:{sessionId} only when the workspace may read it, else to user:{profileId}.
-- sid is null once the parent is gone (cascade delete): skip, never broadcast to a NULL topic (F4);
-- reconcile catches the delete.
create or replace function tb_broadcast_highlight() returns trigger
language plpgsql security definer set search_path = public as $$
declare r highlights; sid uuid; is_public boolean;
begin
  r := coalesce(new, old);
  select a.session_id into sid from artifacts a where a.id = r.artifact_id;
  if sid is null then return null; end if;
  is_public := r.layer = 'group' or r.shared_at is not null;
  perform realtime.broadcast_changes(
    case when is_public then 'ws:' || sid::text else 'user:' || r.profile_id::text end,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  if tg_op = 'UPDATE' and not is_public
     and (old.layer = 'group' or old.shared_at is not null) then            -- DB-F8: unshared
    perform realtime.broadcast_changes('ws:' || sid::text, 'RETRACT', 'DELETE',
      tg_table_name, tg_table_schema, null, old);
  end if;
  return null;
end $$;

create or replace function tb_broadcast_note() returns trigger
language plpgsql security definer set search_path = public as $$
declare r highlight_notes; h highlights; sid uuid; h_public boolean; is_public boolean;
begin
  r := coalesce(new, old);
  select * into h from highlights where id = r.highlight_id;
  select a.session_id into sid from artifacts a where a.id = h.artifact_id;
  if sid is null then return null; end if;
  h_public  := h.layer = 'group' or h.shared_at is not null;
  is_public := r.visibility = 'group' and h_public;            -- mirrors "read notes" (RULE-03)
  perform realtime.broadcast_changes(
    case when is_public then 'ws:' || sid::text else 'user:' || r.profile_id::text end,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  if tg_op = 'UPDATE' and not is_public and old.visibility = 'group' and h_public then   -- DB-F8
    perform realtime.broadcast_changes('ws:' || sid::text, 'RETRACT', 'DELETE',
      tg_table_name, tg_table_schema, null, old);
  end if;
  return null;
end $$;

create or replace function tb_broadcast_mini_conclusion() returns trigger       -- DB-F5
language plpgsql security definer set search_path = public as $$
declare r mini_conclusions; h highlights; sid uuid;
begin
  r := coalesce(new, old);
  select * into h from highlights where id = r.highlight_id;
  select a.session_id into sid from artifacts a where a.id = h.artifact_id;
  if sid is null then return null; end if;
  perform realtime.broadcast_changes(
    case when h.layer = 'group' or h.shared_at is not null
         then 'ws:' || sid::text else 'user:' || h.profile_id::text end,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  return null;
end $$;

create or replace function tb_broadcast_run() returns trigger                   -- DB-F5
language plpgsql security definer set search_path = public as $$
declare r pipeline_runs;
begin
  r := coalesce(new, old);
  if r.session_id is null then return null; end if;
  perform realtime.broadcast_changes(
    case when r.owner_profile_id is null
         then 'ws:' || r.session_id::text else 'user:' || r.owner_profile_id::text end,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  return null;
end $$;

create or replace trigger highlights_broadcast       after insert or update or delete on highlights
  for each row execute function tb_broadcast_highlight();
create or replace trigger highlight_notes_broadcast  after insert or update or delete on highlight_notes
  for each row execute function tb_broadcast_note();
create or replace trigger mini_conclusions_broadcast after insert or update or delete on mini_conclusions
  for each row execute function tb_broadcast_mini_conclusion();
create or replace trigger pipeline_runs_broadcast    after insert or update or delete on pipeline_runs
  for each row execute function tb_broadcast_run();

-- ── realtime authorization: both topics (client-sent traffic: DB-Q9) ────
drop policy if exists "members listen to their workspace" on realtime.messages;
create policy "members listen to their workspace" on realtime.messages
  for select to authenticated using (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from sessions s
      join board_columns c on c.id = s.column_id
      join boards b        on b.id = c.board_id
      where realtime.topic() = 'ws:' || s.id::text
        and is_team_member(b.team_id)));

drop policy if exists "listen to own device topic" on realtime.messages;
create policy "listen to own device topic" on realtime.messages
  for select to authenticated using (
    realtime.messages.extension = 'broadcast'
    and realtime.topic() = 'user:' || current_profile_id()::text);

-- ── misc ────────────────────────────────────────────────────────────────
drop policy if exists "own llm usage insert" on llm_requests;
create policy "own llm usage insert" on llm_requests for insert
  with check (profile_id = current_profile_id());

create unique index if not exists user_personas_one_active_per_owner
  on user_personas (owner_profile_id) where is_active and owner_profile_id is not null;
