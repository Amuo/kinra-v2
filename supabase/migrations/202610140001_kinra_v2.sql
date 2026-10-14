-- Kinra v2: additive installation in the existing Kinra project.
-- Does not change the previous app's tables, functions, buckets or auth.
-- Run once as postgres. The transaction rolls back in full on any failure.
BEGIN;
-- Source: 0000_migration.sql
create type public.kinra_v2_app_role as enum ('solo','client','trainer');

create table public.kinra_v2_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  goal text,
  trainer_code text unique default upper(substr(md5(random()::text),1,6)),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.kinra_v2_profiles to authenticated;
grant all on public.kinra_v2_profiles to service_role;
alter table public.kinra_v2_profiles enable row level security;

create table public.kinra_v2_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role kinra_v2_app_role not null,
  unique (user_id)
);
grant select, insert on public.kinra_v2_user_roles to authenticated;
grant all on public.kinra_v2_user_roles to service_role;
alter table public.kinra_v2_user_roles enable row level security;
create policy "Kinra v2: own role read" on public.kinra_v2_user_roles for select to authenticated using (user_id = auth.uid());
create policy "Kinra v2: own role pick once" on public.kinra_v2_user_roles for insert to authenticated with check (user_id = auth.uid());

create or replace function public.kinra_v2_has_role(_user_id uuid, _role kinra_v2_app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.kinra_v2_user_roles where user_id = _user_id and role = _role)
$$;

create table public.kinra_v2_trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null,
  client_id uuid not null,
  created_at timestamptz not null default now(),
  unique (trainer_id, client_id)
);
grant select, insert, delete on public.kinra_v2_trainer_clients to authenticated;
grant all on public.kinra_v2_trainer_clients to service_role;
alter table public.kinra_v2_trainer_clients enable row level security;
create policy "Kinra v2: parties read" on public.kinra_v2_trainer_clients for select to authenticated using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "Kinra v2: client joins" on public.kinra_v2_trainer_clients for insert to authenticated with check (client_id = auth.uid() and public.kinra_v2_has_role(trainer_id,'trainer'));
create policy "Kinra v2: parties leave" on public.kinra_v2_trainer_clients for delete to authenticated using (trainer_id = auth.uid() or client_id = auth.uid());

create or replace function public.kinra_v2_is_trainer_of(_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.kinra_v2_trainer_clients where trainer_id = auth.uid() and client_id = _client)
$$;

create or replace function public.kinra_v2_find_trainer_by_code(_code text)
returns table(id uuid, display_name text) language sql stable security definer set search_path = public as $$
  select p.id, p.display_name from public.kinra_v2_profiles p
  where p.trainer_code = upper(_code) and public.kinra_v2_has_role(p.id,'trainer')
$$;
grant execute on function public.kinra_v2_find_trainer_by_code(text) to authenticated;

create policy "Kinra v2: own profile" on public.kinra_v2_profiles for select to authenticated using (id = auth.uid() or public.kinra_v2_is_trainer_of(id) or exists (select 1 from public.kinra_v2_trainer_clients t where t.client_id = auth.uid() and t.trainer_id = kinra_v2_profiles.id));
create policy "Kinra v2: own profile insert" on public.kinra_v2_profiles for insert to authenticated with check (id = auth.uid());
create policy "Kinra v2: own profile update" on public.kinra_v2_profiles for update to authenticated using (id = auth.uid());

create or replace function public.kinra_v2_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.kinra_v2_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger kinra_v2_on_auth_user_created after insert on auth.users for each row execute function public.kinra_v2_handle_new_user();

-- log tables
create table public.kinra_v2_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  performed_at timestamptz not null default now(),
  duration_min int,
  rpe int,
  notes text,
  sets jsonb not null default '[]'::jsonb
);
create table public.kinra_v2_sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  log_date date not null default current_date,
  hours numeric not null,
  quality int not null default 3
);
create table public.kinra_v2_nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  log_date date not null default current_date,
  meal text not null default 'Meal',
  name text not null,
  calories int not null default 0,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0
);
create table public.kinra_v2_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  mood int not null default 3,
  energy int not null default 3,
  body text
);
create table public.kinra_v2_body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  log_date date not null default current_date,
  weight numeric,
  body_fat numeric
);

