-- 0008_team_profile_names.sql — housekeeping (task review §3.5 / README §6).
--
-- The members roster shows names, but `profiles` only lets a profile read itself ("own profile"), so a
-- teammate's name is invisible. Add a permissive SELECT policy for co-members: a member may read the profile
-- of anyone who shares a team with them. Outsiders and other teams stay invisible, and the existing
-- owner-only all-policy is untouched (permissive policies OR together).

create policy "teammates read each other's profile" on profiles
  for select to authenticated using (
    exists (
      select 1
      from team_members mine
      join team_members theirs on theirs.team_id = mine.team_id
      where mine.profile_id = current_profile_id()
        and theirs.profile_id = profiles.id));
