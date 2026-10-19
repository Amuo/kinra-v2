-- Structured feature records. All payloads are checked against the same strict
-- schemas used by the application; public content and health data cannot share
-- visibility. This migration is additive and preserves existing logs.
CREATE FUNCTION public.kinra_json_matches(value jsonb, spec jsonb) RETURNS boolean
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
        IF NOT public.kinra_json_matches(v,spec->'properties'->k) THEN RETURN false; END IF;
      ELSIF spec ? 'values' THEN
        IF length(k)>100 OR NOT public.kinra_json_matches(v,spec->'values') THEN RETURN false; END IF;
      ELSE RETURN false;
      END IF;
    END LOOP;
  ELSIF spec->>'type' = 'array' THEN
    IF jsonb_array_length(value) < (spec->>'min')::int OR jsonb_array_length(value) > (spec->>'max')::int THEN RETURN false; END IF;
    FOR v IN SELECT jsonb_array_elements(value) LOOP
      IF NOT public.kinra_json_matches(v,spec->'items') THEN RETURN false; END IF;
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

CREATE TABLE public.feature_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_payload_shape CHECK (coalesce(public.kinra_json_matches(payload, public.kinra_feature_schemas()->kind),false)),
  CONSTRAINT feature_public_kinds CHECK (visibility='private' OR kind IN ('expert','facility','review','group','group_member','post','reaction','article','organization','organization_member','membership_plan')),
  CONSTRAINT feature_client_kinds CHECK (client_id IS NULL OR kind IN ('nutrition_plan','supplement')),
  CONSTRAINT feature_public_unassigned CHECK (client_id IS NULL OR visibility='private'),
  UNIQUE(owner_id, kind, dedupe_key)
);
CREATE INDEX feature_kind_created ON public.feature_records(kind,created_at DESC,id);
CREATE INDEX feature_client ON public.feature_records(client_id) WHERE client_id IS NOT NULL;
ALTER TABLE public.feature_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feature_records FROM anon, PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.feature_records TO authenticated;

CREATE FUNCTION public.kinra_feature_blocked(other_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM feature_records WHERE kind='block' AND
    (owner_id=auth.uid() AND payload->>'user_id'=other_id::text OR owner_id=other_id AND payload->>'user_id'=auth.uid()::text))
$$;
CREATE FUNCTION public.kinra_feature_visible(record_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM feature_records r WHERE r.id=record_id AND (
    r.owner_id=auth.uid() OR r.visibility='public' AND NOT kinra_feature_blocked(r.owner_id) AND
      (r.kind<>'post' OR NOT r.payload ? 'group_id' OR EXISTS(SELECT 1 FROM feature_records g WHERE g.kind='group' AND g.id=(r.payload->>'group_id')::uuid AND NOT kinra_feature_blocked(g.owner_id) AND (g.visibility='public' OR g.owner_id=auth.uid() OR EXISTS(SELECT 1 FROM feature_records m WHERE m.kind='group_member' AND m.owner_id=auth.uid() AND m.payload->>'group_id'=g.id::text)))) OR
    r.client_id=auth.uid() AND EXISTS(SELECT 1 FROM trainer_clients c WHERE c.client_id=r.client_id AND c.trainer_id=r.owner_id)))
$$;
CREATE FUNCTION public.kinra_group_visible(group_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM feature_records g WHERE g.id=group_id AND g.kind='group' AND NOT kinra_feature_blocked(g.owner_id) AND (
    g.owner_id=auth.uid() OR g.visibility='public' OR EXISTS(SELECT 1 FROM feature_records m WHERE m.owner_id=auth.uid() AND m.kind='group_member' AND m.payload->>'group_id'=g.id::text)))
