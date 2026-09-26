-- RLS + broadcast-routing proof for 0004_lite.sql (task 002). Run: npm test  (see rls.test.mjs)
-- One transaction, rolled back. Every check runs as the `authenticated` role with a JWT `sub`, never as postgres.
-- Realtime: what 0004 owns is which topic a row is routed to and who may read that topic (the real
-- realtime.messages policy, with realtime.topic set as the server sets it). Socket delivery is Realtime's job.
-- ponytail: if a delivery bug ever slips past this, add one supabase-js socket test for g5.
begin;

create schema tb_test;
grant usage on schema tb_test to authenticated;
create table tb_test.ctx (k text primary key, v uuid);
create table tb_test.results (n serial, name text, ok boolean);
grant select on tb_test.ctx to authenticated;

create function tb_test.g(k text) returns uuid language sql stable as $$ select v from tb_test.ctx where ctx.k = $1 $$;
create function tb_test.stash(k text, v uuid) returns void language sql security definer as $$ insert into tb_test.ctx values ($1, $2) $$;
create function tb_test.ok(name text, cond boolean) returns void language sql security definer as $$ insert into tb_test.results (name, ok) values ($1, coalesce($2, false)) $$;
create function tb_test.p(k text) returns uuid language sql stable security definer set search_path = public as $$
  select profile_id from profile_identities where auth_user_id = tb_test.g('u' || $1) $$;

create function tb_test.root() returns void language plpgsql as $$ begin execute 'reset role'; end $$;
create function tb_test.anon() returns void language plpgsql as $$
begin
  execute 'reset role'; execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
end $$;
create function tb_test.be(k text) returns void language plpgsql as $$
begin
  execute 'reset role'; execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', tb_test.g('u' || k), 'role', 'authenticated')::text, true);
end $$;
-- rows affected by stmt; -1 on an RLS/privilege error. "denied" = <= 0, "allowed" = > 0.
create function tb_test.run(stmt text) returns int language plpgsql as $$
declare n int;
begin execute stmt; get diagnostics n = row_count; return n;
exception when insufficient_privilege then return -1; end $$;
create function tb_test.errs(stmt text) returns boolean language plpgsql as $$
begin execute stmt; return false; exception when others then return true; end $$;
-- a highlight of the current user on the fixture artifact; the id is stashed under `key`
create function tb_test.hl(key text, lyr text default 'individual') returns void language plpgsql as $$
declare i uuid;
begin
  insert into highlights (artifact_id, profile_id, page, text, layer)
    values (tb_test.g('art'), current_profile_id(), 1, key, lyr::highlight_layer) returning id into i;
  perform tb_test.stash(key, i);
end $$;
-- topic/event pairs a row of `tbl` was routed to (call as root)
create function tb_test.msgs(tbl text, id uuid) returns text[] language sql stable as $$
  select coalesce(array_agg(distinct topic || ' ' || event order by topic || ' ' || event), '{}') from realtime.messages
   where payload->>'table' = $1 and coalesce(payload->'record'->>'id', payload->'old_record'->>'id') = $2::text $$;
-- how many messages the current user may read on `topic` (realtime.topic is what Realtime sets on join)
create function tb_test.can_read(topic text) returns bigint language plpgsql as $$
begin perform set_config('realtime.topic', topic, true); return (select count(*) from realtime.messages where realtime.messages.topic = $1); end $$;

-- g17 runs the harness itself as anon, so anon needs USAGE on this schema and EXECUTE on the helpers.
grant usage on schema tb_test to anon;
grant execute on all functions in schema tb_test to anon;

-- ═══ g1 · fixture: leader L, members A and B, outsider X ═══
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'l@t.test', '{}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'a@t.test', '{}', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'b@t.test', '{}', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'x@t.test', '{}', 'authenticated', 'authenticated');
select tb_test.stash('uL', '11111111-1111-1111-1111-111111111111'), tb_test.stash('uA', '22222222-2222-2222-2222-222222222222'),
       tb_test.stash('uB', '33333333-3333-3333-3333-333333333333'), tb_test.stash('uX', '44444444-4444-4444-4444-444444444444');
