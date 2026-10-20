-- A stale review is a validation error, not a retryable transaction conflict.
DO $validation$ DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.kinra_activate_supplement_plan(uuid,date,uuid,timestamptz)'::regprocedure) INTO definition;
 EXECUTE replace(definition,'ERRCODE=''40001''','ERRCODE=''22023''');
END $validation$;
