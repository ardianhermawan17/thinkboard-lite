-- 0007_revoke_anon_execute.sql — housekeeping (task review §3.5 / README §6).
--
-- The definer RPCs (create_workspace, transfer_leadership, promote_highlight) and the policy helpers
-- (current_profile_id, is_team_member, is_team_leader, can_access_session, can_lead_session, ...) run as their
-- owner, so an EXECUTE grant is a front door that must not be open to an unauthenticated `anon` role. RLS is
-- the authorization layer (DB-1); a caller must be signed in before it can even reach a definer function.
--
-- Supabase grants EXECUTE to PUBLIC by default, which `anon` inherits. Revoke it from PUBLIC and `anon`, grant
-- the validated `authenticated` role explicitly, and set the same as the default for functions created later.

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
grant execute on all functions in schema public to authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public grant execute on functions to authenticated;