select tb_test.be('L');
select tb_test.stash('sid', create_workspace('Pilot', 'Cost review', 'What does the report conclude?'));
select tb_test.root();
insert into tb_test.ctx select 'team', b.team_id from sessions s join board_columns c on c.id = s.column_id join boards b on b.id = c.board_id where s.id = tb_test.g('sid');
insert into team_members (team_id, profile_id, role) values (tb_test.g('team'), tb_test.p('A'), 'member'), (tb_test.g('team'), tb_test.p('B'), 'member');
insert into artifacts (session_id, kind) values (tb_test.g('sid'), 'pdf');
insert into tb_test.ctx select 'art', id from artifacts where session_id = tb_test.g('sid');
select tb_test.ok('g1 four profiles exist', (select count(*) from profile_identities where auth_user_id in (tb_test.g('uL'), tb_test.g('uA'), tb_test.g('uB'), tb_test.g('uX'))) = 4);
select tb_test.ok('g1 one workspace: L leads, A and B are members',
  (select array_agg(profile_id order by role) from team_members where team_id = tb_test.g('team') and role = 'leader') = array[tb_test.p('L')]
  and (select count(*) from team_members where team_id = tb_test.g('team')) = 3);
select tb_test.be('A');
select tb_test.ok('g1 checks run as authenticated, not postgres', current_user = 'authenticated' and current_profile_id() = tb_test.p('A'));

-- A's material: three highlights, notes, mini conclusions
select tb_test.hl('hA'), tb_test.hl('hP'), tb_test.hl('hR');
with n as (insert into highlight_notes (highlight_id, profile_id, content) values (tb_test.g('hP'), current_profile_id(), 'note on hP') returning id) select tb_test.stash('nP', id) from n;
with n as (insert into highlight_notes (highlight_id, profile_id, content, visibility) values (tb_test.g('hA'), current_profile_id(), 'group note on a private highlight', 'group') returning id) select tb_test.stash('nG', id) from n;
with m as (insert into mini_conclusions (highlight_id, content) values (tb_test.g('hA'), 'mc A') returning id) select tb_test.stash('mcA', id) from m;
with m as (insert into mini_conclusions (highlight_id, content) values (tb_test.g('hP'), 'mc P') returning id) select tb_test.stash('mcP', id) from m;

-- ═══ g2 · B cannot select A's private highlight ═══
select tb_test.ok('g2 A sees their own private highlight', (select count(*) from highlights where id = tb_test.g('hA')) = 1);
select tb_test.be('B');
select tb_test.ok('g2 B cannot select A''s private highlight', (select count(*) from highlights where id = tb_test.g('hA')) = 0);
-- ═══ g3 · nor its mini-conclusion ═══
select tb_test.ok('g3 B cannot select the mini_conclusion of a private highlight', (select count(*) from mini_conclusions where id = tb_test.g('mcA')) = 0);
select tb_test.be('A');
select tb_test.ok('g3 A sees it', (select count(*) from mini_conclusions where id = tb_test.g('mcA')) = 1);
-- ═══ g4 · group layer is leader-write ═══
select tb_test.be('B');
select tb_test.ok('g4 B cannot insert layer=group', tb_test.run(format($q$insert into highlights (artifact_id, profile_id, page, text, layer) values (%L, %L, 1, 'x', 'group')$q$, tb_test.g('art'), tb_test.p('B'))) <= 0);
select tb_test.ok('g4 B cannot insert as A', tb_test.run(format($q$insert into highlights (artifact_id, profile_id, page, text) values (%L, %L, 1, 'x')$q$, tb_test.g('art'), tb_test.p('A'))) <= 0);
select tb_test.be('L');
select tb_test.ok('g4 the leader can insert layer=group', tb_test.run(format($q$insert into highlights (artifact_id, profile_id, page, text, layer) values (%L, %L, 1, 'x', 'group')$q$, tb_test.g('art'), tb_test.p('L'))) = 1);

-- ═══ g6 · promotion is atomic and only the author's ═══
select tb_test.be('B');
select tb_test.ok('g6 B cannot promote A''s highlight', tb_test.errs(format('select promote_highlight(%L)', tb_test.g('hA'))));
select tb_test.be('A');
select promote_highlight(tb_test.g('hP'), tb_test.g('nP'));
select tb_test.root();
select tb_test.ok('g6 one call flips the highlight and its note',
  (select shared_at is not null from highlights where id = tb_test.g('hP')) and (select visibility = 'group' from highlight_notes where id = tb_test.g('nP')));
