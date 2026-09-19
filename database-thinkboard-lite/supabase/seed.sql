-- ThinkBoard Lite — local dev seed (task 003 g2). Runs after the migrations on `supabase db reset`.
-- One team, one leader, two members, one board / column / session, one pdf artifact (D-02: one `main` PDF).
-- Local stack only. The users share the dev password below; it is a password on a throwaway local database, not a key.
-- The PDF bytes are uploaded afterwards by seed/upload-pdf.mjs (npm run db:seed), signed in as the leader.
-- g3 (llm_providers / llm_models) is deliberately absent: D-12 is unanswered.

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change, email_change_token_new)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
       extensions.crypt('password', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.name), now(), now(),
       '', '', '', ''
from (values
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'leader@thinkboard.test', 'Leader'),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'member-a@thinkboard.test', 'Member A'),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 'member-b@thinkboard.test', 'Member B')
) as u(id, email, name);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from auth.users where email like '%@thinkboard.test';

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
    where auth_user_id in ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a3');
  insert into artifacts (session_id, kind, slot, title, created_by)
    values (s, 'pdf', 'main', 'Placeholder report', current_profile_id());
end $$;
