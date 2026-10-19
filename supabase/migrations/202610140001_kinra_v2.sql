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


-- Source: 0004_feature_schemas.sql
-- Generated by scripts/feature-schema.mjs from strict application schemas.
CREATE OR REPLACE FUNCTION public.kinra_v2_kinra_feature_schemas() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public AS $schemas$ SELECT $json${"message":{"type":"object","properties":{"recipient_id":{"type":"string","min":1,"max":100,"trim":false},"body":{"type":"string","min":1,"max":10000,"trim":true}},"required":["recipient_id","body"],"strict":true},"preferences":{"type":"object","properties":{"language":{"type":"string","enum":["en","bs"]},"theme":{"type":"string","enum":["light","dark","system"]},"modules":{"type":"object","values":{"type":"boolean"}},"timezone":{"type":"string","min":1,"max":100,"trim":false},"units":{"type":"string","enum":["metric","imperial"]}},"required":["language","theme","modules","timezone"],"strict":true},"nutrition_plan":{"type":"object","properties":{"title":{"type":"string","min":1,"max":200,"trim":true},"meals":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"time":{"type":"string","trim":false,"pattern":"^([01]\\d|2[0-3]):[0-5]\\d$"},"foods":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"quantity":{"type":"string","min":1,"max":200,"trim":true},"calories":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":true},"protein":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"carbs":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"fat":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false}},"required":["name","calories","protein","carbs","fat"],"strict":true},"min":1,"max":50}},"required":["name","foods"],"strict":true},"min":1,"max":20},"notes":{"type":"string","max":10000,"trim":false},"calories_target":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"protein_target":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false}},"required":["title","meals"],"strict":true},"meal_event":{"type":"object","properties":{"plan_id":{"type":"string","trim":false,"format":"uuid"},"meal_index":{"type":"number","min":0,"exclusiveMin":false,"max":19,"integer":true},"date":{"type":"string","trim":false,"format":"date"},"status":{"type":"string","enum":["consumed","skipped"]},"plan_snapshot":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"foods":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"quantity":{"type":"string","min":1,"max":200,"trim":true},"calories":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":true},"protein":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"carbs":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"fat":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false}},"required":["name","calories","protein","carbs","fat"],"strict":true},"min":1,"max":50}},"required":["name","foods"],"strict":true}},"required":["plan_id","meal_index","date","status"],"strict":true},"supplement":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"dose":{"type":"number","min":0,"exclusiveMin":true,"max":1000000,"integer":false},"unit":{"type":"string","enum":["mg","g","ml","IU","caps","tabs","scoops"]},"times":{"type":"array","items":{"type":"string","trim":false,"pattern":"^([01]\\d|2[0-3]):[0-5]\\d$"},"min":1,"max":24},"frequency":{"type":"string","enum":["daily","training","rest","as_needed"]},"start_date":{"type":"string","trim":false,"format":"date"},"end_date":{"type":"string","trim":false,"format":"date"},"notes":{"type":"string","max":10000,"trim":false},"protocol":{"type":"string","min":1,"max":200,"trim":true}},"required":["name","dose","unit","times","frequency","start_date"],"strict":true},"dose":{"type":"object","properties":{"supplement_id":{"type":"string","trim":false,"format":"uuid"},"date":{"type":"string","trim":false,"format":"date"},"time":{"type":"string","trim":false,"pattern":"^([01]\\d|2[0-3]):[0-5]\\d$"},"status":{"type":"string","enum":["taken","skipped","snoozed"]},"taken_at":{"type":"string","trim":false,"format":"datetime"},"snoozed_until":{"type":"string","trim":false,"format":"datetime"},"name_snapshot":{"type":"string","min":1,"max":200,"trim":true},"dose_snapshot":{"type":"number","min":0,"exclusiveMin":true,"max":1000000,"integer":false},"unit_snapshot":{"type":"string","min":1,"max":200,"trim":true}},"required":["supplement_id","date","time","status"],"strict":true},"measurement":{"type":"object","properties":{"type":{"type":"string","enum":["weight","body_fat","waist","hips","chest","arm_flexed","arm_relaxed","glute","thigh","forearm","calf","shoulder","neck"]},"value":{"type":"number","min":0,"exclusiveMin":true,"max":1000000,"integer":false},"unit":{"type":"string","enum":["kg","lb","cm","in","%"]},"date":{"type":"string","trim":false,"format":"date"},"notes":{"type":"string","max":10000,"trim":false}},"required":["type","value","unit","date"],"strict":true},"goal":{"type":"object","properties":{"title":{"type":"string","min":1,"max":200,"trim":true},"metric":{"type":"string","enum":["weight","sessions","steps","sleep","water","custom"]},"baseline":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"target":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"unit":{"type":"string","min":1,"max":200,"trim":true},"target_date":{"type":"string","trim":false,"format":"date"},"notes":{"type":"string","max":10000,"trim":false}},"required":["title","metric","baseline","target","unit"],"strict":true},"medication":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"route":{"type":"string","min":1,"max":200,"trim":true},"dose":{"type":"number","min":0,"exclusiveMin":true,"max":1000000,"integer":false},"unit":{"type":"string","min":1,"max":200,"trim":true},"frequency":{"type":"string","min":1,"max":200,"trim":true},"start_date":{"type":"string","trim":false,"format":"date"},"end_date":{"type":"string","trim":false,"format":"date"},"notes":{"type":"string","max":10000,"trim":false}},"required":["name","route","dose","unit","frequency","start_date"],"strict":true},"medication_event":{"type":"object","properties":{"medication_id":{"type":"string","trim":false,"format":"uuid"},"taken_at":{"type":"string","trim":false,"format":"datetime"},"status":{"type":"string","enum":["taken","skipped"]},"location":{"type":"string","min":1,"max":200,"trim":true},"notes":{"type":"string","max":10000,"trim":false}},"required":["medication_id","taken_at","status"],"strict":true},"cycle":{"type":"object","properties":{"date":{"type":"string","trim":false,"format":"date"},"flow":{"type":"string","enum":["none","spotting","light","medium","heavy"]},"symptoms":{"type":"array","items":{"type":"string","min":1,"max":200,"trim":true},"min":0,"max":50},"notes":{"type":"string","max":10000,"trim":false}},"required":["date","flow","symptoms"],"strict":true},"habit":{"type":"object","properties":{"title":{"type":"string","min":1,"max":200,"trim":true},"weekdays":{"type":"array","items":{"type":"number","min":0,"exclusiveMin":false,"max":6,"integer":true},"min":0,"max":7},"notes":{"type":"string","max":10000,"trim":false}},"required":["title","weekdays"],"strict":true},"habit_event":{"type":"object","properties":{"habit_id":{"type":"string","trim":false,"format":"uuid"},"date":{"type":"string","trim":false,"format":"date"},"completed":{"type":"boolean"}},"required":["habit_id","date","completed"],"strict":true},"steps":{"type":"object","properties":{"date":{"type":"string","trim":false,"format":"date"},"count":{"type":"number","min":0,"exclusiveMin":false,"max":200000,"integer":true}},"required":["date","count"],"strict":true},"check_in":{"type":"object","properties":{"date":{"type":"string","trim":false,"format":"date"},"context":{"type":"string","enum":["morning","pre_workout","post_workout","evening","other"]},"mood":{"type":"number","min":1,"exclusiveMin":false,"max":5,"integer":true},"energy":{"type":"number","min":1,"exclusiveMin":false,"max":5,"integer":true},"notes":{"type":"string","max":10000,"trim":false}},"required":["date","context","mood","energy"],"strict":true},"expert":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"headline":{"type":"string","min":1,"max":200,"trim":true},"city":{"type":"string","min":1,"max":200,"trim":true},"biography":{"type":"string","max":10000,"trim":false},"languages":{"type":"array","items":{"type":"string","min":1,"max":200,"trim":true},"min":0,"max":50},"specialties":{"type":"array","items":{"type":"string","min":1,"max":200,"trim":true},"min":0,"max":50},"website":{"type":"string","max":2000,"trim":false,"format":"url"},"credential_claims":{"type":"array","items":{"type":"string","min":1,"max":200,"trim":true},"min":0,"max":50}},"required":["name","headline","city","languages","specialties"],"strict":true},"facility":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"type":{"type":"string","min":1,"max":200,"trim":true},"city":{"type":"string","min":1,"max":200,"trim":true},"address":{"type":"string","min":1,"max":200,"trim":true},"description":{"type":"string","max":10000,"trim":false},"equipment":{"type":"array","items":{"type":"string","min":1,"max":200,"trim":true},"min":0,"max":50},"amenities":{"type":"array","items":{"type":"string","min":1,"max":200,"trim":true},"min":0,"max":50},"website":{"type":"string","max":2000,"trim":false,"format":"url"},"opening_hours":{"type":"string","max":10000,"trim":false},"price_tier":{"type":"number","min":1,"exclusiveMin":false,"max":4,"integer":true}},"required":["name","type","city","equipment","amenities"],"strict":true},"review":{"type":"object","properties":{"subject_id":{"type":"string","trim":false,"format":"uuid"},"subject_type":{"type":"string","enum":["facility","expert"]},"rating":{"type":"number","min":1,"exclusiveMin":false,"max":5,"integer":true},"body":{"type":"string","max":10000,"trim":false}},"required":["subject_id","subject_type","rating"],"strict":true},"saved":{"type":"object","properties":{"target_type":{"type":"string","enum":["exercise","program","expert","facility","article"]},"target_id":{"type":"string","min":1,"max":200,"trim":true}},"required":["target_type","target_id"],"strict":true},"group":{"type":"object","properties":{"title":{"type":"string","min":1,"max":200,"trim":true},"description":{"type":"string","max":10000,"trim":false},"type":{"type":"string","enum":["interest","gym","club","challenge","education"]}},"required":["title","description","type"],"strict":true},"group_member":{"type":"object","properties":{"group_id":{"type":"string","trim":false,"format":"uuid"}},"required":["group_id"],"strict":true},"post":{"type":"object","properties":{"body":{"type":"string","min":1,"max":10000,"trim":true},"category":{"type":"string","min":1,"max":200,"trim":true},"group_id":{"type":"string","trim":false,"format":"uuid"}},"required":["body","category"],"strict":true},"reaction":{"type":"object","properties":{"subject_id":{"type":"string","trim":false,"format":"uuid"},"type":{"type":"string","enum":["like"]}},"required":["subject_id","type"],"strict":true},"article":{"type":"object","properties":{"title":{"type":"string","min":1,"max":200,"trim":true},"category":{"type":"string","min":1,"max":200,"trim":true},"body":{"type":"string","min":1,"max":10000,"trim":true},"sources":{"type":"array","items":{"type":"string","max":2000,"trim":false,"format":"url"},"min":0,"max":20},"updated_on":{"type":"string","trim":false,"format":"date"}},"required":["title","category","body","sources","updated_on"],"strict":true},"report":{"type":"object","properties":{"subject_id":{"type":"string","trim":false,"format":"uuid"},"reason":{"type":"string","min":1,"max":200,"trim":true},"detail":{"type":"string","max":10000,"trim":false}},"required":["subject_id","reason"],"strict":true},"block":{"type":"object","properties":{"user_id":{"type":"string","trim":false,"format":"uuid"}},"required":["user_id"],"strict":true},"appointment":{"type":"object","properties":{"coach_id":{"type":"string","trim":false,"format":"uuid"},"starts_at":{"type":"string","trim":false,"format":"datetime"},"ends_at":{"type":"string","trim":false,"format":"datetime"},"status":{"type":"string","enum":["requested","confirmed","cancelled"]},"notes":{"type":"string","max":10000,"trim":false}},"required":["coach_id","starts_at","ends_at","status"],"strict":true},"organization":{"type":"object","properties":{"name":{"type":"string","min":1,"max":200,"trim":true},"city":{"type":"string","min":1,"max":200,"trim":true},"description":{"type":"string","max":10000,"trim":false},"website":{"type":"string","max":2000,"trim":false,"format":"url"}},"required":["name","city"],"strict":true},"organization_member":{"type":"object","properties":{"organization_id":{"type":"string","trim":false,"format":"uuid"}},"required":["organization_id"],"strict":true},"membership_plan":{"type":"object","properties":{"organization_id":{"type":"string","trim":false,"format":"uuid"},"title":{"type":"string","min":1,"max":200,"trim":true},"amount":{"type":"number","min":0,"exclusiveMin":false,"max":1000000,"integer":false},"currency":{"type":"string","enum":["EUR","USD","BAM","GBP"]},"period":{"type":"string","enum":["month","year","one_time"]},"description":{"type":"string","max":10000,"trim":false}},"required":["organization_id","title","amount","currency","period"],"strict":true},"notification_preferences":{"type":"object","properties":{"categories":{"type":"object","values":{"type":"boolean"}},"quiet_start":{"type":"string","trim":false,"pattern":"^([01]\\d|2[0-3]):[0-5]\\d$"},"quiet_end":{"type":"string","trim":false,"pattern":"^([01]\\d|2[0-3]):[0-5]\\d$"},"timezone":{"type":"string","min":1,"max":100,"trim":false}},"required":["categories","quiet_start","quiet_end","timezone"],"strict":true},"reminder":{"type":"object","properties":{"title":{"type":"string","min":1,"max":200,"trim":true},"time":{"type":"string","trim":false,"pattern":"^([01]\\d|2[0-3]):[0-5]\\d$"},"timezone":{"type":"string","min":1,"max":100,"trim":false},"weekdays":{"type":"array","items":{"type":"number","min":0,"exclusiveMin":false,"max":6,"integer":true},"min":0,"max":7},"enabled":{"type":"boolean"}},"required":["title","time","timezone","weekdays","enabled"],"strict":true}}$json$::jsonb $schemas$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_feature_schemas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_feature_schemas() TO authenticated, service_role;