select tb_test.ok('g6 the refused call changed nothing', (select shared_at is null from highlights where id = tb_test.g('hA')));
select tb_test.be('B');
select tb_test.ok('g6 B now sees the promoted highlight and note, still not the private one',
  (select count(*) from highlights where id = tb_test.g('hP')) = 1 and (select count(*) from highlight_notes where id = tb_test.g('nP')) = 1
  and (select count(*) from highlights where id = tb_test.g('hA')) = 0);

-- ═══ g5 · routing: promoted -> ws:, private -> user:{A} only; B may listen on ws: and not on user:{A} ═══
select tb_test.root();
select tb_test.ok('g5 private highlight is routed to user:{A} only', tb_test.msgs('highlights', tb_test.g('hA')) = array['user:' || tb_test.p('A') || ' INSERT']);
select tb_test.ok('g5 promoted highlight reaches ws:{session}', 'ws:' || tb_test.g('sid') || ' UPDATE' = any (tb_test.msgs('highlights', tb_test.g('hP'))));
select tb_test.ok('g5 the user:{A} topic has messages (so the next check is not vacuous)', (select count(*) from realtime.messages where topic = 'user:' || tb_test.p('A')) > 0);
select tb_test.be('B');
select tb_test.ok('g5 B is authorized to listen on ws:{session}', tb_test.can_read('ws:' || tb_test.g('sid')) > 0);
select tb_test.ok('g5 B cannot listen on user:{A}', tb_test.can_read('user:' || tb_test.p('A')) = 0);
select tb_test.be('X');
select tb_test.ok('g5 an outsider cannot listen on ws:{session}', tb_test.can_read('ws:' || tb_test.g('sid')) = 0);
select tb_test.be('A');
select tb_test.ok('g5 A''s other devices can listen on user:{A}', tb_test.can_read('user:' || tb_test.p('A')) > 0);

-- ═══ g10 · unsharing: B is told (RETRACT on ws:), A's other devices keep the row ═══
select tb_test.root();
select tb_test.ok('g10 before unsharing: no RETRACT for hR', 'ws:' || tb_test.g('sid') || ' RETRACT' <> all (tb_test.msgs('highlights', tb_test.g('hR'))));
select tb_test.be('A');
select promote_highlight(tb_test.g('hR'));
update highlights set shared_at = null where id = tb_test.g('hR');
select tb_test.root();
select tb_test.ok('g10 unsharing sends RETRACT on ws:{session}', 'ws:' || tb_test.g('sid') || ' RETRACT' = any (tb_test.msgs('highlights', tb_test.g('hR'))));
select tb_test.ok('g10 and the row update goes to user:{A}', 'user:' || tb_test.p('A') || ' UPDATE' = any (tb_test.msgs('highlights', tb_test.g('hR'))));
select tb_test.be('B');
select tb_test.ok('g10 B can read the RETRACT and no longer sees the row', tb_test.can_read('ws:' || tb_test.g('sid')) > 0 and (select count(*) from highlights where id = tb_test.g('hR')) = 0);

-- ═══ g11 · a group-visibility note on a private highlight stays off ws: and is invisible (DB-Q7) ═══
select tb_test.root();
select tb_test.ok('g11 the note is routed to user:{A} only', tb_test.msgs('highlight_notes', tb_test.g('nG')) = array['user:' || tb_test.p('A') || ' INSERT']);
select tb_test.be('B');
select tb_test.ok('g11 B cannot select it', (select count(*) from highlight_notes where id = tb_test.g('nG')) = 0);

-- ═══ g12 · mini_conclusions follow their highlight ═══
select tb_test.root();
select tb_test.ok('g12 a private highlight''s mini_conclusion goes to user:{A} only', tb_test.msgs('mini_conclusions', tb_test.g('mcA')) = array['user:' || tb_test.p('A') || ' INSERT']);
select tb_test.ok('g12 a promoted one is re-fired to ws:{session}', tb_test.msgs('mini_conclusions', tb_test.g('mcP')) = array['user:' || tb_test.p('A') || ' INSERT', 'ws:' || tb_test.g('sid') || ' UPDATE']);

