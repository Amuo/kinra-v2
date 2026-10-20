-- Source: 0028_supplement_revision_validation.sql
-- A stale review is a validation error, not a retryable transaction conflict.
DO $validation$ DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.kinra_v2_kinra_activate_supplement_plan(uuid,date,uuid,timestamptz)'::regprocedure) INTO definition;
 EXECUTE replace(definition,'ERRCODE=''40001''','ERRCODE=''22023''');
END $validation$;



COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0028_supplement_revision_validation';
NOTIFY pgrst, 'reload schema';
