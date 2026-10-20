-- Additive JSON extensions: completed strength history is never rewritten.
CREATE FUNCTION public.kinra_valid_cardio_metrics(value jsonb, required boolean) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE key text; amount numeric;
BEGIN
 IF jsonb_typeof(value) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
 FOR key IN SELECT jsonb_object_keys(value) LOOP
  IF key NOT IN ('duration_seconds','distance_m','speed_kmh','incline_percent') OR jsonb_typeof(value->key) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
  amount:=(value->>key)::numeric;
  IF key='duration_seconds' AND (amount<=0 OR amount>86400 OR amount<>trunc(amount)) OR key='distance_m' AND (amount<=0 OR amount>10000000) OR key='speed_kmh' AND (amount<0 OR amount>200) OR key='incline_percent' AND (amount< -100 OR amount>100) THEN RETURN false; END IF;
 END LOOP;
 RETURN NOT required OR value ? 'duration_seconds' OR value ? 'distance_m';
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE FUNCTION public.kinra_valid_cardio_sets(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE item jsonb;
BEGIN
 FOR item IN SELECT jsonb_array_elements(value) LOOP
  IF item ? 'tracking' THEN
   IF item->>'tracking' IS DISTINCT FROM 'cardio' OR (item->>'reps')::numeric<>0 OR (item->>'weight')::numeric<>0 OR NOT public.kinra_valid_cardio_metrics(item->'cardio',true) THEN RETURN false; END IF;
  ELSIF item ? 'cardio' THEN RETURN false;
  END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE FUNCTION public.kinra_valid_cardio_program(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE day jsonb; item jsonb;
BEGIN
 FOR day IN SELECT jsonb_array_elements(value) LOOP
  FOR item IN SELECT jsonb_array_elements(day->'exercises') LOOP
   IF item ? 'tracking' THEN
    IF item->>'tracking' IS DISTINCT FROM 'cardio' OR NOT public.kinra_valid_cardio_metrics(item->'cardio',true) OR (item ? 'weight' AND jsonb_typeof(item->'weight')<>'null' AND (item->>'weight')::numeric<>0) THEN RETURN false; END IF;
   ELSIF item ? 'cardio' THEN RETURN false;
   END IF;
  END LOOP;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.kinra_valid_cardio_metrics(jsonb,boolean), public.kinra_valid_cardio_sets(jsonb),public.kinra_valid_cardio_program(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_valid_cardio_metrics(jsonb,boolean), public.kinra_valid_cardio_sets(jsonb),public.kinra_valid_cardio_program(jsonb) TO authenticated,service_role;
ALTER TABLE public.workouts ADD CONSTRAINT workout_cardio_valid CHECK (public.kinra_valid_cardio_sets(sets)) NOT VALID;
ALTER TABLE public.programs ADD CONSTRAINT program_cardio_valid CHECK (public.kinra_valid_cardio_program(days)) NOT VALID;
ALTER TABLE public.feature_records DROP CONSTRAINT feature_client_kinds;
ALTER TABLE public.feature_records ADD CONSTRAINT feature_client_kinds CHECK(client_id IS NULL OR kind IN ('nutrition_plan','supplement','supplement_plan','video_plan'));

-- Plans are private or explicitly assigned. Events belong to the person doing them.
CREATE FUNCTION public.kinra_guard_program_collection() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item jsonb; source public.feature_records; seen text[]:='{}'; slots int; title text;
BEGIN
 IF NEW.kind IN ('supplement_plan','video_plan') THEN
  FOR item IN SELECT jsonb_array_elements(CASE WHEN NEW.kind='supplement_plan' THEN NEW.payload->'supplements' ELSE NEW.payload->'videos' END) LOOP
   IF item->>'id'=ANY(seen) THEN RAISE EXCEPTION 'Use distinct program items.' USING ERRCODE='23514'; END IF;
   seen:=array_append(seen,item->>'id');
   IF NEW.kind='supplement_plan' THEN
    SELECT count(DISTINCT t) INTO slots FROM jsonb_array_elements_text(item->'times') t;
    IF slots<>jsonb_array_length(item->'times') THEN RAISE EXCEPTION 'Use distinct dose times.' USING ERRCODE='23514'; END IF;
   ELSIF NOT public.kinra_safe_external_url(item->>'url') OR item->>'url' NOT LIKE 'https://%' THEN RAISE EXCEPTION 'Use an HTTPS video link without credentials or control characters.' USING ERRCODE='23514';
   END IF;
  END LOOP;
 ELSIF NEW.kind='video_event' THEN
  IF TG_OP='UPDATE' THEN
   IF NEW.payload->>'plan_id' IS DISTINCT FROM OLD.payload->>'plan_id' OR NEW.payload->>'video_id' IS DISTINCT FROM OLD.payload->>'video_id' OR NEW.payload->>'date' IS DISTINCT FROM OLD.payload->>'date' THEN RAISE EXCEPTION 'Event identity is immutable.' USING ERRCODE='23514'; END IF;
   title:=OLD.payload->>'title_snapshot';
  ELSE
   SELECT * INTO source FROM public.feature_records r WHERE r.id=(NEW.payload->>'plan_id')::uuid AND r.kind='video_plan';
   IF source.id IS NULL OR public.kinra_feature_blocked(source.owner_id) OR NOT(source.owner_id=NEW.owner_id AND source.client_id IS NULL OR source.client_id=NEW.owner_id AND EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.trainer_id=source.owner_id AND c.client_id=NEW.owner_id)) THEN RAISE EXCEPTION 'Video program unavailable.' USING ERRCODE='42501'; END IF;
   SELECT v->>'title' INTO title FROM jsonb_array_elements(source.payload->'videos') v WHERE v->>'id'=NEW.payload->>'video_id';
   IF title IS NULL THEN RAISE EXCEPTION 'Video is not in this program.' USING ERRCODE='23514'; END IF;
  END IF;
  NEW.payload:=NEW.payload||jsonb_build_object('title_snapshot',title);
  NEW.dedupe_key:=concat(NEW.payload->>'plan_id','|',NEW.payload->>'video_id','|',NEW.payload->>'date');
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.kinra_guard_program_collection() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_program_collection BEFORE INSERT OR UPDATE ON public.feature_records FOR EACH ROW EXECUTE FUNCTION public.kinra_guard_program_collection();

CREATE TABLE public.supplement_plan_activations (
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 plan_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 start_on date NOT NULL,
 supplement_ids uuid[] NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,plan_id,start_on)
);
ALTER TABLE public.supplement_plan_activations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplement_plan_activations FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.supplement_plan_activations TO authenticated;
GRANT ALL ON public.supplement_plan_activations TO service_role;
CREATE POLICY "Own supplement activation receipts" ON public.supplement_plan_activations FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
CREATE INDEX supplement_activation_plan ON public.supplement_plan_activations(plan_id);

CREATE FUNCTION public.kinra_activate_supplement_plan(plan_id uuid,start_on date,expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); source public.feature_records; ids uuid[]; item jsonb; target uuid; content jsonb;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor) THEN RAISE EXCEPTION 'Sign in with the matching Kinra account.' USING ERRCODE='42501'; END IF;
 IF start_on IS NULL OR start_on<'1900-01-01'::date OR start_on>'2200-12-31'::date THEN RAISE EXCEPTION 'Choose a valid start date.' USING ERRCODE='22023'; END IF;
 SELECT * INTO source FROM public.feature_records r WHERE r.id=plan_id AND r.kind='supplement_plan' FOR SHARE;
 IF source.id IS NULL OR public.kinra_feature_blocked(source.owner_id) OR NOT(source.owner_id=actor AND source.client_id IS NULL OR source.client_id=actor AND EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.trainer_id=source.owner_id AND c.client_id=actor)) THEN RAISE EXCEPTION 'Supplement program unavailable.' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||plan_id::text||start_on::text,0));
 SELECT a.supplement_ids INTO ids FROM public.supplement_plan_activations a WHERE a.owner_id=actor AND a.plan_id=kinra_activate_supplement_plan.plan_id AND a.start_on=kinra_activate_supplement_plan.start_on;
 IF ids IS NOT NULL THEN RETURN jsonb_build_object('ids',ids,'alreadyActivated',true); END IF;
 ids:='{}';
 FOR item IN SELECT jsonb_array_elements(source.payload->'supplements') LOOP
  target:=gen_random_uuid();
  content:=(item-'id')||jsonb_build_object('start_date',start_on,'end_date',start_on+(source.payload->>'weeks')::int*7-1,'protocol',source.payload->>'title');
  INSERT INTO public.feature_records(id,owner_id,kind,payload) VALUES(target,actor,'supplement',content);
  ids:=array_append(ids,target);
 END LOOP;
 INSERT INTO public.supplement_plan_activations(owner_id,plan_id,start_on,supplement_ids) VALUES(actor,plan_id,start_on,ids);
 RETURN jsonb_build_object('ids',ids,'alreadyActivated',false);
END $$;
REVOKE ALL ON FUNCTION public.kinra_activate_supplement_plan(uuid,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_activate_supplement_plan(uuid,date,uuid) TO authenticated,service_role;