-- ═══ g7 · a removed member keeps their ids but cannot write ═══
delete from team_members where team_id = tb_test.g('team') and profile_id = tb_test.p('A');
select tb_test.be('A');
select tb_test.ok('g7 removed A cannot insert a highlight', tb_test.run(format($q$insert into highlights (artifact_id, profile_id, page, text) values (%L, %L, 1, 'x')$q$, tb_test.g('art'), tb_test.p('A'))) <= 0);
select tb_test.ok('g7 removed A cannot insert a note', tb_test.run(format($q$insert into highlight_notes (highlight_id, profile_id, content) values (%L, %L, 'x')$q$, tb_test.g('hP'), tb_test.p('A'))) <= 0);
select tb_test.root();
insert into team_members (team_id, profile_id, role) values (tb_test.g('team'), tb_test.p('A'), 'member');

-- ═══ results fixture: an individual run of A and a group run, each with one of every child ═══
insert into pipeline_runs (session_id, owner_profile_id) values (tb_test.g('sid'), tb_test.p('A'));
insert into tb_test.ctx select 'rA', id from pipeline_runs where owner_profile_id = tb_test.p('A');
insert into pipeline_runs (session_id, owner_profile_id) values (tb_test.g('sid'), null);
insert into tb_test.ctx select 'rG', id from pipeline_runs where owner_profile_id is null;
insert into pipeline_stages (run_id, stage) select v, 'scope_anchor' from tb_test.ctx where k in ('rA', 'rG');
insert into points (run_id, content) select v, 'point' from tb_test.ctx where k in ('rA', 'rG');
insert into tb_test.ctx select 'ptA', id from points where run_id = tb_test.g('rA');
insert into tb_test.ctx select 'ptG', id from points where run_id = tb_test.g('rG');
insert into point_conclusions (point_id, conclusion, temperature) select v, 'c', 0.5 from tb_test.ctx where k in ('ptA', 'ptG');
insert into run_renderings (run_id, mode, content_md) select v, 'descriptive', 'md' from tb_test.ctx where k in ('rA', 'rG');

-- ═══ g8 · an individual run and everything under it is private ═══
select tb_test.be('B');
select tb_test.ok('g8 B cannot select A''s individual run, its stages, points, conclusions or renderings',
  (select count(*) from pipeline_runs where id = tb_test.g('rA')) = 0 and (select count(*) from pipeline_stages where run_id = tb_test.g('rA')) = 0
  and (select count(*) from points where run_id = tb_test.g('rA')) = 0 and (select count(*) from point_conclusions where point_id = tb_test.g('ptA')) = 0
  and (select count(*) from run_renderings where run_id = tb_test.g('rA')) = 0);
select tb_test.ok('g8 B does see the group run and its children',
  (select count(*) from pipeline_runs where id = tb_test.g('rG')) = 1 and (select count(*) from points where run_id = tb_test.g('rG')) = 1
  and (select count(*) from run_renderings where run_id = tb_test.g('rG')) = 1);
select tb_test.be('A');
select tb_test.ok('g8 A sees their own run and all its children',
  (select count(*) from pipeline_runs where id = tb_test.g('rA')) = 1 and (select count(*) from pipeline_stages where run_id = tb_test.g('rA')) = 1
  and (select count(*) from points where run_id = tb_test.g('rA')) = 1 and (select count(*) from point_conclusions where point_id = tb_test.g('ptA')) = 1
  and (select count(*) from run_renderings where run_id = tb_test.g('rA')) = 1);

-- ═══ g9 · who may insert which run ═══
select tb_test.be('B');
select tb_test.ok('g9 B cannot insert a group run', tb_test.run(format('insert into pipeline_runs (session_id, owner_profile_id) values (%L, null)', tb_test.g('sid'))) <= 0);
select tb_test.ok('g9 B cannot insert a run owned by A', tb_test.run(format('insert into pipeline_runs (session_id, owner_profile_id) values (%L, %L)', tb_test.g('sid'), tb_test.p('A'))) <= 0);
select tb_test.be('A');
select tb_test.ok('g9 A cannot insert a group run', tb_test.run(format('insert into pipeline_runs (session_id, owner_profile_id) values (%L, null)', tb_test.g('sid'))) <= 0);
select tb_test.ok('g9 A can insert their own run', tb_test.run(format('insert into pipeline_runs (session_id, owner_profile_id) values (%L, %L)', tb_test.g('sid'), tb_test.p('A'))) = 1);
select tb_test.be('L');
select tb_test.ok('g9 the leader can insert a group run', tb_test.run(format('insert into pipeline_runs (session_id, owner_profile_id) values (%L, null)', tb_test.g('sid'))) = 1);

