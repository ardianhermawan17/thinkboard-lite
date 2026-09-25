-- 0006_live_topic.sql — task 015 g6 / DB-Q9.
--
-- A `live:{sessionId}` topic carries client-sent, EPHEMERAL traffic only: presence (who is here) and cursors,
-- throttled ~20 Hz. `ws:{sessionId}` and `user:{profileId}` stay DATABASE-SENT ONLY — a member must never be
-- able to forge a database-change event into a teammate's Dexie (RULE-03 / DB-Q9's default). The client may
-- therefore SELECT and INSERT on `live:`, and only SELECT on `ws:`/`user:` (0004 already grants that).
--
-- The plan doc named this `0005_live_topic.sql`; migration 0005 is already `0005_storage_artifacts.sql`, so the
-- next free number is used (agent-history/015-task-realtime-presence/analyze.json NEW-1).

-- Listen: a session member may receive broadcast + presence on their session's live topic.
drop policy if exists "members live on their session topic" on realtime.messages;
create policy "members live on their session topic" on realtime.messages
  for select to authenticated using (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from sessions s
      join board_columns c on c.id = s.column_id
      join boards b        on b.id = c.board_id
      where realtime.topic() = 'live:' || s.id::text
        and is_team_member(b.team_id)));

-- Send: the same members may publish their presence and their cursor on that live topic. No insert policy
-- exists for `ws:`/`user:`, which is what keeps those topics database-sent only.
drop policy if exists "members send on their session topic" on realtime.messages;
create policy "members send on their session topic" on realtime.messages
  for insert to authenticated with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (
      select 1 from sessions s
      join board_columns c on c.id = s.column_id
      join boards b        on b.id = c.board_id
      where realtime.topic() = 'live:' || s.id::text
        and is_team_member(b.team_id)));
