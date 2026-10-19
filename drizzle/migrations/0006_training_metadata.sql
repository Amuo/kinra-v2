CREATE FUNCTION public.kinra_valid_program_metadata(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
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
REVOKE ALL ON FUNCTION public.kinra_valid_program_metadata(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_valid_program_metadata(jsonb) TO authenticated,service_role;
ALTER TABLE public.programs ADD CONSTRAINT program_metadata_valid CHECK (public.kinra_valid_program_metadata(days)) NOT VALID;
