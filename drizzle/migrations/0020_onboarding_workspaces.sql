-- Five onboarding paths share the same private profile and original role.
-- Additional optional questionnaire answers remain owner-only.
CREATE OR REPLACE FUNCTION public.kinra_valid_onboarding(v jsonb) RETURNS boolean LANGUAGE plpgsql STABLE SET search_path='' AS $$
BEGIN
  IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR NOT (v ?& ARRAY['role','display_name','goal','first_action','theme','language','timezone']) THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(v) k WHERE k NOT IN ('role','display_name','goal','first_action','theme','language','timezone','gender','height_cm','weight_kg','units','experience','birth_date','activity_level','city','limitations','workspace')) THEN RETURN false; END IF;
  IF jsonb_typeof(v->'display_name') IS DISTINCT FROM 'string' OR length(v->>'display_name')>80 OR jsonb_typeof(v->'goal') IS DISTINCT FROM 'string' OR length(v->>'goal')>160 THEN RETURN false; END IF;
  IF jsonb_typeof(v->'theme') IS DISTINCT FROM 'string' OR v->>'theme' NOT IN ('dark','light','system') OR jsonb_typeof(v->'language') IS DISTINCT FROM 'string' OR v->>'language' NOT IN ('en','bs','de') THEN RETURN false; END IF;
  IF jsonb_typeof(v->'timezone') IS DISTINCT FROM 'string' OR (v->>'timezone') !~ '^[A-Za-z0-9_+/-]{1,80}$' THEN RETURN false; END IF;
  IF v->'role' <> 'null'::jsonb AND (jsonb_typeof(v->'role') <> 'string' OR v->>'role' NOT IN ('solo','client','trainer')) THEN RETURN false; END IF;
  IF v->'first_action' <> 'null'::jsonb AND (jsonb_typeof(v->'first_action') <> 'string' OR v->>'first_action' NOT IN ('workout','food','sleep','connect','plan','overview','program','clients','dashboard','organization','membership','community')) THEN RETURN false; END IF;
  IF v->>'first_action' IS NOT NULL AND NOT coalesce(CASE WHEN v->>'workspace'='organization' THEN v->>'first_action' IN ('organization','membership','community') ELSE CASE v->>'role' WHEN 'solo' THEN v->>'first_action' IN ('workout','food','sleep') WHEN 'client' THEN v->>'first_action' IN ('connect','plan','overview') WHEN 'trainer' THEN v->>'first_action' IN ('program','clients','dashboard') ELSE false END END,false) THEN RETURN false; END IF;
  IF v ? 'gender' AND v->'gender' <> 'null'::jsonb AND (jsonb_typeof(v->'gender') <> 'string' OR v->>'gender' NOT IN ('woman','man','non_binary','another_identity','prefer_not_to_say')) THEN RETURN false; END IF;
  IF v ? 'experience' AND v->'experience' <> 'null'::jsonb AND (jsonb_typeof(v->'experience') <> 'string' OR v->>'experience' NOT IN ('new','some','experienced')) THEN RETURN false; END IF;
  IF v ? 'units' AND (jsonb_typeof(v->'units') IS DISTINCT FROM 'string' OR v->>'units' NOT IN ('metric','imperial')) THEN RETURN false; END IF;
  IF v ? 'height_cm' AND v->'height_cm' <> 'null'::jsonb THEN
    IF jsonb_typeof(v->'height_cm') <> 'number' THEN RETURN false; END IF;
    IF (v->>'height_cm')::numeric NOT BETWEEN 80 AND 250 THEN RETURN false; END IF;
  END IF;
  IF v ? 'weight_kg' AND v->'weight_kg' <> 'null'::jsonb THEN
    IF jsonb_typeof(v->'weight_kg') <> 'number' THEN RETURN false; END IF;
    IF (v->>'weight_kg')::numeric NOT BETWEEN 20 AND 350 THEN RETURN false; END IF;
  END IF;

  IF v ? 'birth_date' AND v->'birth_date' <> 'null'::jsonb THEN
    IF jsonb_typeof(v->'birth_date') <> 'string' OR v->>'birth_date' !~ '^\d{4}-\d{2}-\d{2}$' THEN RETURN false; END IF;
    BEGIN IF (v->>'birth_date')::date < DATE '1900-01-01' OR (v->>'birth_date')::date > CURRENT_DATE THEN RETURN false; END IF;
    EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RETURN false; END;
  END IF;
  IF v ? 'activity_level' AND v->'activity_level' <> 'null'::jsonb AND (jsonb_typeof(v->'activity_level') <> 'string' OR v->>'activity_level' NOT IN ('low','moderate','high')) THEN RETURN false; END IF;
  IF v ? 'city' AND (jsonb_typeof(v->'city') IS DISTINCT FROM 'string' OR length(v->>'city')>100) THEN RETURN false; END IF;
  IF v ? 'limitations' AND (jsonb_typeof(v->'limitations') IS DISTINCT FROM 'string' OR length(v->>'limitations')>1000) THEN RETURN false; END IF;
  IF v ? 'workspace' AND v->'workspace'<>'null'::jsonb THEN
    IF jsonb_typeof(v->'workspace')<>'string' OR v->>'workspace' NOT IN ('solo','client','trainer','specialist','organization') THEN RETURN false; END IF;
    IF v->>'role' IS NOT NULL AND (CASE v->>'workspace' WHEN 'specialist' THEN 'trainer' WHEN 'organization' THEN 'solo' ELSE v->>'workspace' END) IS DISTINCT FROM v->>'role' THEN RETURN false; END IF;
  END IF;
  RETURN true;
