-- Source: 0027_supplement_plan_review_guard.sql
-- Activate only the exact program revision the person reviewed.
CREATE OR REPLACE FUNCTION public.kinra_v2_kinra_activate_supplement_plan(plan_id uuid,start_on date,expected_owner uuid,expected_revision timestamptz) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); source public.kinra_v2_feature_records; ids uuid[]; item jsonb; target uuid; content jsonb;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR NOT EXISTS(SELECT 1 FROM public.kinra_v2_profiles p WHERE p.id=actor) THEN RAISE EXCEPTION 'Sign in with the matching Kinra account.' USING ERRCODE='42501'; END IF;
 IF start_on IS NULL OR start_on<'1900-01-01'::date OR start_on>'2200-12-31'::date THEN RAISE EXCEPTION 'Choose a valid start date.' USING ERRCODE='22023'; END IF;
 SELECT * INTO source FROM public.kinra_v2_feature_records r WHERE r.id=plan_id AND r.kind='supplement_plan' FOR SHARE;
 IF source.id IS NULL OR public.kinra_v2_kinra_feature_blocked(source.owner_id) OR NOT(source.owner_id=actor AND source.client_id IS NULL OR source.client_id=actor AND EXISTS(SELECT 1 FROM public.kinra_v2_trainer_clients c WHERE c.trainer_id=source.owner_id AND c.client_id=actor)) THEN RAISE EXCEPTION 'Supplement program unavailable.' USING ERRCODE='42501'; END IF;
 IF expected_revision IS NULL OR source.updated_at IS DISTINCT FROM expected_revision THEN RAISE EXCEPTION 'This plan changed. Reload and review it before activating.' USING ERRCODE='40001'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||plan_id::text||start_on::text,0));
 SELECT a.supplement_ids INTO ids FROM public.kinra_v2_supplement_plan_activations a WHERE a.owner_id=actor AND a.plan_id=kinra_v2_kinra_activate_supplement_plan.plan_id AND a.start_on=kinra_v2_kinra_activate_supplement_plan.start_on;
 IF ids IS NOT NULL THEN RETURN jsonb_build_object('ids',ids,'alreadyActivated',true); END IF;
 ids:='{}';
 FOR item IN SELECT jsonb_array_elements(source.payload->'supplements') LOOP
  target:=gen_random_uuid();
  content:=(item-'id')||jsonb_build_object('start_date',start_on,'end_date',start_on+(source.payload->>'weeks')::int*7-1,'protocol',source.payload->>'title');
  INSERT INTO public.kinra_v2_feature_records(id,owner_id,kind,payload) VALUES(target,actor,'supplement',content);
  ids:=array_append(ids,target);
 END LOOP;
 INSERT INTO public.kinra_v2_supplement_plan_activations(owner_id,plan_id,start_on,supplement_ids) VALUES(actor,plan_id,start_on,ids);
 RETURN jsonb_build_object('ids',ids,'alreadyActivated',false);
END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_activate_supplement_plan(uuid,date,uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_activate_supplement_plan(uuid,date,uuid,timestamptz) TO authenticated,service_role;

DROP FUNCTION IF EXISTS public.kinra_v2_kinra_activate_supplement_plan(uuid,date,uuid);



COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0027_supplement_plan_review_guard';
NOTIFY pgrst, 'reload schema';