do $$ declare t text; begin
  foreach t in array array['kinra_v2_workouts','kinra_v2_sleep_logs','kinra_v2_nutrition_logs','kinra_v2_journal_entries','kinra_v2_body_metrics'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Kinra v2: owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "Kinra v2: trainer reads" on public.%I for select to authenticated using (public.kinra_v2_is_trainer_of(user_id))', t);
  end loop;
end $$;

create table public.kinra_v2_programs (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  name text not null,
  description text,
  weeks int not null default 4,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.kinra_v2_program_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.kinra_v2_programs(id) on delete cascade,
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);
create table public.kinra_v2_trainer_notes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null,
  body text not null,
  shared boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.kinra_v2_programs, public.kinra_v2_program_assignments, public.kinra_v2_trainer_notes to authenticated;
grant all on public.kinra_v2_programs, public.kinra_v2_program_assignments, public.kinra_v2_trainer_notes to service_role;
alter table public.kinra_v2_programs enable row level security;
alter table public.kinra_v2_program_assignments enable row level security;
alter table public.kinra_v2_trainer_notes enable row level security;

create policy "Kinra v2: trainer owns" on public.kinra_v2_programs for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid() and public.kinra_v2_has_role(auth.uid(),'trainer'));
create policy "Kinra v2: assigned client reads" on public.kinra_v2_programs for select to authenticated using (exists (select 1 from public.kinra_v2_program_assignments a where a.program_id = kinra_v2_programs.id and a.client_id = auth.uid()));
create policy "Kinra v2: trainer manages" on public.kinra_v2_program_assignments for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid() and public.kinra_v2_is_trainer_of(client_id));
create policy "Kinra v2: client reads" on public.kinra_v2_program_assignments for select to authenticated using (client_id = auth.uid());
create policy "Kinra v2: trainer notes" on public.kinra_v2_trainer_notes for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid() and public.kinra_v2_is_trainer_of(client_id));
create policy "Kinra v2: client reads shared" on public.kinra_v2_trainer_notes for select to authenticated using (client_id = auth.uid() and shared);

-- Source: 0001_progress_photos_and_reports.sql
create table public.kinra_v2_progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  taken_on date not null default current_date,
  pose text not null default 'Front',
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.kinra_v2_progress_photos to authenticated;
grant all on public.kinra_v2_progress_photos to service_role;
alter table public.kinra_v2_progress_photos enable row level security;
create policy "Kinra v2: owner all" on public.kinra_v2_progress_photos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Kinra v2: trainer reads" on public.kinra_v2_progress_photos for select to authenticated using (public.kinra_v2_is_trainer_of(user_id));

create table public.kinra_v2_progress_reports (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null,
  period_days int not null default 30,
  summary jsonb not null default '{}'::jsonb,
  comment text,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.kinra_v2_progress_reports to authenticated;
grant all on public.kinra_v2_progress_reports to service_role;
alter table public.kinra_v2_progress_reports enable row level security;
create policy "Kinra v2: trainer manages" on public.kinra_v2_progress_reports for all to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid() and public.kinra_v2_is_trainer_of(client_id));
create policy "Kinra v2: client reads" on public.kinra_v2_progress_reports for select to authenticated using (client_id = auth.uid());

create policy "Kinra v2: photo owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'kinra-v2-progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Kinra v2: photo owner delete" on storage.objects for delete to authenticated using (bucket_id = 'kinra-v2-progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Kinra v2: photo owner or trainer read" on storage.objects for select to authenticated using (bucket_id = 'kinra-v2-progress-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.kinra_v2_is_trainer_of(((storage.foldername(name))[1])::uuid)));

-- Source: 0002_profile_customization.sql
ALTER TABLE public.kinra_v2_profiles ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS avatar_path text;
CREATE POLICY "Kinra v2: Owners upload profile avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kinra-v2-profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Kinra v2: Owners delete profile avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'kinra-v2-profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Kinra v2: Visible kinra_v2_profiles have readable avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kinra-v2-profile-avatars' AND EXISTS (SELECT 1 FROM public.kinra_v2_profiles p WHERE p.avatar_path = name));

-- Source: 0003_security_and_integrity.sql
-- Additive repair. NOT VALID checks enforce new writes without deleting or
-- silently rewriting existing health records. See README.md for validation.

ALTER TABLE public.kinra_v2_profiles ADD CONSTRAINT profile_avatar_owner
  CHECK (avatar_path IS NULL OR split_part(avatar_path, '/', 1) = id::text) NOT VALID;
DROP POLICY "Kinra v2: Visible kinra_v2_profiles have readable avatars" ON storage.objects;
CREATE POLICY "Kinra v2: Visible kinra_v2_profiles have readable avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kinra-v2-profile-avatars' AND EXISTS (
    SELECT 1 FROM public.kinra_v2_profiles p
    WHERE p.id::text = (storage.foldername(name))[1] AND p.avatar_path = name
  ));

CREATE UNIQUE INDEX kinra_v2_programs_id_trainer_unique ON public.kinra_v2_programs(id, trainer_id);
ALTER TABLE public.kinra_v2_program_assignments ADD CONSTRAINT assigned_program_owner
  FOREIGN KEY (program_id, trainer_id) REFERENCES public.kinra_v2_programs(id, trainer_id) ON DELETE CASCADE NOT VALID;