-- Source: 0005_features.sql
-- Structured feature records. All payloads are checked against the same strict
-- schemas used by the application; public content and health data cannot share
-- visibility. This migration is additive and preserves existing logs.
CREATE FUNCTION public.kinra_v2_kinra_json_matches(value jsonb, spec jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE k text; v jsonb; s text; n numeric;
BEGIN
  IF jsonb_typeof(value) IS DISTINCT FROM spec->>'type' THEN RETURN false; END IF;
  IF spec->>'type' = 'object' THEN
    IF (SELECT count(*) FROM jsonb_object_keys(value)) > 200 THEN RETURN false; END IF;
    IF spec ? 'required' THEN
      FOR k IN SELECT jsonb_array_elements_text(spec->'required') LOOP
        IF NOT value ? k THEN RETURN false; END IF;
      END LOOP;
    END IF;
    FOR k,v IN SELECT * FROM jsonb_each(value) LOOP
      IF spec ? 'properties' AND spec->'properties' ? k THEN
        IF NOT public.kinra_v2_kinra_json_matches(v,spec->'properties'->k) THEN RETURN false; END IF;
      ELSIF spec ? 'values' THEN
        IF length(k)>100 OR NOT public.kinra_v2_kinra_json_matches(v,spec->'values') THEN RETURN false; END IF;
      ELSE RETURN false;
      END IF;
    END LOOP;
  ELSIF spec->>'type' = 'array' THEN
    IF jsonb_array_length(value) < (spec->>'min')::int OR jsonb_array_length(value) > (spec->>'max')::int THEN RETURN false; END IF;
    FOR v IN SELECT jsonb_array_elements(value) LOOP
      IF NOT public.kinra_v2_kinra_json_matches(v,spec->'items') THEN RETURN false; END IF;
    END LOOP;
  ELSIF spec->>'type' = 'string' THEN
    s := value #>> '{}';
    IF coalesce((spec->>'trim')::boolean,false) THEN s:=trim(s); END IF;
    IF spec ? 'min' AND length(s)<(spec->>'min')::int OR spec ? 'max' AND length(s)>(spec->>'max')::int THEN RETURN false; END IF;
    IF spec ? 'enum' AND NOT spec->'enum' @> jsonb_build_array(s) THEN RETURN false; END IF;
    IF spec ? 'pattern' AND s !~ (spec->>'pattern') THEN RETURN false; END IF;
    IF spec->>'format'='uuid' AND s !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RETURN false; END IF;
    IF spec->>'format'='date' THEN
      IF s !~ '^\d{4}-\d{2}-\d{2}$' OR s::date::text <> s THEN RETURN false; END IF;
    END IF;
    IF spec->>'format'='datetime' THEN
      IF s !~ '^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$' THEN RETURN false; END IF;
      PERFORM s::timestamptz;
    END IF;
    IF spec->>'format'='url' AND s !~* '^https?://[^ /]+([/?#].*)?$' THEN RETURN false; END IF;
  ELSIF spec->>'type'='number' THEN
    n:=(value #>> '{}')::numeric;
    IF spec ? 'min' AND (n<(spec->>'min')::numeric OR coalesce((spec->>'exclusiveMin')::boolean,false) AND n=(spec->>'min')::numeric)
      OR spec ? 'max' AND n>(spec->>'max')::numeric OR coalesce((spec->>'integer')::boolean,false) AND n<>trunc(n) THEN RETURN false; END IF;
  END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE public.kinra_v2_feature_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_payload_shape CHECK (coalesce(public.kinra_v2_kinra_json_matches(payload, public.kinra_v2_kinra_feature_schemas()->kind),false)),
  CONSTRAINT feature_public_kinds CHECK (visibility='private' OR kind IN ('expert','facility','review','group','group_member','post','reaction','article','organization','organization_member','membership_plan')),
  CONSTRAINT feature_client_kinds CHECK (client_id IS NULL OR kind IN ('nutrition_plan','supplement')),
  CONSTRAINT feature_public_unassigned CHECK (client_id IS NULL OR visibility='private'),
  UNIQUE(owner_id, kind, dedupe_key)
);
CREATE INDEX kinra_v2_feature_kind_created ON public.kinra_v2_feature_records(kind,created_at DESC,id);
CREATE INDEX kinra_v2_feature_client ON public.kinra_v2_feature_records(client_id) WHERE client_id IS NOT NULL;
ALTER TABLE public.kinra_v2_feature_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kinra_v2_feature_records FROM anon, PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.kinra_v2_feature_records TO authenticated;

CREATE FUNCTION public.kinra_v2_kinra_feature_blocked(other_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM kinra_v2_feature_records WHERE kind='block' AND
    (owner_id=auth.uid() AND payload->>'user_id'=other_id::text OR owner_id=other_id AND payload->>'user_id'=auth.uid()::text))
$$;
CREATE FUNCTION public.kinra_v2_kinra_feature_visible(record_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM kinra_v2_feature_records r WHERE r.id=record_id AND (
    r.owner_id=auth.uid() OR r.visibility='public' AND NOT kinra_v2_kinra_feature_blocked(r.owner_id) AND
      (r.kind<>'post' OR NOT r.payload ? 'group_id' OR EXISTS(SELECT 1 FROM kinra_v2_feature_records g WHERE g.kind='group' AND g.id=(r.payload->>'group_id')::uuid AND NOT kinra_v2_kinra_feature_blocked(g.owner_id) AND (g.visibility='public' OR g.owner_id=auth.uid() OR EXISTS(SELECT 1 FROM kinra_v2_feature_records m WHERE m.kind='group_member' AND m.owner_id=auth.uid() AND m.payload->>'group_id'=g.id::text)))) OR
    r.client_id=auth.uid() AND EXISTS(SELECT 1 FROM kinra_v2_trainer_clients c WHERE c.client_id=r.client_id AND c.trainer_id=r.owner_id)))
$$;
CREATE FUNCTION public.kinra_v2_kinra_group_visible(group_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM kinra_v2_feature_records g WHERE g.id=group_id AND g.kind='group' AND NOT kinra_v2_kinra_feature_blocked(g.owner_id) AND (
    g.owner_id=auth.uid() OR g.visibility='public' OR EXISTS(SELECT 1 FROM kinra_v2_feature_records m WHERE m.owner_id=auth.uid() AND m.kind='group_member' AND m.payload->>'group_id'=g.id::text)))
$$;
CREATE POLICY "Kinra v2: Feature record audience" ON public.kinra_v2_feature_records FOR SELECT TO authenticated USING (
  owner_id=auth.uid() OR
  kind='message' AND payload->>'recipient_id'=auth.uid()::text AND EXISTS(SELECT 1 FROM kinra_v2_trainer_clients c WHERE c.trainer_id=owner_id AND c.client_id=auth.uid() OR c.trainer_id=auth.uid() AND c.client_id=owner_id) OR
  visibility='public' AND NOT public.kinra_v2_kinra_feature_blocked(owner_id) AND
    (kind<>'post' OR NOT payload ? 'group_id' OR public.kinra_v2_kinra_group_visible((payload->>'group_id')::uuid)) OR
  client_id=auth.uid() AND EXISTS(SELECT 1 FROM kinra_v2_trainer_clients c WHERE c.trainer_id=owner_id AND c.client_id=auth.uid()) OR
  kind='appointment' AND payload->>'coach_id'=auth.uid()::text
);
CREATE POLICY "Kinra v2: Owner creates feature record" ON public.kinra_v2_feature_records FOR INSERT TO authenticated WITH CHECK (
  owner_id=auth.uid() AND (client_id IS NULL OR public.kinra_v2_is_trainer_of(client_id)) AND
  (kind<>'meal_event' OR payload->>'status'='skipped')
);
CREATE POLICY "Kinra v2: Owner changes feature record" ON public.kinra_v2_feature_records FOR UPDATE TO authenticated USING (
  owner_id=auth.uid() AND (kind<>'meal_event' OR payload->>'status'='skipped')
) WITH CHECK (
  owner_id=auth.uid() AND (client_id IS NULL OR public.kinra_v2_is_trainer_of(client_id)) AND
  (kind<>'meal_event' OR payload->>'status'='skipped')
);
CREATE POLICY "Kinra v2: Owner deletes feature record" ON public.kinra_v2_feature_records FOR DELETE TO authenticated USING (
  owner_id=auth.uid() AND (kind<>'meal_event' OR payload->>'status'<>'consumed')
);

CREATE FUNCTION public.kinra_v2_kinra_guard_feature() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb; reference kinra_v2_feature_records; parent kinra_v2_feature_records; field text; unit text; measurement text; time_count int;
BEGIN
  p:=NEW.payload;
  IF TG_OP='UPDATE' THEN
    IF NEW.owner_id<>OLD.owner_id OR NEW.kind<>OLD.kind OR NEW.id<>OLD.id THEN RAISE EXCEPTION 'Record identity is immutable' USING ERRCODE='23514'; END IF;
    NEW.created_at:=OLD.created_at;
  ELSE NEW.created_at:=now(); END IF;
  NEW.updated_at:=now();
  IF NEW.kind='message' THEN
    IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Sent messages cannot be edited' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM kinra_v2_trainer_clients c WHERE c.trainer_id=NEW.owner_id AND c.client_id=(p->>'recipient_id')::uuid OR c.client_id=NEW.owner_id AND c.trainer_id=(p->>'recipient_id')::uuid) OR p->>'recipient_id'=NEW.owner_id::text THEN RAISE EXCEPTION 'Choose a connected coach or client' USING ERRCODE='23514'; END IF;
  END IF;
  IF p ? 'timezone' AND NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=p->>'timezone') THEN RAISE EXCEPTION 'Invalid timezone' USING ERRCODE='23514'; END IF;
  IF p ? 'end_date' AND (p->>'end_date')::date<(p->>'start_date')::date THEN RAISE EXCEPTION 'End precedes start' USING ERRCODE='23514'; END IF;
  IF NEW.kind='measurement' THEN
    unit:=p->>'unit'; measurement:=p->>'type';
    IF (measurement='weight' AND unit NOT IN ('kg','lb')) OR (measurement='body_fat' AND (unit<>'%' OR (p->>'value')::numeric>100)) OR (measurement NOT IN ('weight','body_fat') AND unit NOT IN ('cm','in')) THEN RAISE EXCEPTION 'Invalid measurement unit or value' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind='supplement' THEN
    SELECT count(DISTINCT t) INTO time_count FROM jsonb_array_elements_text(p->'times') AS t;
    IF time_count<>jsonb_array_length(p->'times') THEN RAISE EXCEPTION 'Dose times must be distinct' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind IN ('dose','medication_event','habit_event','meal_event') THEN
    field:=CASE NEW.kind WHEN 'dose' THEN 'supplement_id' WHEN 'medication_event' THEN 'medication_id' WHEN 'habit_event' THEN 'habit_id' ELSE 'plan_id' END;
    SELECT * INTO reference FROM kinra_v2_feature_records WHERE id=(p->>field)::uuid AND kind=CASE NEW.kind WHEN 'dose' THEN 'supplement' WHEN 'medication_event' THEN 'medication' WHEN 'habit_event' THEN 'habit' ELSE 'nutrition_plan' END;
    IF TG_OP='UPDATE' AND (p->>field IS DISTINCT FROM OLD.payload->>field OR p->>'date' IS DISTINCT FROM OLD.payload->>'date' OR p->>'time' IS DISTINCT FROM OLD.payload->>'time') THEN RAISE EXCEPTION 'Event identity is immutable' USING ERRCODE='23514'; END IF;
    IF TG_OP='INSERT' AND (reference.id IS NULL OR NOT (reference.owner_id=NEW.owner_id AND reference.client_id IS NULL OR reference.client_id=NEW.owner_id AND EXISTS(SELECT 1 FROM kinra_v2_trainer_clients WHERE trainer_id=reference.owner_id AND client_id=NEW.owner_id))) THEN RAISE EXCEPTION 'Referenced plan is not available to this person' USING ERRCODE='23514'; END IF;
    IF NEW.kind='meal_event' AND ((p->>'meal_index')::int<0 OR (p->>'meal_index')::int>=jsonb_array_length(reference.payload->'meals')) THEN RAISE EXCEPTION 'Meal not in plan' USING ERRCODE='23514'; END IF;
    IF NEW.kind='dose' THEN
      IF TG_OP='INSERT' AND (NOT reference.payload->'times' @> jsonb_build_array(p->>'time') OR (p->>'date')::date<(reference.payload->>'start_date')::date OR reference.payload ? 'end_date' AND (p->>'date')::date>(reference.payload->>'end_date')::date) THEN RAISE EXCEPTION 'Dose is outside the schedule' USING ERRCODE='23514'; END IF;
      IF TG_OP='INSERT' THEN NEW.payload:=p || jsonb_build_object('name_snapshot',reference.payload->>'name','dose_snapshot',reference.payload->'dose','unit_snapshot',reference.payload->>'unit');
      ELSE NEW.payload:=p || jsonb_build_object('name_snapshot',OLD.payload->>'name_snapshot','dose_snapshot',OLD.payload->'dose_snapshot','unit_snapshot',OLD.payload->>'unit_snapshot'); END IF;
    END IF;
  END IF;
  IF NEW.kind IN ('review','reaction','report') THEN
    SELECT * INTO reference FROM kinra_v2_feature_records WHERE id=(p->>'subject_id')::uuid;
    IF reference.id IS NULL OR NOT kinra_v2_kinra_feature_visible(reference.id) THEN RAISE EXCEPTION 'Content not available' USING ERRCODE='23514'; END IF;
    IF NEW.kind='review' AND (reference.kind<>p->>'subject_type' OR reference.visibility<>'public' OR reference.owner_id=NEW.owner_id) THEN RAISE EXCEPTION 'Reviews need another published expert or facility' USING ERRCODE='23514'; END IF;
    IF NEW.kind='reaction' AND reference.kind NOT IN ('post','article') THEN RAISE EXCEPTION 'Unsupported reaction target' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind='group_member' OR NEW.kind='post' AND p ? 'group_id' THEN
    SELECT * INTO parent FROM kinra_v2_feature_records WHERE id=(p->>'group_id')::uuid AND kind='group';
    IF parent.id IS NULL OR kinra_v2_kinra_feature_blocked(parent.owner_id) THEN RAISE EXCEPTION 'Group not available' USING ERRCODE='23514'; END IF;
    IF NEW.kind='group_member' AND parent.visibility<>'public' AND parent.owner_id<>NEW.owner_id THEN RAISE EXCEPTION 'Group requires an invitation' USING ERRCODE='23514'; END IF;
    IF NEW.kind='post' AND parent.owner_id<>NEW.owner_id AND NOT EXISTS(SELECT 1 FROM kinra_v2_feature_records m WHERE m.kind='group_member' AND m.owner_id=NEW.owner_id AND m.payload->>'group_id'=parent.id::text) THEN RAISE EXCEPTION 'Join the group before posting' USING ERRCODE='23514'; END IF;
    IF parent.visibility='private' AND NEW.visibility='public' THEN RAISE EXCEPTION 'Private group content must stay private' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind IN ('organization_member','membership_plan') THEN
    SELECT * INTO parent FROM kinra_v2_feature_records WHERE id=(p->>'organization_id')::uuid AND kind='organization';
    IF parent.id IS NULL OR NOT kinra_v2_kinra_feature_visible(parent.id) OR NEW.kind='membership_plan' AND parent.owner_id<>NEW.owner_id OR NEW.kind='organization_member' AND parent.visibility<>'public' AND parent.owner_id<>NEW.owner_id THEN RAISE EXCEPTION 'Organization access required' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind='appointment' THEN
    IF (p->>'ends_at')::timestamptz<=(p->>'starts_at')::timestamptz OR (p->>'ends_at')::timestamptz-(p->>'starts_at')::timestamptz>interval '24 hours' THEN RAISE EXCEPTION 'Invalid appointment range' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM kinra_v2_trainer_clients WHERE trainer_id=(p->>'coach_id')::uuid AND client_id=NEW.owner_id) THEN RAISE EXCEPTION 'Connect to this coach first' USING ERRCODE='23514'; END IF;
    IF TG_OP='INSERT' AND p->>'status'<>'requested' OR TG_OP='UPDATE' AND (p->>'coach_id'<>OLD.payload->>'coach_id' OR p->>'status'='confirmed' AND auth.uid()::text<>p->>'coach_id') THEN RAISE EXCEPTION 'Only the coach confirms appointments' USING ERRCODE='23514'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p->>'coach_id',0));
    IF p->>'status'='confirmed' AND EXISTS(SELECT 1 FROM kinra_v2_feature_records a WHERE a.kind='appointment' AND a.id<>NEW.id AND a.payload->>'coach_id'=p->>'coach_id' AND a.payload->>'status'='confirmed' AND (a.payload->>'starts_at')::timestamptz<(p->>'ends_at')::timestamptz AND (a.payload->>'ends_at')::timestamptz>(p->>'starts_at')::timestamptz) THEN RAISE EXCEPTION 'This time is already booked' USING ERRCODE='23505'; END IF;
  END IF;
  NEW.dedupe_key:=CASE NEW.kind
    WHEN 'preferences' THEN 'singleton' WHEN 'notification_preferences' THEN 'singleton'
    WHEN 'dose' THEN concat(p->>'supplement_id','|',p->>'date','|',p->>'time')
    WHEN 'meal_event' THEN concat(p->>'plan_id','|',p->>'meal_index','|',p->>'date')
    WHEN 'habit_event' THEN concat(p->>'habit_id','|',p->>'date') WHEN 'steps' THEN p->>'date'
    WHEN 'saved' THEN concat(p->>'target_type','|',p->>'target_id') WHEN 'review' THEN concat(p->>'subject_type','|',p->>'subject_id')
    WHEN 'group_member' THEN p->>'group_id' WHEN 'organization_member' THEN p->>'organization_id'
    WHEN 'reaction' THEN concat(p->>'subject_id','|',p->>'type') WHEN 'block' THEN p->>'user_id' ELSE NULL END;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_feature_record BEFORE INSERT OR UPDATE ON public.kinra_v2_feature_records FOR EACH ROW EXECUTE FUNCTION public.kinra_v2_kinra_guard_feature();