-- ═══ g14 · run children are write-guarded too (DB-F11) ═══
select tb_test.be('B');
select tb_test.ok('g14 B cannot write the children of a group run',
  tb_test.run(format($q$insert into points (run_id, content) values (%L, 'x')$q$, tb_test.g('rG'))) <= 0
  and tb_test.run(format('update points set content = ''z'' where run_id = %L', tb_test.g('rG'))) <= 0
  and tb_test.run(format('delete from points where run_id = %L', tb_test.g('rG'))) <= 0
  and tb_test.run(format($q$insert into pipeline_stages (run_id, stage) values (%L, 'analytic')$q$, tb_test.g('rG'))) <= 0
  and tb_test.run(format('update pipeline_stages set error = ''z'' where run_id = %L', tb_test.g('rG'))) <= 0
  and tb_test.run(format('delete from pipeline_stages where run_id = %L', tb_test.g('rG'))) <= 0
  and tb_test.run(format($q$insert into run_renderings (run_id, mode, content_md) values (%L, 'planning', 'x')$q$, tb_test.g('rG'))) <= 0
  and tb_test.run(format('update run_renderings set content_md = ''z'' where run_id = %L', tb_test.g('rG'))) <= 0
  and tb_test.run(format('delete from run_renderings where run_id = %L', tb_test.g('rG'))) <= 0
  and tb_test.run(format($q$insert into point_conclusions (point_id, conclusion, temperature) values (%L, 'x', 0.1)$q$, tb_test.g('ptG'))) <= 0
  and tb_test.run(format('update point_conclusions set conclusion = ''z'' where point_id = %L', tb_test.g('ptG'))) <= 0
  and tb_test.run(format('delete from point_conclusions where point_id = %L', tb_test.g('ptG'))) <= 0);
select tb_test.ok('g14 B cannot delete the group run', tb_test.run(format('delete from pipeline_runs where id = %L', tb_test.g('rG'))) <= 0);
select tb_test.be('A');
select tb_test.ok('g14 a member who is not the leader cannot add to a group run', tb_test.run(format($q$insert into points (run_id, content) values (%L, 'x')$q$, tb_test.g('rG'))) <= 0);
select tb_test.ok('g14 the owner can write their own run''s children',
  tb_test.run(format($q$insert into points (run_id, content) values (%L, 'x')$q$, tb_test.g('rA'))) = 1
  and tb_test.run(format('update run_renderings set content_md = ''z'' where run_id = %L', tb_test.g('rA'))) = 1
  and tb_test.run(format('update point_conclusions set conclusion = ''z'' where point_id = %L', tb_test.g('ptA'))) = 1
  and tb_test.run(format('delete from pipeline_stages where run_id = %L', tb_test.g('rA'))) = 1);
select tb_test.ok('g14 the owner can delete their own run', tb_test.run(format('delete from pipeline_runs where id = %L', tb_test.g('rA'))) = 1);
select tb_test.be('L');
select tb_test.ok('g14 the leader can write a group run''s children',
  tb_test.run(format($q$insert into points (run_id, content) values (%L, 'x')$q$, tb_test.g('rG'))) = 1
  and tb_test.run(format('update run_renderings set content_md = ''z'' where run_id = %L', tb_test.g('rG'))) = 1
  and tb_test.run(format('update point_conclusions set conclusion = ''z'' where point_id = %L', tb_test.g('ptG'))) = 1
  and tb_test.run(format('delete from pipeline_stages where run_id = %L', tb_test.g('rG'))) = 1);
select tb_test.ok('g14 the leader can delete the group run', tb_test.run(format('delete from pipeline_runs where id = %L', tb_test.g('rG'))) = 1);