DROP POLICY "Kinra v2: assigned client reads" ON public.kinra_v2_programs;
CREATE POLICY "Kinra v2: assigned client reads" ON public.kinra_v2_programs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.kinra_v2_program_assignments a
    WHERE a.program_id = kinra_v2_programs.id AND a.trainer_id = kinra_v2_programs.trainer_id AND a.client_id = auth.uid()));

REVOKE ALL ON FUNCTION public.kinra_v2_has_role(uuid, public.kinra_v2_app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kinra_v2_is_trainer_of(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kinra_v2_find_trainer_by_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kinra_v2_handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kinra_v2_has_role(uuid, public.kinra_v2_app_role), public.kinra_v2_is_trainer_of(uuid), public.kinra_v2_find_trainer_by_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.kinra_v2_find_trainer_by_code(_code text)
RETURNS TABLE(id uuid, display_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name FROM public.kinra_v2_profiles p
  WHERE auth.uid() IS NOT NULL AND upper(trim(_code)) ~ '^[A-Z0-9]{6}$'
    AND p.trainer_code = upper(trim(_code)) AND public.kinra_v2_has_role(p.id, 'trainer')
$$;

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kinra-v2-profile-avatars', 'kinra-v2-profile-avatars', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
       ('kinra-v2-progress-photos', 'kinra-v2-progress-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.kinra_v2_nutrition_logs
  ALTER COLUMN protein TYPE numeric(10,1),
  ALTER COLUMN carbs TYPE numeric(10,1),
  ALTER COLUMN fat TYPE numeric(10,1);

ALTER TABLE public.kinra_v2_profiles ADD CONSTRAINT profile_text_limits CHECK (
  (display_name IS NULL OR length(display_name) BETWEEN 1 AND 80) AND
  (goal IS NULL OR length(goal) <= 160) AND (bio IS NULL OR length(bio) <= 500)) NOT VALID;
ALTER TABLE public.kinra_v2_sleep_logs ADD CONSTRAINT sleep_value_ranges CHECK (hours BETWEEN 0 AND 24 AND quality BETWEEN 1 AND 5) NOT VALID;
ALTER TABLE public.kinra_v2_nutrition_logs ADD CONSTRAINT food_value_ranges CHECK (
  calories BETWEEN 0 AND 1000000 AND protein BETWEEN 0 AND 1000000 AND carbs BETWEEN 0 AND 1000000 AND fat BETWEEN 0 AND 1000000
  AND length(trim(name)) BETWEEN 1 AND 300 AND length(trim(meal)) BETWEEN 1 AND 100) NOT VALID;
ALTER TABLE public.kinra_v2_journal_entries ADD CONSTRAINT journal_value_ranges CHECK (
  mood BETWEEN 1 AND 5 AND energy BETWEEN 1 AND 5 AND (body IS NULL OR length(body) <= 10000)) NOT VALID;
ALTER TABLE public.kinra_v2_body_metrics ADD CONSTRAINT body_value_ranges CHECK (
  (weight IS NULL OR weight > 0 AND weight <= 700) AND (body_fat IS NULL OR body_fat BETWEEN 0 AND 100)
  AND (weight IS NOT NULL OR body_fat IS NOT NULL)) NOT VALID;
ALTER TABLE public.kinra_v2_workouts ADD CONSTRAINT workout_value_ranges CHECK (
  length(trim(title)) BETWEEN 1 AND 200 AND (duration_min IS NULL OR duration_min BETWEEN 1 AND 1440)
  AND (rpe IS NULL OR rpe BETWEEN 1 AND 10) AND (notes IS NULL OR length(notes) <= 10000)) NOT VALID;

CREATE FUNCTION public.kinra_v2_kinra_valid_sets(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE item jsonb; reps numeric; weight numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(value) > 1000 THEN RETURN false; END IF;
  FOR item IN SELECT jsonb_array_elements(value) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR jsonb_typeof(item->'exercise') IS DISTINCT FROM 'string'
      OR jsonb_typeof(item->'reps') IS DISTINCT FROM 'number' OR jsonb_typeof(item->'weight') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    reps := (item->>'reps')::numeric; weight := (item->>'weight')::numeric;
    IF length(trim(item->>'exercise')) NOT BETWEEN 1 AND 200 OR reps < 0 OR reps > 10000 OR reps <> trunc(reps)
      OR weight < 0 OR weight > 2000 THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

CREATE FUNCTION public.kinra_v2_kinra_valid_program_days(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE day jsonb; exercise jsonb; key text; amount numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(value) NOT BETWEEN 1 AND 31 THEN RETURN false; END IF;
  FOR day IN SELECT jsonb_array_elements(value) LOOP
    IF jsonb_typeof(day) IS DISTINCT FROM 'object' OR jsonb_typeof(day->'title') IS DISTINCT FROM 'string'
      OR jsonb_typeof(day->'exercises') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
    IF length(trim(day->>'title')) NOT BETWEEN 1 AND 200 OR jsonb_array_length(day->'exercises') NOT BETWEEN 1 AND 100 THEN RETURN false; END IF;
    FOR exercise IN SELECT jsonb_array_elements(day->'exercises') LOOP
      IF jsonb_typeof(exercise) IS DISTINCT FROM 'object' OR jsonb_typeof(exercise->'name') IS DISTINCT FROM 'string'
        OR jsonb_typeof(exercise->'reps') IS DISTINCT FROM 'string' OR jsonb_typeof(exercise->'sets') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
      amount := (exercise->>'sets')::numeric;
      IF length(trim(exercise->>'name')) NOT BETWEEN 1 AND 200 OR length(trim(exercise->>'reps')) NOT BETWEEN 1 AND 100
        OR amount NOT BETWEEN 1 AND 8 OR amount <> trunc(amount) THEN RETURN false; END IF;
      FOREACH key IN ARRAY ARRAY['weight','rest_seconds','rpe'] LOOP
        IF exercise ? key AND jsonb_typeof(exercise->key) <> 'null' THEN
          IF jsonb_typeof(exercise->key) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
          amount := (exercise->>key)::numeric;
          IF key = 'weight' AND (amount < 0 OR amount > 2000) THEN RETURN false; END IF;
          IF key = 'rest_seconds' AND (amount < 0 OR amount > 3600 OR amount <> trunc(amount)) THEN RETURN false; END IF;
          IF key = 'rpe' AND (amount < 1 OR amount > 10 OR amount <> trunc(amount)) THEN RETURN false; END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_valid_sets(jsonb), public.kinra_v2_kinra_valid_program_days(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_valid_sets(jsonb), public.kinra_v2_kinra_valid_program_days(jsonb) TO authenticated, service_role;
ALTER TABLE public.kinra_v2_workouts ADD CONSTRAINT workout_sets_valid CHECK (public.kinra_v2_kinra_valid_sets(sets)) NOT VALID;
ALTER TABLE public.kinra_v2_programs ADD CONSTRAINT program_value_ranges CHECK (
  length(trim(name)) BETWEEN 1 AND 200 AND (description IS NULL OR length(description) <= 10000)
  AND weeks BETWEEN 1 AND 104 AND public.kinra_v2_kinra_valid_program_days(days)) NOT VALID;
ALTER TABLE public.kinra_v2_progress_reports ADD CONSTRAINT report_value_ranges CHECK (
  period_days BETWEEN 1 AND 365 AND jsonb_typeof(summary) = 'object' AND (comment IS NULL OR length(comment) <= 10000)) NOT VALID;
ALTER TABLE public.kinra_v2_trainer_notes ADD CONSTRAINT note_value_ranges CHECK (length(trim(body)) BETWEEN 1 AND 10000) NOT VALID;
ALTER TABLE public.kinra_v2_progress_photos ADD CONSTRAINT progress_photo_owner_path CHECK (split_part(storage_path, '/', 1) = user_id::text) NOT VALID;

CREATE INDEX kinra_v2_workouts_owner_time ON public.kinra_v2_workouts(user_id, performed_at DESC, id);
CREATE INDEX kinra_v2_sleep_owner_date ON public.kinra_v2_sleep_logs(user_id, log_date DESC, id);
CREATE INDEX kinra_v2_nutrition_owner_date ON public.kinra_v2_nutrition_logs(user_id, log_date DESC, id);
CREATE INDEX kinra_v2_journal_owner_time ON public.kinra_v2_journal_entries(user_id, created_at DESC, id);
CREATE INDEX kinra_v2_metrics_owner_date ON public.kinra_v2_body_metrics(user_id, log_date DESC, id);
CREATE INDEX kinra_v2_connections_client ON public.kinra_v2_trainer_clients(client_id);
CREATE INDEX kinra_v2_assignments_client_time ON public.kinra_v2_program_assignments(client_id, created_at DESC);


-- Existing Supabase identities receive a v2 profile; roles are chosen in v2.
INSERT INTO public.kinra_v2_profiles(id, display_name)
SELECT id, left(coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', split_part(email,'@',1), 'Member'),80) FROM auth.users
ON CONFLICT(id) DO NOTHING;
COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0003_security_and_integrity';
NOTIFY pgrst, 'reload schema';
COMMIT;