CREATE FUNCTION public.kinra_v2_kinra_consume_meal(plan_id uuid, meal_index int, log_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE plan kinra_v2_feature_records; meal jsonb; food jsonb; entry kinra_v2_feature_records; ordinal int:=0; user_id uuid:=auth.uid();
BEGIN
  IF user_id IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
  SELECT * INTO plan FROM kinra_v2_feature_records r WHERE r.id=plan_id AND kind='nutrition_plan' FOR SHARE;
  IF plan.id IS NULL OR NOT (plan.owner_id=user_id AND plan.client_id IS NULL OR plan.client_id=user_id AND EXISTS(SELECT 1 FROM kinra_v2_trainer_clients WHERE trainer_id=plan.owner_id AND client_id=user_id)) THEN RAISE EXCEPTION 'Meal plan unavailable' USING ERRCODE='42501'; END IF;
  IF meal_index<0 OR meal_index>=jsonb_array_length(plan.payload->'meals') OR log_date IS NULL THEN RAISE EXCEPTION 'Invalid meal or date' USING ERRCODE='23514'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(user_id::text||plan_id::text||meal_index::text||log_date::text,0));
  SELECT * INTO entry FROM kinra_v2_feature_records r WHERE r.owner_id=user_id AND r.kind='meal_event' AND r.payload->>'plan_id'=plan_id::text AND (r.payload->>'meal_index')::int=meal_index AND r.payload->>'date'=log_date::text;
  IF entry.payload->>'status'='consumed' THEN RETURN; END IF;
  meal:=plan.payload->'meals'->meal_index;
  FOR food IN SELECT jsonb_array_elements(meal->'foods') LOOP
    INSERT INTO kinra_v2_nutrition_logs(user_id,log_date,meal,name,calories,protein,carbs,fat) VALUES(user_id,log_date,meal->>'name',food->>'name',(food->>'calories')::int,(food->>'protein')::numeric,(food->>'carbs')::numeric,(food->>'fat')::numeric);
    ordinal:=ordinal+1;
  END LOOP;
  IF entry.id IS NOT NULL THEN DELETE FROM kinra_v2_feature_records WHERE id=entry.id; END IF;
  INSERT INTO kinra_v2_feature_records(owner_id,kind,payload) VALUES(user_id,'meal_event',jsonb_build_object('plan_id',plan_id,'meal_index',meal_index,'date',log_date,'status','consumed','plan_snapshot',jsonb_build_object('name',meal->>'name','foods',meal->'foods')));