$$;
CREATE POLICY "Feature record audience" ON public.feature_records FOR SELECT TO authenticated USING (
  owner_id=auth.uid() OR
  kind='message' AND payload->>'recipient_id'=auth.uid()::text AND EXISTS(SELECT 1 FROM trainer_clients c WHERE c.trainer_id=owner_id AND c.client_id=auth.uid() OR c.trainer_id=auth.uid() AND c.client_id=owner_id) OR
  visibility='public' AND NOT public.kinra_feature_blocked(owner_id) AND
    (kind<>'post' OR NOT payload ? 'group_id' OR public.kinra_group_visible((payload->>'group_id')::uuid)) OR
  client_id=auth.uid() AND EXISTS(SELECT 1 FROM trainer_clients c WHERE c.trainer_id=owner_id AND c.client_id=auth.uid()) OR
  kind='appointment' AND payload->>'coach_id'=auth.uid()::text
);
CREATE POLICY "Owner creates feature record" ON public.feature_records FOR INSERT TO authenticated WITH CHECK (
  owner_id=auth.uid() AND (client_id IS NULL OR public.is_trainer_of(client_id)) AND
  (kind<>'meal_event' OR payload->>'status'='skipped')
);
CREATE POLICY "Owner changes feature record" ON public.feature_records FOR UPDATE TO authenticated USING (
  owner_id=auth.uid() AND (kind<>'meal_event' OR payload->>'status'='skipped')
) WITH CHECK (
  owner_id=auth.uid() AND (client_id IS NULL OR public.is_trainer_of(client_id)) AND
  (kind<>'meal_event' OR payload->>'status'='skipped')
);
CREATE POLICY "Owner deletes feature record" ON public.feature_records FOR DELETE TO authenticated USING (
  owner_id=auth.uid() AND (kind<>'meal_event' OR payload->>'status'<>'consumed')
);

