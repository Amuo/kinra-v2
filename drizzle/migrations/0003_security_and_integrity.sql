-- Additive repair. NOT VALID checks enforce new writes without deleting or
-- silently rewriting existing health records. See README.md for validation.

ALTER TABLE public.profiles ADD CONSTRAINT profile_avatar_owner
  CHECK (avatar_path IS NULL OR split_part(avatar_path, '/', 1) = id::text) NOT VALID;
DROP POLICY "Visible profiles have readable avatars" ON storage.objects;
CREATE POLICY "Visible profiles have readable avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-avatars' AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1] AND p.avatar_path = name
  ));

CREATE UNIQUE INDEX programs_id_trainer_unique ON public.programs(id, trainer_id);
ALTER TABLE public.program_assignments ADD CONSTRAINT assigned_program_owner
  FOREIGN KEY (program_id, trainer_id) REFERENCES public.programs(id, trainer_id) ON DELETE CASCADE NOT VALID;
DROP POLICY "assigned client reads" ON public.programs;
CREATE POLICY "assigned client reads" ON public.programs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.program_assignments a
    WHERE a.program_id = programs.id AND a.trainer_id = programs.trainer_id AND a.client_id = auth.uid()));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_trainer_of(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_trainer_by_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.is_trainer_of(uuid), public.find_trainer_by_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.find_trainer_by_code(_code text)
RETURNS TABLE(id uuid, display_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND upper(trim(_code)) ~ '^[A-Z0-9]{6}$'
    AND p.trainer_code = upper(trim(_code)) AND public.has_role(p.id, 'trainer')
$$;

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-avatars', 'profile-avatars', false, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
       ('progress-photos', 'progress-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.nutrition_logs
  ALTER COLUMN protein TYPE numeric(10,1),
  ALTER COLUMN carbs TYPE numeric(10,1),
  ALTER COLUMN fat TYPE numeric(10,1);

ALTER TABLE public.profiles ADD CONSTRAINT profile_text_limits CHECK (
  (display_name IS NULL OR length(display_name) BETWEEN 1 AND 80) AND
  (goal IS NULL OR length(goal) <= 160) AND (bio IS NULL OR length(bio) <= 500)) NOT VALID;
ALTER TABLE public.sleep_logs ADD CONSTRAINT sleep_value_ranges CHECK (hours BETWEEN 0 AND 24 AND quality BETWEEN 1 AND 5) NOT VALID;
ALTER TABLE public.nutrition_logs ADD CONSTRAINT food_value_ranges CHECK (
  calories BETWEEN 0 AND 1000000 AND protein BETWEEN 0 AND 1000000 AND carbs BETWEEN 0 AND 1000000 AND fat BETWEEN 0 AND 1000000
  AND length(trim(name)) BETWEEN 1 AND 300 AND length(trim(meal)) BETWEEN 1 AND 100) NOT VALID;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_value_ranges CHECK (
  mood BETWEEN 1 AND 5 AND energy BETWEEN 1 AND 5 AND (body IS NULL OR length(body) <= 10000)) NOT VALID;
ALTER TABLE public.body_metrics ADD CONSTRAINT body_value_ranges CHECK (
  (weight IS NULL OR weight > 0 AND weight <= 700) AND (body_fat IS NULL OR body_fat BETWEEN 0 AND 100)
  AND (weight IS NOT NULL OR body_fat IS NOT NULL)) NOT VALID;
ALTER TABLE public.workouts ADD CONSTRAINT workout_value_ranges CHECK (
  length(trim(title)) BETWEEN 1 AND 200 AND (duration_min IS NULL OR duration_min BETWEEN 1 AND 1440)
  AND (rpe IS NULL OR rpe BETWEEN 1 AND 10) AND (notes IS NULL OR length(notes) <= 10000)) NOT VALID;

CREATE FUNCTION public.kinra_valid_sets(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
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

CREATE FUNCTION public.kinra_valid_program_days(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
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
REVOKE ALL ON FUNCTION public.kinra_valid_sets(jsonb), public.kinra_valid_program_days(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kinra_valid_sets(jsonb), public.kinra_valid_program_days(jsonb) TO authenticated, service_role;
ALTER TABLE public.workouts ADD CONSTRAINT workout_sets_valid CHECK (public.kinra_valid_sets(sets)) NOT VALID;
ALTER TABLE public.programs ADD CONSTRAINT program_value_ranges CHECK (
  length(trim(name)) BETWEEN 1 AND 200 AND (description IS NULL OR length(description) <= 10000)
  AND weeks BETWEEN 1 AND 104 AND public.kinra_valid_program_days(days)) NOT VALID;
ALTER TABLE public.progress_reports ADD CONSTRAINT report_value_ranges CHECK (
  period_days BETWEEN 1 AND 365 AND jsonb_typeof(summary) = 'object' AND (comment IS NULL OR length(comment) <= 10000)) NOT VALID;
ALTER TABLE public.trainer_notes ADD CONSTRAINT note_value_ranges CHECK (length(trim(body)) BETWEEN 1 AND 10000) NOT VALID;
ALTER TABLE public.progress_photos ADD CONSTRAINT progress_photo_owner_path CHECK (split_part(storage_path, '/', 1) = user_id::text) NOT VALID;

CREATE INDEX workouts_owner_time ON public.workouts(user_id, performed_at DESC, id);
CREATE INDEX sleep_owner_date ON public.sleep_logs(user_id, log_date DESC, id);
CREATE INDEX nutrition_owner_date ON public.nutrition_logs(user_id, log_date DESC, id);
CREATE INDEX journal_owner_time ON public.journal_entries(user_id, created_at DESC, id);
CREATE INDEX metrics_owner_date ON public.body_metrics(user_id, log_date DESC, id);
CREATE INDEX connections_client ON public.trainer_clients(client_id);
CREATE INDEX assignments_client_time ON public.program_assignments(client_id, created_at DESC);