END $$;

CREATE FUNCTION public.kinra_v2_kinra_respond_appointment(record_id uuid,new_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE appointment kinra_v2_feature_records;
BEGIN
  SELECT * INTO appointment FROM kinra_v2_feature_records WHERE id=record_id AND kind='appointment' FOR UPDATE;
  IF auth.uid() IS NULL OR appointment.id IS NULL OR new_status NOT IN ('confirmed','cancelled') OR NOT (appointment.payload->>'coach_id'=auth.uid()::text OR appointment.owner_id=auth.uid() AND new_status='cancelled') THEN RAISE EXCEPTION 'Appointment access denied' USING ERRCODE='42501'; END IF;
  UPDATE kinra_v2_feature_records SET payload=jsonb_set(payload,'{status}',to_jsonb(new_status)) WHERE id=record_id;
END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_json_matches(jsonb,jsonb), public.kinra_v2_kinra_feature_blocked(uuid), public.kinra_v2_kinra_feature_visible(uuid), public.kinra_v2_kinra_group_visible(uuid), public.kinra_v2_kinra_guard_feature(), public.kinra_v2_kinra_consume_meal(uuid,int,date), public.kinra_v2_kinra_respond_appointment(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_json_matches(jsonb,jsonb), public.kinra_v2_kinra_feature_blocked(uuid), public.kinra_v2_kinra_feature_visible(uuid), public.kinra_v2_kinra_group_visible(uuid), public.kinra_v2_kinra_consume_meal(uuid,int,date), public.kinra_v2_kinra_respond_appointment(uuid,text) TO authenticated,service_role;


-- Source: 0006_training_metadata.sql
CREATE FUNCTION public.kinra_v2_kinra_valid_program_metadata(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE day jsonb; exercise jsonb; item jsonb; k text;
BEGIN
  FOR day IN SELECT jsonb_array_elements(value) LOOP
    FOR exercise IN SELECT jsonb_array_elements(day->'exercises') LOOP
      FOREACH k IN ARRAY ARRAY['catalogue_id','section','group','equipment','tempo','notes'] LOOP
        IF exercise ? k AND jsonb_typeof(exercise->k)<>'string' THEN RETURN false; END IF;
      END LOOP;
      IF exercise ? 'section' AND exercise->>'section' NOT IN ('warmup','main','cooldown') THEN RETURN false; END IF;
      IF exercise ? 'catalogue_id' AND (length(exercise->>'catalogue_id') NOT BETWEEN 1 AND 300 OR exercise->>'catalogue_id' !~ '^exercise-[0-9]{4}-[a-z0-9-]+$') THEN RETURN false; END IF;
      IF length(exercise->>'group')>100 OR length(exercise->>'equipment')>500 OR length(exercise->>'tempo')>100 OR length(exercise->>'notes')>10000 THEN RETURN false; END IF;
      IF exercise ? 'substitutions' THEN
        IF jsonb_typeof(exercise->'substitutions')<>'array' OR jsonb_array_length(exercise->'substitutions')>20 THEN RETURN false; END IF;
        FOR item IN SELECT jsonb_array_elements(exercise->'substitutions') LOOP
          IF jsonb_typeof(item)<>'string' OR length(trim(item #>> '{}')) NOT BETWEEN 1 AND 200 THEN RETURN false; END IF;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_valid_program_metadata(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_valid_program_metadata(jsonb) TO authenticated,service_role;
ALTER TABLE public.kinra_v2_programs ADD CONSTRAINT program_metadata_valid CHECK (public.kinra_v2_kinra_valid_program_metadata(days)) NOT VALID;


-- Source: 0007_erase_data.sql
-- Deletes only this application's records. Shared auth identities and legacy
-- app data remain untouched. Storage binaries are removed by the app first.
CREATE FUNCTION public.kinra_v2_kinra_erase_data(confirmation text,expected_owner uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR confirmation IS DISTINCT FROM 'DELETE KINRA DATA' THEN RAISE EXCEPTION 'Deletion confirmation and matching account required' USING ERRCODE='42501'; END IF;
  DELETE FROM kinra_v2_feature_records WHERE owner_id=actor OR client_id=actor OR kind='message' AND payload->>'recipient_id'=actor::text;
  -- Optional coaching tables already exist in the production namespace.
  IF to_regclass('public.kinra_v2_message_receipts') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_message_receipts WHERE reader_id=$1 OR message_id IN (SELECT id FROM public.kinra_v2_trainer_notes WHERE trainer_id=$1 OR client_id=$1)' USING actor; END IF;
  IF to_regclass('public.kinra_v2_check_ins') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_check_ins WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.kinra_v2_check_in_schedules') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_check_in_schedules WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.kinra_v2_calendar_events') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_calendar_events WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.kinra_v2_habit_completions') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_habit_completions WHERE client_id=$1 OR habit_id IN (SELECT id FROM public.kinra_v2_habits WHERE trainer_id=$1)' USING actor; END IF;
  IF to_regclass('public.kinra_v2_habits') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_habits WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.kinra_v2_coach_branding') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_coach_branding WHERE trainer_id=$1' USING actor; END IF;
  IF to_regclass('public.kinra_v2_push_subscriptions') IS NOT NULL THEN EXECUTE 'DELETE FROM public.kinra_v2_push_subscriptions WHERE user_id=$1' USING actor; END IF;
  DELETE FROM kinra_v2_progress_reports WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM kinra_v2_trainer_notes WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM kinra_v2_program_assignments WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM kinra_v2_programs WHERE trainer_id=actor;
  DELETE FROM kinra_v2_trainer_clients WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM kinra_v2_workouts WHERE user_id=actor;
  DELETE FROM kinra_v2_nutrition_logs WHERE user_id=actor;
  DELETE FROM kinra_v2_sleep_logs WHERE user_id=actor;
  DELETE FROM kinra_v2_journal_entries WHERE user_id=actor;
  DELETE FROM kinra_v2_body_metrics WHERE user_id=actor;
  DELETE FROM kinra_v2_progress_photos WHERE user_id=actor;
  DELETE FROM kinra_v2_user_roles WHERE user_id=actor;
  DELETE FROM kinra_v2_profiles WHERE id=actor;
END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_erase_data(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_erase_data(text,uuid) TO authenticated,service_role;


-- Source: 0008_message_compatibility.sql
-- Reuse the existing conversation store. New installations get the minimum
-- sender metadata; deployments with richer media/reply fields retain them.
ALTER TABLE public.kinra_v2_trainer_notes ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.kinra_v2_trainer_notes ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'text';
CREATE FUNCTION public.kinra_v2_kinra_send_message(recipient_id uuid,body text,expected_owner uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); trainer uuid; client uuid; message_id uuid;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR length(trim(body)) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Matching account and a message are required' USING ERRCODE='42501'; END IF;
  SELECT trainer_id,client_id INTO trainer,client FROM kinra_v2_trainer_clients WHERE trainer_id=actor AND client_id=recipient_id OR trainer_id=recipient_id AND client_id=actor;
  IF trainer IS NULL THEN RAISE EXCEPTION 'Choose a connected coach or client' USING ERRCODE='42501'; END IF;
  INSERT INTO kinra_v2_trainer_notes(trainer_id,client_id,sender_id,body,shared,kind) VALUES(trainer,client,actor,trim(body),true,'text') RETURNING id INTO message_id;
  RETURN message_id;
END $$;
-- Existing stricter deployment policies stay in place. This rule grants only
-- the participants' shared conversation to an active connection on fresh DBs.
CREATE POLICY "Kinra v2: Connected shared message reads" ON public.kinra_v2_trainer_notes FOR SELECT TO authenticated USING (
  shared AND (auth.uid()=trainer_id OR auth.uid()=client_id) AND EXISTS(SELECT 1 FROM kinra_v2_trainer_clients c WHERE c.trainer_id=kinra_v2_trainer_notes.trainer_id AND c.client_id=kinra_v2_trainer_notes.client_id)
);
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_send_message(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_send_message(uuid,text,uuid) TO authenticated,service_role;
CREATE POLICY "Kinra v2: Shared replies need an active recipient connection" ON public.kinra_v2_trainer_notes AS RESTRICTIVE FOR SELECT TO authenticated USING (
  coalesce(sender_id,trainer_id)=auth.uid() OR EXISTS(SELECT 1 FROM kinra_v2_trainer_clients c WHERE c.trainer_id=kinra_v2_trainer_notes.trainer_id AND c.client_id=kinra_v2_trainer_notes.client_id AND (auth.uid()=c.trainer_id OR auth.uid()=c.client_id))
);
CREATE FUNCTION public.kinra_v2_kinra_guard_message_sender() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.trainer_id<>OLD.trainer_id OR NEW.client_id<>OLD.client_id) THEN RAISE EXCEPTION 'Message participants are immutable' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND NEW.sender_id IS NULL THEN NEW.sender_id:=auth.uid(); END IF;
  IF TG_OP='INSERT' AND auth.uid() IS NOT NULL AND NEW.sender_id<>auth.uid() THEN RAISE EXCEPTION 'Message sender must match the account' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_message_sender BEFORE INSERT OR UPDATE ON public.kinra_v2_trainer_notes FOR EACH ROW EXECUTE FUNCTION public.kinra_v2_kinra_guard_message_sender();
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_guard_message_sender() FROM PUBLIC,anon;


-- Existing Supabase identities receive a v2 profile; roles are chosen in v2.
INSERT INTO public.kinra_v2_profiles(id, display_name)
SELECT id, left(coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', split_part(email,'@',1), 'Member'),80) FROM auth.users
ON CONFLICT(id) DO NOTHING;
COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0008_message_compatibility';
NOTIFY pgrst, 'reload schema';
COMMIT;