CREATE FUNCTION public.kinra_guard_feature() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb; reference feature_records; parent feature_records; field text; unit text; measurement text; time_count int;
BEGIN
  p:=NEW.payload;
  IF TG_OP='UPDATE' THEN
    IF NEW.owner_id<>OLD.owner_id OR NEW.kind<>OLD.kind OR NEW.id<>OLD.id THEN RAISE EXCEPTION 'Record identity is immutable' USING ERRCODE='23514'; END IF;
    NEW.created_at:=OLD.created_at;
  ELSE NEW.created_at:=now(); END IF;
  NEW.updated_at:=now();
  IF NEW.kind='message' THEN
    IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Sent messages cannot be edited' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM trainer_clients c WHERE c.trainer_id=NEW.owner_id AND c.client_id=(p->>'recipient_id')::uuid OR c.client_id=NEW.owner_id AND c.trainer_id=(p->>'recipient_id')::uuid) OR p->>'recipient_id'=NEW.owner_id::text THEN RAISE EXCEPTION 'Choose a connected coach or client' USING ERRCODE='23514'; END IF;
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
    SELECT * INTO reference FROM feature_records WHERE id=(p->>field)::uuid AND kind=CASE NEW.kind WHEN 'dose' THEN 'supplement' WHEN 'medication_event' THEN 'medication' WHEN 'habit_event' THEN 'habit' ELSE 'nutrition_plan' END;
    IF TG_OP='UPDATE' AND (p->>field IS DISTINCT FROM OLD.payload->>field OR p->>'date' IS DISTINCT FROM OLD.payload->>'date' OR p->>'time' IS DISTINCT FROM OLD.payload->>'time') THEN RAISE EXCEPTION 'Event identity is immutable' USING ERRCODE='23514'; END IF;
    IF TG_OP='INSERT' AND (reference.id IS NULL OR NOT (reference.owner_id=NEW.owner_id AND reference.client_id IS NULL OR reference.client_id=NEW.owner_id AND EXISTS(SELECT 1 FROM trainer_clients WHERE trainer_id=reference.owner_id AND client_id=NEW.owner_id))) THEN RAISE EXCEPTION 'Referenced plan is not available to this person' USING ERRCODE='23514'; END IF;
    IF NEW.kind='meal_event' AND ((p->>'meal_index')::int<0 OR (p->>'meal_index')::int>=jsonb_array_length(reference.payload->'meals')) THEN RAISE EXCEPTION 'Meal not in plan' USING ERRCODE='23514'; END IF;
    IF NEW.kind='dose' THEN
      IF TG_OP='INSERT' AND (NOT reference.payload->'times' @> jsonb_build_array(p->>'time') OR (p->>'date')::date<(reference.payload->>'start_date')::date OR reference.payload ? 'end_date' AND (p->>'date')::date>(reference.payload->>'end_date')::date) THEN RAISE EXCEPTION 'Dose is outside the schedule' USING ERRCODE='23514'; END IF;
      IF TG_OP='INSERT' THEN NEW.payload:=p || jsonb_build_object('name_snapshot',reference.payload->>'name','dose_snapshot',reference.payload->'dose','unit_snapshot',reference.payload->>'unit');
      ELSE NEW.payload:=p || jsonb_build_object('name_snapshot',OLD.payload->>'name_snapshot','dose_snapshot',OLD.payload->'dose_snapshot','unit_snapshot',OLD.payload->>'unit_snapshot'); END IF;
    END IF;
  END IF;
  IF NEW.kind IN ('review','reaction','report') THEN
    SELECT * INTO reference FROM feature_records WHERE id=(p->>'subject_id')::uuid;
    IF reference.id IS NULL OR NOT kinra_feature_visible(reference.id) THEN RAISE EXCEPTION 'Content not available' USING ERRCODE='23514'; END IF;
    IF NEW.kind='review' AND (reference.kind<>p->>'subject_type' OR reference.visibility<>'public' OR reference.owner_id=NEW.owner_id) THEN RAISE EXCEPTION 'Reviews need another published expert or facility' USING ERRCODE='23514'; END IF;
    IF NEW.kind='reaction' AND reference.kind NOT IN ('post','article') THEN RAISE EXCEPTION 'Unsupported reaction target' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind='group_member' OR NEW.kind='post' AND p ? 'group_id' THEN
    SELECT * INTO parent FROM feature_records WHERE id=(p->>'group_id')::uuid AND kind='group';
    IF parent.id IS NULL OR kinra_feature_blocked(parent.owner_id) THEN RAISE EXCEPTION 'Group not available' USING ERRCODE='23514'; END IF;
    IF NEW.kind='group_member' AND parent.visibility<>'public' AND parent.owner_id<>NEW.owner_id THEN RAISE EXCEPTION 'Group requires an invitation' USING ERRCODE='23514'; END IF;
    IF NEW.kind='post' AND parent.owner_id<>NEW.owner_id AND NOT EXISTS(SELECT 1 FROM feature_records m WHERE m.kind='group_member' AND m.owner_id=NEW.owner_id AND m.payload->>'group_id'=parent.id::text) THEN RAISE EXCEPTION 'Join the group before posting' USING ERRCODE='23514'; END IF;
    IF parent.visibility='private' AND NEW.visibility='public' THEN RAISE EXCEPTION 'Private group content must stay private' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind IN ('organization_member','membership_plan') THEN
    SELECT * INTO parent FROM feature_records WHERE id=(p->>'organization_id')::uuid AND kind='organization';
    IF parent.id IS NULL OR NOT kinra_feature_visible(parent.id) OR NEW.kind='membership_plan' AND parent.owner_id<>NEW.owner_id OR NEW.kind='organization_member' AND parent.visibility<>'public' AND parent.owner_id<>NEW.owner_id THEN RAISE EXCEPTION 'Organization access required' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.kind='appointment' THEN
    IF (p->>'ends_at')::timestamptz<=(p->>'starts_at')::timestamptz OR (p->>'ends_at')::timestamptz-(p->>'starts_at')::timestamptz>interval '24 hours' THEN RAISE EXCEPTION 'Invalid appointment range' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM trainer_clients WHERE trainer_id=(p->>'coach_id')::uuid AND client_id=NEW.owner_id) THEN RAISE EXCEPTION 'Connect to this coach first' USING ERRCODE='23514'; END IF;
    IF TG_OP='INSERT' AND p->>'status'<>'requested' OR TG_OP='UPDATE' AND (p->>'coach_id'<>OLD.payload->>'coach_id' OR p->>'status'='confirmed' AND auth.uid()::text<>p->>'coach_id') THEN RAISE EXCEPTION 'Only the coach confirms appointments' USING ERRCODE='23514'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p->>'coach_id',0));
    IF p->>'status'='confirmed' AND EXISTS(SELECT 1 FROM feature_records a WHERE a.kind='appointment' AND a.id<>NEW.id AND a.payload->>'coach_id'=p->>'coach_id' AND a.payload->>'status'='confirmed' AND (a.payload->>'starts_at')::timestamptz<(p->>'ends_at')::timestamptz AND (a.payload->>'ends_at')::timestamptz>(p->>'starts_at')::timestamptz) THEN RAISE EXCEPTION 'This time is already booked' USING ERRCODE='23505'; END IF;
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
CREATE TRIGGER guard_feature_record BEFORE INSERT OR UPDATE ON public.feature_records FOR EACH ROW EXECUTE FUNCTION public.kinra_guard_feature();