END $$;


CREATE OR REPLACE FUNCTION public.kinra_save_onboarding(data jsonb,stage integer,finish boolean,expected_owner uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); chosen public.app_role; existing public.app_role; prior jsonb; modern boolean; next_stage integer; merged jsonb;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501'; END IF;
  modern := data ? 'height_cm';
  IF stage IS NULL OR finish IS NULL OR stage NOT BETWEEN 0 AND (CASE WHEN modern THEN 4 ELSE 3 END) OR NOT public.kinra_valid_onboarding(data) THEN RAISE EXCEPTION 'Enter valid setup details.' USING ERRCODE='22023'; END IF;
  IF finish AND (nullif(trim(data->>'display_name'),'') IS NULL OR data->>'role' IS NULL OR data->>'first_action' IS NULL) THEN RAISE EXCEPTION 'Complete the required setup steps.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.profiles(id) VALUES(actor) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.onboarding_state(owner_id,answers,step) VALUES(actor,data,stage) ON CONFLICT(owner_id) DO NOTHING;
  SELECT answers INTO prior FROM public.onboarding_state WHERE owner_id=actor FOR UPDATE;
  SELECT role INTO existing FROM public.user_roles WHERE user_id=actor;
  IF existing IS NOT NULL AND existing::text IS DISTINCT FROM data->>'role' THEN RAISE EXCEPTION 'Your account type is already set. Reopen setup to continue.' USING ERRCODE='22023'; END IF;
  -- A cached four-step client must not erase facts saved by the new setup.
  merged := coalesce(prior,'{}'::jsonb) || data;
  next_stage := CASE WHEN NOT modern AND stage>=2 THEN stage+1 ELSE stage END;
  IF finish THEN
    chosen:=(data->>'role')::public.app_role;
    INSERT INTO public.user_roles(user_id,role) VALUES(actor,chosen) ON CONFLICT(user_id) DO NOTHING;
    IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor AND role=chosen) THEN RAISE EXCEPTION 'Your account type is already set. Reopen setup to continue.' USING ERRCODE='22023'; END IF;
    -- Only initial completion selects a workspace. Retaking setup cannot
    -- unexpectedly switch the current account context or grant staff access.
    IF existing IS NULL THEN
      INSERT INTO public.account_roles(owner_id,role) VALUES(actor,chosen::text) ON CONFLICT DO NOTHING;
      INSERT INTO public.account_roles(owner_id,role) VALUES(actor,coalesce(data->>'workspace',chosen::text)) ON CONFLICT DO NOTHING;
      INSERT INTO public.account_context(owner_id,active_role) VALUES(actor,coalesce(data->>'workspace',chosen::text)) ON CONFLICT(owner_id) DO NOTHING;
    END IF;
    UPDATE public.profiles SET display_name=trim(data->>'display_name'),goal=nullif(trim(data->>'goal'),'') WHERE id=actor;
    INSERT INTO public.feature_records(owner_id,kind,payload) VALUES(actor,'preferences',jsonb_build_object('language',data->>'language','theme',data->>'theme','modules','{}'::jsonb,'timezone',data->>'timezone') || CASE WHEN data ? 'units' THEN jsonb_build_object('units',data->>'units') ELSE '{}'::jsonb END)
      ON CONFLICT(owner_id,kind,dedupe_key) DO UPDATE SET payload=public.feature_records.payload || jsonb_build_object('language',data->>'language','theme',data->>'theme') || CASE WHEN data ? 'units' THEN jsonb_build_object('units',data->>'units') ELSE '{}'::jsonb END;
  END IF;
  UPDATE public.onboarding_state SET answers=merged,version=2,step=CASE WHEN finish THEN 4 ELSE next_stage END,updated_at=now(),completed_at=CASE WHEN finish THEN coalesce(completed_at,now()) ELSE NULL END WHERE owner_id=actor;
END $$;
REVOKE ALL ON FUNCTION public.kinra_valid_onboarding(jsonb),public.kinra_save_onboarding(jsonb,integer,boolean,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_valid_onboarding(jsonb),public.kinra_save_onboarding(jsonb,integer,boolean,uuid) TO authenticated,service_role;
