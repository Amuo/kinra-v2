-- Source: 0026_legacy_tracking_compat.sql
-- Existing hosted v2 installations also have the earlier timed/distance
-- validator. Extend its accepted discriminator without removing its checks.
DO $compat$ DECLARE definition text;
BEGIN
 IF to_regprocedure('public.kinra_v2_kinra_valid_tracking(jsonb,boolean)') IS NOT NULL THEN
  SELECT pg_get_functiondef('public.kinra_v2_kinra_valid_tracking(jsonb,boolean)'::regprocedure) INTO definition;
  IF position('NOT IN(''reps'',''seconds'',''meters'')' IN definition)>0 THEN
   EXECUTE replace(definition,'NOT IN(''reps'',''seconds'',''meters'')','NOT IN(''reps'',''seconds'',''meters'',''cardio'')');
  ELSIF position('NOT IN(''reps'',''seconds'',''meters'',''cardio'')' IN definition)=0 THEN
   RAISE EXCEPTION 'Review the existing tracking validator before upgrading.';
  END IF;
 END IF;
END $compat$;
CREATE OR REPLACE FUNCTION public.kinra_v2_kinra_valid_cardio_sets(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE item jsonb; amount numeric;
BEGIN
 FOR item IN SELECT jsonb_array_elements(value) LOOP
  IF item->>'tracking'='cardio' THEN
   IF (item->>'reps')::numeric<>0 OR (item->>'weight')::numeric<>0 OR NOT public.kinra_v2_kinra_valid_cardio_metrics(item->'cardio',true) THEN RETURN false; END IF;
  ELSE
   IF item ? 'cardio' OR item ? 'tracking' AND (jsonb_typeof(item->'tracking')<>'string' OR item->>'tracking' NOT IN ('reps','seconds','meters')) THEN RETURN false; END IF;
   IF item->>'tracking' IN ('seconds','meters') THEN
    IF (item->>'reps')::numeric<>0 THEN RETURN false; END IF;
    IF item->>'tracking'='seconds' THEN
     IF jsonb_typeof(item->'duration_seconds') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
     amount:=(item->>'duration_seconds')::numeric; IF amount<=0 OR amount>86400 THEN RETURN false; END IF;
    ELSE
     IF jsonb_typeof(item->'distance_meters') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
     amount:=(item->>'distance_meters')::numeric; IF amount<=0 OR amount>1000000 THEN RETURN false; END IF;
    END IF;
   ELSIF item ? 'duration_seconds' OR item ? 'distance_meters' THEN RETURN false;
   END IF;
  END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE OR REPLACE FUNCTION public.kinra_v2_kinra_valid_cardio_program(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE day jsonb; item jsonb;
BEGIN
 FOR day IN SELECT jsonb_array_elements(value) LOOP
  FOR item IN SELECT jsonb_array_elements(day->'exercises') LOOP
   IF item->>'tracking'='cardio' THEN
    IF NOT public.kinra_v2_kinra_valid_cardio_metrics(item->'cardio',true) OR (item ? 'weight' AND jsonb_typeof(item->'weight')<>'null' AND (item->>'weight')::numeric<>0) THEN RETURN false; END IF;
   ELSIF item ? 'cardio' OR item ? 'tracking' AND (jsonb_typeof(item->'tracking')<>'string' OR item->>'tracking' NOT IN ('reps','seconds','meters')) THEN RETURN false;
   END IF;
  END LOOP;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;



COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0026_legacy_tracking_compat';
NOTIFY pgrst, 'reload schema';