CREATE FUNCTION public.kinra_consume_meal(plan_id uuid, meal_index int, log_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE plan feature_records; meal jsonb; food jsonb; entry feature_records; ordinal int:=0; user_id uuid:=auth.uid();
BEGIN
  IF user_id IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
  SELECT * INTO plan FROM feature_records r WHERE r.id=plan_id AND kind='nutrition_plan' FOR SHARE;
  IF plan.id IS NULL OR NOT (plan.owner_id=user_id AND plan.client_id IS NULL OR plan.client_id=user_id AND EXISTS(SELECT 1 FROM trainer_clients WHERE trainer_id=plan.owner_id AND client_id=user_id)) THEN RAISE EXCEPTION 'Meal plan unavailable' USING ERRCODE='42501'; END IF;
  IF meal_index<0 OR meal_index>=jsonb_array_length(plan.payload->'meals') OR log_date IS NULL THEN RAISE EXCEPTION 'Invalid meal or date' USING ERRCODE='23514'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(user_id::text||plan_id::text||meal_index::text||log_date::text,0));
  SELECT * INTO entry FROM feature_records r WHERE r.owner_id=user_id AND r.kind='meal_event' AND r.payload->>'plan_id'=plan_id::text AND (r.payload->>'meal_index')::int=meal_index AND r.payload->>'date'=log_date::text;
  IF entry.payload->>'status'='consumed' THEN RETURN; END IF;
  meal:=plan.payload->'meals'->meal_index;
  FOR food IN SELECT jsonb_array_elements(meal->'foods') LOOP
    INSERT INTO nutrition_logs(user_id,log_date,meal,name,calories,protein,carbs,fat) VALUES(user_id,log_date,meal->>'name',food->>'name',(food->>'calories')::int,(food->>'protein')::numeric,(food->>'carbs')::numeric,(food->>'fat')::numeric);
    ordinal:=ordinal+1;
  END LOOP;
  IF entry.id IS NOT NULL THEN DELETE FROM feature_records WHERE id=entry.id; END IF;
  INSERT INTO feature_records(owner_id,kind,payload) VALUES(user_id,'meal_event',jsonb_build_object('plan_id',plan_id,'meal_index',meal_index,'date',log_date,'status','consumed','plan_snapshot',jsonb_build_object('name',meal->>'name','foods',meal->'foods')));
END $$;

CREATE FUNCTION public.kinra_respond_appointment(record_id uuid,new_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE appointment feature_records;
BEGIN
  SELECT * INTO appointment FROM feature_records WHERE id=record_id AND kind='appointment' FOR UPDATE;
  IF auth.uid() IS NULL OR appointment.id IS NULL OR new_status NOT IN ('confirmed','cancelled') OR NOT (appointment.payload->>'coach_id'=auth.uid()::text OR appointment.owner_id=auth.uid() AND new_status='cancelled') THEN RAISE EXCEPTION 'Appointment access denied' USING ERRCODE='42501'; END IF;
  UPDATE feature_records SET payload=jsonb_set(payload,'{status}',to_jsonb(new_status)) WHERE id=record_id;
END $$;
REVOKE ALL ON FUNCTION public.kinra_json_matches(jsonb,jsonb), public.kinra_feature_blocked(uuid), public.kinra_feature_visible(uuid), public.kinra_group_visible(uuid), public.kinra_guard_feature(), public.kinra_consume_meal(uuid,int,date), public.kinra_respond_appointment(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_json_matches(jsonb,jsonb), public.kinra_feature_blocked(uuid), public.kinra_feature_visible(uuid), public.kinra_group_visible(uuid), public.kinra_consume_meal(uuid,int,date), public.kinra_respond_appointment(uuid,text) TO authenticated,service_role;