-- ═══ g15 · memory: only the leader writes group and initial scope (DB-F12) ═══
select tb_test.be('A');
select tb_test.ok('g15 a member cannot write group or initial memory',
  tb_test.run(format($q$insert into memory_entries (scope, team_id, content) values ('group', %L, 'x')$q$, tb_test.g('team'))) <= 0
  and tb_test.run(format($q$insert into memory_entries (scope, session_id, content) values ('initial', %L, 'x')$q$, tb_test.g('sid'))) <= 0);
select tb_test.be('L');
select tb_test.ok('g15 the leader can write both',
  tb_test.run(format($q$insert into memory_entries (scope, team_id, content) values ('group', %L, 'minutes')$q$, tb_test.g('team'))) = 1
  and tb_test.run(format($q$insert into memory_entries (scope, session_id, content) values ('initial', %L, 'idea')$q$, tb_test.g('sid'))) = 1);
select tb_test.be('A');
select tb_test.ok('g15 members read the group minutes', (select count(*) from memory_entries where scope = 'group' and team_id = tb_test.g('team')) = 1);

-- ═══ g16 · workspace RPCs (DB-F13) ═══
select tb_test.be('X');
select tb_test.stash('sidX', create_workspace('Other', 'Other', 'goal'));
select tb_test.root();
insert into tb_test.ctx select 'teamX', b.team_id from sessions s join board_columns c on c.id = s.column_id join boards b on b.id = c.board_id where s.id = tb_test.g('sidX');
select tb_test.ok('g16 the creator is the one leader of the new team', (select array_agg(profile_id) from team_members where team_id = tb_test.g('teamX') and role = 'leader') = array[tb_test.p('X')]);
select tb_test.be('A');
select tb_test.ok('g16 another workspace''s team is invisible', (select count(*) from teams where id = tb_test.g('teamX')) = 0);
select tb_test.ok('g16 a non-leader cannot transfer leadership', tb_test.errs(format('select transfer_leadership(%L, %L)', tb_test.g('team'), tb_test.p('B'))));
select tb_test.be('L');
select tb_test.ok('g16 the target must already be a member', tb_test.errs(format('select transfer_leadership(%L, %L)', tb_test.g('team'), tb_test.p('X'))));
select transfer_leadership(tb_test.g('team'), tb_test.p('A'));
select tb_test.root();
select tb_test.ok('g16 after a transfer there is exactly one leader, the new one',
  (select array_agg(profile_id) from team_members where team_id = tb_test.g('team') and role = 'leader') = array[tb_test.p('A')]
  and (select role from team_members where team_id = tb_test.g('team') and profile_id = tb_test.p('L')) = 'member');
select tb_test.be('L');
select tb_test.ok('g16 the former leader can no longer transfer', tb_test.errs(format('select transfer_leadership(%L, %L)', tb_test.g('team'), tb_test.p('B'))));
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
select tb_test.ok('g16 an unknown user cannot create a workspace', tb_test.errs('select create_workspace(''n'', ''t'', ''g'')'));

-- ═══ g17 · housekeeping: anon cannot call the definer RPCs (0007_revoke_anon_execute) ═══
select tb_test.anon();
select tb_test.ok('g17 anon cannot execute create_workspace', tb_test.errs('select create_workspace(''n'', ''t'', ''g'')'));
select tb_test.be('L');
select tb_test.ok('g17 authenticated can still execute create_workspace', (select create_workspace('Keep', 'Keep', 'g') is not null));

-- ═══ g18 · housekeeping: teammates read each other's profile, outsiders do not (0008_team_profile_names) ═══
select tb_test.be('B');
select tb_test.ok('g18 a teammate can read a co-member''s profile', (select count(*) from profiles where id = tb_test.p('A')) = 1);
select tb_test.ok('g18 B still cannot read an outsider''s profile', (select count(*) from profiles where id = tb_test.p('X')) = 0);
select tb_test.be('X');
select tb_test.ok('g18 an outsider cannot read a member''s profile', (select count(*) from profiles where id = tb_test.p('A')) = 0);

-- ═══ report ═══
select tb_test.root();
select case when ok then 'ok   ' else 'FAIL ' end || name from tb_test.results order by n;
do $$ begin if exists (select 1 from tb_test.results where not ok) then raise exception '% check(s) failed', (select count(*) from tb_test.results where not ok); end if; end $$;
rollback;
