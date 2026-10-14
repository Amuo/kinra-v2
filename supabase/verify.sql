-- Run as postgres in the linked Kinra database. Synthetic writes roll back.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','f4ebc98c-f2f0-4e2e-aa9f-3b766d3f1011',true);
INSERT INTO public.kinra_v2_workouts(id,title) VALUES('f4ebc98c-f2f0-4e2e-aa9f-3b766d3f1099','Synthetic isolation verification');
DO $$ BEGIN
  IF (SELECT count(*) FROM public.kinra_v2_workouts WHERE id='f4ebc98c-f2f0-4e2e-aa9f-3b766d3f1099') <> 1 THEN RAISE EXCEPTION 'Owner read failed'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','f4ebc98c-f2f0-4e2e-aa9f-3b766d3f1022',true);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.kinra_v2_workouts WHERE id='f4ebc98c-f2f0-4e2e-aa9f-3b766d3f1099') THEN RAISE EXCEPTION 'Cross-account read allowed'; END IF;
  BEGIN
    INSERT INTO public.kinra_v2_workouts(user_id,title) VALUES('f4ebc98c-f2f0-4e2e-aa9f-3b766d3f1011','Must be rejected');
    RAISE EXCEPTION 'Cross-account write allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'Account isolation passed; synthetic writes rolled back' AS result;
SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'kinra_v2_%' ORDER BY tablename;
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id LIKE 'kinra-v2-%';
SELECT has_function_privilege('anon','public.kinra_v2_find_trainer_by_code(text)','execute') AS anonymous_lookup_allowed;
