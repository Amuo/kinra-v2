-- Private setup drafts are separate from profiles shared with connected coaches.
CREATE FUNCTION public.kinra_valid_onboarding(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
BEGIN
  IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR NOT (v ?& ARRAY['role','display_name','goal','first_action','theme','language','timezone']) THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(v) k WHERE k NOT IN ('role','display_name','goal','first_action','theme','language','timezone')) THEN RETURN false; END IF;
  IF jsonb_typeof(v->'display_name') IS DISTINCT FROM 'string' OR length(v->>'display_name')>80 OR jsonb_typeof(v->'goal') IS DISTINCT FROM 'string' OR length(v->>'goal')>160 THEN RETURN false; END IF;
  IF jsonb_typeof(v->'theme') IS DISTINCT FROM 'string' OR v->>'theme' NOT IN ('dark','light','system') OR jsonb_typeof(v->'language') IS DISTINCT FROM 'string' OR v->>'language' NOT IN ('en','bs','de') THEN RETURN false; END IF;
  IF jsonb_typeof(v->'timezone') IS DISTINCT FROM 'string' OR (v->>'timezone') !~ '^[A-Za-z0-9_+/-]{1,80}$' THEN RETURN false; END IF;
  IF v->'role' <> 'null'::jsonb AND (jsonb_typeof(v->'role') <> 'string' OR v->>'role' NOT IN ('solo','client','trainer')) THEN RETURN false; END IF;
  IF v->'first_action' <> 'null'::jsonb AND (jsonb_typeof(v->'first_action') <> 'string' OR v->>'first_action' NOT IN ('workout','food','sleep','connect','plan','overview','program','clients','dashboard')) THEN RETURN false; END IF;
  IF v->>'first_action' IS NOT NULL AND NOT coalesce(CASE v->>'role' WHEN 'solo' THEN v->>'first_action' IN ('workout','food','sleep') WHEN 'client' THEN v->>'first_action' IN ('connect','plan','overview') WHEN 'trainer' THEN v->>'first_action' IN ('program','clients','dashboard') ELSE false END,false) THEN RETURN false; END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.kinra_valid_onboarding(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_valid_onboarding(jsonb) TO authenticated,service_role;

CREATE TABLE public.onboarding_state (
  owner_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  version integer NOT NULL DEFAULT 1 CHECK(version=1),
  step integer NOT NULL DEFAULT 0 CHECK(step BETWEEN 0 AND 3),
  answers jsonb NOT NULL CHECK(public.kinra_valid_onboarding(answers)),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.onboarding_state FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.onboarding_state TO authenticated;
GRANT ALL ON public.onboarding_state TO service_role;
CREATE POLICY "Read own setup" ON public.onboarding_state FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
CREATE POLICY "Create own setup" ON public.onboarding_state FOR INSERT TO authenticated WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY "Change own setup" ON public.onboarding_state FOR UPDATE TO authenticated USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY "Delete own setup" ON public.onboarding_state FOR DELETE TO authenticated USING(owner_id=(SELECT auth.uid()));

-- Invoker privileges retain every normal profile/role/preference RLS check.
-- One transaction commits setup, profile, role and appearance; retries are safe.
CREATE FUNCTION public.kinra_save_onboarding(data jsonb,stage integer,finish boolean,expected_owner uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); chosen public.app_role; existing public.app_role;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501'; END IF;
  IF stage IS NULL OR finish IS NULL OR stage NOT BETWEEN 0 AND 3 OR NOT public.kinra_valid_onboarding(data) THEN RAISE EXCEPTION 'Enter valid setup details.' USING ERRCODE='22023'; END IF;
  IF finish AND (nullif(trim(data->>'display_name'),'') IS NULL OR data->>'role' IS NULL OR data->>'first_action' IS NULL) THEN RAISE EXCEPTION 'Complete the required setup steps.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.profiles(id) VALUES(actor) ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.onboarding_state(owner_id,answers,step) VALUES(actor,data,stage) ON CONFLICT(owner_id) DO NOTHING;
  PERFORM 1 FROM public.onboarding_state WHERE owner_id=actor FOR UPDATE;
  SELECT role INTO existing FROM public.user_roles WHERE user_id=actor;
  IF existing IS NOT NULL AND existing::text IS DISTINCT FROM data->>'role' THEN RAISE EXCEPTION 'Your account type is already set. Reopen setup to continue.' USING ERRCODE='22023'; END IF;
  IF finish THEN
    chosen:=(data->>'role')::public.app_role;
    INSERT INTO public.user_roles(user_id,role) VALUES(actor,chosen) ON CONFLICT(user_id) DO NOTHING;
    IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor AND role=chosen) THEN RAISE EXCEPTION 'Your account type is already set. Reopen setup to continue.' USING ERRCODE='22023'; END IF;
    UPDATE public.profiles SET display_name=trim(data->>'display_name'),goal=nullif(trim(data->>'goal'),'') WHERE id=actor;
    INSERT INTO public.feature_records(owner_id,kind,payload) VALUES(actor,'preferences',jsonb_build_object('language',data->>'language','theme',data->>'theme','modules','{}'::jsonb,'timezone',data->>'timezone'))
      ON CONFLICT(owner_id,kind,dedupe_key) DO UPDATE SET payload=public.feature_records.payload || jsonb_build_object('language',data->>'language','theme',data->>'theme');
  END IF;
  UPDATE public.onboarding_state SET answers=data,step=CASE WHEN finish THEN 3 ELSE stage END,updated_at=now(),completed_at=CASE WHEN finish THEN coalesce(completed_at,now()) ELSE NULL END WHERE owner_id=actor;
END $$;
REVOKE ALL ON FUNCTION public.kinra_save_onboarding(jsonb,integer,boolean,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_save_onboarding(jsonb,integer,boolean,uuid) TO authenticated,service_role;
