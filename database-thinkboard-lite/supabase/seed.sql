-- ThinkBoard Lite — local dev seed (task 003 g2). Runs after the migrations on `supabase db reset`.
-- One team, one leader, three members (one of them `admin@gmail.com`, the owner's mock login), one board / column /
-- session, one pdf artifact (D-02: one `main` PDF).
-- Local stack only. The users share the dev password below; it is a password on a throwaway local database, not a key.
-- The PDF bytes are uploaded afterwards by seed/upload-pdf.mjs (npm run db:seed), signed in as the leader.
-- g3 (llm_providers / llm_models) is PLACEHOLDER rows only, see the end of this file: D-12 is still unanswered.

-- Guard: this seed creates users with a known password, so it runs only on an EMPTY database. A remote project
-- (`db reset --linked`, `db push --include-seed`) already has users and stops here.
do $$ begin
  if exists (select 1 from auth.users) then raise exception 'seed.sql is for an empty local database only'; end if;
end $$;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change, email_change_token_new)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
       extensions.crypt('password', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.name), now(), now(),
       '', '', '', ''
from (values
  ('00000000-0000-4000-8000-0000000000a0'::uuid, 'admin@gmail.com', 'Admin'),
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'leader@thinkboard.test', 'Leader'),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'member-a@thinkboard.test', 'Member A'),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 'member-b@thinkboard.test', 'Member B')
) as u(id, email, name);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from auth.users where email like '%@thinkboard.test' or email = 'admin@gmail.com';

do $$
declare s uuid; t uuid;
begin
  -- act as the leader: create_workspace() takes the caller from the JWT and makes them the one leader
  perform set_config('request.jwt.claims',
    json_build_object('sub', '00000000-0000-4000-8000-0000000000a1', 'role', 'authenticated')::text, true);
  s := create_workspace('ThinkBoard Pilot', 'Placeholder report review', 'What does the placeholder report conclude?');
  select b.team_id into t from sessions x join board_columns c on c.id = x.column_id join boards b on b.id = c.board_id where x.id = s;
  -- clients cannot add team members (team_members is read-only to them), so the seed does, as postgres
  insert into team_members (team_id, profile_id, role)
    select t, profile_id, 'member' from profile_identities
    where auth_user_id in ('00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a3');
  insert into artifacts (session_id, kind, slot, title, created_by)
    values (s, 'pdf', 'main', 'Placeholder report', current_profile_id());
end $$;

-- g3: PLACEHOLDER providers so the settings dropdown has entries. D-12 (free-tier training terms vs document
-- sensitivity) is still unanswered, and the owner ruled on 2026-09-19 that these must not imply a provider choice:
-- no real provider is named, none is active, none holds a key, and the host is a reserved non-routable one
-- (RFC 2606 .invalid). Task 018 replaces them once D-12 is answered.
insert into llm_providers (key, label, base_url, is_active) values
  ('placeholder-a', 'Placeholder provider A (D-12 pending)', 'https://placeholder.invalid', false),
  ('placeholder-b', 'Placeholder provider B (D-12 pending)', 'https://placeholder.invalid', false);
insert into llm_models (provider_id, model_key, label, is_active)
  select id, 'placeholder-model', 'Placeholder model (D-12 pending)', false from llm_providers;
