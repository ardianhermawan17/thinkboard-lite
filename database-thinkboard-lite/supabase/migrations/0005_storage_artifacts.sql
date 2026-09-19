-- ThinkBoard Lite — artifact PDF storage (task 003 g4, DB-Q11). Idempotent, like 0004.
-- Private bucket `artifacts`; object name = {sessionId}/{artifactId}.pdf, i.e. artifacts/{sessionId}/{artifactId}.pdf
-- with the bucket as the first segment (that full string is what artifacts.storage_path holds).
-- Read = a session member (can_access_session); write = the session's leader (can_lead_session).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artifacts', 'artifacts', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- The session id is the first path segment; anything that is not a uuid resolves to null, which no policy grants.
-- plpgsql, not sql: nothing here depends on the storage schema being ready when this migration is parsed.
create or replace function artifact_object_session(object_name text) returns uuid
language plpgsql immutable as $$
begin
  return case when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(object_name, '/', 1)::uuid end;
end $$;

drop policy if exists "artifacts read"   on storage.objects;
drop policy if exists "artifacts insert" on storage.objects;
drop policy if exists "artifacts update" on storage.objects;
drop policy if exists "artifacts delete" on storage.objects;

create policy "artifacts read"   on storage.objects for select to authenticated
  using (bucket_id = 'artifacts' and can_access_session(artifact_object_session(name)));
create policy "artifacts insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'artifacts' and can_lead_session(artifact_object_session(name)));
create policy "artifacts update" on storage.objects for update to authenticated
  using (bucket_id = 'artifacts' and can_lead_session(artifact_object_session(name)))
  with check (bucket_id = 'artifacts' and can_lead_session(artifact_object_session(name)));
create policy "artifacts delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artifacts' and can_lead_session(artifact_object_session(name)));
